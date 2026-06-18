import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, Calendar, Users, MapPin } from 'lucide-react';
import { Booking } from '@/types';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const savedConfirmation = sessionStorage.getItem('bookingConfirmation');
    if (!savedConfirmation) {
      navigate('/search');
      return;
    }
    
    const bookingData = JSON.parse(savedConfirmation);
    setBooking(bookingData);
  }, [navigate]);

  if (!booking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your reservation has been successfully completed
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="card p-8 mb-6">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Booking Details
              </h2>
              <div className="text-right">
                <p className="text-sm text-gray-600">Booking ID</p>
                <p className="text-lg font-semibold text-primary-600">
                  #{booking.id}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Guest Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Guest Information</h3>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {booking.guest_name}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {booking.guest_email}
                </p>
              </div>
            </div>

            {/* Stay Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Stay Details</h3>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-in: {new Date(booking.check_in_date).toLocaleDateString()}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-out: {new Date(booking.check_out_date).toLocaleDateString()}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Guests: {booking.num_guests}
                </p>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Amount Paid</span>
                  <span className="font-bold text-xl text-gray-900">
                    ${booking.total_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  <span className="text-green-600 font-semibold">
                    {booking.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Email Notice */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <Mail className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary-900 mb-1">
                Confirmation Email Sent
              </h3>
              <p className="text-sm text-primary-800">
                A confirmation email with your booking details has been sent to{' '}
                <span className="font-medium">{booking.guest_email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Important Information</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>Please bring a valid ID and the credit card used for booking at check-in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>Check-in time starts from the hotel's designated check-in time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">•</span>
              <span>For cancellations or modifications, please contact the hotel directly</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/')}
            className="btn-primary flex-1"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/search')}
            className="btn-secondary flex-1"
          >
            Book Another Hotel
          </button>
        </div>
      </div>
    </div>
  );
}
