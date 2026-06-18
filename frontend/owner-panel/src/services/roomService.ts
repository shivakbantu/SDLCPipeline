import { apiClient } from '@/utils/apiClient';

export interface Room {
  id: string;
  hotel_id: string;
  room_type: string;
  description: string;
  base_price: number;
  max_guests: number;
  quantity: number;
  amenities: string[];
  photos: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomData {
  room_type: string;
  description: string;
  base_price: number;
  max_guests: number;
  quantity: number;
  amenities?: string[];
}

export interface UpdateRoomData extends Partial<CreateRoomData> {
  is_available?: boolean;
}

export const roomService = {
  async getRooms(hotelId: string): Promise<Room[]> {
    return apiClient.get(`/hotels/${hotelId}/rooms`);
  },

  async getRoom(roomId: string): Promise<Room> {
    return apiClient.get(`/rooms/${roomId}`);
  },

  async createRoom(hotelId: string, data: CreateRoomData): Promise<Room> {
    return apiClient.post(`/hotels/${hotelId}/rooms`, data);
  },

  async updateRoom(roomId: string, data: UpdateRoomData): Promise<Room> {
    return apiClient.put(`/rooms/${roomId}`, data);
  },

  async deleteRoom(roomId: string): Promise<void> {
    return apiClient.delete(`/rooms/${roomId}`);
  },

  async blockDates(roomId: string, startDate: string, endDate: string): Promise<void> {
    return apiClient.post(`/rooms/${roomId}/block`, {
      start_date: startDate,
      end_date: endDate,
    });
  },
};
