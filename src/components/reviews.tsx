import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';

interface Review {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_votes: number;
  total_votes: number;
}

interface ReviewsProps {
  courseId: string;
}

export default function Reviews({ courseId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchMyReview();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const token = localStorage.getItem('ajayu_token');
      if (!token) return;

      const response = await fetch(`/api/courses/${courseId}/my-review`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMyReview(data.data);
          setReviewText(data.data.comment || '');
          setReviewRating(data.data.rating || 5);
        }
      }
    } catch (error) {
      console.error('Error fetching my review:', error);
    }
  };

  const submitReview = async () => {
    if (!reviewText.trim()) {
      alert('Por favor escribe tu reseña');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('ajayu_token');
      if (!token) {
        alert('Debes iniciar sesión para dejar una reseña');
        return;
      }

      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewText
        })
      });

      if (response.ok) {
        setReviewText('');
        setReviewRating(5);
        setShowReviewForm(false);
        fetchReviews();
        fetchMyReview();
        alert('¡Reseña guardada exitosamente!');
      } else {
        const data = await response.json();
        alert(data.message || 'Error al guardar la reseña');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error al guardar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const voteReview = async (reviewId: number, helpful: boolean) => {
    try {
      const token = localStorage.getItem('ajayu_token');
      if (!token) {
        alert('Debes iniciar sesión para votar');
        return;
      }

      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          helpful
        })
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error voting review:', error);
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive && onStarClick ? () => onStarClick(star) : undefined}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FFE2] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">
          Reseñas ({reviews.length})
        </h2>
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="px-4 py-2 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
        >
          {myReview ? 'Editar Reseña' : 'Escribir Reseña'}
        </button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {myReview ? 'Editar tu reseña' : 'Escribir una reseña'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Calificación
              </label>
              {renderStars(reviewRating, true, setReviewRating)}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Comentario
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#00FFE2] focus:border-transparent"
                rows={4}
                placeholder="Comparte tu experiencia con este curso..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={submitReview}
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : (myReview ? 'Actualizar' : 'Publicar')}
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Review */}
      {myReview && !showReviewForm && (
        <div className="bg-gradient-to-r from-[#00FFE2]/10 to-[#A848F0]/10 rounded-lg p-6 border border-[#00FFE2]/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-neutral-900">Tu reseña</h3>
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-sm text-[#A848F0] hover:underline"
            >
              Editar
            </button>
          </div>
          <div className="flex items-center mb-2">
            {renderStars(myReview.rating)}
            <span className="text-sm text-neutral-600 ml-2">
              {new Date(myReview.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-neutral-700">{myReview.comment}</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00FFE2] to-[#A848F0] flex items-center justify-center text-white font-bold">
                    {review.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900">{review.user_name}</h4>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-neutral-600">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-neutral-700 mb-4">{review.comment}</p>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => voteReview(review.id, true)}
                  className="flex items-center space-x-1 text-sm text-neutral-600 hover:text-green-600 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Útil ({review.helpful_votes || 0})</span>
                </button>
                <button
                  onClick={() => voteReview(review.id, false)}
                  className="flex items-center space-x-1 text-sm text-neutral-600 hover:text-red-600 transition-colors"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-600 mb-2">
              Aún no hay reseñas
            </h3>
            <p className="text-neutral-500">
              Sé el primero en dejar una reseña para este curso
            </p>
          </div>
        )}
      </div>
    </div>
  );
}