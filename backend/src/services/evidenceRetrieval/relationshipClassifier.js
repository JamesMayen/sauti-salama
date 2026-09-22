const DIRECT_SUPPORT_PATTERNS = [
  /(?:capital|national capital).*of\s+(South Sudan|Uganda|Sudan|Kenya|Ethiopia)/i,
  /is (?:the\s+)?capital(?:\s+city)?\s+of/i,
  /located\s+in\s+(?:the\s+)?(.+?)(?:\s+state|\s+province|\s+region|\s+country)/i,
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
  /capital\s+is\s+(?!Juba)(.+)/i,
  /not\s+(?:located|situated)\s+in/i,
  /is\s+in\s+(?!South\s+Sudan)(.+)/i,
  /does\s+not\b/i,
  /does\s+not\s+pass\b/i,
  /is\s+not\s+a\s+(?:part|portion)/i,
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

  if (CONTRADICTS_PATTERNS.some((p) => p.test(evidenceText))) {
    return "contradicts";
  }

  const hasDirectMatch = DIRECT_SUPPORT_PATTERNS.some((pattern) => {
    const match = pattern.exec(evidenceText);
    if (!match) return false;

    const captured = match[1] || match[0] || "";
    const claimTerms = extractKeyTerms(claimText);
    const evidenceTerms = extractKeyTerms(captured);

    const overlap = claimTerms.filter((t) => evidenceTerms.includes(t)).length;
    return overlap >= Math.min(claimTerms.length, 1);
  });

  if (hasDirectMatch) return "direct_support";

  if (evidenceText.includes(claimText.split(" ").slice(0, 3).join(" "))) {
    return "direct_support";
  }

  if (CONTEXTUAL_PATTERNS.some((p) => p.test(evidenceText))) {
    return "contextual";
  }

  if (evidenceText.length > 20) {
    return "partial_support";
  }

  if (evidenceText.length > 0 && evidenceText !== claimText) {
    return "related";
  }

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

export { classifyRelationship };
