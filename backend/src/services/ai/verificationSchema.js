import Joi from "joi";

export const truthStatuses = [
  "verified",
  "unverified",
  "contested",
  "false",
  "partially_verified",
];

export const riskLevels = [
  "low",
  "medium",
  "high",
  "critical",
];

export const evidenceSufficiencyLevels = [
  "sufficient",
  "conflicting",
  "insufficient",
  "technical_failure",
];

export const claimTypes = [
  "geography",
  "government",
  "history",
  "law_policy",
  "public_figure",
  "current_event",
  "security_incident",
  "health",
  "statistics",
  "general_factual",
  "opinion",
  "ambiguous",
];

export const relationshipTypes = [
  "direct_support",
  "partial_support",
  "contextual",
  "contradicts",
  "irrelevant",
  "inconclusive",
];

const nullableStringSchema = {
  anyOf: [
    { type: "string" },
    { type: "null" },
  ],
};

export const verificationResultJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    truthStatus: { type: "string", enum: truthStatuses },
    riskLevel: { type: "string", enum: riskLevels },
    confidence: { anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] },
    summary: { type: "string" },
    reasoning: nullableStringSchema,
    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          evidenceId: { type: "string" },
          source: nullableStringSchema,
          sourceType: nullableStringSchema,
          reliabilityLevel: { type: "string", enum: ["high", "medium", "unknown"] },
          sourceTier: { type: "integer", enum: [1, 2, 3, 4] },
          title: nullableStringSchema,
          url: nullableStringSchema,
          date: nullableStringSchema,
          relevance: nullableStringSchema,
          publisher: nullableStringSchema,
          relationshipToClaim: { type: "string", enum: relationshipTypes },
          supportsClaim: { type: "boolean" },
          evidenceScore: { anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] },
        },
        required: [
          "evidenceId", "source", "sourceType", "reliabilityLevel",
          "sourceTier", "title", "url", "date", "relevance",
        ],
      },
    },
    uncertainties: { type: "array", items: { type: "string" } },
    recommendedAction: nullableStringSchema,
    verifiedAt: nullableStringSchema,
    aiGenerated: { type: "boolean" },
  },
  required: [
    "truthStatus", "riskLevel", "confidence", "summary", "reasoning",
    "evidence", "uncertainties", "recommendedAction", "verifiedAt", "aiGenerated",
  ],
};

export const aiVerificationResultSchema = Joi.object({
  truthStatus: Joi.string().valid(...truthStatuses).required(),
  riskLevel: Joi.string().valid(...riskLevels).required(),
  confidence: Joi.number().min(0).max(1).allow(null).default(null),
  summary: Joi.string().trim().min(10).max(2000).required(),
  reasoning: Joi.string().trim().max(5000).allow(null, "").default(null),
  evidence: Joi.array().items(
    Joi.object({
      evidenceId: Joi.string().trim().max(20).required(),
      source: Joi.string().trim().max(200).allow(null, "").default(null),
      sourceType: Joi.string().trim().max(100).allow(null, "").default(null),
      reliabilityLevel: Joi.string().valid("high", "medium", "unknown").default("unknown"),
      sourceTier: Joi.number().valid(1, 2, 3, 4).required(),
      title: Joi.string().trim().max(300).allow(null, "").default(null),
      url: Joi.string().uri({ scheme: ["http", "https"] }).max(1000).allow(null, "").default(null),
      date: Joi.string().trim().max(100).allow(null, "").default(null),
      relevance: Joi.string().trim().max(1000).allow(null, "").default(null),
      publisher: Joi.string().trim().max(200).allow(null, "").default(null),
      relationshipToClaim: Joi.string().valid(...relationshipTypes).default("inconclusive"),
      supportsClaim: Joi.boolean().default(null),
      evidenceScore: Joi.number().min(0).max(1).allow(null).default(null),
    }).unknown(false)
  ).max(20).default([]),
  uncertainties: Joi.array().items(Joi.string().trim().max(500)).max(20).default([]),
  recommendedAction: Joi.string().trim().max(2000).allow(null, "").default(null),
  verifiedAt: Joi.date().allow(null).default(null),
  aiGenerated: Joi.boolean().valid(true).default(true),
}).unknown(false);

export function validateAiVerificationResult(output) {
  return aiVerificationResultSchema.validate(output, { abortEarly: false, convert: true, stripUnknown: true });
}

export function isEvidenceTraceable(evidence, suppliedEvidence = []) {
  const availableEvidence = Array.isArray(suppliedEvidence) ? suppliedEvidence : [];
  if (!Array.isArray(evidence)) return false;

  if (evidence.length === 0) return true;

  if (!availableEvidence.length) return false;

  return evidence.every((item) => {
    const identityFields = ["evidenceId", "source", "sourceType", "reliabilityLevel", "sourceTier", "title", "url", "date"];
    if (!item.evidenceId) return false;
    return availableEvidence.some((supplied) => {
      const populatedFields = identityFields.filter((field) => item[field] !== null && item[field] !== undefined);
      return supplied && supplied.evidenceId === item.evidenceId && populatedFields.every((field) => {
        if (item[field] === null || item[field] === undefined) return true;
        return supplied[field] === item[field];
      });
    });
  });
}

function attachSourceIds(evidence, suppliedEvidence) {
  return evidence.map((item) => {
    const supplied = suppliedEvidence.find((candidate) => candidate.evidenceId === item.evidenceId);
    if (!supplied) throw new Error("AI evidence could not be linked to a source.");
    return { ...item, ...(supplied.sourceId ? { sourceId: supplied.sourceId } : {}) };
  });
}

export function normalizeAiVerificationResult(output, { suppliedEvidence = [] } = {}) {
  const { error, value } = validateAiVerificationResult(output);
  if (error) return { error, value: null };

  if (!isEvidenceTraceable(value.evidence, suppliedEvidence)) {
    return { error: new Error("AI evidence could not be traced to supplied evidence."), value: null };
  }

  try {
    return {
      error: null,
      value: { ...value, evidence: attachSourceIds(value.evidence, suppliedEvidence), aiGenerated: true },
    };
  } catch (error) {
    return { error, value: null };
  }
}
