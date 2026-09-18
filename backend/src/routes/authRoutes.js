import express from "express";

import {
  register,
  login,
  getMe,
} from "../controllers/authController.js";

import {
  registerSchema,
  loginSchema,
} from "../middleware/validationSchemas.js";

import { validate } from "../middleware/validate.js";

import {
  authenticate,
} from "../middleware/auth.js";

const router = express.Router();

/**
 * Register analyst account
 */
router.post(
  "/register",
  validate(registerSchema),
  register
);

/**
 * Login
 */
router.post(
  "/login",
  validate(loginSchema),
  login
);

/**
 * Current authenticated user
 */
router.get(
  "/me",
  authenticate,
  getMe
);

export default router;