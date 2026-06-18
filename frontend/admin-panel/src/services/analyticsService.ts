import { apiClient } from '@/utils/apiClient';

export interface PlatformStats {
  total_users: number;
  total_hotels: number;
  total_bookings: number;
  total_revenue: number;
  active_bookings: number;
  pending_hotels: number;
  open_disputes: number;
  revenue_growth: number;
}

export const analyticsService = {
  async getPlatformStats(): Promise<PlatformStats> {
    return apiClient.get('/admin/analytics/stats');
  },

  async getRevenueData(period: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    return apiClient.get(`/admin/analytics/revenue?period=${period}`);
  },

  async getBookingsData(period: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    return apiClient.get(`/admin/analytics/bookings?period=${period}`);
  },
};
