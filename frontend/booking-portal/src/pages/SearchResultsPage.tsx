import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import HotelCard from '@/components/HotelCard';
import { Hotel, SearchParams } from '@/types';
import { hotelAPI, mockAPI } from '@/services/api';
import { Loader2 } from 'lucide-react';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchCriteria: SearchParams = {
    location: searchParams.get('location') || undefined,
    checkIn: searchParams.get('checkIn') || undefined,
    checkOut: searchParams.get('checkOut') || undefined,
    guests: searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined,
  };

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try to fetch from API
        const results = await hotelAPI.getAllHotels();
        setHotels(results);
      } catch (err) {
        console.warn('API not available, using mock data:', err);
        // Fallback to mock data if API is not available
        setHotels(mockAPI.hotels);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white shadow-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar initialValues={searchCriteria} />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">
          {searchCriteria.location
            ? `Hotels in ${searchCriteria.location}`
            : 'All Hotels'}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg">
              No hotels found. Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Found {hotels.length} hotel{hotels.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
