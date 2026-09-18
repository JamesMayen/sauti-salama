const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/**
 * Generic API request helper.
 *
 * Automatically:
 * - adds JSON headers
 * - attaches JWT when available
 * - parses JSON responses
 * - converts API errors into JavaScript errors
 */
export async function apiRequest(
  endpoint,
  options = {}
) {
  const token =
    localStorage.getItem("sauti_salama_token");

  const {
    method = "GET",
    body,
    headers = {},
    ...rest
  } = options;

  const requestHeaders = {
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] =
      "application/json";
  }

  if (token) {
    requestHeaders.Authorization =
      `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        method,
        headers: requestHeaders,
        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
        ...rest,
      }
    );
  } catch (error) {
    throw new Error(
      "Unable to connect to Sauti Salama API. Please check that the backend server is running."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const apiMessage =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}.`;

    const error = new Error(apiMessage);

    error.status = response.status;
    error.code = data?.error?.code || null;
    error.details = data?.error?.details || null;

    throw error;
  }

  return data;
}

/**
 * Check backend health.
 */
export async function checkApiHealth() {
  return apiRequest("/health");
}

/**
 * Expose API URL when needed by other services.
 */
export { API_URL };