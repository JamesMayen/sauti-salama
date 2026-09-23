import VerificationRequest from "../models/VerificationRequest.js";
import VerificationResult from "../models/VerificationResult.js";
import { verifyClaim as verifyClaimWithAi } from "./ai/aiService.js";
import { buildVerificationPrompt } from "./ai/verificationPrompt.js";
import { prepareEvidence } from "./evidence/evidenceService.js";
import { retrieveAndAssessEvidence } from "./evidenceRetrievalService.js";
import AppError from "../utils/AppError.js";

const TECHNICAL_ERROR_CODES = new Set([
  "EVIDENCE_RETRIEVAL_FAILED",
  "EVIDENCE_RETRIEVAL_INVALID_RESPONSE",
  "AI_PROVIDER_NOT_CONFIGURED",
  "AI_PROVIDER_AUTHENTICATION_FAILED",
  "AI_PROVIDER_RATE_LIMITED",
  "AI_PROVIDER_TIMEOUT",
  "AI_PROVIDER_INVALID_REQUEST",
  "AI_PROVIDER_REQUEST_FAILED",
  "AI_PROVIDER_UNAVAILABLE",
  "AI_PROVIDER_EMPTY_RESPONSE",
  "AI_PROVIDER_MALFORMED_RESPONSE",
  "INVALID_AI_VERIFICATION_RESULT",
  "AI_VERIFICATION_INSTRUCTIONS_NOT_CONFIGURED",
  "SEARCH_PROVIDER_ERROR",
  "SEARCH_TIMEOUT",
]);

function getIdString(value) {
  return typeof value?.toString === "function"
    ? value.toString()
    : String(value);
}

function getSafeErrorSummary(error) {
  return {
    code:
      error?.code ||
      (error instanceof AppError ? error.code : "SERVER_ERROR"),
    message:
      error instanceof AppError
        ? error.message
        : error?.name || "Error",
  };
}

function isTechnicalVerificationError(error) {
  if (!error) return true;
  if (TECHNICAL_ERROR_CODES.has(error.code)) return true;
  if (String(error.code || "").startsWith("AI_PROVIDER_")) return true;
  if (String(error.code || "").startsWith("SEARCH_")) return true;
  if (error instanceof AppError) return error.statusCode >= 500;
  return !error.statusCode || error.statusCode >= 500;
}

async function markRequestFailed(requestId, error) {
  const isTechnicalFailure = isTechnicalVerificationError(error);

  try {
    await VerificationRequest.findByIdAndUpdate(requestId, {
      status: "failed",
      reviewRequired: false,
      reviewReason: isTechnicalFailure
        ? "technical_failure"
        : null,
      reviewStatus: null,
      evidenceSufficiency: null,
    });
  } catch (updateError) {
    console.error(
      "[Verification] Failed to persist request failure",
      getSafeErrorSummary(updateError)
    );
  }
}

function buildInsufficientEvidenceResult(evidence, claimType) {
  return {
    truthStatus: "unverified",
    riskLevel: "medium",
    confidence: 0.35,
    summary:
      "We could not find enough reliable evidence to independently verify this claim at this time.",
    reasoning:
      "The review process did not find sufficient reliable evidence to establish or contradict the claim. This is not evidence of falsehood; it requires human review.",
    uncertainties: [
      "No sufficiently reliable evidence was identified to verify or refute the claim.",
    ],
    recommendedAction:
      "Avoid forwarding this claim as established fact until a reviewer assesses the available evidence.",
    evidence: Array.isArray(evidence) ? evidence : [],
    evidenceSufficiency: "insufficient",
    reviewRequired: true,
    reviewReason: "insufficient_evidence",
    aiGenerated: false,
    humanReview: {
      status: "pending",
      reason: "insufficient_evidence",
    },
    claimType: claimType || null,
  };
}

