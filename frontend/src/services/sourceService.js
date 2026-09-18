import { apiRequest } from "./api.js";

export function getSources(filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString();

  return apiRequest(`/sources${query ? `?${query}` : ""}`);
}

export function getSourceById(id) {
  return apiRequest(`/sources/${id}`);
}

export function createSource(payload) {
  return apiRequest("/sources", {
    method: "POST",
    body: payload,
  });
}

export function updateSource(id, payload) {
  return apiRequest(`/sources/${id}`, {
    method: "PATCH",
    body: payload,
  });
}
