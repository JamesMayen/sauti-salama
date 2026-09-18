import { apiRequest } from "./api.js";

export function createReport(payload) {
  return apiRequest("/reports", {
    method: "POST",
    body: payload,
  });
}

export function getReports(filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString();

  return apiRequest(`/reports${query ? `?${query}` : ""}`);
}

export function updateReportStatus(id, status) {
  return apiRequest(`/reports/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
