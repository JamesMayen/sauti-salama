import { apiRequest } from "./api.js";

export function getReviewQueue() {
  return apiRequest("/verification/review-queue");
}

export function resolveReview(id, payload) {
  return apiRequest(`/verification/${id}/review`, {
    method: "POST",
    body: payload,
  });
}
