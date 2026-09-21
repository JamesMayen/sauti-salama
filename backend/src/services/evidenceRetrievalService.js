import Source from "../models/Source.js";
import AppError from "../utils/AppError.js";

const PRIORITY_BY_TYPE = {
  official: 1,
  institutional: 1,
  international: 1,
  independent_media: 2,
  community: 3,
  user_submitted: 4,
  other: 4,
};

const RELATIONSHIP_WEIGHTS = {
  supports: 3,
  contradicts: 3,
  contextualizes: 2,
  inconclusive: 1,
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeClaim(claim) {
  if (typeof claim !== "string") {
    return "";
  }

  return claim.replace(/\s+/g, " ").trim();
}

function extractTerms(claim) {
  const normalized = normalizeClaim(claim)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ");

  return normalized
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .slice(0, 12);
}

function getRelationshipFromType(sourceType) {
  if (!sourceType) {
    return "inconclusive";
  }

  if (["official", "institutional", "international"].includes(sourceType)) {
    return "supports";
  }

  if (["independent_media", "community"].includes(sourceType)) {
    return "contextualizes";
  }

  return "inconclusive";
}

function rankSourcesByClaim(sources, terms, sourceUrl = null) {
  return sources
    .map((source) => {
      const haystack = [
        source.name,
        source.description,
        source.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let score = 0;

      for (const term of terms) {
        if (haystack.includes(term)) {
          score += 2;
        }
      }

      if (source.type && PRIORITY_BY_TYPE[source.type]) {
        score += 3 - PRIORITY_BY_TYPE[source.type];
      }

      if (source.reliabilityLevel === "high") {
        score += 3;
      } else if (source.reliabilityLevel === "medium") {
        score += 2;
      }

      return {
        source,
        score,
        exactSourceMatch:
          Boolean(sourceUrl) && source.url === sourceUrl,
      };
    })
    .filter(
      (entry) =>
        entry.score > 0 || entry.exactSourceMatch
    )
    .sort((a, b) => b.score - a.score);
}

export function determineEvidenceSufficiency(evidence = []) {
  const items = Array.isArray(evidence)
    ? evidence.filter(
        (item) => item && typeof item === "object"
      )
    : [];

  if (!items.length) {
    return "insufficient";
  }

  const supportCount = items.filter(
    (item) => item.relationshipToClaim === "supports"
  ).length;
  const conflictCount = items.filter(
    (item) => item.relationshipToClaim === "contradicts"
  ).length;
  const contextualCount = items.filter(
    (item) => item.relationshipToClaim === "contextualizes"
  ).length;

  const reliableItems = items.filter(
    (item) =>
      ["high", "medium"].includes(item.reliabilityLevel)
  );

  if (conflictCount > 0 && supportCount > 0) {
    return "conflicting";
  }

  if (reliableItems.length >= 2 && supportCount >= 1) {
    return "sufficient";
  }

  if (reliableItems.length === 0 && contextualCount > 0) {
    return "insufficient";
  }

  if (supportCount > 0 || conflictCount > 0) {
    return supportCount >= conflictCount ? "sufficient" : "conflicting";
  }

  return "insufficient";
}

export async function retrieveEvidenceForClaim({
  claim,
  sourceUrl = null,
  suppliedEvidence = [],
  context = null,
} = {}) {
  const normalizedClaim = normalizeClaim(claim);
  const evidence = Array.isArray(suppliedEvidence)
    ? suppliedEvidence
    : [];

  console.log("[Verification] Evidence retrieval started", {
    provider: "mongodb-source-registry",
    sourceUrlProvided: Boolean(sourceUrl),
    suppliedEvidenceCount: evidence.length,
  });

  if (!normalizedClaim) {
    console.log("[Verification] Evidence retrieval completed", {
      matchedSourceCount: 0,
      retrievedEvidenceCount: evidence.length,
    });
    return evidence;
  }

  const terms = extractTerms(normalizedClaim);

  if (!terms.length && !sourceUrl) {
    console.log("[Verification] Evidence retrieval completed", {
      matchedSourceCount: 0,
      retrievedEvidenceCount: evidence.length,
      reason: "no_search_terms_or_source_url",
    });
    return evidence;
  }

  let sourceMatches = [];

  try {
    const query = { isActive: true };

    if (sourceUrl) {
      query.url = sourceUrl;
    }

    if (terms.length) {
      const escapedTerms = terms.map(escapeRegExp);
      query.$or = [
        {
          name: {
            $regex: escapedTerms.join("|"),
            $options: "i",
          },
        },
        {
          description: {
            $regex: escapedTerms.join("|"),
            $options: "i",
          },
        },
      ];
    }

    const candidateSources = await Source.find(query)
      .sort({
        reliabilityLevel: -1,
        createdAt: -1,
      })
      .limit(12);

    sourceMatches = rankSourcesByClaim(
      candidateSources,
      terms,
      sourceUrl
    );
  } catch (error) {
    console.error("[Verification] Evidence retrieval failed", {
      code: error?.code || "EVIDENCE_RETRIEVAL_FAILED",
      message:
        error instanceof Error
          ? "Source registry access failed."
          : "Source registry access failed.",
    });

    throw new AppError(
      "Evidence retrieval could not access the current source registry.",
      503,
      "EVIDENCE_RETRIEVAL_FAILED"
    );
  }

  const retrieved = sourceMatches
    .slice(0, 5)
    .map((entry, index) => {
      const source = entry?.source;

      if (
        !source?._id ||
        !source.name ||
        !source.type
      ) {
        return null;
      }

      return {
        evidenceId: `E${index + 1}`,
        sourceId: source._id.toString(),
        source: source.name,
        sourceType: source.type,
        reliabilityLevel:
          source.reliabilityLevel || "unknown",
        sourceTier: PRIORITY_BY_TYPE[source.type] || 4,
        title: source.name,
        url: source.url || null,
        date: null,
        relevance:
          "Matched the submitted claim against active source-registry metadata.",
        relationshipToClaim: getRelationshipFromType(
          source.type
        ),
        content: null,
        missingFields: [
          !source.url && "url",
        ].filter(Boolean),
      };
    })
    .filter(Boolean);

  if (retrieved.length !== sourceMatches.slice(0, 5).length) {
    throw new AppError(
      "Evidence retrieval returned an invalid source record.",
      503,
      "EVIDENCE_RETRIEVAL_INVALID_RESPONSE"
    );
  }

  const deduped = new Map();

  for (const item of [...evidence, ...retrieved]) {
    if (!item || (!item.sourceId && !item.source)) {
      continue;
    }

    const dedupeKey =
      item.sourceId || item.url || item.title || item.source;

    if (!dedupeKey || deduped.has(dedupeKey)) {
      continue;
    }

    deduped.set(dedupeKey, {
      ...item,
      relationshipToClaim:
        item.relationshipToClaim ||
        getRelationshipFromType(item.sourceType),
    });
  }

  const result = Array.from(deduped.values()).slice(0, 8);

  console.log("[Verification] Evidence retrieval completed", {
    matchedSourceCount: sourceMatches.length,
    retrievedEvidenceCount: result.length,
  });

  return result;
}
