import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Star, Loader2 } from 'lucide-react';
import { Hotel, Room, Review } from '@/types';
import { hotelAPI, mockAPI } from '@/services/api';
import RoomCard from '@/components/RoomCard';
import { differenceInDays, parseISO } from 'date-fns';

export default function HotelDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '1');
  
  const nights = checkIn && checkOut
    ? differenceInDays(parseISO(checkOut), parseISO(checkIn))
    : 1;

  useEffect(() => {
    const fetchHotelData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch from API
        const hotelData = await hotelAPI.getHotelById(id);
        const roomsData = await hotelAPI.getHotelRooms(id);
        const reviewsData = await hotelAPI.getHotelReviews(id);
        
        setHotel(hotelData);
        setRooms(roomsData);
        setReviews(reviewsData);
      } catch (err) {
        console.warn('API not available, using mock data:', err);
        // Fallback to mock data
        setHotel(mockAPI.hotels[0]);
        setRooms(mockAPI.rooms);
        setReviews(mockAPI.reviews);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, [id]);

  const handleRoomSelect = (room: Room) => {
    // Store booking details and navigate to booking page
    const bookingData = {
      hotel,
      room,
      checkIn,
      checkOut,
      guests,
      nights,
      totalPrice: room.base_price * nights,
    };
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    navigate('/booking');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Hotel not found'}</p>
          <button onClick={() => navigate('/search')} className="btn-primary mt-4">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hotel Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  {[...Array(hotel.star_rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                {hotel.average_rating && (
                  <span className="text-sm">
                    {hotel.average_rating.toFixed(1)} ({hotel.total_reviews} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-6">{hotel.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{hotel.address}, {hotel.city}, {hotel.state} {hotel.zip_code}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{hotel.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{hotel.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Check-in: {hotel.check_in_time} | Check-out: {hotel.check_out_time}</span>
            </div>
          </div>

          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Hotel Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Rooms */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>
        
        {checkIn && checkOut && (
          <p className="text-gray-600 mb-6">
            For {nights} night{nights !== 1 ? 's' : ''} ({checkIn} to {checkOut}) • {guests} guest{guests !== 1 ? 's' : ''}
          </p>
        )}

        <div className="space-y-4">
          {rooms.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600">No rooms available</p>
            </div>
          ) : (
            rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                nights={nights}
                onSelect={() => handleRoomSelect(room)}
              />
            ))
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold mb-6">Guest Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="card p-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary-600">
                      {review.user_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{review.user_name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
