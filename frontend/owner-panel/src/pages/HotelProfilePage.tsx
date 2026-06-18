import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hotelService, Hotel, UpdateHotelData } from '@/services/hotelService';
import { Save, Upload, X } from 'lucide-react';

export default function HotelProfilePage() {
  const { user } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateHotelData>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.hotel_id) {
      loadHotel();
    }
  }, [user]);

  const loadHotel = async () => {
    if (!user?.hotel_id) return;

    try {
      const data = await hotelService.getHotel(user.hotel_id);
      setHotel(data);
      setFormData({
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zip_code: data.zip_code,
        phone: data.phone,
        email: data.email,
        star_rating: data.star_rating,
        amenities: data.amenities,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
        cancellation_policy: data.cancellation_policy,
      });
    } catch (error) {
      console.error('Failed to load hotel:', error);
      setMessage({ type: 'error', text: 'Failed to load hotel information' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.hotel_id) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const updated = await hotelService.updateHotel(user.hotel_id, formData);
      setHotel(updated);
      setMessage({ type: 'success', text: 'Hotel profile updated successfully!' });
    } catch (error) {
      console.error('Failed to update hotel:', error);
      setMessage({ type: 'error', text: 'Failed to update hotel profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateHotelData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    const current = formData.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    handleInputChange('amenities', updated);
  };

  const availableAmenities = [
    'WiFi',
    'Pool',
    'Parking',
    'Air Conditioning',
    'Breakfast',
    'Gym',
    'Pet Friendly',
    'Restaurant',
    'Bar',
    'Room Service',
    'Spa',
    'Conference Room',
  ];

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
        <h1 className="text-3xl font-bold text-gray-900">Hotel Profile</h1>
        <p className="text-gray-600 mt-2">Manage your hotel information and settings</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <p>{message.text}</p>
            <button onClick={() => setMessage(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Star Rating</label>
              <select
                value={formData.star_rating || 3}
                onChange={(e) => handleInputChange('star_rating', parseInt(e.target.value))}
                className="input-field"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} Star{rating > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="input-field"
                placeholder="Describe your hotel..."
              />
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact & Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input
                type="text"
                value={formData.zip_code || ''}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableAmenities.map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities?.includes(amenity) || false}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Policies */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Policies & Timings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Time</label>
              <input
                type="time"
                value={formData.check_in_time || ''}
                onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Time</label>
              <input
                type="time"
                value={formData.check_out_time || ''}
                onChange={(e) => handleInputChange('check_out_time', e.target.value)}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Policy
              </label>
              <textarea
                value={formData.cancellation_policy || ''}
                onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Describe your cancellation policy..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn-primary flex items-center">
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
