function stripMarkup(value) {
  return typeof value === "string"
    ? value.replace(/<[^>]*>/g, "").trim()
    : value;
}

export function normalizeReportInput(data) {
  return {
    ...data,
    description: stripMarkup(data.description),
    location: stripMarkup(data.location),
    contactName: stripMarkup(data.contactName),
    contactPhone: stripMarkup(data.contactPhone),
    contactEmail: stripMarkup(data.contactEmail),
  };
}

export function sanitizeReport(report) {
  if (!report) {
    return null;
  }

  const data =
    typeof report.toObject === "function"
      ? report.toObject()
      : { ...report };

  delete data.contactName;
  delete data.contactPhone;
  delete data.contactEmail;
  delete data.reviewedBy;
  delete data.reviewedAt;

  return data;
}

export function sanitizeReports(reports) {
  return reports.map(sanitizeReport);
}

export function sanitizeReportSubmission(report) {
  const data = sanitizeReport(report);

  return {
    category: data.category,
    status: data.status,
    createdAt: data.createdAt,
  };
}