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
};

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `API Error: ${response.statusText}`);
  }
  return response.json();
};
