import { apiRequest } from "./api.js";

export function createVerification(payload) {
  return apiRequest("/verification", {
    method: "POST",
    body: payload,
  });
}

export function getVerification(id) {
  return apiRequest(`/verification/${id}`);
}

export function getVerifications(filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString();

  return apiRequest(`/verification${query ? `?${query}` : ""}`);
}
