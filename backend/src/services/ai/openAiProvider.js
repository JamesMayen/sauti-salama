import OpenAI from "openai";
import AppError from "../../utils/AppError.js";
import {
  verificationResultJsonSchema,
} from "./verificationSchema.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 30_000;

function getOpenAiError(error) {
  const status = Number(error?.status ?? error?.statusCode ?? 0);
  const providerCode = error?.error?.code || error?.code || null;
  const providerMessage = error?.message || "AI provider request failed.";

  if (status === 401 || providerCode === "invalid_api_key") {
    return new AppError(
      "AI verification is currently unavailable because the configured OpenAI key is invalid or missing.",
      503,
      "AI_PROVIDER_AUTHENTICATION_FAILED",
      {
        providerCode,
        providerMessage,
      }
    );
  }

  if (status === 429) {
    return new AppError(
      "AI verification is busy. Please try again later.",
      503,
      "AI_PROVIDER_RATE_LIMITED",
      {
        providerCode,
        providerMessage,
      }
    );
  }

  if (status === 400) {
    return new AppError(
      "AI verification could not process this request.",
      502,
      "AI_PROVIDER_INVALID_REQUEST",
      {
        providerCode,
        providerMessage,
      }
    );
  }

  if (status >= 500) {
    return new AppError(
      "AI verification is temporarily unavailable. Please try again later.",
      503,
      "AI_PROVIDER_UNAVAILABLE",
      {
        providerCode,
        providerMessage,
      }
    );
  }

  if (
    error?.name === "AbortError" ||
    error?.name === "APIConnectionTimeoutError" ||
    error?.code === "ETIMEDOUT"
  ) {
    return new AppError(
      "AI verification timed out. Please try again later.",
      504,
      "AI_PROVIDER_TIMEOUT",
      {
        providerCode,
        providerMessage,
      }
    );
  }

  if (error?.name === "APIConnectionError") {
    return new AppError(
      "AI verification is temporarily unavailable. Please try again later.",
      503,
      "AI_PROVIDER_UNAVAILABLE",
      {
        providerCode,
        providerMessage,
      }
    );
  }

  return new AppError(
    "AI verification failed. Please try again later.",
    502,
    "AI_PROVIDER_REQUEST_FAILED",
    {
      providerCode,
      providerMessage,
    }
  );
}

function parseResponseText(response) {
  const outputText = response?.output_text?.trim();

  if (!outputText) {
    throw new AppError(
      "AI provider returned an empty verification result.",
      502,
      "AI_PROVIDER_EMPTY_RESPONSE"
    );
  }

  try {
    return JSON.parse(outputText);
  } catch {
    throw new AppError(
      "AI provider returned an invalid verification result.",
      502,
      "AI_PROVIDER_MALFORMED_RESPONSE"
    );
  }
}

export function createOpenAiProvider({
  client = null,
  model = process.env.OPENAI_MODEL || DEFAULT_MODEL,
  timeout = DEFAULT_TIMEOUT_MS,
} = {}) {
  let openAiClient = client;

  function getClient() {
    if (!process.env.OPENAI_API_KEY) {
      throw new AppError(
        "AI verification is currently unavailable. Please try again later.",
        503,
        "AI_PROVIDER_NOT_CONFIGURED"
      );
    }

    if (!openAiClient) {
      openAiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout,
      });
    }

    return openAiClient;
  }

  return {
    async verifyClaim({
      claim,
      language,
      sourceUrl,
      suppliedEvidence = [],
      context = null,
      instructions,
    }) {
      if (!claim || typeof claim !== "string") {
        throw new AppError(
          "A claim is required for AI verification.",
          400,
          "AI_VERIFICATION_INPUT_INVALID"
        );
      }

      if (!instructions || typeof instructions !== "string") {
        throw new AppError(
          "AI verification instructions are not configured yet.",
          501,
          "AI_VERIFICATION_INSTRUCTIONS_NOT_CONFIGURED"
        );
      }

      const input = JSON.stringify({
        CLAIM: claim.trim(),
        CONTEXT: {
          language: language || "english",
          submittedSourceUrl: sourceUrl || null,
          notes:
            context && typeof context === "string"
              ? context
              : null,
        },
        EVIDENCE: Array.isArray(suppliedEvidence)
          ? suppliedEvidence.map(
              ({
                evidenceId,
                source,
                sourceType,
                reliabilityLevel,
                sourceTier,
                title,
                url,
                date,
                content,
                missingFields,
              }) => ({
                evidenceId,
                source,
                sourceType,
                reliabilityLevel,
                sourceTier,
                title,
                url,
                date,
                content,
                missingFields,
              })
            )
          : [],
      });

      try {
        const response = await getClient().responses.create({
          model,
          instructions,
          input,
          text: {
            format: {
              type: "json_schema",
              name: "sauti_salama_verification_result",
              strict: true,
              schema: verificationResultJsonSchema,
            },
          },
        });

        return parseResponseText(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw getOpenAiError(error);
      }
    },
  };
}
