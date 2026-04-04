import { User, LoginResponse } from "../types";
import { apiClient } from "../../../services/api.client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";

const AUTH_TOKEN_KEY = "token"; // Matches api.client.ts expectation
const AUTH_USER_KEY = "auth_user";

export const authService = {
  // Real login
  login: async (email: string, password: string): Promise<User> => {
    // 1. Firebase Login using client SDK
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseToken = await userCredential.user.getIdToken();

    // 2. Send Firebase token to backend to get session/app token
    // The backend should now expect ONLY the token (or we send it as a field).
    // Updating to send { token: firebaseToken } as per plan.
    localStorage.setItem(AUTH_TOKEN_KEY , firebaseToken);
    const response = await apiClient.post<LoginResponse>('/auth/login', {});
    
    // Extract token and user data
    const { access_token, ...user } = response;

    // Store in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, access_token);
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
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
};
