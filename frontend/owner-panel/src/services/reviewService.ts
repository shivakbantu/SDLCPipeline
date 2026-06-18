import { apiClient } from '@/utils/apiClient';

export interface Review {
  id: string;
  user_id: string;
  hotel_id: string;
  booking_id: string;
  rating: number;
  comment: string;
  user_name: string;
  response?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

export const reviewService = {
  async getReviews(hotelId: string): Promise<Review[]> {
    return apiClient.get(`/hotels/${hotelId}/reviews`);
  },

  async respondToReview(reviewId: string, response: string): Promise<Review> {
    return apiClient.post(`/reviews/${reviewId}/respond`, { response });
  },
};
