import AppError from "../../utils/AppError.js";
import { scoreEvidence } from "../evidenceRetrieval/evidenceScorer.js";
import { classifyRelationship } from "../evidenceRetrieval/relationshipClassifier.js";
import { assessSourceTier } from "../evidenceRetrieval/sourceAssessor.js";
import { generateSearchQueries } from "../evidenceRetrieval/searchQueries.js";

const DEFAULT_SEARCH_API = "https://www.google.com/search";

function validateUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

async function searchWithSerpAPI(query, apiKey) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("engine", "google");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", "10");
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "ss");

  const response = await fetch(url.toString(), { timeout: 15000 });
  if (!response.ok) {
    throw new AppError("Search provider returned an error.", 503, "SEARCH_PROVIDER_ERROR");
  }

  const data = await response.json();
  return data;
}

async function fetchWebContent(url) {
  if (!validateUrl(url)) return null;

  try {
    const response = await fetch(url, { timeout: 10000 });
    if (!response.ok) return null;

    const text = await response.text();
    const snippet = extractSnippet(text);
    const title = extractTitle(text);

    return { title, snippet, url };
  } catch {
    return null;
  }
}

function extractSnippet(html, maxLength = 300) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

async function searchWeb(query, apiKey) {
  if (apiKey) {
    try {
      const data = await searchWithSerpAPI(query, apiKey);
      return normalizeSerpResults(data, query);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 503) throw error;
      console.warn("[OnlineRetriever] SerpAPI failed, trying fallback", { error: error.message });
    }
  }

  return searchViaFallback(query);
}

function normalizeSerpResults(data, query) {
  const results = [];
  const organic = data.results || data.organic_results || [];

  for (const item of organic) {
    const url = item.link || item.url || null;
    const sourceAssess = assessSourceTier({
      url,
      name: item.title || "",
      description: item.snippet || "",
    });

    results.push({
      title: item.title || null,
      url,
      snippet: item.snippet || item.description || null,
      publisher: sourceAssess.publisher,
      sourceTier: sourceAssess.tier,
      sourceType: sourceAssess.sourceType,
      searchMatch: query,
    });
  }

  return results;
}

async function searchViaFallback(query) {
  const url = new URL(DEFAULT_SEARCH_API);
  url.searchParams.set("q", query);

  try {
    const response = await fetch(url.toString(), { timeout: 10000 });
    if (!response.ok) return [];

    const text = await response.text();
    const results = parseSearchResults(text, query);
    return results;
  } catch {
    return [];
  }
}

function parseSearchResults(html, query) {
  const results = [];
  const linkPattern = /href="(https?:\/\/[a-z0-9.-]+\/[a-z0-9@:%_\+.~#?&//=]*)"/gi;
  const titlePattern = /<h3[^>]*>(.*?)<\/h3>/gi;
  const snippetPattern = /<span[^>]*class="st"[^>]*>(.*?)<\/span>/gi;

  const seen = new Set();
  let match;
  let titleMatch;
  let snippetMatch;

  const links = [...html.matchAll(linkPattern)].map((m) => m[1]);
  const titles = [...html.matchAll(titlePattern)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  const snippets = [...html.matchAll(snippetPattern)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());

  for (let i = 0; i < Math.min(links.length, 8); i++) {
    const link = links[i];
    if (!validateUrl(link) || seen.has(link)) continue;
    seen.add(link);

    results.push({
      title: titles[i] || null,
      url: link,
      snippet: snippets[i] || null,
      searchMatch: query,
    });
  }

  return results;
}

async function retrieveEvidenceForClaimOnline(claim, config = {}) {
  const {
    searchApiKey = process.env.SEARCH_API_KEY || process.env.SERPAPI_KEY || null,
    maxQueries = 3,
    timeoutMs = 20000,
  } = config;

  if (!searchApiKey && !process.env.ONLINE_RETRIEVAL_ENABLED) {
    console.log("[OnlineRetriever] Online retrieval not configured");
    return { evidence: [], retrieved: false, error: null };
  }

  const queries = generateSearchQueries(claim);
  const limitedQueries = queries.slice(0, maxQueries);

  const allEvidence = [];
  const seenUrls = new Set();

  for (const query of limitedQueries) {
    try {
      const results = await Promise.race([
        searchWeb(query, searchApiKey),
        new Promise((_, reject) =>
          setTimeout(() => reject(new AppError("Search timed out", 503, "SEARCH_TIMEOUT")), timeoutMs)
        ),
      ]);

      for (const result of results) {
        if (!result.url || seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);

        const content = await fetchWebContent(result.url);

        const relationship = classifyRelationship(
          {
            title: result.title,
            snippet: content?.snippet || result.snippet,
            content: content?.snippet || result.snippet,
            description: result.snippet,
          },
          claim
        );

        const evidenceItem = {
          title: result.title || content?.title || null,
          url: result.url,
          snippet: content?.snippet || result.snippet || null,
          publisher: result.publisher || null,
          sourceTier: result.sourceTier || 4,
          sourceType: result.sourceType || "other",
          relationshipToClaim: relationship,
          date: null,
          relevance: buildRelevanceText(claim, query, relationship),
          searchMatch: query,
          retrievedAt: new Date().toISOString(),
          content: content?.snippet || null,
        };

        allEvidence.push(evidenceItem);
      }
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 503) {
        console.error("[OnlineRetriever] Search API error", { error: error.message });
        return {
          evidence: [],
          retrieved: false,
          error,
        };
      }
      console.warn("[OnlineRetriever] Query failed", { query, error: error.message });
    }
  }

  const enriched = allEvidence.map((item) => {
    const assessment = assessSourceTier({
      url: item.url,
      name: item.title || "",
      description: item.snippet || "",
    });

    return {
      ...item,
      sourceTier: assessment.tier,
      sourceType: assessment.sourceType,
      publisher: assessment.publisher || item.publisher,
    };
  });

  const scored = enriched.map((item) => {
    const { score, factors } = scoreEvidence(item, claim);
    return { ...item, evidenceScore: score, scoreFactors: factors };
  });

  scored.sort((a, b) => (b.evidenceScore ?? 0) - (a.evidenceScore ?? 0));

  return {
    evidence: scored,
    retrieved: true,
    error: null,
  };
}

function buildRelevanceText(claim, query, relationship) {
  const parts = [`Claim: "${claim}"`, `Query: "${query}"`, `Relationship: ${relationship}`];
  return parts.join(" — ");
}

export { retrieveEvidenceForClaimOnline, validateUrl, fetchWebContent };
