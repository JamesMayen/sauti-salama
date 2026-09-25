import AppError from "../../utils/AppError.js";
import { scoreEvidence } from "../evidenceRetrieval/evidenceScorer.js";
import { classifyRelationship } from "../evidenceRetrieval/relationshipClassifier.js";
import { assessSourceTier } from "../evidenceRetrieval/sourceAssessor.js";
import { generateSearchQueries } from "../evidenceRetrieval/searchQueries.js";

const SERPAPI_BASE = "https://serpapi.com/search.json";
const DDG_HTML_BASE = "https://html.duckduckgo.com/html/";
const DDG_API_BASE = "https://api.duckduckgo.com/";

function validateUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Native fetch has no `timeout` option — it's silently ignored if you pass one.
 * This wrapper uses AbortController so requests actually get cancelled.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function searchWithSerpAPI(query, apiKey) {
  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("q", query);
  url.searchParams.set("engine", "google");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", "8");
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "ss");

  let response;
  try {
    response = await fetchWithTimeout(url.toString(), {}, 15000);
  } catch (err) {
    // Network failure or timeout (AbortError) — not an HTTP error response
    console.error("[OnlineRetriever] SerpAPI request failed", {
      query,
      name: err.name,
      message: err.message,
    });
    throw new AppError("Search provider returned an error.", 503, "SEARCH_PROVIDER_ERROR");
  }

  if (!response.ok) {
    // Capture the real reason before throwing the generic error, so it shows up in logs
    let detail = null;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => null);
    }
    console.error("[OnlineRetriever] SerpAPI raw error", {
      query,
      status: response.status,
      statusText: response.statusText,
      detail,
    });
    throw new AppError("Search provider returned an error.", 503, "SEARCH_PROVIDER_ERROR");
  }

  const data = await response.json();
  return normalizeSerpResults(data, query);
}

function normalizeSerpResults(data, query) {
  const results = [];
  const organic = data.results || data.organic_results || [];

  for (const item of organic) {
    const url = item.link || item.url || null;
    if (!url || !validateUrl(url)) continue;

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

async function searchDuckDuckGo(query) {
  const results = [];

  try {
    const url = new URL(DDG_HTML_BASE);
    url.searchParams.set("q", query);

    const response = await fetchWithTimeout(
      url.toString(),
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
      10000
    );

    if (!response.ok) return results;

    const html = await response.text();

    const resultPattern = /class="result__a"[^>]*href="(https?:\/\/[^"]+)"/gi;
    const titlePattern = /class="result__a"[^>]*>(.*?)<\/a>/gi;
    const snippetPattern = /class="result__snippet"[^>]*>(.*?)<\/[a-z]/gi;

    const links = [...html.matchAll(resultPattern)].map((m) => m[1]);
    const titles = [...html.matchAll(titlePattern)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
    const snippets = [...html.matchAll(snippetPattern)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());

    const seen = new Set();
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
  } catch (err) {
    console.warn("[OnlineRetriever] DuckDuckGo HTML search failed", { query, error: err.message });
  }

  return results;
}

async function searchWithDDGAbstract(query) {
  const results = [];

  try {
    const url = new URL(DDG_API_BASE + "search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");

    const response = await fetchWithTimeout(url.toString(), {}, 10000);
    if (!response.ok) return results;

    const data = await response.json();

    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        const url2 = item.url || null;
        if (!url2 || !validateUrl(url2)) continue;

        const sourceAssess = assessSourceTier({
          url: url2,
          name: item.text || "",
          description: item.definition || "",
        });

        results.push({
          title: item.text || null,
          url: url2,
          snippet: item.definition || item.snippet || null,
          publisher: sourceAssess.publisher,
          sourceTier: sourceAssess.tier,
          sourceType: sourceAssess.sourceType,
          searchMatch: query,
        });
      }
    }
  } catch (err) {
    console.warn("[OnlineRetriever] DDG abstract API failed", { query, error: err.message });
  }

  return results;
}

