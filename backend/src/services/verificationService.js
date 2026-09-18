import VerificationRequest from "../models/VerificationRequest.js";
import VerificationResult from "../models/VerificationResult.js";
import { verifyClaim as verifyClaimWithAi } from "./ai/aiService.js";
import { buildVerificationPrompt } from "./ai/verificationPrompt.js";
import { prepareEvidence } from "./evidence/evidenceService.js";
import AppError from "../utils/AppError.js";

export async function createVerificationRequest(data) {
  const verificationRequest = await VerificationRequest.create({
    claim: data.claim,
    language: data.language || "english",
    submittedBy: data.submittedBy || null,
    sourceUrl: data.sourceUrl || null,
    priority: data.priority || "normal",
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

export async function createVerificationResult(requestId, data) {
  const existingResult = await getVerificationResult(
    requestId
  );

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
    verifiedAt: data.verifiedAt || null,
    reviewedBy: data.reviewedBy || null,
    aiGenerated: data.aiGenerated || false,
  });

  await VerificationRequest.findByIdAndUpdate(
    requestId,
    {
      status: "completed",
    },
    {
      new: true,
    }
  );

  return result;
}

export async function processVerificationRequest(
  data,
  { instructions = buildVerificationPrompt() } = {}
) {
  const verificationRequest =
    await createVerificationRequest(data);

  await VerificationRequest.findByIdAndUpdate(
    verificationRequest._id,
    { status: "processing" }
  );

  try {
    const evidence = await prepareEvidence(
      data.evidence || []
    );

    const aiResult = await verifyClaimWithAi({
      claim: data.claim,
      language: data.language || "english",
      sourceUrl: data.sourceUrl || null,
      suppliedEvidence: evidence,
      context: data.context || null,
      instructions,
    });

    const result = await createVerificationResult(
      verificationRequest._id,
      aiResult
    );

    verificationRequest.status = "completed";

    return {
      request: verificationRequest,
      result,
    };
  } catch (error) {
    await VerificationRequest.findByIdAndUpdate(
      verificationRequest._id,
      { status: "failed" }
    );

    throw error;
  }
}