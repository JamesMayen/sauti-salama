import mongoose from "mongoose";

const verificationRequestSchema = new mongoose.Schema(
  {
    claim: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },

    language: {
      type: String,
      enum: ["english", "juba_arabic", "dinka", "nuer", "other"],
      default: "english",
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    sourceUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "needs_review",
      ],
      default: "pending",
    },

    reviewRequired: {
      type: Boolean,
      default: false,
    },

    reviewReason: {
      type: String,
      enum: ["insufficient_evidence", "manual_review", "technical_failure", null],
      default: null,
    },

    evidenceSufficiency: {
      type: String,
      enum: ["sufficient", "conflicting", "insufficient", null],
      default: null,
    },

    reviewStatus: {
      type: String,
      enum: ["pending", "in_review", "resolved", "dismissed", null],
      default: null,
    },

    reviewDecision: {
      type: String,
      enum: ["verified", "partially_verified", "unverified", "contested", "false", null],
      default: null,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
  },
  {
    timestamps: true,
  }
);

verificationRequestSchema.index({ status: 1 });
verificationRequestSchema.index({ createdAt: -1 });

const VerificationRequest = mongoose.model(
  "VerificationRequest",
  verificationRequestSchema
);

export default VerificationRequest;