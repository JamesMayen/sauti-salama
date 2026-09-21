import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

function handleDuplicateKeyError(error) {
  const fields = Object.keys(error.keyValue || {});

  return {
    statusCode: 409,
    code: "DUPLICATE_RESOURCE",
    message: fields.length
      ? `A resource with the same ${fields.join(", ")} already exists.`
      : "A resource with the same unique value already exists.",
    details: fields.map((field) => ({
      field,
      message: "A duplicate value was rejected.",
    })),
  };
}

function handleCastError(error) {
  return {
    statusCode: 400,
    code: "INVALID_IDENTIFIER",
    message: `Invalid value for ${error.path}.`,
    details: [
      {
        field: error.path,
        message: "The identifier was invalid.",
      },
    ],
  };
}

function handleJsonSyntaxError() {
  return {
    statusCode: 400,
    code: "INVALID_JSON",
    message: "Request body contains invalid JSON.",
  };
}

function sanitizeDetails(details) {
  if (!Array.isArray(details)) {
    return null;
  }

  return details
    .filter((detail) => detail && typeof detail === "object")
    .map((detail) => ({
      field:
        typeof detail.field === "string"
          ? detail.field
          : "unknown",
      message:
        typeof detail.message === "string"
          ? detail.message
          : "Invalid field value.",
    }));
}

function buildErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: sanitizeDetails(error.details),
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map(
      (fieldError) => ({
        field: fieldError.path,
        message: fieldError.message,
      })
    );

    return {
      statusCode: 400,
      code: "DATABASE_VALIDATION_ERROR",
      message: "Database validation failed.",
      details,
    };
  }

  if (error instanceof mongoose.Error.CastError) {
    return handleCastError(error);
  }

  if (error?.code === 11000) {
    return handleDuplicateKeyError(error);
  }

  if (
    error instanceof SyntaxError &&
    error.status === 400
  ) {
    return handleJsonSyntaxError();
  }

  return {
    statusCode: 500,
    code: "SERVER_ERROR",
    message: "An unexpected server error occurred.",
  };
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const response = buildErrorResponse(error);
  const isUnexpectedError =
    response.code === "SERVER_ERROR";

  console.error("API Error:", {
    method: req.method,
    path: req.originalUrl,
    code: response.code,
    statusCode: response.statusCode,
    message: isUnexpectedError
      ? "Unexpected server error."
      : response.message,
  });

  if (
    process.env.NODE_ENV !== "production" &&
    error?.stack
  ) {
    console.error(error.stack);
  }

  const payload = {
    success: false,
    error: {
      code: response.code,
      message: response.message,
    },
  };

  const details = sanitizeDetails(response.details);
  if (details?.length) {
    payload.error.details = details;
  }

  return res.status(response.statusCode).json(payload);
}
