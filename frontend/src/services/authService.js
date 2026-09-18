import { apiRequest } from "./api.js";

const TOKEN_KEY =
  "sauti_salama_token";

const USER_KEY =
  "sauti_salama_user";

/**
 * Register a new analyst account.
 */
export async function registerUser({
  fullName,
  email,
  password,
}) {
  const response = await apiRequest(
    "/auth/register",
    {
      method: "POST",
      body: {
        fullName,
        email,
        password,
      },
    }
  );

  if (response?.data?.token) {
    saveAuthSession(
      response.data.token,
      response.data.user
    );
  }

  return response;
}

/**
 * Login an existing user.
 */
export async function loginUser({
  email,
  password,
}) {
  const response = await apiRequest(
    "/auth/login",
    {
      method: "POST",
      body: {
        email,
        password,
      },
    }
  );

  if (response?.data?.token) {
    saveAuthSession(
      response.data.token,
      response.data.user
    );
  }

  return response;
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser() {
  return apiRequest("/auth/me");
}

/**
 * Save JWT and user information.
 */
export function saveAuthSession(
  token,
  user
) {
  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}

/**
 * Remove authentication session.
 */
export function clearAuthSession() {
  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );
}

/**
 * Get stored JWT.
 */
export function getStoredToken() {
  return localStorage.getItem(
    TOKEN_KEY
  );
}

/**
 * Get cached user.
 */
export function getStoredUser() {
  const user =
    localStorage.getItem(
      USER_KEY
    );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem(
      USER_KEY
    );

    return null;
  }
}

/**
 * Check whether a token exists.
 */
export function isAuthenticated() {
  return Boolean(
    getStoredToken()
  );
}