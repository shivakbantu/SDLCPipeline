import { apiClient } from '@/utils/apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    hotel_id?: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post('/auth/login', credentials);
  },

  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    return apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  },

  async getProfile(): Promise<AuthResponse['user']> {
    return apiClient.get('/auth/profile');
  },
};
