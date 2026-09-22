function scoreEvidence(evidence, claim) {
  if (!evidence || !claim) {
    return { score: 0, factors: {} };
  }

  const factors = {};

  factors.authority = scoreAuthority(evidence);
  factors.relevance = scoreRelevance(evidence, claim);
  factors.directness = scoreDirectness(evidence, claim);
  factors.recency = scoreRecency(evidence);
  factors.independence = scoreIndependence(evidence);
  factors.consistency = scoreConsistency(evidence);

  const weights = {
    authority: 0.25,
    relevance: 0.25,
    directness: 0.25,
    recency: 0.10,
    independence: 0.10,
    consistency: 0.05,
  };

  let total = 0;
  for (const [key, value] of Object.entries(factors)) {
    total += (value ?? 0) * (weights[key] ?? 0);
  }

  const score = Math.min(1, Math.max(0, Math.round(total * 100) / 100));

  return { score, factors };
}

function scoreAuthority(evidence) {
  const tier = evidence.sourceTier;
  if (tier === 1) return 1.0;
  if (tier === 2) return 0.75;
  if (tier === 3) return 0.45;
  if (tier === 4) return 0.2;

  const reliability = evidence.reliabilityLevel;
  if (reliability === "high") return 0.7;
  if (reliability === "medium") return 0.45;
  return 0.2;
}

function scoreRelevance(evidence, claim) {
  const claimTerms = extractSignificantTerms(claim);
  const evidenceText = [
    evidence.title || "",
    evidence.snippet || "",
    evidence.content || "",
    evidence.description || "",
    evidence.relevance || "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!claimTerms.length) return 0.3;

  let matched = 0;
  for (const term of claimTerms) {
    if (evidenceText.includes(term)) matched++;
  }

  return Math.min(1, matched / claimTerms.length);
}

function scoreDirectness(evidence, claim) {
  const relationship = evidence.relationshipToClaim || evidence.relationship || "inconclusive";

  switch (relationship) {
    case "direct_support":
      return 1.0;
    case "partial_support":
      return 0.5;
    case "contextual":
    case "contextualizes":
      return 0.3;
    case "contradicts":
      return -0.5;
    case "irrelevant":
      return 0.0;
    default:
      return 0.2;
  }
}

function scoreRecency(evidence) {
  const date = evidence.date || evidence.publishedDate || evidence.publishedAt;
  if (!date) return 0.3;

  try {
    const pubDate = new Date(date);
    const now = new Date();
    const ageMs = now - pubDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < 30) return 1.0;
    if (ageDays < 90) return 0.8;
    if (ageDays < 365) return 0.6;
    if (ageDays < 1825) return 0.4;
    return 0.2;
  } catch {
    return 0.3;
  }
}

function scoreIndependence(evidence) {
  const url = evidence.url || "";
  const source = (evidence.source || "").toLowerCase();
  const publisher = (evidence.publisher || "").toLowerCase();

  if (publisher.includes("world bank") || publisher.includes("un ")) return 1.0;
  if (/^https?:\/\/[a-z0-9-]+\.[a-z0-9-]+\.(com|org|net)$/.test(url)) return 0.7;
  if (source.includes("reuters") || source.includes("bbc")) return 0.8;
  return 0.5;
}

function scoreConsistency(evidence) {
  const supports = evidence.supportsClaim;
  if (supports === true) return 0.9;
  if (supports === false) return -0.5;
  return 0.5;
}

function extractSignificantTerms(text) {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "in", "of", "to", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "under", "and", "or",
    "but", "if", "because", "while", "where", "when", "that", "this",
    "it", "its", "not", "no", "nor", "so", "yet", "both", "either",
    "neither", "each", "every", "all", "any", "few", "more", "most",
    "other", "some", "such", "than", "too", "very", "just", "about",
    "also", "then", "there", "these", "those", "our", "your", "their",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

export { scoreEvidence };
