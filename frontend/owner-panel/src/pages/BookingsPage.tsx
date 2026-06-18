import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, Booking } from '@/services/bookingService';
import { format } from 'date-fns';
import { Calendar, CheckCircle, XCircle, User } from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (user?.hotel_id) {
      loadBookings();
    }
  }, [user, selectedStatus]);

  const loadBookings = async () => {
    if (!user?.hotel_id) return;

    try {
      const filters = selectedStatus !== 'all' ? { status: selectedStatus } : undefined;
      const data = await bookingService.getBookings(user.hotel_id, filters);
      setBookings(data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: Booking['status']) => {
    try {
      await bookingService.updateBookingStatus(bookingId, status);
      await loadBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingService.cancelBooking(bookingId, 'Cancelled by hotel manager');
      await loadBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      checked_in: 'bg-blue-100 text-blue-800',
      checked_out: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.replace('_', ' ').toUpperCase()}
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
        <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
        <p className="text-gray-600 mt-2">View and manage all bookings</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">{booking.guest_name}</p>
                        <p className="text-sm text-gray-500">{booking.guest_email}</p>
                      </div>
                    </div>
                    <div>{getStatusBadge(booking.status)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(booking.check_in_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(booking.check_out_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="font-medium text-gray-900">${booking.total_price}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-medium text-gray-900">{booking.num_guests}</p>
                    </div>
                    {booking.special_requests && (
                      <div>
                        <p className="text-sm text-gray-600">Special Requests</p>
                        <p className="text-sm text-gray-900">{booking.special_requests}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {booking.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        className="btn-primary flex items-center text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="btn-secondary flex items-center text-sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </button>
                    </div>
                  )}

                  {booking.status === 'confirmed' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'checked_in')}
                        className="btn-primary text-sm"
                      >
                        Mark Check-in
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="btn-secondary text-sm"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}

                  {booking.status === 'checked_in' && (
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'checked_out')}
                      className="btn-primary text-sm"
                    >
                      Mark Check-out
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
