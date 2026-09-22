const CLASSIFICATION_CATEGORIES = [
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

const GOV_TERMS = [
  "ministry", "government", "parliament", "assembly", "congress", "senate",
  "president", "vice president", "governor", "mayor", "council", "constitution",
  "legislation", "law", "bill", "regulation", "policy", "administration",
  "office of the president", "national assembly", "constitutional",
];

const CURRENT_EVENT_TERMS = [
  "today", "yesterday", "this week", "this month", "recently", "now",
  "currently", "ongoing", "breaking", "latest", "happening", "today's",
];

const SECURITY_TERMS = [
  "attack", "bombing", "shooting", "conflict", "war", "violence",
  "clash", "fighting", "militia", "rebel", "insurgent", "terrorism",
  "security operation", "airstrike", "shelling", "protest", "riot",
];

const HEALTH_TERMS = [
  "disease", "epidemic", "vaccine", "hospital", "clinic", "health",
  "medical", "infection", "outbreak", "patient", "treatment", "medicine",
];

const STATISTICS_TERMS = [
  "percent", "percentage", "population", "number", "statistic", "data",
  "census", "survey", "report", "figure", "rate", "total", "count",
];

const HISTORY_TERMS = [
  "independence", "colonial", "historical", "historically", "founded",
  "established", "anniversary", "century", "decade", "ancient", "past",
  "before", "previously", "formerly", "originated", "heritage",
];

const GEOGRAPHY_TERMS = [
  "capital", "city", "country", "state", "province", "region", "location",
  "located", "situated", "area", "territory", "border", "river", "mountain",
  "lake", "ocean", "sea", "valley", "island", "coordinates", "latitude",
  "longitude", "geographic", "terrain", "elevation", "in South Sudan",
  "of South Sudan", "South Sudan",
];

const LAW_POLICY_TERMS = [
  "article", "constitution", "legal", "court", "judge", "jury", "criminal",
  "civil", "right", "freedom", "law", "amendment", "charter", "treaty",
  "agreement", "convention", "protocol", "statute", "ordinance", "decree",
];

const PUBLIC_FIGURE_TERMS = [
  "president", "vice president", "governor", "mayor", "minister", "deputy",
  "ambassador", "official", "leader", "politician", "general", "commander",
  "colonel", "captain", "chairman", "speaker", "prime minister",
];

function containsAny(text, terms) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

export function classifyClaim(claim) {
  if (!claim || typeof claim !== "string") {
    return { category: "ambiguous", confidence: 0, indicators: [] };
  }

  const lower = claim.toLowerCase();
  const scores = {};
  const indicators = [];

  function scoreCategory(category, terms, weight) {
    let score = 0;
    const found = [];
    for (const term of terms) {
      if (lower.includes(term)) {
        score += weight;
        found.push(term);
      }
    }
    if (found.length > 0) {
      indicators.push({ category, terms: found });
    }
    scores[category] = score;
  }

  scoreCategory("geography", GEOGRAPHY_TERMS, 2);
  scoreCategory("government", GOV_TERMS, 2);
  scoreCategory("history", HISTORY_TERMS, 1.5);
  scoreCategory("law_policy", LAW_POLICY_TERMS, 1.5);
  scoreCategory("current_event", CURRENT_EVENT_TERMS, 3);
  scoreCategory("security_incident", SECURITY_TERMS, 3);
  scoreCategory("health", HEALTH_TERMS, 1.5);
  scoreCategory("statistics", STATISTICS_TERMS, 1.5);
  scoreCategory("public_figure", PUBLIC_FIGURE_TERMS, 1);

  const generalFactualBoost = ["is the", "are the", "was the", "were the", "became", "happens", "is located", "is in", "capital of", "highest", "oldest", "largest"].some((t) => lower.includes(t));
  if (generalFactualBoost) {
    scores["general_factual"] = (scores["general_factual"] || 0) + 1;
    indicators.push({ category: "general_factual", terms: ["factual language"] });
  }

  if (!Object.keys(scores).length || Math.max(...Object.values(scores)) === 0) {
    return { category: "general_factual", confidence: 0.3, indicators: [] };
  }

  const maxScore = Math.max(...Object.values(scores));
  const topCategories = Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([category]) => category);

  let category = topCategories[0];

  const containsOpinionWords = ["i think", "i believe", "probably", "maybe", "perhaps", "in my opinion", "it seems"].some((w) => lower.includes(w));
  if (containsOpinionWords) {
    category = "opinion";
  }

  if (topCategories.length > 1 && maxScore <= 2) {
    category = "general_factual";
  }

  const confidence = Math.min(0.95, 0.5 + maxScore * 0.1);

  if (category === "current_event" || category === "security_incident") {
    return { category, confidence: Math.min(confidence, 0.8), indicators };
  }

  return { category, confidence, indicators };
}

export { CLASSIFICATION_CATEGORIES };
