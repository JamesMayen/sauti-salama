import mongoose from "mongoose";

const civicInformationSchema = new mongoose.Schema(
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

    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },

    category: {
      type: String,
      enum: [
        "rights",
        "services",
        "safety",
        "reporting",
        "governance",
        "elections",
        "documentation",
        "other",
      ],
      required: true,
    },

    language: {
      type: String,
      enum: ["english", "juba_arabic", "dinka", "nuer", "other"],
      default: "english",
    },

    source: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Source",
      default: null,
    },

    sourceUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    lastVerifiedAt: {
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

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

civicInformationSchema.index({ category: 1 });
civicInformationSchema.index({ language: 1 });
civicInformationSchema.index({ isPublished: 1 });
civicInformationSchema.index({ createdAt: -1 });

const CivicInformation = mongoose.model(
  "CivicInformation",
  civicInformationSchema
);

export default CivicInformation;