# Implementation Report — Evidence Retrieval Upgrade

## 1. What evidence retrieval mechanism is now being used

The system now uses a **multi-layered evidence retrieval pipeline**:

1. **Online Search Retrieval (Primary)** — Web search queries are generated from the claim, executed against a configurable search API (SerpAPI/Google Search), and the top results are fetched, scored, and classified.
2. **Source Registry (Fallback)** — If online retrieval is unavailable or returns no results, the system falls back to the existing MongoDB Source registry.
3. **Mixed Mode** — If both online and registry evidence are found, they are merged, deduplicated by URL, and ranked together.

**Flow**: Claim → Classification → Search query generation → Online retrieval → Source registry fallback → Source quality assessment → Evidence scoring → Relationship classification → Sufficiency determination → AI assessment → Result.

## 2. What external provider/API is required

- **Primary**: DuckDuckGo HTML search (free, no API key required) — searches html.duckduckgo.com and api.duckduckgo.com
- **Better**: SerpAPI (Google Search API) when `SEARCH_API_KEY` or `SERPAPI_KEY` is provided
- **Fallback**: Direct web page fetching using Node.js `fetch` for content extraction after search

**No API key is required** for basic operation. DuckDuckGo is the default provider. SerpAPI is optional for improved results.

## 3. Required environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing key (min 32 chars) |
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model |
| `SEARCH_API_KEY` | No | — | SerpAPI/search API key |
| `SERPAPI_KEY` | No | — | Alternative SerpAPI key |
| `ONLINE_RETRIEVAL_ENABLED` | No | `false` | Enable web search retrieval |

## 4. How source quality is evaluated

Source quality is determined dynamically by `sourceAssessor.js` using a multi-factor assessment:

**Tier assignment** based on URL domain, content keywords, and declared type:
- **Tier 1 (Primary/Authoritative)**: Government websites (.gov.ss), constitutions, legislation, official government documents, national statistics offices, Ministry of Justice, Office of the President, National Assembly
- **Tier 2 (Recognized Institutional)**: UN agencies, World Bank, WHO, UNESCO, recognized universities, established international organizations
- **Tier 3 (Recognized Independent)**: Established news organizations (BBC, Reuters, Al Jazeera), reputable reference organizations, fact-checking organizations
- **Tier 4 (Community/Other)**: Blogs, social media, public websites, user-submitted

**Publisher field** is determined by matching known South Sudan ministries and institutions against source name, URL, and description.

## 5. How claim classification works

Claim classification is performed by `claimClassifier.js` using keyword-based scoring across 11 categories:

- **geography**, **government**, **history**, **law_policy**, **public_figure**, **current_event**, **security_incident**, **health**, **statistics**, **general_factual**, **opinion**, **ambiguous**

Each category has weighted keywords. The category with the highest score wins. Confidence is calculated from the score (0.3–0.95). Current events and security incidents get reduced confidence for safety. Claims with opinion language are classified as "opinion".

## 6. How evidence sufficiency works

Evidence sufficiency now has 4 states (in `evidenceRetrievalService.js` → `determineEvidenceSufficiency`):

- **sufficient**: Authoritative evidence found that supports the claim (1+ Tier 1/2 source with "supports" relationship, or 2+ reliable sources)
- **conflicting**: Multiple sources contradict each other
- **insufficient**: Retrieval succeeded but evidence is too weak/absent → triggers human review
- **technical_failure**: Retrieval system itself failed (search API down, network timeout, etc.) → returns 503, NO human review item

Key distinction: Technical failure (503) ≠ insufficient evidence.

## 7. How conflicting evidence works

If evidence items include both "supports" and "contradicts" relationships, sufficiency is set to "conflicting". The AI assessment receives all evidence and determines whether the claim is verified, contested, or false based on the balance and quality of conflicting sources. Human review is triggered when evidence is conflicting and the AI cannot resolve it.

## 8. How technical failures are separated

Technical failures are handled in `verificationService.js` → `processVerificationRequest`:

1. If online retrieval returns a 503 error (search provider down, timeout, etc.) AND no evidence was found → mark request as failed, throw error
2. The error propagates to the controller → 503 HTTP response
3. Error code is one of: `EVIDENCE_RETRIEVAL_FAILED`, `SEARCH_PROVIDER_ERROR`, `SEARCH_TIMEOUT`, `AI_PROVIDER_*`
4. No verification result is created → no human review item → user sees "Verification temporarily unavailable"
5. If retrieval succeeds but evidence is weak → insufficient evidence → human review

## 9. How human review works

