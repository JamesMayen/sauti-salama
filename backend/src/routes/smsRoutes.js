import express from "express";
import {
  getSms,
  listSms,
  sendAlertSms,
  sendSms,
  deliveryWebhook,
} from "../controllers/smsController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  sendAlertSmsSchema,
  sendSmsSchema,
  smsDeliveryWebhookSchema,
} from "../middleware/validationSchemas.js";
import { smsLimiter } from "../middleware/security.js";

const router = express.Router();

router.post(
  "/webhooks/delivery",
  validate(smsDeliveryWebhookSchema),
  deliveryWebhook
);

router.get(
  "/",
  authenticate,
  authorizeRoles("admin", "moderator"),
  listSms
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("admin", "moderator"),
  getSms
);

router.post(
  "/send",
  authenticate,
  authorizeRoles("admin", "moderator"),
  smsLimiter,
  validate(sendSmsSchema),
  sendSms
);

router.post(
  "/alert/:alertId",
  authenticate,
  authorizeRoles("admin", "moderator"),
  smsLimiter,
  validate(sendAlertSmsSchema),
  sendAlertSms
);

export default router;
