import AppError from "../../utils/AppError.js";
import { smsConfig } from "../../config/sms.js";

const endpoint =
  smsConfig.atEnvironment === "production"
    ? "https://api.africastalking.com/version1/messaging"
    : "https://api.sandbox.africastalking.com/version1/messaging";

export function createAfricaTalkingSmsProvider() {
  return {
    name: "africastalking",

    async send({ to, message }) {
      if (typeof fetch !== "function") {
        throw new AppError(
          "SMS provider is unavailable in this environment.",
          503,
          "SMS_PROVIDER_UNAVAILABLE"
        );
      }

      const body = new URLSearchParams({
        username: smsConfig.atUsername,
        to,
        message,
      });

      if (smsConfig.atSenderId) {
        body.set("from", smsConfig.atSenderId);
      }

      let response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            apiKey: smsConfig.atApiKey,
          },
          body,
        });
      } catch {
        throw new AppError(
          "SMS service is temporarily unavailable. Please try again later.",
          503,
          "SMS_PROVIDER_UNAVAILABLE"
        );
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new AppError(
          "SMS service is temporarily unavailable. Please try again later.",
          503,
          "SMS_PROVIDER_FAILED"
        );
      }

      const recipient = data?.SMSMessageData?.Recipients?.[0];
      const providerMessageId = recipient?.messageId || null;
      const acceptedStatus = recipient?.statusCode === "100";
      const status = acceptedStatus && smsConfig.atEnvironment === "sandbox"
        ? "simulated"
        : acceptedStatus
          ? "sent"
        : "failed";

      if (status === "failed") {
        throw new AppError(
          "SMS provider could not accept the message.",
          502,
          "SMS_PROVIDER_REJECTED"
        );
      }

      return {
        provider: "africastalking",
        providerMessageId,
        status,
        recipient: to,
        simulated: smsConfig.atEnvironment === "sandbox",
      };
    },
  };
}
