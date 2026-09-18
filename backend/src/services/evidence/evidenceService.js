import { getActiveSourcesByIds } from "../sourceService.js";
import { normalizeEvidenceItems } from "./evidenceNormalizer.js";
import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";

export async function prepareEvidence(items = []) {
  if (!Array.isArray(items)) {
    throw new AppError(
      "Evidence must be an array.",
      400,
      "INVALID_EVIDENCE"
    );
  }

  const sourceIds = [
    ...new Set(
      items
        .map((item) => item?.sourceId)
        .filter(Boolean)
    ),
  ];

  if (
    sourceIds.some(
      (sourceId) =>
        typeof sourceId !== "string" ||
        !mongoose.Types.ObjectId.isValid(sourceId)
    )
  ) {
    throw new AppError(
      "Each evidence item must reference a valid source.",
      400,
      "EVIDENCE_SOURCE_REQUIRED"
    );
  }

  const sources = sourceIds.length
    ? await getActiveSourcesByIds(sourceIds)
    : [];

  return normalizeEvidenceItems(items, sources);
}
