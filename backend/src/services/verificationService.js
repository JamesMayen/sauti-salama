import VerificationRequest from "../models/VerificationRequest.js";
import VerificationResult from "../models/VerificationResult.js";
import { verifyClaim as verifyClaimWithAi } from "./ai/aiService.js";
import { buildVerificationPrompt } from "./ai/verificationPrompt.js";
import { prepareEvidence } from "./evidence/evidenceService.js";
import {
  retrieveEvidenceForClaim,
  determineEvidenceSufficiency,
} from "./evidenceRetrievalService.js";
import AppError from "../utils/AppError.js";

export async function createVerificationRequest(data) {
  const verificationRequest = await VerificationRequest.create({
    claim: data.claim,
    language: data.language || "english",
    submittedBy: data.submittedBy || null,
    sourceUrl: data.sourceUrl || null,
    priority: data.priority || "normal",
    reviewRequired: false,
    reviewReason: null,
    evidenceSufficiency: null,
    reviewStatus: null,
    reviewDecision: null,
  });

  return verificationRequest;
}

export async function getVerificationRequests(filters = {}) {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.reviewRequired === "true") {
    query.reviewRequired = true;
  }

  return VerificationRequest.find(query)
    .populate("submittedBy", "fullName email role")
    .sort({ createdAt: -1 });
}

export async function getVerificationRequestById(id) {
  return VerificationRequest.findById(id)
    .populate("submittedBy", "fullName email role");
}

export async function getVerificationResult(requestId) {
  return VerificationResult.findOne({
    verificationRequest: requestId,
  }).populate("reviewedBy", "fullName email role");
}

export async function getReviewQueue() {
  return VerificationRequest.find({
    reviewRequired: true,
    status: "needs_review",
  })
    .populate("submittedBy", "fullName email role")
    .sort({ createdAt: -1 });
}

export async function createVerificationResult(requestId, data) {
  const existingResult = await getVerificationResult(requestId);

  if (existingResult) {
    throw new AppError(
      "A verification result already exists for this request.",
      409,
      "VERIFICATION_RESULT_ALREADY_EXISTS"
    );
  }

  const result = await VerificationResult.create({
    verificationRequest: requestId,
    truthStatus: data.truthStatus,
    riskLevel: data.riskLevel,
    confidence: data.confidence ?? null,
    summary: data.summary,
    reasoning: data.reasoning || null,
    evidence: data.evidence || [],
    uncertainties: data.uncertainties || [],
    recommendedAction: data.recommendedAction || null,
    evidenceSufficiency: data.evidenceSufficiency || "sufficient",
    reviewRequired: Boolean(data.reviewRequired),
    reviewReason: data.reviewReason || null,
    verifiedAt: data.verifiedAt || null,
    reviewedBy: data.reviewedBy || null,
    aiGenerated: data.aiGenerated || false,
    aiAssessment: data.aiAssessment || null,
    humanReview: data.humanReview || null,
  });

  const statusToSet = result.reviewRequired ? "needs_review" : "completed";

  await VerificationRequest.findByIdAndUpdate(
    requestId,
    {
      status: statusToSet,
      reviewRequired: result.reviewRequired,
      reviewReason: result.reviewRequired ? result.reviewReason : null,
      evidenceSufficiency: result.evidenceSufficiency,
      reviewStatus: result.reviewRequired ? "pending" : null,
      reviewDecision: null,
    },
    {
      new: true,
    }
  );

  return result;
}

