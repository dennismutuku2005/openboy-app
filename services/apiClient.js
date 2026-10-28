const rawUrl =
  process.env.NEXT_PUBLIC_ENGINE_API_URL || "https://openboyapi.cloudmint.co.ke/api";
const cleanUrl = rawUrl.replace(/\/+$/, "");
const API_BASE_URL = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;

/**
 * Generic API request wrapper that automatically attaches JWT Bearer token
 * and handles JSON parsing and error propagation.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    ...(options.headers || {}),
  };

  // Attach JWT Bearer token from localStorage if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("openboy_jwt");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const config = {
    cache: "no-store",
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);

    // If unauthorized, token expired or invalid
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("openboy_jwt");
      localStorage.removeItem("openboy_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?error=session_expired";
      }
    }

    if (res.status === 204) {
      return null;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: "GET", ...options }),
  post: (endpoint, body, options) =>
    apiRequest(endpoint, { method: "POST", body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) =>
    apiRequest(endpoint, { method: "PUT", body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => apiRequest(endpoint, { method: "DELETE", ...options }),
};
