import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Phone, Mail } from 'lucide-react';
import { Hotel } from '@/types';

interface HotelCardProps {
  hotel: Hotel;
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="card overflow-hidden cursor-pointer"
      onClick={() => navigate(`/hotel/${hotel.id}`)}
    >
      {/* Hotel Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
        <div className="text-white text-center">
          <Star className="w-16 h-16 mx-auto mb-2" />
          <p className="text-sm">Hotel Image</p>
        </div>
      </div>

      <div className="p-6">
        {/* Hotel Name & Rating */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">{hotel.name}</h3>
          <div className="flex items-center gap-1">
            {[...Array(hotel.star_rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {hotel.description}
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span>{hotel.city}, {hotel.state}, {hotel.country}</span>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-1 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3" />
            <span>{hotel.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3 h-3" />
            <span>{hotel.email}</span>
          </div>
        </div>

        {/* Amenities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {hotel.amenities.slice(0, 4).map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{hotel.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Reviews */}
        {hotel.average_rating && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{hotel.average_rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-500">
              ({hotel.total_reviews} reviews)
            </span>
          </div>
        )}

        {/* Action Button */}
        <button className="btn-primary w-full mt-4">
          View Details
        </button>
      </div>
    </div>
  );
}
