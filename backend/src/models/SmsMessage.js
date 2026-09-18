import mongoose from "mongoose";

const smsMessageSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: [
        "report_acknowledgement",
        "report_status",
        "verification_result",
        "alert_notification",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1600,
    },
    provider: {
      type: String,
      enum: ["mock", "africastalking"],
      required: true,
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["queued", "simulated", "sent", "delivered", "failed"],
      default: "queued",
    },
    sourceType: {
      type: String,
      enum: ["report", "verification", "alert", "manual"],
      required: true,
    },
    sourceId: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

smsMessageSchema.index({ createdAt: -1 });
smsMessageSchema.index({ sourceType: 1, sourceId: 1, messageType: 1 });
smsMessageSchema.index({ status: 1 });

const SmsMessage = mongoose.model("SmsMessage", smsMessageSchema);

export default SmsMessage;
