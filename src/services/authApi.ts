import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const authApi = {
  login: (email: string, password: string) =>
    axios.post(`${API_URL}/auth/login`, { email, password }),
};
