const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export const apiClient = {
  get: async <T>(url: string, params?: Record<string, string>): Promise<T> => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    const response = await fetch(`${BASE_URL}${url}${query}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  post: async <T>(url: string, data: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async <T>(url: string, data: any): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async <T>(
    url: string,
    params?: Record<string, string>,
  ): Promise<T> => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    const response = await fetch(`${BASE_URL}${url}${query}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  postForm: async <T>(url: string, formData: FormData, params?: Record<string, string>): Promise<T> => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}${url}${query}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return handleResponse(response);
  },
};

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `API Error: ${response.statusText}`);
  }
  return response.json();
};
