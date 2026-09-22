import Source from "../models/Source.js";
import AppError from "../utils/AppError.js";
import { classifyClaim, CLASSIFICATION_CATEGORIES } from "./evidenceRetrieval/claimClassifier.js";
import { generateSearchQueries } from "./evidenceRetrieval/searchQueries.js";
import { retrieveEvidenceForClaimOnline } from "./evidenceRetrieval/onlineRetriever.js";
import { assessSourceTier } from "./evidenceRetrieval/sourceAssessor.js";
import { scoreEvidence } from "./evidenceRetrieval/evidenceScorer.js";
import { classifyRelationship } from "./evidenceRetrieval/relationshipClassifier.js";
import { normalizeEvidenceItems } from "./evidence/evidenceNormalizer.js";
import { prepareEvidence } from "./evidence/evidenceService.js";

const PRIORITY_BY_TYPE = {
  official: 1,
  institutional: 1,
  international: 1,
  independent_media: 2,
  community: 3,
  user_submitted: 4,
  other: 4,
};

const RELATIONSHIP_MAP = {
  direct_support: "supports",
  partial_support: "supports",
  contextual: "contextualizes",
  contextualizes: "contextualizes",
  contradicts: "contradicts",
  irrelevant: "inconclusive",
  inconclusive: "inconclusive",
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeClaim(claim) {
  if (typeof claim !== "string") return "";
  return claim.replace(/\s+/g, " ").trim();
}

function determineEvidenceSufficiency(evidence = []) {
  const items = Array.isArray(evidence)
    ? evidence.filter((item) => item && typeof item === "object")
    : [];

  if (!items.length) {
    return { sufficiency: "insufficient", reason: "no_evidence_retrieved" };
  }

  const supportCount = items.filter(
    (item) => item.relationshipToClaim === "supports" || item.relationshipToClaim === "direct_support" || item.relationshipToClaim === "partial_support"
  ).length;
  const conflictCount = items.filter(
    (item) => item.relationshipToClaim === "contradicts"
  ).length;
  const contextualCount = items.filter(
    (item) => item.relationshipToClaim === "contextualizes" || item.relationshipToClaim === "contextual"
  ).length;

  const reliableItems = items.filter(
    (item) => ["high", "medium"].includes(item.reliabilityLevel) || item.sourceTier <= 2
  );

  const strongEvidence = items.filter(
    (item) => item.evidenceScore && item.evidenceScore >= 0.6
  );

  if (conflictCount > 0 && supportCount > 0) {
    return { sufficiency: "conflicting", reason: "multiple_sources_conflict" };
  }

  if (reliableItems.length >= 1 && supportCount >= 1) {
    if (strongEvidence.length >= 1 || (reliableItems.length >= 1 && supportCount >= 1 && items.length >= 1)) {
      return { sufficiency: "sufficient", reason: "authoritative_evidence_found" };
    }
  }

  if (reliableItems.length >= 2 && supportCount >= 1) {
    return { sufficiency: "sufficient", reason: "multiple_reliable_sources" };
  }

  if (supportCount > 0) {
    return { sufficiency: "sufficient", reason: "evidence_supports_claim" };
  }

  if (reliableItems.length === 0 && contextualCount === 0 && supportCount === 0) {
    return { sufficiency: "insufficient", reason: "insufficient_reliable_evidence" };
  }

  return { sufficiency: "insufficient", reason: "evidence_too_weak" };
}

async function retrieveOnlineEvidence(claim) {
  const onlineResult = await retrieveEvidenceForClaimOnline(claim);

  if (onlineResult.error) {
    throw onlineResult.error;
  }

  if (!onlineResult.retrieved) {
    return { evidence: [], method: "none", error: null };
  }

  const processed = [];
  for (const item of onlineResult.evidence) {
    const relationship = item.relationshipToClaim || "inconclusive";
    const supportsClaim = relationship === "direct_support" || relationship === "partial_support";

    const enriched = {
      evidenceId: item.evidenceId || `E${processed.length + 1}`,
      sourceId: item.sourceId || null,
      source: item.title || item.source || null,
      sourceType: item.sourceType || "other",
      reliabilityLevel: item.reliabilityLevel || "unknown",
      sourceTier: item.sourceTier || 4,
      title: item.title || null,
      url: item.url || null,
      date: item.date || null,
      relevance: item.relevance || item.searchMatch || null,
      relationshipToClaim: relationship,
      publisher: item.publisher || null,
      retrievedAt: item.retrievedAt || new Date().toISOString(),
      snippet: item.snippet || null,
      supportsClaim,
      content: item.content || item.snippet || null,
      evidenceScore: item.evidenceScore || null,
    };

    enriched.reliabilityLevel = assessSourceTier({
      url: enriched.url,
      name: enriched.title,
      description: enriched.snippet,
    }).sourceType === "official"
      ? "high"
      : enriched.reliabilityLevel;

    processed.push(enriched);
  }

  return { evidence: processed, method: "online_search", error: null };
}

async function retrieveSourceRegistryEvidence(claim, suppliedEvidence) {
  const normalized = normalizeClaim(claim);
  const evidence = Array.isArray(suppliedEvidence) ? suppliedEvidence : [];

  if (!normalized) {
    return [];
  }

  const terms = normalized
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .slice(0, 12);

  if (!terms.length) return [];

  const query = { isActive: true };
  const escapedTerms = terms.map(escapeRegExp);
  query.$or = [
    { name: { $regex: escapedTerms.join("|"), $options: "i" } },
    { description: { $regex: escapedTerms.join("|"), $options: "i" } },
  ];

  const candidateSources = await Source.find(query)
    .sort({ reliabilityLevel: -1, createdAt: -1 })
    .limit(12);

  const items = candidateSources
    .slice(0, 5)
    .map((source, index) => {
      const tier = PRIORITY_BY_TYPE[source.type] || 4;
      const relationship = ["official", "institutional", "international"].includes(source.type)
        ? "supports"
        : "contextualizes";

      const assessed = assessSourceTier(source);

      return {
        evidenceId: `E${index + 1}`,
        sourceId: source._id.toString(),
        source: source.name,
        sourceType: assessed.sourceType || source.type,
        reliabilityLevel: source.reliabilityLevel || "unknown",
        sourceTier: assessed.tier,
        title: source.name,
        url: source.url || null,
        date: null,
        relevance: `Matched claim against source registry: ${source.type}`,
        relationshipToClaim: relationship,
        publisher: assessed.publisher || null,
        retrievedAt: new Date().toISOString(),
        snippet: source.description || null,
        supportsClaim: relationship === "supports",
        content: source.description || null,
      };
    });

  try {
    const normalizedItems = await normalizeEvidenceItems(items, candidateSources);
    return normalizedItems.map((item) => ({
      ...item,
      evidenceScore: scoreEvidence(item, claim).score,
    }));
  } catch {
    return items.map((item) => ({
      ...item,
      evidenceScore: scoreEvidence(item, claim).score,
    }));
  }
}

export async function retrieveAndAssessEvidence({
  claim,
  sourceUrl = null,
  suppliedEvidence = [],
  context = null,
}) {
  const normalized = normalizeClaim(claim);
  if (!normalized) {
    return {
      evidence: [],
      evidenceSufficiency: "insufficient",
      sufficiencyReason: "no_claim",
      claimType: "ambiguous",
      retrievalMethod: "none",
      technicalFailure: false,
    };
  }

  const claimClassification = classifyClaim(normalized);

  let onlineEvidence = [];
  let onlineError = null;
  let onlineSuccess = false;
  let retrievalMethod = "source_registry";

  try {
    const onlineResult = await retrieveOnlineEvidence(normalized);
    if (onlineResult.error) {
      onlineError = onlineResult.error;
    } else if (onlineResult.evidence.length > 0) {
      onlineEvidence = onlineResult.evidence;
      onlineSuccess = true;
      retrievalMethod = "online_search";
    }
  } catch (error) {
    onlineError = error;
  }

  let allEvidence = [];

  if (onlineSuccess) {
    allEvidence = onlineEvidence;
    retrievalMethod = "online_search";

    try {
      const registryEvidence = await retrieveSourceRegistryEvidence(normalized, suppliedEvidence);
      const seenUrls = new Set(allEvidence.map((e) => e.url).filter(Boolean));
      for (const item of registryEvidence) {
        if (item.url && seenUrls.has(item.url)) continue;
        if (item.url) seenUrls.add(item.url);
        allEvidence.push(item);
      }
      retrievalMethod = "mixed";
    } catch {
      // Registry failed, continue with online evidence only
    }
  } else {
    try {
      const registryEvidence = await retrieveSourceRegistryEvidence(normalized, suppliedEvidence);
      allEvidence = registryEvidence;
      retrievalMethod = "source_registry";
    } catch (error) {
      if (error instanceof AppError && error.statusCode >= 500) {
        throw new AppError(
          "Evidence retrieval failed.",
          503,
          "EVIDENCE_RETRIEVAL_FAILED"
        );
      }
    }
  }

  if (onlineError && onlineError.statusCode >= 500 && !allEvidence.length) {
    throw onlineError;
  }

  for (const item of allEvidence) {
    if (!item.relevance) {
      item.relevance = item.relevance || `Evidence for claim: "${normalized}"`;
    }
    if (!item.relationshipToClaim || item.relationshipToClaim === "inconclusive") {
      item.relationshipToClaim = classifyRelationship(item, normalized);
    }
    if (item.evidenceScore === null || item.evidenceScore === undefined) {
      item.evidenceScore = scoreEvidence(item, normalized).score;
    }
  }

  allEvidence.sort((a, b) => (b.evidenceScore ?? 0) - (a.evidenceScore ?? 0));
  allEvidence = allEvidence.slice(0, 8);

  const { sufficiency, reason } = determineEvidenceSufficiency(allEvidence);

  const technicalFailure =
    onlineError && onlineError.statusCode >= 500 && !allEvidence.length;

  return {
    evidence: allEvidence,
    evidenceSufficiency: sufficiency,
    sufficiencyReason: reason,
    claimType: claimClassification.category,
    retrievalMethod,
    technicalFailure,
    onlineError,
  };
}

export { determineEvidenceSufficiency, CLASSIFICATION_CATEGORIES };
