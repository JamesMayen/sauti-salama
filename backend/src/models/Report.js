import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    incidentDate: {
      type: Date,
      default: null,
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

    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    contactName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    contactPhone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
      default: null,
    },

    isAnonymous: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: [
        "received",
        "under_review",
        "verified",
        "unverified",
        "closed",
      ],
      default: "received",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ location: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ urgency: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;