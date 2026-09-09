const apiBaseUrl = (
  import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
).replace(/\/$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Unable to complete the request.");
    error.details = data.errors || [];
    throw error;
  }

  return data;
};

export const registerUser = (user) =>
  request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(user),
  });

export const loginUser = (credentials) =>
  request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

export const verifyUser = () => request("/api/auth/verify");

export const logoutUser = () =>
  request("/api/auth/logout", {
    method: "POST",
  });
