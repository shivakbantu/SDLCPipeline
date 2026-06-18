import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roomService, Room, CreateRoomData } from '@/services/roomService';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<CreateRoomData>({
    room_type: '',
    description: '',
    base_price: 0,
    max_guests: 1,
    quantity: 1,
    amenities: [],
  });

  useEffect(() => {
    if (user?.hotel_id) {
      loadRooms();
    }
  }, [user]);

  const loadRooms = async () => {
    if (!user?.hotel_id) return;

    try {
      const data = await roomService.getRooms(user.hotel_id);
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, formData);
      } else {
        await roomService.createRoom(user!.hotel_id!, formData);
      }

      await loadRooms();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save room:', error);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room type?')) return;

    try {
      await roomService.deleteRoom(roomId);
      await loadRooms();
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_type: room.room_type,
      description: room.description,
      base_price: room.base_price,
      max_guests: room.max_guests,
      quantity: room.quantity,
      amenities: room.amenities,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({
      room_type: '',
      description: '',
      base_price: 0,
      max_guests: 1,
      quantity: 1,
      amenities: [],
    });
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600 mt-2">Manage your room types and inventory</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add Room Type
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{room.room_type}</h3>
                <p className="text-sm text-gray-500">
                  {room.quantity} room{room.quantity > 1 ? 's' : ''} available
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(room)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{room.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price per night</span>
                <span className="font-medium text-gray-900">${room.base_price}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Max guests</span>
                <span className="font-medium text-gray-900">{room.max_guests}</span>
              </div>
            </div>

            {room.amenities.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  room.is_available
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {room.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRoom ? 'Edit Room Type' : 'Add Room Type'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type Name
                  </label>
                  <input
                    type="text"
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Deluxe Suite"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input-field"
                    placeholder="Describe the room type..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Night
                    </label>
                    <input
                      type="number"
                      value={formData.base_price}
                      onChange={(e) =>
                        setFormData({ ...formData, base_price: parseFloat(e.target.value) })
                      }
                      className="input-field"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Guests
                    </label>
                    <input
                      type="number"
                      value={formData.max_guests}
                      onChange={(e) =>
                        setFormData({ ...formData, max_guests: parseInt(e.target.value) })
                      }
                      className="input-field"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseInt(e.target.value) })
                      }
                      className="input-field"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={handleCloseModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingRoom ? 'Update Room' : 'Add Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
