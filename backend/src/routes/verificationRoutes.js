import express from "express";

import {
  createVerification,
  getVerifications,
  getVerification,
  createResult,
} from "../controllers/verificationController.js";

import { validate } from "../middleware/validate.js";

import {
  createVerificationSchema,
  createVerificationResultSchema,
} from "../middleware/validationSchemas.js";

import {
  verificationLimiter,
} from "../middleware/security.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/",
  verificationLimiter,
  validate(createVerificationSchema),
  createVerification
);

router.get(
  "/",
  authenticate,
  getVerifications
);

router.get(
  "/:id",
  authenticate,
  getVerification
);

router.post(
  "/:id/result",
  authenticate,
  authorizeRoles("admin", "moderator"),
  validate(createVerificationResultSchema),
  createResult
);

export default router;