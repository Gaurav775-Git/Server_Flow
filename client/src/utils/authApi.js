const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

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
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(user),
  });

export const loginUser = (credentials) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

export const verifyUser = () => request("/auth/verify");

export const logoutUser = () =>
  request("/auth/logout", {
    method: "POST",
  });