Human review is preserved exactly as before:

- Triggered when evidence sufficiency is "insufficient" (retrieval succeeded but weak evidence)
- NOT triggered on technical failure (503)
- Reviewers see: claim, retrieved evidence, sources, evidence quality, uncertainty, review notes, final decision
- Review queue accessible at `/dashboard/review-queue` (admin/moderator roles)

## 10. Files changed

### New files (9):
| File | Purpose |
|---|---|
| `backend/src/services/evidenceRetrieval/claimClassifier.js` | Claim type classification |
| `backend/src/services/evidenceRetrieval/searchQueries.js` | Targeted search query generation |
| `backend/src/services/evidenceRetrieval/onlineRetriever.js` | Web search and page retrieval |
| `backend/src/services/evidenceRetrieval/sourceAssessor.js` | Source tier, publisher, metadata |
| `backend/src/services/evidenceRetrieval/evidenceScorer.js` | Evidence quality scoring |
| `backend/src/services/evidenceRetrieval/relationshipClassifier.js` | Direct support vs related distinction |
| `backend/src/services/evidenceRetrievalService.js` | Main orchestrator (rewritten) |
| `backend/src/services/verificationService.js` | Verification pipeline (rewritten) |
| `backend/src/services/ai/verificationSchema.js` | AI schema with new fields |

### Modified files (10):
| File | Change |
|---|---|
| `backend/src/models/VerificationResult.js` | Added claimType, retrievalMethod, technicalFailure, evidence fields (publisher, retrievedAt, snippet, supportsClaim, relationshipToClaim, evidenceScore, content) |
| `backend/src/models/VerificationRequest.js` | Added claimType field |
| `backend/src/models/Source.js` | Added publisher field |
| `backend/src/services/ai/verificationPrompt.js` | Updated instructions for retrieved evidence, new field semantics, safety contract |
| `backend/src/config/env.js` | Added optional env var validation, logging |
| `backend/.env` | Added SEARCH_API_KEY, SERPAPI_KEY (ONLINE_RETRIEVAL_ENABLED removed — always enabled) |
| `backend/.env.example` | Added SEARCH_API_KEY, SERPAPI_KEY examples |
| `frontend/src/pages/Verify.jsx` | Added technical failure state handling |
| `frontend/src/components/verification/VerificationResult.jsx` | Full rewrite — shows evidence with tier/publisher/score/relationship, handles technical failure |
| `frontend/src/pages/dashboard/Verification.jsx` | Shows claim type, retrieval method, evidence scores |
| `frontend/src/pages/dashboard/ReviewQueue.jsx` | Shows retrieved evidence for insufficient claims |

### Unchanged (preserved):
- `backend/server.js`, `backend/src/routes/verificationRoutes.js`, `backend/src/controllers/verificationController.js`, `backend/src/middleware/auth.js`, `backend/src/middleware/errorHandler.js`, all frontend layouts, dashboard layout, auth context, API service, JWT auth, dark mode, existing report/alert/SMS/civic systems, MongoDB documents.

## 11. Database/model changes

### VerificationResult (backward compatible):
**New fields**: `claimType` (string), `retrievalMethod` (string), `technicalFailure` (boolean)

**Evidence subdocument new fields**: `publisher` (string), `retrievedAt` (date), `snippet` (string), `supportsClaim` (boolean), `relationshipToClaim` (expanded enum), `evidenceScore` (number 0-1), `content` (string)

**Evidence sufficiency enum expanded**: Added `"technical_failure"`

### VerificationRequest:
**New field**: `claimType` (string, nullable)

### Source:
**New field**: `publisher` (string, nullable)

All changes are additive and backward compatible. Existing documents will have null/defaults for new fields.

## 12. API changes

**No new API routes**. The existing `POST /api/verification` endpoint now:
- Accepts the same input
- Returns results with additional fields: `claimType`, `retrievalMethod`, `technicalFailure`, `evidenceSufficiency` (with new value `technical_failure`)
- Returns HTTP 503 for technical failures (instead of 200 with insufficient evidence)
- Evidence items in the response include: `publisher`, `retrievedAt`, `snippet`, `supportsClaim`, `relationshipToClaim`, `evidenceScore`, `content`

**Response shape change** (backward compatible):
```json
{
  "success": true,
  "data": {
    "request": { "...": "..." },
    "result": {
      "truthStatus": "verified",
      "riskLevel": "low",
      "evidenceSufficiency": "sufficient",
      "technicalFailure": false,
      "claimType": "geography",
      "retrievalMethod": "online_search",
      "evidence": [
        {
          "title": "...",
          "url": "...",
          "publisher": "Ministry of Justice",
          "sourceTier": 1,
          "sourceType": "official",
          "relationshipToClaim": "direct_support",
          "supportsClaim": true,
          "evidenceScore": 0.95,
          "retrievedAt": "...",
          "snippet": "..."
        }
      ]
    }
  }
}
```

