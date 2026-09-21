import OpenAI from "openai";
import AppError from "../../utils/AppError.js";
import {
  verificationResultJsonSchema,
} from "./verificationSchema.js";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 30_000;

function getOpenAiError(error) {
  const status = Number(
    error?.status ?? error?.statusCode ?? 0
  );
  const providerCode =
    error?.error?.code || error?.code || null;
  const isTimeout =
    error?.name === "AbortError" ||
    error?.name === "APIConnectionTimeoutError" ||
    error?.name === "APIUserAbortError" ||
    error?.code === "ETIMEDOUT";

  if (
    status === 401 ||
    providerCode === "invalid_api_key"
  ) {
    return new AppError(
      "AI verification is currently unavailable because the configured OpenAI key is invalid or missing.",
      503,
      "AI_PROVIDER_AUTHENTICATION_FAILED",
      { providerCode }
    );
  }

  if (status === 429) {
    return new AppError(
      "AI verification is busy. Please try again later.",
      503,
      "AI_PROVIDER_RATE_LIMITED",
      { providerCode }
    );
  }

  if (status === 400) {
    return new AppError(
      "AI verification could not process this request.",
      503,
      "AI_PROVIDER_INVALID_REQUEST",
      { providerCode }
    );
  }

  if (status >= 500) {
    return new AppError(
      "AI verification is temporarily unavailable. Please try again later.",
      503,
      "AI_PROVIDER_UNAVAILABLE",
      { providerCode }
    );
  }

  if (isTimeout) {
    return new AppError(
      "AI verification timed out. Please try again later.",
      503,
      "AI_PROVIDER_TIMEOUT",
      { providerCode }
    );
  }

  if (error?.name === "APIConnectionError") {
    return new AppError(
      "AI verification is temporarily unavailable. Please try again later.",
      503,
      "AI_PROVIDER_UNAVAILABLE",
      { providerCode }
    );
  }

  return new AppError(
    "AI verification failed. Please try again later.",
    503,
    "AI_PROVIDER_REQUEST_FAILED",
    { providerCode }
  );
}

function parseResponseText(response) {
  if (
    response?.output_parsed &&
    typeof response.output_parsed === "object"
  ) {
    return response.output_parsed;
  }

  const outputText =
    typeof response?.output_text === "string"
      ? response.output_text.trim()
      : "";

  if (!outputText) {
    throw new AppError(
      "AI provider returned an empty verification result.",
      503,
      "AI_PROVIDER_EMPTY_RESPONSE"
    );
  }

  try {
    return JSON.parse(outputText);
  } catch {
    throw new AppError(
      "AI provider returned an invalid verification result.",
      503,
      "AI_PROVIDER_MALFORMED_RESPONSE"
    );
  }
}

function prepareEvidenceForInput(suppliedEvidence = []) {
  if (!Array.isArray(suppliedEvidence)) {
    return [];
  }

  return suppliedEvidence
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const {
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
      } = item;

      return {
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
      };
    })
    .filter(Boolean);
}

export function createOpenAiProvider({
  client = null,
  model = null,
  timeout = DEFAULT_TIMEOUT_MS,
} = {}) {
  let openAiClient = client;

  function getClient() {
    if (!openAiClient && !process.env.OPENAI_API_KEY) {
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
        maxRetries: 0,
      });
    }

    return openAiClient;
  }

  function getResolvedModel() {
    return (
      model ||
      process.env.OPENAI_MODEL ||
      DEFAULT_MODEL
    );
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

      if (
        !instructions ||
        typeof instructions !== "string"
      ) {
        throw new AppError(
          "AI verification instructions are not configured yet.",
          503,
          "AI_VERIFICATION_INSTRUCTIONS_NOT_CONFIGURED"
        );
      }

      const evidence = prepareEvidenceForInput(
        suppliedEvidence
      );
      let input;

      try {
        input = JSON.stringify({
          CLAIM: claim.trim(),
          CONTEXT: {
            language: language || "english",
            submittedSourceUrl: sourceUrl || null,
            notes:
              context && typeof context === "string"
                ? context
                : null,
          },
          EVIDENCE: evidence,
        });
      } catch {
        throw new AppError(
          "AI verification input could not be prepared.",
          500,
          "AI_VERIFICATION_INPUT_INVALID"
        );
      }

      const resolvedModel = getResolvedModel();

      console.log("[Verification] AI provider request started", {
        provider: "openai",
        model: resolvedModel,
        evidenceCount: evidence.length,
        inputLength: input.length,
      });

      try {
        const response = await getClient().responses.create({
          model: resolvedModel,
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

        if (response?.error) {
          throw new AppError(
            "AI provider returned a verification error.",
            503,
            "AI_PROVIDER_REQUEST_FAILED"
          );
        }

        const result = parseResponseText(response);

        console.log("[Verification] AI provider request completed", {
          provider: "openai",
          requestId: response?._request_id || null,
        });

        return result;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        console.error(
          "[Verification] AI provider request failed",
          {
            code:
              error?.code ||
              "AI_PROVIDER_REQUEST_FAILED",
            requestId: error?._request_id || null,
          }
        );

        throw getOpenAiError(error);
      }
    },
  };
}
