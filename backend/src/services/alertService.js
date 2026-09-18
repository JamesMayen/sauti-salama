import Alert from "../models/Alert.js";

export async function createAlert(data) {
  return Alert.create({
    title: data.title,
    summary: data.summary,
    location: data.location,
    category: data.category,
    status: data.status,
    riskLevel: data.riskLevel || "medium",
    source: data.source || null,
    publishedAt: data.publishedAt || null,
    expiresAt: data.expiresAt || null,
    isPublished:
      data.isPublished !== undefined
        ? data.isPublished
        : false,
    createdBy: data.createdBy || null,
  });
}

export async function getAlerts(filters = {}) {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.location) {
    query.location = {
      $regex: filters.location,
      $options: "i",
    };
  }

  if (filters.published === "true") {
    query.isPublished = true;
  }

  return Alert.find(query)
    .populate("source")
    .populate("createdBy", "fullName email role")
    .sort({ createdAt: -1 });
}

export async function getAlertById(id) {
  return Alert.findById(id)
    .populate("source")
    .populate("createdBy", "fullName email role");
}

export async function updateAlert(id, data) {
  return Alert.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
}