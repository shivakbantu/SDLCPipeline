import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MessageSquare } from 'lucide-react';
import { BookingDetails, GuestInfo } from '@/types';

export default function BookingPage() {
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  useEffect(() => {
    // Load booking details from session storage
    const savedData = sessionStorage.getItem('bookingData');
    if (!savedData) {
      navigate('/search');
      return;
    }
    
    const data = JSON.parse(savedData);
    setBookingDetails(data);
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingDetails) return;
    
    // Save guest info and proceed to payment
    const updatedBooking = {
      ...bookingDetails,
      guestInfo,
    };
    
    sessionStorage.setItem('bookingData', JSON.stringify(updatedBooking));
    navigate('/payment');
  };

  if (!bookingDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card p-6">
              <h2 className="text-xl font-semibold mb-6">Guest Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={guestInfo.firstName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={guestInfo.lastName}
                    onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="inline w-4 h-4 mr-1" />
                  Special Requests (Optional)
                </label>
                <textarea
                  value={guestInfo.specialRequests}
                  onChange={(e) => setGuestInfo({ ...guestInfo, specialRequests: e.target.value })}
                  rows={4}
                  className="input-field"
                  placeholder="Any special requirements or preferences?"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Continue to Payment
                </button>
              </div>
            </form>
          </div>

          {/* Booking Summary */}
          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>

              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{bookingDetails.hotel.name}</h3>
                <p className="text-sm text-gray-600">{bookingDetails.hotel.city}, {bookingDetails.hotel.state}</p>
              </div>

              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{bookingDetails.room.room_type}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Check-in: {bookingDetails.checkIn}</p>
                  <p>Check-out: {bookingDetails.checkOut}</p>
                  <p>Guests: {bookingDetails.guests}</p>
                  <p>Nights: {bookingDetails.nights}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room rate x {bookingDetails.nights} night{bookingDetails.nights > 1 ? 's' : ''}</span>
                  <span>${bookingDetails.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span>${(bookingDetails.totalPrice * 0.15).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${(bookingDetails.totalPrice * 1.15).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
