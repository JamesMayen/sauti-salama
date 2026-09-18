import { apiRequest } from "./api.js";

export function getCivicInformation(filters = {}) {
  const { manage, ...queryFilters } = filters;
  const params = new URLSearchParams(queryFilters);
  const query = params.toString();

  return apiRequest(
    `${manage ? "/civic/manage" : "/civic"}${
      query ? `?${query}` : ""
    }`
  );
}

export function getCivicInformationById(id, manage = false) {
  return apiRequest(
    `${manage ? "/civic/manage" : "/civic"}/${id}`
  );
}

export function createCivicInformation(payload) {
  return apiRequest("/civic", {
    method: "POST",
    body: payload,
  });
}

export function updateCivicInformation(id, payload) {
  return apiRequest(`/civic/${id}`, {
    method: "PATCH",
    body: payload,
  });
}
