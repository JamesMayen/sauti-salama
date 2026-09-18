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