import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const JWT_EXPIRES_IN = "1d";

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * POST /api/auth/register
 *
 * Public registration creates analyst accounts only.
 * Users cannot choose admin or moderator roles.
 */
export const register = asyncHandler(
  async (req, res) => {
    const {
      fullName,
      email,
      password,
    } = req.body;

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      throw new AppError(
        "An account with this email already exists.",
        409,
        "EMAIL_ALREADY_REGISTERED"
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "analyst",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  }
);

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(
  async (req, res) => {
    const {
      email,
      password,
    } = req.body;

    const normalizedEmail =
      email.trim().toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+passwordHash");

    if (!user) {
      throw new AppError(
        "Invalid email or password.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "This account has been deactivated.",
        403,
        "ACCOUNT_DISABLED"
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      throw new AppError(
        "Invalid email or password.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  }
);

/**
 * GET /api/auth/me
 *
 * Requires authentication.
 */
export const getMe = asyncHandler(
  async (req, res) => {
    const user =
      await User.findById(req.user.userId);

    if (!user) {
      throw new AppError(
        "User account no longer exists.",
        401,
        "USER_NOT_FOUND"
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "This account has been deactivated.",
        403,
        "ACCOUNT_DISABLED"
      );
    }

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  }
);