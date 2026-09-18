import AppError from "../../utils/AppError.js";
import { normalizeAiVerificationResult } from "./verificationSchema.js";
import { createOpenAiProvider } from "./openAiProvider.js";

/*
 * Provider-neutral boundary for future AI verification.
 *
 * The provider owns SDK communication and key access. This module keeps the
 * verification workflow provider-neutral and never fabricates a result.
 */
export function createAiService({ provider = null } = {}) {
  return {
    async verifyClaim(input) {
      if (!provider || typeof provider.verifyClaim !== "function") {
        throw new AppError(
          "AI verification is not configured yet.",
          501,
          "AI_VERIFICATION_NOT_CONFIGURED"
        );
      }

      const providerOutput = await provider.verifyClaim(input);
      const normalized = normalizeAiVerificationResult(
        providerOutput,
        {
          suppliedEvidence: input?.suppliedEvidence,
        }
      );

      if (normalized.error) {
        throw new AppError(
          "AI provider returned an invalid verification result.",
          502,
          "INVALID_AI_VERIFICATION_RESULT",
          normalized.error.details
        );
      }

      return normalized.value;
    },
  };
}

export const aiService = createAiService({
  provider: createOpenAiProvider(),
});

export async function verifyClaim(input) {
  return aiService.verifyClaim(input);
}
