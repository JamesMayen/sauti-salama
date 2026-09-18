import CivicInformation from "../models/CivicInformation.js";
import Source from "../models/Source.js";
import AppError from "../utils/AppError.js";

async function validateSource(sourceId) {
  if (!sourceId) {
    return null;
  }

  const source = await Source.findOne({
    _id: sourceId,
    isActive: true,
  });

  if (!source) {
    throw new AppError(
      "The selected source is not available.",
      400,
      "CIVIC_SOURCE_UNAVAILABLE"
    );
  }

  return source._id;
}

export async function createCivicInformation(
  data,
  userId = null
) {
  const source = await validateSource(data.source);

  return CivicInformation.create({
    title: data.title,
    summary: data.summary,
    content: data.content,
    category: data.category,
    language: data.language || "english",
    source,
    sourceUrl: data.sourceUrl || null,
    lastVerifiedAt: data.lastVerifiedAt || null,
    isPublished:
      data.isPublished !== undefined
        ? data.isPublished
        : false,
    createdBy: userId,
    updatedBy: userId,
  });
}

export async function getCivicInformation(filters = {}) {
  const query = {};

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.language) {
    query.language = filters.language;
  }

  if (filters.published === "true") {
    query.isPublished = true;
  }

  if (filters.search) {
    const escapedSearch = filters.search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    query.$or = [
      {
        title: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        summary: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  return CivicInformation.find(query)
    .populate("source")
    .sort({ createdAt: -1 });
}

export async function getCivicInformationById(
  id,
  includeUnpublished = false
) {
  const query = includeUnpublished
    ? { _id: id }
    : { _id: id, isPublished: true };

  return CivicInformation.findOne(query).populate("source");
}

export async function updateCivicInformation(
  id,
  data,
  userId = null
) {
  const source = data.source === undefined
    ? undefined
    : await validateSource(data.source);

  const updates = {
    title: data.title,
    summary: data.summary,
    content: data.content,
    category: data.category,
    language: data.language,
    source,
    sourceUrl: data.sourceUrl,
    lastVerifiedAt: data.lastVerifiedAt,
    isPublished: data.isPublished,
    updatedBy: userId,
  };

  Object.keys(updates).forEach((key) => {
    if (updates[key] === undefined) {
      delete updates[key];
    }
  });

  return CivicInformation.findByIdAndUpdate(
    id,
    updates,
    {
      new: true,
      runValidators: true,
    }
  );
}