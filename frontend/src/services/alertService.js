import { apiRequest } from "./api.js";

export function getAlerts(filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString();

  return apiRequest(`/alerts${query ? `?${query}` : ""}`);
}

export function createAlert(payload) {
  return apiRequest("/alerts", {
    method: "POST",
    body: payload,
  });
}

export function updateAlert(id, payload) {
  return apiRequest(`/alerts/${id}`, {
    method: "PATCH",
    body: payload,
  });
}
