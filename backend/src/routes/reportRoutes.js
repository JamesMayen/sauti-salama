import express from "express";

import {
  createReportController,
  getReportsController,
  getReportController,
  updateReportStatusController,
} from "../controllers/reportController.js";

import { validate } from "../middleware/validate.js";

import {
  createReportSchema,
  updateReportStatusSchema,
} from "../middleware/validationSchemas.js";

import {
  reportLimiter,
} from "../middleware/security.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/",
  reportLimiter,
  validate(createReportSchema),
  createReportController
);

router.get(
  "/",
  authenticate,
  getReportsController
);

router.get(
  "/:id",
  authenticate,
  getReportController
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin", "moderator"),
  validate(updateReportStatusSchema),
  updateReportStatusController
);

export default router;