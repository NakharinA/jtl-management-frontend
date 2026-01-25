// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse extends User {
  access_token: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