## 13. Frontend changes

### Verify page (`src/pages/Verify.jsx`):
- Added `isTechnicalFailure` state
- Shows "Verification temporarily unavailable" card when 503 is received
- Error messages distinguish technical failure from insufficient evidence

### VerificationResult component (`src/components/verification/VerificationResult.jsx`):
- Shows evidence with source tier badges, publisher, relationship type, evidence score
- Shows claim type and retrieval method badges
- Technical failure state with dedicated UI
- Verified claims show "Verified based on authoritative sources" banner
- Evidence cards are clickable to open source URLs

### Dashboard Verification (`src/pages/dashboard/Verification.jsx`):
- Shows claim type, evidence sufficiency, retrieval method
- Shows evidence with tier, publisher, relationship type

### Review Queue (`src/pages/dashboard/ReviewQueue.jsx`):
- Shows claim type for each item
- Shows retrieved evidence with tier, publisher, relationship for insufficient claims

## 14. Exact production tests to run

**Root cause identified**: The online retrieval was gated behind `ONLINE_RETRIEVAL_ENABLED` env var (empty by default). When disabled, the system fell back to MongoDB source registry which had no South Sudan sources, resulting in empty evidence → insufficient evidence → `confidence: 0.35`, `aiGenerated: false`.

**Critical bugs fixed**:
1. **`attachSourceIds` threw on null sourceId** (verificationSchema.js:149) — online evidence has no MongoDB Source ID; function now gracefully skips sourceId attachment
2. **`sourceId` was required** (VerificationResult.js:16) — evidence from web search has no Source document; changed to optional
3. **Overbroad contradiction pattern** (relationshipClassifier.js) — `/is\s+in\s+(?!South\s+Sudan)(.+)/i` incorrectly classified "Juba is in Central Equatoria" as contradicting "Juba is the capital of South Sudan"; replaced with specific patterns

**Fix for primary issue**:
1. Removed `ONLINE_RETRIEVAL_ENABLED` gate — online retrieval always attempts
2. Free DuckDuckGo HTML/API search used as default (no API key needed)
3. SerpAPI used when key is available (better results)
4. Added comprehensive diagnostic logging at every pipeline step
5. `confidence: 0.35` only applies to genuine insufficient evidence; technical failures return 503
6. Added `[Verification] Claim:`, `[OnlineRetriever] START`, `[OnlineRetriever] RESULT`, `[Verification] Evidence retrieval START/RESULT`, `[Verification] Pipeline complete` diagnostic logs

**TEST 1**: Submit "Juba is the capital of South Sudan"
- Expected: DuckDuckGo search finds sources (Wikipedia, constitution references) → evidence retrieved → sufficient → AI assessment → likely verified
- Set `SEARCH_API_KEY` or `SERPAPI_KEY` for better results

**TEST 2**: Submit "South Sudan became independent on 9 July 2011"
- Expected: Retrieve authoritative evidence, verify if evidence supports it

**TEST 3**: Submit "Juba is the capital of Uganda"
- Expected: Retrieve evidence, likely contradicted → false

**TEST 4**: Submit "Juba is located in Central Equatoria State"
- Expected: Retrieve authoritative evidence and verify

**TEST 5**: A claim for which reliable evidence genuinely cannot be found
- Expected: unverified + human review (retrieval succeeded, evidence genuinely insufficient)

**TEST 6**: Simulate retrieval provider failure (network block, timeout)
- Expected: 503 + verification temporarily unavailable + NO review request

**TEST 7**: Conflicting reliable sources
- Expected: conflicting evidence, contested assessment, human review

## 15. Render environment variables to configure

On Render, set the following in the service environment variables:

| Variable | Value |
|---|---|
| `MONGO_URI` | (existing MongoDB URI) |
| `JWT_SECRET` | (strong secret) |
| `OPENAI_API_KEY` | (existing key) |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `SEARCH_API_KEY` or `SERPAPI_KEY` | (optional — SerpAPI for better search results; DuckDuckGo works without it) |
| `CLIENT_URL` | (frontend URL) |
| `PORT` | `5000` |

DuckDuckGo search runs automatically without any API key configuration. No `ONLINE_RETRIEVAL_ENABLED` variable is needed.
