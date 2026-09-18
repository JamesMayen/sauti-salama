import jwt from "jsonwebtoken";

import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Verify JWT token and attach the authenticated
 * user information to req.user.
 */
export const authenticate = asyncHandler(
  async (req, res, next) => {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      throw new AppError(
        "Authentication required. Please provide a valid access token.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    const token =
      authorization.split(" ")[1];

    if (!token) {
      throw new AppError(
        "Authentication token is missing.",
        401,
        "TOKEN_MISSING"
      );
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError(
          "Your session has expired. Please log in again.",
          401,
          "TOKEN_EXPIRED"
        );
      }

      throw new AppError(
        "Invalid authentication token.",
        401,
        "INVALID_TOKEN"
      );
    }

    const user =
      await User.findById(decoded.userId);

    if (!user) {
      throw new AppError(
        "The authenticated user no longer exists.",
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

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    };

    next();
  }
);

/**
 * Restrict access to specific roles.
 *
 * Example:
 * authorizeRoles("admin", "moderator")
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(
          "Authentication required.",
          401,
          "AUTHENTICATION_REQUIRED"
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action.",
          403,
          "INSUFFICIENT_PERMISSIONS"
        )
      );
    }

    next();
  };
}