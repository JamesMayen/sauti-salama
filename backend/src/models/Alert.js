import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      enum: [
        "security",
        "violence",
        "displacement",
        "misinformation",
        "service_disruption",
        "humanitarian",
        "other",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "verified",
        "unverified",
        "contested",
        "emerging_signal",
      ],
      required: true,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Source",
      default: null,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ location: 1 });
alertSchema.index({ category: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ isPublished: 1 });
alertSchema.index({ createdAt: -1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;