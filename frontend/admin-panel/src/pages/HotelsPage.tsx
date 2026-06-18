import { useEffect, useState } from 'react';
import { hotelService, Hotel } from '@/services/hotelService';
import { format } from 'date-fns';
import { Search, CheckCircle, XCircle, ShieldCheck, Ban } from 'lucide-react';

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadHotels();
  }, [selectedStatus]);

  const loadHotels = async () => {
    try {
      const filters = selectedStatus !== 'all' ? { status: selectedStatus } : undefined;
      const data = await hotelService.getHotels(filters);
      setHotels(data);
    } catch (error) {
      console.error('Failed to load hotels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (hotelId: string) => {
    setActionLoading(hotelId);
    try {
      await hotelService.approveHotel(hotelId);
      await loadHotels();
    } catch (error) {
      console.error('Failed to approve hotel:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (hotelId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setActionLoading(hotelId);
    try {
      await hotelService.rejectHotel(hotelId, reason);
      await loadHotels();
    } catch (error) {
      console.error('Failed to reject hotel:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (hotelId: string) => {
    setActionLoading(hotelId);
    try {
      await hotelService.verifyHotel(hotelId);
      await loadHotels();
    } catch (error) {
      console.error('Failed to verify hotel:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (hotelId: string) => {
    const reason = prompt('Please provide a reason for suspension:');
    if (!reason) return;

    setActionLoading(hotelId);
    try {
      await hotelService.suspendHotel(hotelId, reason);
      await loadHotels();
    } catch (error) {
      console.error('Failed to suspend hotel:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Hotel['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hotel Management</h1>
        <p className="text-gray-600 mt-2">Review, approve, and manage hotel listings</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by hotel name, city, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHotels.map((hotel) => (
          <div key={hotel.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{hotel.name}</h3>
                  {hotel.verified && (
                    <ShieldCheck className="w-5 h-5 text-green-600" title="Verified" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {hotel.city}, {hotel.country}
                </p>
                <p className="text-sm text-gray-600">Owner: {hotel.owner_name}</p>
              </div>
              <div>{getStatusBadge(hotel.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Star Rating</p>
                <p className="font-medium text-gray-900">{'⭐'.repeat(hotel.star_rating)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rooms</p>
                <p className="font-medium text-gray-900">{hotel.total_rooms}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="font-medium text-gray-900">{hotel.total_bookings}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(hotel.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
              {hotel.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(hotel.id)}
                    disabled={actionLoading === hotel.id}
                    className="btn-primary text-sm flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(hotel.id)}
                    disabled={actionLoading === hotel.id}
                    className="btn-danger text-sm flex items-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </>
              )}

              {hotel.status === 'approved' && !hotel.verified && (
                <button
                  onClick={() => handleVerify(hotel.id)}
                  disabled={actionLoading === hotel.id}
                  className="btn-primary text-sm flex items-center"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verify
                </button>
              )}

              {(hotel.status === 'approved' || hotel.status === 'suspended') && (
                <button
                  onClick={() => handleSuspend(hotel.id)}
                  disabled={actionLoading === hotel.id}
                  className="btn-secondary text-sm flex items-center"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {hotel.status === 'suspended' ? 'Suspended' : 'Suspend'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredHotels.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No hotels found</p>
        </div>
      )}
    </div>
  );
}
