import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";

const MAX_EVIDENCE_ITEMS = 10;
const MAX_EXCERPT_LENGTH = 4000;

const sourceTierByType = {
  official: 1,
  institutional: 1,
  international: 1,
  independent_media: 2,
  community: 3,
  user_submitted: 4,
  other: 4,
};

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(
      "Evidence contains an invalid publication date.",
      400,
      "INVALID_EVIDENCE_DATE"
    );
  }

  return date.toISOString();
}

function normalizeText(value, maxLength) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(
      "Evidence contains an invalid text field.",
      400,
      "INVALID_EVIDENCE_FIELD"
    );
  }

  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function assertSafeUrl(value, canonicalUrl) {
  const providedUrl = normalizeText(value, 1000);
  const candidateUrl = providedUrl || canonicalUrl || null;

  if (!candidateUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(candidateUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Unsupported URL scheme");
    }
  } catch {
    throw new AppError(
      "Evidence contains an invalid source URL.",
      400,
      "INVALID_EVIDENCE_URL"
    );
  }

  if (canonicalUrl && providedUrl && providedUrl !== canonicalUrl) {
    throw new AppError(
      "Evidence URL does not match the registered source.",
      400,
      "EVIDENCE_SOURCE_URL_MISMATCH"
    );
  }

  return canonicalUrl || providedUrl;
}

export function normalizeEvidenceItems(items, sources) {
  if (!Array.isArray(items)) {
    throw new AppError(
      "Evidence must be an array.",
      400,
      "INVALID_EVIDENCE"
    );
  }

  if (items.length > MAX_EVIDENCE_ITEMS) {
    throw new AppError(
      `A maximum of ${MAX_EVIDENCE_ITEMS} evidence items may be supplied.`,
      400,
      "EVIDENCE_LIMIT_EXCEEDED"
    );
  }

  const sourceMap = new Map(
    sources.map((source) => [source._id.toString(), source])
  );
  const seen = new Set();

  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new AppError(
        "Evidence items must be objects.",
        400,
        "INVALID_EVIDENCE_ITEM"
      );
    }

    const sourceId = normalizeText(item.sourceId, 24);

    if (!sourceId || !mongoose.Types.ObjectId.isValid(sourceId)) {
      throw new AppError(
        "Each evidence item must reference a valid source.",
        400,
        "EVIDENCE_SOURCE_REQUIRED"
      );
    }

    const source = sourceMap.get(sourceId);

    if (!source) {
      throw new AppError(
        "Evidence source was not found or is inactive.",
        400,
        "EVIDENCE_SOURCE_UNAVAILABLE"
      );
    }

    const title = normalizeText(item.title, 300);
    const publishedAt = normalizeDate(item.publishedAt);
    const excerpt = normalizeText(item.content, MAX_EXCERPT_LENGTH);
    const url = assertSafeUrl(item.url, source.url);
    const duplicateKey = JSON.stringify({
      sourceId,
      title,
      publishedAt,
      excerpt,
      url,
    });

    if (seen.has(duplicateKey)) {
      throw new AppError(
        "Duplicate evidence items are not allowed.",
        400,
        "DUPLICATE_EVIDENCE"
      );
    }

    seen.add(duplicateKey);

    return {
      evidenceId: `E${index + 1}`,
      sourceId,
      source: source.name,
      sourceType: source.type,
      reliabilityLevel: source.reliabilityLevel,
      sourceTier: sourceTierByType[source.type] || 4,
      title,
      url,
      date: publishedAt,
      content: excerpt,
      missingFields: [
        !title && "title",
        !url && "url",
        !publishedAt && "date",
        !excerpt && "content",
      ].filter(Boolean),
    };
  });
}
