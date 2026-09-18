import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getSmsMessageById,
  getSmsMessages,
  sanitizeSmsMessage,
  sanitizeSmsMessages,
  sendSMS,
  sendAlertNotification,
  updateSmsDeliveryStatus,
} from "../services/smsService.js";
import Alert from "../models/Alert.js";
import { normalizeSouthSudanPhone } from "../utils/phoneNumber.js";
import { smsConfig } from "../config/sms.js";

export const listSms = asyncHandler(async (req, res) => {
  const messages = await getSmsMessages(req.query);
  return res.status(200).json({
    success: true,
    count: messages.length,
    data: sanitizeSmsMessages(messages),
  });
});

export const getSms = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid SMS message ID.",
    });
  }

  const message = await getSmsMessageById(req.params.id);
  if (!message) {
    return res.status(404).json({
      success: false,
      message: "SMS message not found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: sanitizeSmsMessage(message),
  });
});

export const sendSms = asyncHandler(async (req, res) => {
  const message = await sendSMS({
    to: req.body.recipient,
    message: req.body.message,
    messageType: req.body.messageType,
    sourceType: "manual",
    metadata: {},
  });

  return res.status(201).json({
    success: true,
    message: "SMS request processed.",
    data: sanitizeSmsMessage(message),
  });
});

export const sendAlertSms = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.alertId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid alert ID.",
    });
  }

  const alert = await Alert.findOne({
    _id: req.params.alertId,
    isPublished: true,
  });

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: "Only published alerts can be sent by SMS.",
    });
  }

  const message = await sendAlertNotification({
    alertId: alert._id,
    phone: normalizeSouthSudanPhone(req.body.recipient),
    location: alert.location,
  });

  return res.status(201).json({
    success: true,
    message: "Alert SMS request processed.",
    data: sanitizeSmsMessage(message),
  });
});

export const deliveryWebhook = asyncHandler(async (req, res) => {
  if (
    !smsConfig.webhookSecret ||
    req.get("x-sms-webhook-secret") !== smsConfig.webhookSecret
  ) {
    return res.status(401).json({
      success: false,
      message: "SMS webhook authentication failed.",
    });
  }

  const message = await updateSmsDeliveryStatus(req.body);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: "SMS message not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "SMS delivery status updated.",
  });
});
