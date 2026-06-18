import { apiClient } from '@/utils/apiClient';

export interface Booking {
  id: string;
  user_id: string;
  hotel_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  special_requests?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  created_at: string;
  updated_at: string;
}

export interface BookingStats {
  total_bookings: number;
  confirmed_bookings: number;
  upcoming_bookings: number;
  occupancy_rate: number;
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    this_year: number;
  };
}

export const bookingService = {
  async getBookings(hotelId: string, filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    return apiClient.get(`/hotels/${hotelId}/bookings?${params.toString()}`);
  },

  async getBooking(bookingId: string): Promise<Booking> {
    return apiClient.get(`/bookings/${bookingId}`);
  },

  async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking> {
    return apiClient.patch(`/bookings/${bookingId}/status`, { status });
  },

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    return apiClient.post(`/bookings/${bookingId}/cancel`, { reason });
  },

  async getBookingStats(hotelId: string): Promise<BookingStats> {
    return apiClient.get(`/hotels/${hotelId}/bookings/stats`);
  },
};
