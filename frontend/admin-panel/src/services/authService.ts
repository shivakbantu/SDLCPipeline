import { apiClient } from '@/utils/apiClient';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AdminUser;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post('/admin/auth/login', { email, password });
  },

  async logout(): Promise<void> {
    return apiClient.post('/admin/auth/logout');
  },

  async getProfile(): Promise<AdminUser> {
    return apiClient.get('/admin/auth/profile');
  },
};
