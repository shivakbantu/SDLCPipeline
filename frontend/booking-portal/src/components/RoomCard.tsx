import { Users, Maximize2, Bed } from 'lucide-react';
import { Room } from '@/types';

interface RoomCardProps {
  room: Room;
  nights?: number;
  onSelect?: () => void;
}

export default function RoomCard({ room, nights = 1, onSelect }: RoomCardProps) {
  const totalPrice = room.base_price * nights;

  return (
    <div className="card p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Room Image Placeholder */}
        <div className="w-full md:w-48 h-48 bg-gradient-to-br from-primary-300 to-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Bed className="w-16 h-16 text-white" />
        </div>

        {/* Room Details */}
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {room.room_type}
          </h3>
          <p className="text-gray-600 text-sm mb-4">{room.description}</p>

          {/* Room Features */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Up to {room.max_guests} guests</span>
            </div>
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4" />
              <span>{room.num_beds} {room.bed_type} bed{room.num_beds > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              <span>{room.size_sqm} m²</span>
            </div>
          </div>

          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {room.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}

          {/* Availability */}
          {room.available_count !== undefined && (
            <p className="text-sm text-gray-600 mb-4">
              {room.available_count > 0 ? (
                <span className="text-green-600 font-medium">
                  {room.available_count} room{room.available_count > 1 ? 's' : ''} available
                </span>
              ) : (
                <span className="text-red-600 font-medium">No rooms available</span>
              )}
            </p>
          )}
        </div>

        {/* Pricing & Action */}
        <div className="flex flex-col justify-between items-end md:w-48">
          <div className="text-right">
            <p className="text-sm text-gray-600">Per night</p>
            <p className="text-2xl font-bold text-primary-600">
              ${room.base_price.toFixed(2)}
            </p>
            {nights > 1 && (
              <p className="text-sm text-gray-600 mt-2">
                {nights} night{nights > 1 ? 's' : ''}: ${totalPrice.toFixed(2)}
              </p>
            )}
          </div>

          {onSelect && (
            <button
              onClick={onSelect}
              disabled={room.available_count === 0}
              className={`btn-primary w-full mt-4 ${
                room.available_count === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Select Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
