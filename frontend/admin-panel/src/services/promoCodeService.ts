import { apiClient } from '@/utils/apiClient';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_booking_value?: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  used_count: number;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
}

export interface CreatePromoCodeData {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_booking_value?: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
}

export const promoCodeService = {
  async getPromoCodes(): Promise<PromoCode[]> {
    return apiClient.get('/admin/promo-codes');
  },

  async getPromoCode(id: string): Promise<PromoCode> {
    return apiClient.get(`/admin/promo-codes/${id}`);
  },

  async createPromoCode(data: CreatePromoCodeData): Promise<PromoCode> {
    return apiClient.post('/admin/promo-codes', data);
  },

  async updatePromoCode(id: string, data: Partial<CreatePromoCodeData>): Promise<PromoCode> {
    return apiClient.put(`/admin/promo-codes/${id}`, data);
  },

  async deactivatePromoCode(id: string): Promise<PromoCode> {
    return apiClient.post(`/admin/promo-codes/${id}/deactivate`);
  },

  async deletePromoCode(id: string): Promise<void> {
    return apiClient.delete(`/admin/promo-codes/${id}`);
  },
};
