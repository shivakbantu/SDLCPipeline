import { apiClient } from '@/utils/apiClient';

export interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone: string;
  email: string;
  star_rating: number;
  amenities: string[];
  photos: string[];
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: string;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UpdateHotelData {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  star_rating?: number;
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
}

export const hotelService = {
  async getHotel(hotelId: string): Promise<Hotel> {
    return apiClient.get(`/hotels/${hotelId}`);
  },

  async updateHotel(hotelId: string, data: UpdateHotelData): Promise<Hotel> {
    return apiClient.put(`/hotels/${hotelId}`, data);
  },

  async uploadPhotos(hotelId: string, files: File[]): Promise<{ photos: string[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    return apiClient.post(`/hotels/${hotelId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deletePhoto(hotelId: string, photoUrl: string): Promise<void> {
    return apiClient.delete(`/hotels/${hotelId}/photos`, {
      data: { photo_url: photoUrl },
    });
  },
};
