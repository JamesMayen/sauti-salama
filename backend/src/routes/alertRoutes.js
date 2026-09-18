import express from "express";

import {
  createAlertController,
  getAlertsController,
  getAlertController,
  updateAlertController,
} from "../controllers/alertController.js";

import { validate } from "../middleware/validate.js";

import {
  createAlertSchema,
  updateAlertSchema,
} from "../middleware/validationSchemas.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  getAlertsController
);

router.get(
  "/:id",
  getAlertController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "moderator"),
  validate(createAlertSchema),
  createAlertController
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles("admin", "moderator"),
  validate(updateAlertSchema),
  updateAlertController
);

export default router;