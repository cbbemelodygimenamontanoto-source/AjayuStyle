import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, User, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface CourseReview {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  created_at: Date;
  helpful_votes: number;
  unhelpful_votes: number;
  user_voted?: 'helpful' | 'unhelpful' | null;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  instructor_id: number;
  instructor_name?: string;
  average_rating?: number;
  total_reviews: number;
}

export default function ReviewsPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<CourseReview | null>(null);
  
  // Estado del formulario de reseña
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
      fetchReviews();
      fetchUserReview();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        
        // Actualizar datos del curso con las estadísticas
        if (data.stats && course) {
          setCourse(prev => prev ? {
            ...prev,
            average_rating: data.stats.average_rating,
            total_reviews: data.stats.total_reviews
          } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/my-review`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserReview(data.review);
        if (data.review) {
          setReviewForm({
            rating: data.review.rating,
            comment: data.review.comment
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewForm.comment.trim()) {
      alert('Por favor escribe un comentario');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const method = userReview ? 'PUT' : 'POST';
      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim()
        })
      });

      if (response.ok) {
        await fetchReviews();
        await fetchUserReview();
        alert(userReview ? '¡Reseña actualizada exitosamente!' : '¡Reseña enviada exitosamente!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error al enviar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (reviewId: number, voteType: 'helpful' | 'unhelpful') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote_type: voteType })
      });

      if (response.ok) {
        await fetchReviews();
      }
    } catch (error) {
      console.error('Error voting review:', error);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-200`}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00FFE2]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reseñas del Curso</h1>
                <p className="text-gray-600 mt-2">{course?.title}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push(`/courses/${courseId}/lessons`)}
                  variant="outline"
                >
                  Volver al Curso
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reseñas List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Reseñas de Estudiantes ({reviews.length})
                </h2>
                
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay reseñas aún
                    </h3>
                    <p className="text-gray-600">
                      Sé el primero en dejar una reseña de este curso.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {review.user_avatar ? (
                              <img
                                src={review.user_avatar}
                                alt={review.user_name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          
                          {/* Review Content */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-medium text-gray-900">{review.user_name}</h3>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(review.created_at)}
                                </div>
                              </div>
                              {renderStars(review.rating)}
                            </div>
                            
                            <p className="text-gray-700 mb-3">{review.comment}</p>
                            
                            {/* Vote Buttons */}
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => handleVote(review.id, 'helpful')}
                                className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-lg transition-colors ${
                                  review.user_voted === 'helpful'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>Útil ({review.helpful_votes})</span>
                              </button>
                              
                              <button
                                onClick={() => handleVote(review.id, 'unhelpful')}
                                className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-lg transition-colors ${
                                  review.user_voted === 'unhelpful'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <ThumbsDown className="w-4 h-4" />
                                <span>No útil ({review.unhelpful_votes})</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Write Review Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {userReview ? 'Editar Reseña' : 'Escribir Reseña'}
                </h2>
                
                {course && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Calificación promedio</h3>
                        <p className="text-sm text-gray-600">{course.total_reviews} reseñas</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getRatingColor(course.average_rating || 0)}`}>
                          {course.average_rating?.toFixed(1) || 'N/A'}
                        </div>
                        {renderStars(Math.round(course.average_rating || 0))}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calificación *
                    </label>
                    {renderStars(reviewForm.rating, true, (rating) => 
                      setReviewForm(prev => ({ ...prev, rating }))
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentario *
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00FFE2] focus:border-transparent"
                      placeholder="Comparte tu experiencia con este curso..."
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#00FFE2] hover:bg-[#00E6CC] text-black"
                  >
                    {submitting ? 'Enviando...' : userReview ? 'Actualizar Reseña' : 'Enviar Reseña'}
                  </Button>
                </form>

                {/* Guidelines */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Pautas para reseñas</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Sé honesto y específico</li>
                    <li>• Comparte tu experiencia real</li>
                    <li>• Enfócate en el contenido del curso</li>
                    <li>• Ayuda a otros estudiantes a decidir</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}