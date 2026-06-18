import { apiClient } from '@/utils/apiClient';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'hotel_owner' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login?: string;
}

export const userService = {
  async getUsers(filters?: { status?: string; role?: string }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.role) params.append('role', filters.role);

    return apiClient.get(`/admin/users?${params.toString()}`);
  },

  async getUser(userId: string): Promise<User> {
    return apiClient.get(`/admin/users/${userId}`);
  },

  async updateUserStatus(userId: string, status: User['status']): Promise<User> {
    return apiClient.patch(`/admin/users/${userId}/status`, { status });
  },

  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete(`/admin/users/${userId}`);
  },
};