export async function resolveVerificationReview(requestId, data, reviewerId) {
  const request = await getVerificationRequestById(requestId);

  if (!request) {
    throw new AppError("Verification request not found.", 404, "VERIFICATION_REQUEST_NOT_FOUND");
  }

  const result = await getVerificationResult(requestId);

  if (!result) {
    throw new AppError("Verification result not found for this request.", 404, "VERIFICATION_RESULT_NOT_FOUND");
  }

  const nextStatus = data.truthStatus;
  if (!nextStatus || !["verified", "partially_verified", "unverified", "contested", "false"].includes(nextStatus)) {
    throw new AppError("A valid review outcome is required.", 400, "INVALID_REVIEW_OUTCOME");
  }

  const updatedResult = await VerificationResult.findByIdAndUpdate(
    result._id,
    {
      truthStatus: nextStatus,
      riskLevel: data.riskLevel || result.riskLevel,
      summary: data.summary || result.summary,
      reasoning: data.reasoning || result.reasoning,
      evidence: data.evidence || result.evidence,
      uncertainties: data.uncertainties || result.uncertainties,
      recommendedAction: data.recommendedAction || result.recommendedAction,
      reviewedBy: reviewerId,
      aiGenerated: false,
      reviewRequired: false,
      reviewReason: null,
      evidenceSufficiency: "insufficient",
      humanReview: {
        status: "resolved",
        decision: nextStatus,
        reason: request.reviewReason || "insufficient_evidence",
        notes: data.notes || null,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    },
    { new: true }
  ).populate("reviewedBy", "fullName email role");

  await VerificationRequest.findByIdAndUpdate(
    requestId,
    {
      status: "completed",
      reviewRequired: false,
      reviewReason: null,
      reviewStatus: "resolved",
      reviewDecision: nextStatus,
      evidenceSufficiency: "insufficient",
    },
    { new: true }
  );

  return updatedResult;
}

export async function processVerificationRequest(
  data,
  { instructions = buildVerificationPrompt() } = {}
) {
  const verificationRequest = await createVerificationRequest(data);

  await VerificationRequest.findByIdAndUpdate(
    verificationRequest._id,
    { status: "processing" }
  );

  try {
    const suppliedEvidence = await prepareEvidence(data.evidence || []);

    const retrievedEvidence = await retrieveEvidenceForClaim({
      claim: data.claim,
      sourceUrl: data.sourceUrl || null,
      suppliedEvidence,
      context: data.context || null,
    });

    const evidenceSufficiency = determineEvidenceSufficiency(retrievedEvidence);

    const aiResultBase = await verifyClaimWithAi({
      claim: data.claim,
      language: data.language || "english",
      sourceUrl: data.sourceUrl || null,
      suppliedEvidence: retrievedEvidence.length ? retrievedEvidence : suppliedEvidence,
      context: data.context || null,
      instructions,
    });

    const normalizedAiResult = {
      ...aiResultBase,
      evidence: Array.isArray(aiResultBase.evidence) ? aiResultBase.evidence : [],
      evidenceSufficiency,
      reviewRequired: false,
      reviewReason: null,
      aiGenerated: true,
    };

    if (evidenceSufficiency === "insufficient") {
      const insufficientResult = {
        ...normalizedAiResult,
        truthStatus: "unverified",
        riskLevel: normalizedAiResult.riskLevel || "medium",
        confidence: normalizedAiResult.confidence ?? 0.35,
        summary: "We could not find enough reliable evidence to independently verify this claim at this time.",
        reasoning: "The review process did not find sufficient reliable evidence to establish or contradict the claim. This is not evidence of falsehood; it requires human review.",
        uncertainties: normalizedAiResult.uncertainties?.length
          ? normalizedAiResult.uncertainties
          : ["No sufficiently reliable evidence was identified to verify or refute the claim."],
        recommendedAction: "Avoid forwarding this claim as established fact until a reviewer assesses the available evidence.",
        evidence: retrievedEvidence.length ? retrievedEvidence : suppliedEvidence,
        reviewRequired: true,
        reviewReason: "insufficient_evidence",
        evidenceSufficiency: "insufficient",
      };

      const result = await createVerificationResult(
        verificationRequest._id,
        insufficientResult
      );

      await VerificationRequest.findByIdAndUpdate(
        verificationRequest._id,
        {
          status: "needs_review",
          reviewRequired: true,
          reviewReason: "insufficient_evidence",
          evidenceSufficiency: "insufficient",
          reviewStatus: "pending",
        }
      );

      return {
        request: await getVerificationRequestById(verificationRequest._id),
        result,
      };
    }

    const result = await createVerificationResult(
      verificationRequest._id,
      normalizedAiResult
    );

    return {
      request: await getVerificationRequestById(verificationRequest._id),
      result,
    };
  } catch (error) {
    const requestUpdate = {
      status: "failed",
      reviewRequired: false,
      reviewReason: "technical_failure",
      reviewStatus: null,
      evidenceSufficiency: null,
    };

    if (error && (error.code === "AI_PROVIDER_NOT_CONFIGURED" || error.code === "AI_PROVIDER_AUTHENTICATION_FAILED" || error.code === "AI_PROVIDER_RATE_LIMITED" || error.code === "AI_PROVIDER_TIMEOUT" || error.code === "AI_PROVIDER_INVALID_REQUEST" || error.code === "AI_PROVIDER_REQUEST_FAILED" || error.code === "AI_PROVIDER_UNAVAILABLE" || error.code === "AI_PROVIDER_EMPTY_RESPONSE" || error.code === "AI_PROVIDER_MALFORMED_RESPONSE")) {
      await VerificationRequest.findByIdAndUpdate(verificationRequest._id, requestUpdate);
    } else {
      await VerificationRequest.findByIdAndUpdate(verificationRequest._id, { status: "failed", reviewRequired: false, reviewReason: "technical_failure", evidenceSufficiency: null, reviewStatus: null });
    }

    throw error;
  }
}