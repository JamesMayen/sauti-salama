import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    url: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    type: {
      type: String,
      enum: [
        "official",
        "institutional",
        "independent_media",
        "community",
        "international",
        "user_submitted",
        "other",
      ],
      required: true,
    },

    reliabilityLevel: {
      type: String,
      enum: ["high", "medium", "unknown"],
      default: "unknown",
    },

    description: {
      type: String,
      maxlength: 1000,
      default: null,
    },

    lastCheckedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

sourceSchema.index({ type: 1 });
sourceSchema.index({ reliabilityLevel: 1 });
sourceSchema.index({ isActive: 1 });

const Source = mongoose.model("Source", sourceSchema);

export default Source;