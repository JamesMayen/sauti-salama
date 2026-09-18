import mongoose from "mongoose";

const evidenceSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Source",
      required: true,
    },

    source: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    sourceType: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    reliabilityLevel: {
      type: String,
      enum: ["high", "medium", "unknown", null],
      default: "unknown",
    },

    sourceTier: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 4,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 300,
      default: null,
    },

    url: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    date: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    relevance: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const verificationResultSchema = new mongoose.Schema(
  {
    verificationRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VerificationRequest",
      required: true,
      unique: true,
    },

    truthStatus: {
      type: String,
      enum: [
        "verified",
        "unverified",
        "contested",
        "false",
        "partially_verified",
      ],
      required: true,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    summary: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    reasoning: {
      type: String,
      maxlength: 5000,
      default: null,
    },

    evidence: {
      type: [evidenceSchema],
      default: [],
    },

    uncertainties: {
      type: [String],
      maxlength: 20,
      default: [],
    },

    recommendedAction: {
      type: String,
      maxlength: 2000,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    aiGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

verificationResultSchema.index({ truthStatus: 1 });
verificationResultSchema.index({ riskLevel: 1 });
verificationResultSchema.index({ createdAt: -1 });

const VerificationResult = mongoose.model(
  "VerificationResult",
  verificationResultSchema
);

export default VerificationResult;