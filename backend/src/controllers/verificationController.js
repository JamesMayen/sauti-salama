import mongoose from "mongoose";

import AppError from "../utils/AppError.js";

import {
  processVerificationRequest,
  getVerificationRequests,
  getVerificationRequestById,
  getVerificationResult,
  createVerificationResult,
  getReviewQueue,
  resolveVerificationReview,
} from "../services/verificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createVerification = asyncHandler(
  async (req, res) => {
    const { claim } = req.body;
    const evidenceCount = Array.isArray(req.body.evidence)
      ? req.body.evidence.length
      : 0;

    console.log("[Verification] Request received", {
      claimLength:
        typeof claim === "string" ? claim.length : 0,
      evidenceCount,
    });

    if (!claim || !claim.trim()) {
      throw new AppError(
        "Claim is required.",
        400,
        "VERIFICATION_CLAIM_REQUIRED"
      );
    }

    const verification =
      await processVerificationRequest(req.body);

    console.log("[Verification] Response sent", {
      status: 200,
      reviewRequired:
        verification.result?.reviewRequired || false,
    });

    return res.status(200).json({
      success: true,
      message: "Verification completed successfully.",
      data: verification,
    });
  }
);

export async function getVerifications(req, res) {
  try {
    const requests = await getVerificationRequests(req.query);

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get verifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve verification requests.",
    });
  }
}

export async function getVerification(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification request ID.",
      });
    }

    const request = await getVerificationRequestById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Verification request not found.",
      });
    }

    const result = await getVerificationResult(id);

    return res.status(200).json({
      success: true,
      data: {
        request,
        result,
      },
    });
  } catch (error) {
    console.error("Get verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve verification request.",
    });
  }
}

export async function createResult(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification request ID.",
      });
    }

    const request = await getVerificationRequestById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Verification request not found.",
      });
    }

    const {
      truthStatus,
      riskLevel,
      summary,
    } = req.body;

    if (!truthStatus || !riskLevel || !summary) {
      return res.status(400).json({
        success: false,
        message:
          "truthStatus, riskLevel and summary are required.",
      });
    }

    const existingResult = await getVerificationResult(id);

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message:
          "A verification result already exists for this request.",
      });
    }

    const result = await createVerificationResult(id, req.body);

    return res.status(201).json({
      success: true,
      message: "Verification result created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Create verification result error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create verification result.",
    });
  }
}

export async function getReviewQueueController(req, res) {
  try {
    const queue = await getReviewQueue();
    return res.status(200).json({
      success: true,
      count: queue.length,
      data: queue,
    });
  } catch (error) {
    console.error("Get review queue error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve review queue.",
    });
  }
}

export async function resolveReviewController(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification request ID.",
      });
    }

    const result = await resolveVerificationReview(id, req.body, req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Human review decision recorded successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Resolve review error:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to resolve the review.",
      error: {
        code: error.code || "REVIEW_RESOLUTION_FAILED",
      },
    });
  }
}