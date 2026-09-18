import rateLimit from "express-rate-limit";
import hpp from "hpp";
import "../config/env.js";

const rateLimitWindowMinutes = Number.parseInt(
  process.env.RATE_LIMIT_WINDOW_MINUTES,
  10
);

const rateLimitMaxRequests = Number.parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS,
  10
);

const generalRateLimitWindowMinutes =
  Number.isFinite(rateLimitWindowMinutes) &&
  rateLimitWindowMinutes > 0
    ? rateLimitWindowMinutes
    : 15;

const generalRateLimitMaxRequests =
  Number.isFinite(rateLimitMaxRequests) &&
  rateLimitMaxRequests > 0
    ? rateLimitMaxRequests
    : 300;

/*
|--------------------------------------------------------------------------
| General API Rate Limiter
|--------------------------------------------------------------------------
|
| Protects the API from excessive automated requests.
|
*/

export const apiLimiter = rateLimit({
  windowMs:
    generalRateLimitWindowMinutes * 60 * 1000,

  limit: generalRateLimitMaxRequests,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message:
        "Too many requests. Please try again later.",
    },
  },
});

/*
|--------------------------------------------------------------------------
| Verification Rate Limiter
|--------------------------------------------------------------------------
|
| Verification can eventually trigger AI processing.
| Therefore it receives a stricter limit.
|
*/

export const verificationLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 30,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
      success: false,
      error: {
        code: "VERIFICATION_RATE_LIMIT_EXCEEDED",
        message:
          "Too many verification requests. Please try again later.",
      },
    },
  });

/*
|--------------------------------------------------------------------------
| Report Rate Limiter
|--------------------------------------------------------------------------
|
| Prevents automated abuse of the community reporting
| endpoint.
|
*/

export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 20,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  message: {
    success: false,
    error: {
      code: "REPORT_RATE_LIMIT_EXCEEDED",
      message:
        "Too many reports submitted from this connection. Please try again later.",
    },
  },
});

export const smsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "SMS_RATE_LIMIT_EXCEEDED",
      message: "Too many SMS requests. Please try again later.",
    },
  },
});

/*
|--------------------------------------------------------------------------
| HTTP Parameter Pollution Protection
|--------------------------------------------------------------------------
*/

export const preventParameterPollution = hpp();