function buildTechnicalFailureResult(evidence, error, claimType) {
  return {
    truthStatus: "unverified",
    riskLevel: "high",
    confidence: 0,
    summary:
      "Verification is temporarily unavailable. The evidence retrieval system could not be reached.",
    reasoning:
      "The verification system experienced a technical issue while attempting to retrieve evidence. This does not mean the claim is true or false. Please try again later.",
    uncertainties: [
      "Evidence retrieval could not be completed due to a technical issue.",
      "No evidence was retrieved for assessment.",
    ],
    recommendedAction:
      "Please try again later. If the issue persists, contact the system administrator.",
    evidence: Array.isArray(evidence) ? evidence : [],
    evidenceSufficiency: "technical_failure",
    reviewRequired: false,
    reviewReason: "technical_failure",
    aiGenerated: false,
    humanReview: null,
    claimType: claimType || null,
  };
}

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
    claimType: data.claimType || null,
  });

  return verificationRequest;
}

export async function getVerificationRequests(filters = {}) {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.reviewRequired === "true") query.reviewRequired = true;

  return VerificationRequest.find(query)
    .populate("submittedBy", "fullName email role")
    .sort({ createdAt: -1 });
}

export async function getVerificationRequestById(id) {
  return VerificationRequest.findById(id).populate(
    "submittedBy",
    "fullName email role"
  );
}

export async function getVerificationResult(requestId) {
  return VerificationResult.findOne({
    verificationRequest: requestId,
  }).populate("reviewedBy", "fullName email role");
}

export async function getReviewQueue() {
  const requests = await VerificationRequest.find({
    reviewRequired: true,
    status: "needs_review",
  })
    .populate("submittedBy", "fullName email role")
    .sort({ createdAt: -1 });

  const requestObjects = requests.map((request) =>
    typeof request.toObject === "function" ? request.toObject() : request
  );
  const requestIds = requestObjects.map((request) => request._id);
  const results = requestIds.length
    ? await VerificationResult.find({
        verificationRequest: { $in: requestIds },
      }).populate("reviewedBy", "fullName email role")
    : [];
  const resultsByRequestId = new Map(
    results.map((result) => [
      getIdString(result.verificationRequest),
      typeof result.toObject === "function" ? result.toObject() : result,
    ])
  );

  return requestObjects.map((request) => ({
    ...request,
    result: resultsByRequestId.get(getIdString(request._id)) || null,
  }));
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

  const reviewRequired = Boolean(data.reviewRequired);
  const humanReview =
    data.humanReview ||
    (reviewRequired
      ? {
          status: "pending",
          reason: data.reviewReason || "manual_review",
        }
      : null);

  const result = await VerificationResult.create({
    verificationRequest: requestId,
    truthStatus: data.truthStatus,
    riskLevel: data.riskLevel,
    confidence: data.confidence ?? null,
    summary: data.summary,
    reasoning: data.reasoning || null,
    evidence: Array.isArray(data.evidence) ? data.evidence : [],
    uncertainties: Array.isArray(data.uncertainties) ? data.uncertainties : [],
    recommendedAction: data.recommendedAction || null,
    evidenceSufficiency: data.evidenceSufficiency || "sufficient",
    reviewRequired,
    reviewReason: reviewRequired ? data.reviewReason || "manual_review" : null,
    verifiedAt: data.verifiedAt || null,
    reviewedBy: data.reviewedBy || null,
    aiGenerated: Boolean(data.aiGenerated),
    aiAssessment: data.aiAssessment || null,
    humanReview,
    claimType: data.claimType || null,
    retrievalMethod: data.retrievalMethod || null,
    technicalFailure: data.technicalFailure || false,
  });

  const statusToSet = reviewRequired ? "needs_review" : "completed";

  await VerificationRequest.findByIdAndUpdate(requestId, {
    status: statusToSet,
    reviewRequired,
    reviewReason: reviewRequired ? result.reviewReason : null,
    evidenceSufficiency: result.evidenceSufficiency,
    reviewStatus: reviewRequired ? "pending" : null,
    reviewDecision: null,
    claimType: data.claimType || null,
    retrievalMethod: data.retrievalMethod || null,
    technicalFailure: data.technicalFailure || false,
  }, { new: true });

  return result;
}

