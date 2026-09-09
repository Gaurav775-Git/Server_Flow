const projectApiUrl = (
  import.meta.env.VITE_PROJECT_API_URL || "http://localhost:3000/api/project"
).replace(/\/$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${projectApiUrl}${path}`, {
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

export const getProjects = () => request("");

export const getProject = (id) => request(`/${id}`);

export const createProject = (project) =>
  request("/createProject", {
    method: "POST",
    body: JSON.stringify(project),
  });

export const updateProject = (id, project) =>
  request(`/${id}`, {
    method: "PATCH",
    body: JSON.stringify(project),
  });

export const deleteProject = (id) =>
  request(`/${id}`, {
    method: "DELETE",
  });
