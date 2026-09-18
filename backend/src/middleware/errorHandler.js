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
      value: error.keyValue[field],
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
        value: error.value,
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

function buildErrorResponse(error) {
  /*
  |--------------------------------------------------------------------------
  | Custom application error
  |--------------------------------------------------------------------------
  */

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Mongoose validation error
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Invalid MongoDB ObjectId
  |--------------------------------------------------------------------------
  */

  if (error instanceof mongoose.Error.CastError) {
    return handleCastError(error);
  }

  /*
  |--------------------------------------------------------------------------
  | Duplicate MongoDB key
  |--------------------------------------------------------------------------
  */

  if (error?.code === 11000) {
    return handleDuplicateKeyError(error);
  }

  /*
  |--------------------------------------------------------------------------
  | Invalid JSON
  |--------------------------------------------------------------------------
  */

  if (
    error instanceof SyntaxError &&
    error.status === 400
  ) {
    return handleJsonSyntaxError();
  }

  /*
  |--------------------------------------------------------------------------
  | Unexpected error
  |--------------------------------------------------------------------------
  */

  return {
    statusCode: 500,
    code: "SERVER_ERROR",
    message: "An unexpected server error occurred.",
  };
}

export function errorHandler(error, req, res, next) {
  console.error("API Error:", {
    method: req.method,
    path: req.originalUrl,
    message: error.message,
    stack: error.stack,
  });

  const response = buildErrorResponse(
    error
  );

  const payload = {
    success: false,
    error: {
      code: response.code,
      message: response.message,
    },
  };

  if (response.details) {
    payload.error.details = response.details;
  }

  return res.status(response.statusCode).json(payload);
}