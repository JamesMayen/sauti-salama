import express from "express";

import {
  createSourceController,
  getSourcesController,
  getSourceController,
  updateSourceController,
} from "../controllers/sourceController.js";

import { validate } from "../middleware/validate.js";

import {
  createSourceSchema,
  updateSourceSchema,
} from "../middleware/validationSchemas.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/",
  getSourcesController
);

router.get(
  "/:id",
  getSourceController
);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "moderator"),
  validate(createSourceSchema),
  createSourceController
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles("admin", "moderator"),
  validate(updateSourceSchema),
  updateSourceController
);

export default router;