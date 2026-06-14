const API_BASE_URL = "http://localhost:3000";

export function getToken() {
  return localStorage.getItem("flexiboost_token");
}

export function setToken(token: string) {
  localStorage.setItem("flexiboost_token", token);
}

export function clearToken() {
  localStorage.removeItem("flexiboost_token");
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || "Request failed");
  }

  return response.json();
}

export async function login(data: {
  userId: string;
  tenantId: string;
  role: "admin" | "editor" | "viewer";
}) {
  const response = await apiRequest("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  setToken(response.accessToken);

  return response;
}