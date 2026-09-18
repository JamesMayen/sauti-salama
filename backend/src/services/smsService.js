import SmsMessage from "../models/SmsMessage.js";
import AppError from "../utils/AppError.js";
import { normalizeSouthSudanPhone, maskPhoneNumber } from "../utils/phoneNumber.js";
import { assertSmsConfiguration, smsConfig } from "../config/sms.js";
import { createMockSmsProvider } from "./smsProviders/mockSmsProvider.js";
import { createAfricaTalkingSmsProvider } from "./smsProviders/africaTalkingSmsProvider.js";

const providers = {
  mock: createMockSmsProvider,
  africastalking: createAfricaTalkingSmsProvider,
};

function getProvider() {
  assertSmsConfiguration();
  return providers[smsConfig.provider]();
}

function sanitizeMetadata(metadata = {}) {
  const allowed = {};
  for (const key of ["reportId", "alertId", "verificationId", "simulated"]) {
    if (metadata[key] !== undefined) allowed[key] = metadata[key];
  }
  return allowed;
}

export async function sendSMS({
  to,
  message,
  messageType,
  sourceType,
  sourceId = null,
  metadata = {},
}) {
  if (!message || message.trim().length > 1600) {
    throw new AppError(
      "SMS message must contain between 1 and 1600 characters.",
      400,
      "INVALID_SMS_MESSAGE"
    );
  }

  const recipient = normalizeSouthSudanPhone(to);
  const provider = getProvider();
  const safeMetadata = sanitizeMetadata(metadata);

  const existing = sourceId
    ? await SmsMessage.findOne({
        sourceType,
        sourceId: String(sourceId),
        messageType,
        status: { $in: ["queued", "simulated", "sent", "delivered"] },
      })
    : null;

  if (existing) {
    return existing;
  }

  const record = await SmsMessage.create({
    recipient,
    message: message.trim(),
    messageType,
    provider: provider.name,
    sourceType,
    sourceId: sourceId ? String(sourceId) : null,
    metadata: safeMetadata,
    status: "queued",
  });

  try {
    const result = await provider.send({
      to: recipient,
      message: message.trim(),
      messageType,
    });

    record.providerMessageId = result.providerMessageId;
    record.status = result.status;
    record.sentAt = ["sent", "simulated"].includes(result.status)
      ? new Date()
      : null;
    record.metadata = {
      ...safeMetadata,
      simulated: Boolean(result.simulated),
    };
    await record.save();
    return record;
  } catch (error) {
    record.status = "failed";
    record.failedAt = new Date();
    record.errorMessage = error.isOperational
      ? error.message
      : "SMS provider request failed.";
    await record.save();
    throw error;
  }
}

export async function acknowledgeReport({ reportId, phone }) {
  return sendSMS({
    to: phone,
    message: `Sauti Salama: Your report has been received. Reference: ${String(reportId).slice(-8)}. It has not yet been independently verified.`,
    messageType: "report_acknowledgement",
    sourceType: "report",
    sourceId: reportId,
    metadata: { reportId },
  });
}

export async function sendAlertNotification({ alertId, phone, location }) {
  return sendSMS({
    to: phone,
    message: `Sauti Salama Alert: Safety information is available for ${location}. Avoid sharing unverified reports. Check Sauti Salama for verified information and recommended actions.`,
    messageType: "alert_notification",
    sourceType: "alert",
    sourceId: alertId,
    metadata: { alertId },
  });
}

export async function notifyVerificationResult({
  verificationId,
  phone,
  truthStatus,
  riskLevel,
}) {
  return sendSMS({
    to: phone,
    message: `Sauti Salama: Your verification was reviewed. Status: ${truthStatus}. Risk: ${riskLevel}. Check Sauti Salama for evidence and recommended actions.`,
    messageType: "verification_result",
    sourceType: "verification",
    sourceId: verificationId,
    metadata: { verificationId },
  });
}

export async function getSmsMessages(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.messageType) query.messageType = filters.messageType;
  return SmsMessage.find(query).sort({ createdAt: -1 });
}

export async function getSmsMessageById(id) {
  return SmsMessage.findById(id);
}

export async function updateSmsDeliveryStatus({
  providerMessageId,
  status,
  deliveredAt = null,
  errorMessage = null,
}) {
  const updates = {
    status,
    deliveredAt: status === "delivered"
      ? deliveredAt || new Date()
      : null,
    failedAt: status === "failed" ? new Date() : null,
    errorMessage: status === "failed" ? errorMessage : null,
  };

  return SmsMessage.findOneAndUpdate(
    { providerMessageId },
    updates,
    { new: true }
  );
}

export function sanitizeSmsMessage(message) {
  if (!message) return null;
  const data = typeof message.toObject === "function" ? message.toObject() : { ...message };
  data.recipient = maskPhoneNumber(data.recipient);
  data.message = data.message.length > 240 ? `${data.message.slice(0, 240)}...` : data.message;
  return data;
}

export function sanitizeSmsMessages(messages) {
  return messages.map(sanitizeSmsMessage);
}
