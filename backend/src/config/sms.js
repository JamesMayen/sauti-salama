import AppError from "../utils/AppError.js";
import "./env.js";

const provider = process.env.SMS_PROVIDER || "mock";

export const smsConfig = {
  provider,
  atUsername: process.env.AT_USERNAME || "",
  atApiKey: process.env.AT_API_KEY || "",
  atSenderId: process.env.AT_SENDER_ID || "",
  atEnvironment: process.env.AT_ENVIRONMENT || "sandbox",
  webhookSecret: process.env.SMS_WEBHOOK_SECRET || "",
};

export function assertSmsConfiguration() {
  if (smsConfig.provider === "mock") {
    return;
  }

  if (smsConfig.provider !== "africastalking") {
    throw new AppError(
      "The configured SMS provider is not supported.",
      503,
      "SMS_PROVIDER_UNSUPPORTED"
    );
  }

  if (!smsConfig.atUsername || !smsConfig.atApiKey) {
    throw new AppError(
      "SMS service is not configured for the selected provider.",
      503,
      "SMS_PROVIDER_NOT_CONFIGURED"
    );
  }
}
