const SS_GOV_DOMAINS = [
  "gov.ss", "gov.ss", "mofa.gov.ss", "mohss.gov.ss", "mos.gov.ss",
  "ministryofjustice.gov.ss", "ministryofeducation.gov.ss",
  "ministryofhealth.gov.ss", "ministryofinterior.gov.ss",
  "officeofthepresident.gov.ss", "nationalassembly.gov.ss",
  "bankofsouthsudan.gov.ss", "nbs.gov.ss", "ssnbs.gov.ss",
];

const SS_INSTITUTIONAL_DOMAINS = [
  "un.org", "unicef.org", "undp.org", "unhcr.org", "who.int",
  "worldbank.org", "imf.org", "africa-union.org", "au.int",
  "ecowas.int", "igad.org",
];

const TIER_1_KEYWORDS = [
  "constitution", "act of parliament", "act of national assembly",
  "government gazette", "official gazette", "decree", "order in council",
  "ministry of", "office of the president", "presidential",
  "national bureau of statistics", "bureau of statistics",
  "department of", "directorate of", "department for",
];

const TIER_2_KEYWORDS = [
  "un agency", "world bank", "who", "unicef", "undp", "unhcr",
  "imf", "world health", "food and agriculture", "unesco",
  "african union", "ecowas", "igad", "international organization",
  "recognized university", "research institute", "institute of",
];

const TIER_3_KEYWORDS = [
  "bbc", "al jazeera", "reuters", "africa news", "radio tamazuj",
  "eye radio", "zee news", "fact check", "snopes", "afrique",
];

const TIER_4_KEYWORDS = [
  "blog", "forum", "social media", "facebook", "twitter",
  "youtube", "wordpress", "blogspot", "medium.com",
];

const KNOWN_SS_MINISTRIES = [
  "ministry of justice", "ministry of interior", "ministry of defense",
  "ministry of education", "ministry of health", "ministry of agriculture",
  "ministry of livestock", "ministry of water", "ministry of housing",
  "ministry of transport", "ministry of petroleum", "ministry of mining",
  "ministry of information", "ministry of culture", "ministry of gender",
  "ministry of labor", "ministry of finance", "ministry of planning",
  "ministry of environment", "ministry of wildlife",
  "office of the president", "office of the vice president",
  "national assembly", "constitutional court", "supreme court",
  "bank of south sudan", "national bureau of statistics",
];

function getSSGovType(name, url, description) {
  const combined = `${name || ""} ${url || ""} ${description || ""}`.toLowerCase();
  for (const ministry of KNOWN_SS_MINISTRIES) {
    if (combined.includes(ministry)) return ministry;
  }
  if (url && /\bgov\.ss\b/.test(url)) return "South Sudan government website";
  return "South Sudan government institution";
}

function getPublisher(url, sourceName, sourceType) {
  if (!url && !sourceName) return null;
  const combined = `${sourceName || ""} ${url || ""}`.toLowerCase();

  if (combined.includes("ministry of justice") || combined.includes("ministryofjustice")) {
    return "Ministry of Justice and Constitutional Affairs";
  }
  if (combined.includes("office of the president") || combined.includes("officeofthepresident")) {
    return "Office of the President";
  }
  if (combined.includes("national assembly") || combined.includes("nationalassembly")) {
    return "National Assembly of South Sudan";
  }
  if (combined.includes("national bureau of statistics") || combined.includes("nbs") || combined.includes("bank of south sudan")) {
    return "National Bureau of Statistics / Bank of South Sudan";
  }
  if (combined.includes("ministry of")) {
    const match = combined.match(/ministry of ([a-z ]+?)(?:\s|$)/);
    if (match) return `Ministry of ${match[1].trim()}`;
    return "South Sudan Ministry";
  }

  return null;
}

function getSourceType(url, name, description, declaredType) {
  if (declaredType && ["official", "institutional"].includes(declaredType)) {
    return declaredType;
  }

  const combined = `${name || ""} ${url || ""} ${description || ""}`.toLowerCase();

  if (SS_GOV_DOMAINS.some((d) => combined.includes(d))) {
    return "official";
  }

  if (combined.includes("constitution") || combined.includes("transitional constitution")) {
    return "official";
  }

  if (combined.includes("national assembly") || combined.includes("parliament")) {
    return "official";
  }

  if (SS_INSTITUTIONAL_DOMAINS.some((d) => combined.includes(d))) {
    return "institutional";
  }

  if (combined.includes("international") || combined.includes("intergovernmental")) {
    return "international";
  }

  if (combined.includes("news") || combined.includes("media")) {
    return "independent_media";
  }

  if (combined.includes("community") || combined.includes("civil society")) {
    return "community";
  }

  return declaredType || "other";
}

export function assessSourceTier(source) {
  const url = source.url || "";
  const name = (source.name || "").toLowerCase();
  const description = (source.description || "").toLowerCase();
  const declaredType = source.type || source.sourceType || source.type;
  const combined = `${name} ${url} ${description}`;

  let tier = 4;
  let sourceType = declaredType;

  if (TIER_1_KEYWORDS.some((kw) => combined.includes(kw))) {
    tier = 1;
    sourceType = sourceType || "official";
  } else   if (TIER_2_KEYWORDS.some((kw) => combined.includes(kw))) {
    tier = 2;
    sourceType = sourceType || "institutional";
  } else   if (TIER_3_KEYWORDS.some((kw) => combined.includes(kw))) {
    tier = 3;
    sourceType = sourceType || "independent_media";
  } else   if (TIER_4_KEYWORDS.some((kw) => combined.includes(kw))) {
    tier = 4;
    sourceType = sourceType || "community";
  } else if (SS_GOV_DOMAINS.some((d) => url.includes(d))) {
    tier = 1;
    sourceType = "official";
  } else if (SS_INSTITUTIONAL_DOMAINS.some((d) => url.includes(d))) {
    tier = 2;
    sourceType = sourceType || "institutional";
  }

  const publisher = getPublisher(url, source.name, declaredType);
  const sourceTypeFinal = getSourceType(url, source.name, source.description, declaredType);

  return {
    tier,
    sourceType: sourceTypeFinal,
    publisher,
  };
}

export function buildSourceMetadata(source, retrievedContent) {
  const assessment = assessSourceTier(source);

  return {
    title: source.title || source.name || retrievedContent?.title || null,
    url: source.url || retrievedContent?.url || null,
    publisher: assessment.publisher || source.publisher || retrievedContent?.publisher || null,
    publishedDate: source.publishedDate || retrievedContent?.date || retrievedContent?.publishedDate || null,
    retrievedAt: new Date().toISOString(),
    snippet: retrievedContent?.snippet || source.description || retrievedContent?.description || null,
    relevance: retrievedContent?.relevance || null,
    sourceTier: assessment.tier,
    sourceType: assessment.sourceType,
    supportsClaim: retrievedContent?.supportsClaim ?? null,
  };
}

export { getSSGovType, getPublisher, getSourceType };
