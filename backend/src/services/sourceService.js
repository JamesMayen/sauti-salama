import Source from "../models/Source.js";

export async function createSource(data) {
  return Source.create({
    name: data.name,
    url: data.url || null,
    type: data.type,
    reliabilityLevel:
      data.reliabilityLevel || "unknown",
    description: data.description || null,
    lastCheckedAt: data.lastCheckedAt || null,
    isActive:
      data.isActive !== undefined
        ? data.isActive
        : true,
  });
}

export async function getSources(filters = {}) {
  const query = {};

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.reliabilityLevel) {
    query.reliabilityLevel =
      filters.reliabilityLevel;
  }

  if (filters.active === "true") {
    query.isActive = true;
  }

  return Source.find(query).sort({
    createdAt: -1,
  });
}

export async function getSourceById(id) {
  return Source.findById(id);
}

export async function getActiveSourcesByIds(ids = []) {
  return Source.find({
    _id: { $in: ids },
    isActive: true,
  });
}

export async function updateSource(id, data) {
  return Source.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
}