export async function resolveVerificationReview(requestId, data, reviewerId) {
  const request = await getVerificationRequestById(requestId);
  if (!request) throw new AppError("Verification request not found.", 404, "VERIFICATION_REQUEST_NOT_FOUND");

  const result = await getVerificationResult(requestId);
  if (!result) throw new AppError("Verification result not found for this request.", 404, "VERIFICATION_RESULT_NOT_FOUND");

  const nextStatus = data.truthStatus;
  if (!nextStatus || !["verified", "partially_verified", "unverified", "contested", "false"].includes(nextStatus)) {
    throw new AppError("A valid review outcome is required.", 400, "INVALID_REVIEW_OUTCOME");
  }

  const updatedResult = await VerificationResult.findByIdAndUpdate(result._id, {
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
  }, { new: true }).populate("reviewedBy", "fullName email role");

  await VerificationRequest.findByIdAndUpdate(requestId, {
    status: "completed",
    reviewRequired: false,
    reviewReason: null,
    reviewStatus: "resolved",
    reviewDecision: nextStatus,
    evidenceSufficiency: "insufficient",
  }, { new: true });

  return updatedResult;
}

export async function processVerificationRequest(data, { instructions = buildVerificationPrompt() } = {}) {
  let verificationRequest;

  try {
    verificationRequest = await createVerificationRequest(data);

    console.log("[Verification] Claim normalized", { claimLength: data.claim.length });

    console.log("[Verification] Claim:", data.claim.slice(0, 120));

    await VerificationRequest.findByIdAndUpdate(verificationRequest._id, { status: "processing" });

    const suppliedEvidence = await prepareEvidence(data.evidence || []);

    console.log("[Verification] Supplied evidence prepared", { count: suppliedEvidence.length });

    const retrievalResult = await retrieveAndAssessEvidence({
      claim: data.claim,
      sourceUrl: data.sourceUrl || null,
      suppliedEvidence,
      context: data.context || null,
    });

    const {
      evidence,
      evidenceSufficiency,
      sufficiencyReason,
      claimType,
      retrievalMethod,
      technicalFailure,
      onlineError,
    } = retrievalResult;

    console.log("[Verification] Evidence sufficiency", {
      result: evidenceSufficiency,
      reason: sufficiencyReason,
      evidenceCount: evidence.length,
      technicalFailure,
    });

    if (technicalFailure) {
      console.log("[Verification] Technical failure detected", { error: onlineError?.message });

      if (verificationRequest?._id) {
        await markRequestFailed(verificationRequest._id, onlineError);
      }

      throw onlineError;
    }

    if (evidenceSufficiency === "insufficient") {
      console.log("[Verification] AI assessment skipped", { reason: sufficiencyReason });

      const result = await createVerificationResult(
        verificationRequest._id,
        buildInsufficientEvidenceResult(evidence, claimType)
      );

      console.log("[Verification] Result persisted", { status: "needs_review", reviewRequired: true });

      return {
        request: await getVerificationRequestById(verificationRequest._id),
        result,
      };
    }

    console.log("[Verification] AI assessment started");

    const aiResultBase = await verifyClaimWithAi({
      claim: data.claim,
      language: data.language || "english",
      sourceUrl: data.sourceUrl || null,
      suppliedEvidence: evidence,
      context: data.context || null,
      instructions,
    });

    console.log("[Verification] AI assessment completed");

    const normalizedAiResult = {
      ...aiResultBase,
      evidence: Array.isArray(aiResultBase.evidence) ? aiResultBase.evidence : [],
      evidenceSufficiency,
      reviewRequired: false,
      reviewReason: null,
      aiGenerated: true,
      claimType,
      retrievalMethod,
      technicalFailure: false,
    };

    const result = await createVerificationResult(
      verificationRequest._id,
      normalizedAiResult
    );

    console.log("[Verification] Result persisted", { status: "completed", reviewRequired: false });

    return {
      request: await getVerificationRequestById(verificationRequest._id),
      result,
    };
  } catch (error) {
    console.error("[Verification] Pipeline failed", getSafeErrorSummary(error));

    if (verificationRequest?._id) {
      await markRequestFailed(verificationRequest._id, error);
    }

    throw error;
  }
}
