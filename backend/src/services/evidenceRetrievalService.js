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

function rankSourcesByClaim(sources, terms) {
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
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function determineEvidenceSufficiency(evidence = []) {
  const items = Array.isArray(evidence) ? evidence : [];

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
    (item) => ["high", "medium"].includes(item.reliabilityLevel)
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

  if (!normalizedClaim) {
    return [];
  }

  const evidence = Array.isArray(suppliedEvidence)
    ? suppliedEvidence
    : [];

  const terms = extractTerms(normalizedClaim);

  let sourceMatches = [];

  try {
    const query = { isActive: true };

    if (sourceUrl) {
      query.url = sourceUrl;
    }

    if (terms.length) {
      query.$or = [
        { name: { $regex: terms.join("|"), $options: "i" } },
        { description: { $regex: terms.join("|"), $options: "i" } },
      ];
    }

    const candidateSources = await Source.find(query).sort({
      reliabilityLevel: -1,
      createdAt: -1,
    }).limit(12);

    sourceMatches = rankSourcesByClaim(candidateSources, terms);
  } catch (error) {
    throw new AppError(
      "Evidence retrieval could not access the current source registry.",
      503,
      "EVIDENCE_RETRIEVAL_FAILED"
    );
  }

  const retrieved = sourceMatches
    .slice(0, 5)
    .map((entry, index) => ({
      evidenceId: `E${index + 1}`,
      sourceId: entry.source._id.toString(),
      source: entry.source.name,
      sourceType: entry.source.type,
      reliabilityLevel: entry.source.reliabilityLevel || "unknown",
      sourceTier: PRIORITY_BY_TYPE[entry.source.type] || 4,
      title: entry.source.name,
      url: entry.source.url || null,
      date: entry.source.lastCheckedAt
        ? new Date(entry.source.lastCheckedAt).toISOString()
        : null,
      relevance: `Relevant to the submitted claim based on matching source metadata and source hierarchy.`,
      relationshipToClaim: getRelationshipFromType(entry.source.type),
      content: context || null,
      missingFields: [
        !entry.source.name && "title",
        !entry.source.url && "url",
      ].filter(Boolean),
    }));

  const deduped = new Map();

  for (const item of [...evidence, ...retrieved]) {
    if (!item || !item.sourceId && !item.source) {
      continue;
    }

    const dedupeKey = item.sourceId || item.url || item.title || item.source;

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

  return Array.from(deduped.values()).slice(0, 8);
}
