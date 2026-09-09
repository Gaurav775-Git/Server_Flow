const projectApiUrl = (
  import.meta.env.SERVER_URL
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
