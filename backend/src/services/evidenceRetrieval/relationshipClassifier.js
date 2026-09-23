const DIRECT_SUPPORT_PATTERNS = [
  /(?:capital|national capital).*of\s+(South Sudan|Uganda|Sudan|Kenya|Ethiopia)/i,
  /is\s+(?:the\s+)?capital(?:\s+city)?\s+of/i,
  /located\s+in\s+(?:the\s+)?(.+?)(?:\s+(?:state|province|region|country))$/i,
  /is\s+located\s+in/i,
  /situated\s+in\s+(?:the\s+)?(.+)/i,
  /part\s+of\s+(.+)/i,
  /borders?\s+(.+)/i,
  /flows?\s+through\s+(.+)/i,
  /passes?\s+(?:through|by)\s+(.+)/i,
  /officially\s+(?:known\s+as|called)\s+(.+)/i,
  /is\s+(?:a\s+)?(?:city|town|region|state|province)\s+in/i,
];

const CONTRADICTS_PATTERNS = [
  /is\s+not\s+(?:the\s+)?capital/i,
  /(?:capital|national\s+capital)\s+is\s+(?:not\s+)?(.+)/i,
  /not\s+(?:located|situated)\s+in/i,
  /does\s+not\b/i,
  /does\s+not\s+pass\b/i,
  /is\s+not\s+a\s+(?:part|portion)/i,
  /false/i,
  /incorrect/i,
];

const CONTEXTUAL_PATTERNS = [
  /is\s+a\s+(?:major|large|significant|important)\s+(?:city|town|place)/i,
  /major\s+city/i,
  /largest\s+city/i,
  /important\s+(?:city|town|center)/i,
  /notable\s+(?:for|city|place)/i,
];

function classifyRelationship(evidence, claim) {
  if (!evidence || !claim) return "inconclusive";

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

  const claimText = claim.toLowerCase();
  const claimIsAboutCapital = /capital|is the.*city of|national capital/i.test(claimText);

  for (const pattern of CONTRADICTS_PATTERNS) {
    if (pattern.test(evidenceText)) return "contradicts";
  }

  for (const pattern of DIRECT_SUPPORT_PATTERNS) {
    if (pattern.test(evidenceText)) {
      if (claimIsAboutCapital) return "direct_support";
    }
  }

  if (evidenceText.includes(claimText.split(" ").slice(0, 4).join(" "))) {
    return "direct_support";
  }

  for (const pattern of CONTEXTUAL_PATTERNS) {
    if (pattern.test(evidenceText)) return "contextual";
  }

  if (claimIsAboutCapital && /is\s+(?:a\s+)?(?:major|large|significant)\s+(?:city|town)/i.test(evidenceText)) {
    return "partial_support";
  }

  const claimTerms = extractKeyTerms(claimText);
  const evidenceTerms = extractKeyTerms(evidenceText);
  const overlap = claimTerms.filter((t) => evidenceTerms.includes(t)).length;

  if (overlap >= Math.min(claimTerms.length, 2)) {
    return "partial_support";
  }

  if (evidenceText.length > 20) return "contextual";
  if (evidenceText.length > 0 && evidenceText !== claimText) return "related";

  return "inconclusive";
}

function extractKeyTerms(text) {
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
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

export { classifyRelationship, DIRECT_SUPPORT_PATTERNS, CONTRADICTS_PATTERNS, CONTEXTUAL_PATTERNS };
