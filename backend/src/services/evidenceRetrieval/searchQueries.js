import { classifyClaim } from "./claimClassifier.js";

const GEOGRAPHY_QUERIES = [
  (claim) => {
    const match = claim.match(/(\w+)\s+is\s+(?:the\s+)?capital(?:\s+city)?\s+of\s+(.+)/i);
    if (match) return [`${match[1]} capital ${match[2].trim()}`, `${match[1]} national capital ${match[2].trim()}`];
    return null;
  },
  (claim) => {
    const match = claim.match(/(?:in|located\s+in)\s+(.+?)(?:\s+(?:state|province|region|country))?$/i);
    if (match) return [`${claim}`];
    return null;
  },
];

const GOVERNMENT_QUERIES = [
  (claim) => {
    const match = claim.match(/who\s+is\s+(?:the\s+)?(.+?)(?:\s+of\s+|in\s+)(.+)/i);
    if (match) return [`${match[1]} ${match[2].trim()}`, `leader of ${match[2].trim()}`];
    return null;
  },
];

const HISTORY_QUERIES = [
  (claim) => {
    const match = claim.match(/(South Sudan|country|nation)\s+became\s+(independent|free)\s+(\d{4}|\d{1,2}\s+\w+)/i);
    if (match) return [`${match[1]} independence ${match[3]} official`, `${match[1]} became ${match[2]} on ${match[3]}`];
    return null;
  },
];

const LAW_QUERIES = [
  (claim) => {
    if (/constitution|article|law|legal/.test(claim)) {
      return [`constitution ${claim.match(/(?:of|in)\s+(\w+(?:\s+\w+)?)/i)?.[1] || ""}`, "official constitution text"];
    }
    return null;
  },
];

const GENERAL_QUERIES = [
  (claim) => {
    const clean = claim.replace(/[?.!]$/g, "").trim();
    return [clean];
  },
];

function generateForClaim(claim, category) {
  const queries = [];
  const generators = {
    geography: GEOGRAPHY_QUERIES,
    government: GOVERNMENT_QUERIES,
    history: HISTORY_QUERIES,
    law_policy: LAW_QUERIES,
  };

  const general = GENERAL_QUERIES[0];
  const generalResults = general(claim);
  if (generalResults) queries.push(...generalResults);

  const categoryGenerators = generators[category] || [];
  for (const gen of categoryGenerators) {
    const results = gen(claim);
    if (results) queries.push(...results);
  }

  const fallback = [
    claim.replace(/[?.!]$/g, "").trim(),
    claim.toLowerCase().replace(/[?!"']/g, ""),
  ];

  const seen = new Set();
  const unique = [];
  for (const q of [...queries, ...fallback]) {
    const normalized = q.trim();
    if (normalized.length >= 2 && !seen.has(normalized)) {
      seen.add(normalized);
      unique.push(normalized);
    }
  }

  return unique.slice(0, 5);
}

export function generateSearchQueries(claim, category) {
  if (!claim || typeof claim !== "string") return [claim || ""];
  const classification = typeof category === "string" ? category : classifyClaim(claim).category;
  return generateForClaim(claim, classification);
}

export { generateForClaim };
