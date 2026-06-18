import { apiClient } from '@/utils/apiClient';

export interface Hotel {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  city: string;
  country: string;
  star_rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified: boolean;
  created_at: string;
  total_rooms: number;
  total_bookings: number;
}

export const hotelService = {
  async getHotels(filters?: { status?: string }): Promise<Hotel[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    return apiClient.get(`/admin/hotels?${params.toString()}`);
  },

  async getHotel(hotelId: string): Promise<Hotel> {
    return apiClient.get(`/admin/hotels/${hotelId}`);
  },

  async approveHotel(hotelId: string): Promise<Hotel> {
    return apiClient.post(`/admin/hotels/${hotelId}/approve`);
  },

  async rejectHotel(hotelId: string, reason: string): Promise<Hotel> {
    return apiClient.post(`/admin/hotels/${hotelId}/reject`, { reason });
  },

  async verifyHotel(hotelId: string): Promise<Hotel> {
    return apiClient.post(`/admin/hotels/${hotelId}/verify`);
  },

  async suspendHotel(hotelId: string, reason: string): Promise<Hotel> {
    return apiClient.post(`/admin/hotels/${hotelId}/suspend`, { reason });
  },
};
