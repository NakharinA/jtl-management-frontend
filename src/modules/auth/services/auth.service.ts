import { User, LoginResponse } from "../types";
import { apiClient } from "../../../services/api.client";

const AUTH_TOKEN_KEY = "token"; // Matches api.client.ts expectation
const AUTH_USER_KEY = "auth_user";

export const authService = {
  // Real login
  login: async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    
    // Extract token and user data
    const { token, ...user } = response;

    // Store in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    return user;
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },

  getToken: (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
};
