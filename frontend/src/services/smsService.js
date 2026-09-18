import { apiRequest } from "./api.js";

export function getSmsMessages(filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString();
  return apiRequest(`/sms${query ? `?${query}` : ""}`);
}

export function getSmsMessage(id) {
  return apiRequest(`/sms/${id}`);
}

export function sendSms(payload) {
  return apiRequest("/sms/send", {
    method: "POST",
    body: payload,
  });
}

export function sendAlertSms(alertId, recipient) {
  return apiRequest(`/sms/alert/${alertId}`, {
    method: "POST",
    body: { recipient },
  });
}
