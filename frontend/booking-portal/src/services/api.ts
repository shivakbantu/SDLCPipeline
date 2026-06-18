import { Hotel, Room, SearchParams, Booking, Review } from '@/types';

const API_BASE_URL = '/api';

export const hotelAPI = {
  // Search hotels
  searchHotels: async (params: SearchParams): Promise<Hotel[]> => {
    const queryParams = new URLSearchParams();
    if (params.location) queryParams.append('location', params.location);
    if (params.checkIn) queryParams.append('check_in', params.checkIn);
    if (params.checkOut) queryParams.append('check_out', params.checkOut);
    if (params.guests) queryParams.append('guests', params.guests.toString());
    
    const response = await fetch(`${API_BASE_URL}/hotels/search?${queryParams}`);
    if (!response.ok) throw new Error('Failed to search hotels');
    return response.json();
  },

  // Get all hotels
  getAllHotels: async (): Promise<Hotel[]> => {
    const response = await fetch(`${API_BASE_URL}/hotels`);
    if (!response.ok) throw new Error('Failed to fetch hotels');
    return response.json();
  },

  // Get hotel by ID
  getHotelById: async (id: string): Promise<Hotel> => {
    const response = await fetch(`${API_BASE_URL}/hotels/${id}`);
    if (!response.ok) throw new Error('Hotel not found');
    return response.json();
  },

  // Get rooms for a hotel
  getHotelRooms: async (hotelId: string): Promise<Room[]> => {
    const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}/rooms`);
    if (!response.ok) throw new Error('Failed to fetch rooms');
    return response.json();
  },

  // Get hotel reviews
  getHotelReviews: async (hotelId: string): Promise<Review[]> => {
    const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}/reviews`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },

  // Check room availability
  checkAvailability: async (
    roomId: string,
    checkIn: string,
    checkOut: string
  ): Promise<{ available: boolean; count: number }> => {
    const response = await fetch(
      `${API_BASE_URL}/rooms/${roomId}/availability?check_in=${checkIn}&check_out=${checkOut}`
    );
    if (!response.ok) throw new Error('Failed to check availability');
    return response.json();
  },
};

export const bookingAPI = {
  // Create a booking
  createBooking: async (bookingData: {
    room_id: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    check_in_date: string;
    check_out_date: string;
    num_guests: number;
    special_requests?: string;
  }): Promise<Booking> => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error('Failed to create booking');
    return response.json();
  },

  // Get booking by ID
  getBookingById: async (id: string): Promise<Booking> => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`);
    if (!response.ok) throw new Error('Booking not found');
    return response.json();
  },
};

// Mock API for development (fallback if backend is not running)
export const mockAPI = {
  hotels: [
    {
      id: '1',
      name: 'Grand Plaza Hotel',
      description: 'Luxury hotel in the heart of the city with stunning views',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zip_code: '10001',
      phone: '+1-212-555-0100',
      email: 'info@grandplaza.com',
      star_rating: 5,
      check_in_time: '15:00',
      check_out_time: '11:00',
      cancellation_policy: 'Free cancellation up to 24 hours before check-in',
      amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Parking'],
      average_rating: 4.5,
      total_reviews: 234,
    },
  ] as Hotel[],

  rooms: [
    {
      id: '1',
      hotel_id: '1',
      room_type: 'Deluxe King Room',
      description: 'Spacious room with king bed and city views',
      max_guests: 2,
      num_beds: 1,
      bed_type: 'King',
      size_sqm: 35,
      base_price: 199.99,
      total_rooms: 20,
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Safe', 'Air Conditioning'],
      available_count: 5,
    },
    {
      id: '2',
      hotel_id: '1',
      room_type: 'Executive Suite',
      description: 'Luxurious suite with separate living area',
      max_guests: 4,
      num_beds: 2,
      bed_type: 'Queen',
      size_sqm: 60,
      base_price: 349.99,
      total_rooms: 10,
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Safe', 'Air Conditioning', 'Living Room'],
      available_count: 3,
    },
  ] as Room[],

  reviews: [
    {
      id: '1',
      hotel_id: '1',
      user_name: 'John Doe',
      rating: 5,
      comment: 'Excellent stay! The room was spotless and the staff were very friendly.',
      created_at: '2026-06-10T10:00:00Z',
    },
    {
      id: '2',
      hotel_id: '1',
      user_name: 'Jane Smith',
      rating: 4,
      comment: 'Great location and comfortable rooms. Would definitely stay again.',
      created_at: '2026-06-08T14:30:00Z',
    },
  ] as Review[],
};
