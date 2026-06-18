import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { BookingDetails, PaymentInfo } from '@/types';
import { bookingAPI } from '@/services/api';

export default function PaymentPage() {
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    zipCode: '',
    country: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Card number validation (Luhn algorithm)
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;
    
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  // Expiry date validation
  const validateExpiryDate = (expiry: string): boolean => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [month, year] = expiry.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    
    if (month < 1 || month > 12) return false;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
    return true;
  };

  // CVV validation
  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'cardNumber':
        if (!validateCardNumber(value)) {
          errors.cardNumber = 'Invalid card number';
        } else {
          delete errors.cardNumber;
        }
        break;
      case 'expiryDate':
        if (!validateExpiryDate(value)) {
          errors.expiryDate = 'Invalid or expired date (MM/YY)';
        } else {
          delete errors.expiryDate;
        }
        break;
      case 'cvv':
        if (!validateCVV(value)) {
          errors.cvv = 'CVV must be 3-4 digits';
        } else {
          delete errors.cvv;
        }
        break;
    }
    
    setValidationErrors(errors);
  };

  useEffect(() => {
    const savedData = sessionStorage.getItem('bookingData');
    if (!savedData) {
      navigate('/search');
      return;
    }
    
    const data = JSON.parse(savedData);
    if (!data.guestInfo) {
      navigate('/booking');
      return;
    }
    
    setBookingDetails(data);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingDetails || !bookingDetails.guestInfo) return;
    
    // Validate all fields before submission
    const errors: Record<string, string> = {};
    if (!validateCardNumber(paymentInfo.cardNumber)) {
      errors.cardNumber = 'Invalid card number';
    }
    if (!validateExpiryDate(paymentInfo.expiryDate)) {
      errors.expiryDate = 'Invalid or expired date';
    }
    if (!validateCVV(paymentInfo.cvv)) {
      errors.cvv = 'Invalid CVV';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setProcessing(true);
    
    try {
      // Create booking
      const bookingData = {
        room_id: bookingDetails.room.id,
        guest_name: `${bookingDetails.guestInfo.firstName} ${bookingDetails.guestInfo.lastName}`,
        guest_email: bookingDetails.guestInfo.email,
        guest_phone: bookingDetails.guestInfo.phone,
        check_in_date: bookingDetails.checkIn,
        check_out_date: bookingDetails.checkOut,
        num_guests: bookingDetails.guests,
        special_requests: bookingDetails.guestInfo.specialRequests,
      };
      
      const booking = await bookingAPI.createBooking(bookingData);
      
      // Save booking confirmation
      sessionStorage.setItem('bookingConfirmation', JSON.stringify(booking));
      sessionStorage.removeItem('bookingData');
      
      // Navigate to confirmation page
      navigate('/confirmation');
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!bookingDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const totalAmount = bookingDetails.totalPrice * 1.15;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Payment Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Secure payment with SSL encryption</span>
              </div>

              <h2 className="text-xl font-semibold mb-6">Credit Card Information</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="inline w-4 h-4 mr-1" />
                  Card Number *
                </label>
                <input
                  type="text"
                  value={paymentInfo.cardNumber}
                  onChange={(e) => {
                    setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value });
                    validateField('cardNumber', e.target.value);
                  }}
                  onBlur={(e) => validateField('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  required
                  maxLength={19}
                  className={`input-field ${validationErrors.cardNumber ? 'border-red-500' : ''}`}
                />
                {validationErrors.cardNumber && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.cardNumber}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  value={paymentInfo.cardHolder}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, cardHolder: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.expiryDate}
                    onChange={(e) => {
                      setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value });
                      validateField('expiryDate', e.target.value);
                    }}
                    onBlur={(e) => validateField('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    required
                    maxLength={5}
                    className={`input-field ${validationErrors.expiryDate ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.expiryDate && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cvv}
                    onChange={(e) => {
                      setPaymentInfo({ ...paymentInfo, cvv: e.target.value });
                      validateField('cvv', e.target.value);
                    }}
                    onBlur={(e) => validateField('cvv', e.target.value)}
                    placeholder="123"
                    required
                    maxLength={4}
                    className={`input-field ${validationErrors.cvv ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.cvv && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.cvv}</p>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-4 mt-8">Billing Address</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={paymentInfo.billingAddress}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, billingAddress: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.city}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, city: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.zipCode}
                    onChange={(e) => setPaymentInfo({ ...paymentInfo, zipCode: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={paymentInfo.country}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, country: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={processing}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay $${totalAmount.toFixed(2)}`
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Payment Summary */}
          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room charges</span>
                  <span>${bookingDetails.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees (15%)</span>
                  <span>${(bookingDetails.totalPrice * 0.15).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Your payment is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
