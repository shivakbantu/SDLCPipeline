import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { reviewService, Review } from '@/services/reviewService';
import { format } from 'date-fns';
import { Star, MessageSquare } from 'lucide-react';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (user?.hotel_id) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async () => {
    if (!user?.hotel_id) return;

    try {
      const data = await reviewService.getReviews(user.hotel_id);
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;

    try {
      await reviewService.respondToReview(reviewId, responseText);
      await loadReviews();
      setRespondingTo(null);
      setResponseText('');
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
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
        <h1 className="text-3xl font-bold text-gray-900">Guest Reviews</h1>
        <p className="text-gray-600 mt-2">View and respond to guest feedback</p>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-medium text-gray-900">{review.user_name}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(review.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
                {renderStars(review.rating)}
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Hotel Response */}
              {review.response ? (
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-blue-900 mb-1">Hotel Response</p>
                  <p className="text-sm text-blue-800">{review.response}</p>
                  {review.response_date && (
                    <p className="text-xs text-blue-600 mt-2">
                      Responded on {format(new Date(review.response_date), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {respondingTo === review.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={3}
                        className="input-field"
                        placeholder="Write your response..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSubmitResponse(review.id)}
                          className="btn-primary text-sm"
                        >
                          Submit Response
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText('');
                          }}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(review.id)}
                      className="btn-primary text-sm flex items-center"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Respond to Review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
