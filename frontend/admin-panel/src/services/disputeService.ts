import { apiClient } from '@/utils/apiClient';

export interface Dispute {
  id: string;
  booking_id: string;
  user_id: string;
  hotel_id: string;
  user_name: string;
  hotel_name: string;
  type: 'refund' | 'service' | 'billing' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

export const disputeService = {
  async getDisputes(filters?: { status?: string }): Promise<Dispute[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    return apiClient.get(`/admin/disputes?${params.toString()}`);
  },

  async getDispute(disputeId: string): Promise<Dispute> {
    return apiClient.get(`/admin/disputes/${disputeId}`);
  },

  async updateDisputeStatus(
    disputeId: string,
    status: Dispute['status'],
    resolution?: string
  ): Promise<Dispute> {
    return apiClient.patch(`/admin/disputes/${disputeId}`, { status, resolution });
  },
};
