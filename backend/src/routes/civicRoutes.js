import express from "express";

import {
  createCivicController,
  getCivicController,
  getCivicByIdController,
  updateCivicController,
} from "../controllers/civicController.js";

import { validate } from "../middleware/validate.js";

import {
  createCivicInformationSchema,
  updateCivicInformationSchema,
} from "../middleware/validationSchemas.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  getCivicController
);

router.get(
  "/manage",
  authenticate,
  authorizeRoles("admin", "moderator", "analyst"),
  getCivicController
);

router.get(
  "/manage/:id",
  authenticate,
  authorizeRoles("admin", "moderator", "analyst"),
  getCivicByIdController
);

router.get(
  "/:id",
  getCivicByIdController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "moderator"),
  validate(createCivicInformationSchema),
  createCivicController
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles("admin", "moderator"),
  validate(updateCivicInformationSchema),
  updateCivicController
);

export default router;