async function fetchWebContent(url) {
  if (!validateUrl(url)) return null;

  try {
    const response = await fetchWithTimeout(url, {}, 10000);
    if (!response.ok) return null;

    const text = await response.text();
    const snippet = extractSnippet(text);
    const title = extractTitle(text);

    return { title, snippet, url };
  } catch (err) {
    console.warn("[OnlineRetriever] fetchWebContent failed", { url, error: err.message });
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
      console.log("[OnlineRetriever] Using SerpAPI for query", { query });
      const results = await searchWithSerpAPI(query, apiKey);
      console.log("[OnlineRetriever] SerpAPI results", { count: results.length, query });
      return results;
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 503) throw error;
      console.warn("[OnlineRetriever] SerpAPI failed, trying DuckDuckGo", { error: error.message });
    }
  } else {
    console.log("[OnlineRetriever] No API key, using DuckDuckGo for query", { query });
  }

  const ddgResults = await searchDuckDuckGo(query);
  if (ddgResults.length > 0) {
    console.log("[OnlineRetriever] DuckDuckGo results", { count: ddgResults.length, query });
    return ddgResults;
  }

  console.log("[OnlineRetriever] DuckDuckGo HTML empty, trying DDG API", { query });
  const apiResults = await searchWithDDGAbstract(query);
  console.log("[OnlineRetriever] DDG API results", { count: apiResults.length, query });
  return apiResults;
}

async function retrieveEvidenceForClaimOnline(claim, config = {}) {
  const {
    searchApiKey = process.env.SEARCH_API_KEY || process.env.SERPAPI_KEY || null,
    maxQueries = 3,
    timeoutMs = 25000,
  } = config;

  console.log("[OnlineRetriever] START", {
    claim: claim.slice(0, 100),
    apiKeyPresent: Boolean(searchApiKey),
  });

  const queries = generateSearchQueries(claim);
  const limitedQueries = queries.slice(0, maxQueries);

  console.log("[OnlineRetriever] Generated queries", { queries: limitedQueries });

  const allEvidence = [];
  const seenUrls = new Set();

  for (let qi = 0; qi < limitedQueries.length; qi++) {
    const query = limitedQueries[qi];

    try {
      const results = await Promise.race([
        searchWeb(query, searchApiKey),
        new Promise((_, reject) =>
          setTimeout(() => reject(new AppError("Search timed out", 503, "SEARCH_TIMEOUT")), timeoutMs)
        ),
      ]);

      console.log("[OnlineRetriever] Search results", { query, count: results.length });

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
          relevance: `${query} — ${relationship}`,
          searchMatch: query,
          retrievedAt: new Date().toISOString(),
          content: content?.snippet || null,
        };

        const assessment = assessSourceTier({
          url: evidenceItem.url,
          name: evidenceItem.title,
          description: evidenceItem.snippet,
        });
        evidenceItem.sourceTier = assessment.tier;
        evidenceItem.sourceType = assessment.sourceType;
        evidenceItem.publisher = assessment.publisher || evidenceItem.publisher;

        allEvidence.push(evidenceItem);
      }
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 503) {
        console.error("[OnlineRetriever] Search API error", { error: error.message, code: error.code });
        return { evidence: [], retrieved: false, error };
      }
      console.warn("[OnlineRetriever] Query failed", { query: limitedQueries[qi], error: error.message });
    }
  }

  const scored = allEvidence.map((item) => {
    const { score, factors } = scoreEvidence(item, claim);
    return { ...item, evidenceScore: score, scoreFactors: factors };
  });

  scored.sort((a, b) => (b.evidenceScore ?? 0) - (a.evidenceScore ?? 0));

  console.log("[OnlineRetriever] COMPLETE", { evidenceCount: scored.length, retrieved: scored.length > 0 });

  return { evidence: scored, retrieved: scored.length > 0, error: null };
}

export { retrieveEvidenceForClaimOnline, validateUrl, fetchWebContent, searchDuckDuckGo, searchWithSerpAPI, searchWithDDGAbstract };