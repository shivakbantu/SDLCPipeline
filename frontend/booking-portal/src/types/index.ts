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
  latitude?: number;
  longitude?: number;
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: string;
  amenities?: string[];
  images?: string[];
  average_rating?: number;
  total_reviews?: number;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type: string;
  description: string;
  max_guests: number;
  num_beds: number;
  bed_type: string;
  size_sqm: number;
  base_price: number;
  total_rooms: number;
  amenities?: string[];
  images?: string[];
  available_count?: number;
}

export interface SearchParams {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number[];
}

export interface BookingDetails {
  hotel: Hotel;
  room: Room;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
  guestInfo?: GuestInfo;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests?: string;
}

export interface PaymentInfo {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface Booking {
  id: string;
  hotel_id: string;
  room_id: string;
  user_id?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  total_price: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
}

export interface Review {
  id: string;
  hotel_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}
