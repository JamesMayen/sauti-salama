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

  console.log("[Verification] Sufficiency analysis", {
    supportCount, conflictCount, contextualCount, reliableItems: reliableItems.length, strongEvidence: strongEvidence.length,
  });

  if (conflictCount > 0 && supportCount > 0) {
    return { sufficiency: "conflicting", reason: "multiple_sources_conflict" };
  }

  if (reliableItems.length >= 1 && supportCount >= 1) {
    return { sufficiency: "sufficient", reason: "authoritative_evidence_found" };
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
  console.log("[Verification] Evidence retrieval START (online)", { claim: claim.slice(0, 80) });

  const onlineResult = await retrieveEvidenceForClaimOnline(claim);

  if (onlineResult.error) {
    console.error("[Verification] Online retrieval FAILED", { code: onlineResult.error.code, message: onlineResult.error.message });
    return { evidence: [], method: "none", error: onlineResult.error, retrieved: false };
  }

  if (!onlineResult.retrieved || !onlineResult.evidence.length) {
    console.log("[Verification] Online retrieval returned no evidence");
    return { evidence: [], method: "none", error: null, retrieved: false };
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

    processed.push(enriched);
  }

  console.log("[Verification] Online retrieval RESULT", { evidenceCount: processed.length });

  return { evidence: processed, method: "online_search", error: null, retrieved: true };
}

async function retrieveSourceRegistryEvidence(claim, suppliedEvidence) {
  const normalized = normalizeClaim(claim);
  const evidence = Array.isArray(suppliedEvidence) ? suppliedEvidence : [];

  if (!normalized) return [];

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

  console.log("[Verification] Source registry search", { terms, query: { $or: query.$or.map((q) => Object.keys(q)) } });

  const candidateSources = await Source.find(query)
    .sort({ reliabilityLevel: -1, createdAt: -1 })
    .limit(12);

  console.log("[Verification] Source registry candidates", { count: candidateSources.length });

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
  console.log("[Verification] Claim classification", { category: claimClassification.category, confidence: claimClassification.confidence });

  let onlineEvidence = [];
  let onlineError = null;
  let onlineSuccess = false;
  let retrievalMethod = "source_registry";

  try {
    console.log("[Verification] Attempting online evidence retrieval");
    const onlineResult = await retrieveOnlineEvidence(normalized);

    if (onlineResult.error) {
      onlineError = onlineResult.error;
      console.log("[Verification] Online retrieval error", { code: onlineResult.error.code, statusCode: onlineResult.error.statusCode });
    } else if (onlineResult.evidence.length > 0) {
      onlineEvidence = onlineResult.evidence;
      onlineSuccess = true;
      retrievalMethod = "online_search";
      console.log("[Verification] Online retrieval SUCCESS", { evidenceCount: onlineEvidence.length });
    } else {
      console.log("[Verification] Online retrieval returned no results");
    }
  } catch (error) {
    onlineError = error;
    console.error("[Verification] Online retrieval exception", { code: error.code, message: error.message });
  }

  let allEvidence = [];

  if (onlineSuccess) {
    allEvidence = onlineEvidence;
    retrievalMethod = "online_search";

    try {
      console.log("[Verification] Also searching source registry for corroboration");
      const registryEvidence = await retrieveSourceRegistryEvidence(normalized, suppliedEvidence);
      const seenUrls = new Set(allEvidence.map((e) => e.url).filter(Boolean));
      for (const item of registryEvidence) {
        if (item.url && seenUrls.has(item.url)) continue;
        if (item.url) seenUrls.add(item.url);
        allEvidence.push(item);
      }
      retrievalMethod = "mixed";
      console.log("[Verification] Mixed retrieval complete", { totalEvidence: allEvidence.length });
    } catch {
      console.log("[Verification] Source registry failed, using online evidence only");
    }
  } else {
    if (onlineError && onlineError.statusCode >= 500) {
      console.log("[Verification] Online retrieval failed with technical error, attempting registry fallback");
      try {
        const registryEvidence = await retrieveSourceRegistryEvidence(normalized, suppliedEvidence);
        allEvidence = registryEvidence;
        retrievalMethod = "source_registry";
        console.log("[Verification] Registry fallback complete", { evidenceCount: allEvidence.length });
      } catch (error) {
        if (error instanceof AppError && error.statusCode >= 500) {
          throw error;
        }
        console.log("[Verification] Registry fallback also failed", { error: error.message });
      }
    } else {
      console.log("[Verification] No online evidence, searching source registry");
      try {
        const registryEvidence = await retrieveSourceRegistryEvidence(normalized, suppliedEvidence);
        allEvidence = registryEvidence;
        retrievalMethod = "source_registry";
        console.log("[Verification] Source registry complete", { evidenceCount: allEvidence.length });
      } catch (error) {
        if (error instanceof AppError && error.statusCode >= 500) {
          throw error;
        }
      }
    }
  }

  if (onlineError && onlineError.statusCode >= 500 && !allEvidence.length) {
    console.log("[Verification] Technical failure - no evidence available", { code: onlineError.code });
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

  console.log("[Verification] Final evidence count", { count: allEvidence.length });

  const { sufficiency, reason } = determineEvidenceSufficiency(allEvidence);

  console.log("[Verification] Evidence sufficiency", { sufficiency, reason, evidenceCount: allEvidence.length });

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
