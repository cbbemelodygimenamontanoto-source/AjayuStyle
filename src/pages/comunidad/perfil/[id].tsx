import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Link as LinkIcon,
  Mail,
  Calendar,
  Edit3,
  Settings,
  Heart,
  Share2,
  MessageCircle,
  Star,
  MoreHorizontal,
  Image,
  Send,
  Loader2,
  UserPlus,
  Check,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Flag,
  UserCheck,
  Trash2,
  X,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

interface Review {
  id: number;
  reviewerId: number;
  reviewerName: string;
  reviewerUsername: string;
  reviewerAvatar: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Post {
  id: number;
  authorId: number;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  sharesCount: number;
  isLiked: boolean;
  createdAt: string;
}

interface ProfileData {
  id: number;
  userId: number;
  name: string;
  username: string;
  bio: string;
  avatar: string | null;
  coverImage: string | null;
  country: string;
  region: string;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  contactEmail: string | null;
  mapLocation: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  averageRating: number;
  totalReviews: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  isPrivate: boolean;
  role: 'normal' | 'instructor' | 'moderador' | 'administrador';
}

type TabType = 'posts' | 'reviews' | 'info';

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: number, role: string, profileId?: number} | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{type: 'post' | 'review', id: number} | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportType, setReportType] = useState<'post' | 'review' | 'profile'>('post');
  const [reportTargetId, setReportTargetId] = useState<number>(0);
  const [editForm, setEditForm] = useState({
    bio: '',
    country: '',
    region: '',
    website: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    contactEmail: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Verificar si el usuario actual es admin/moderador
  const isAdminOrModerator = currentUser?.role === 'administrador' || currentUser?.role === 'moderador';

  // Cargar datos del usuario actual
  useEffect(() => {
    const loadCurrentUser = async () => {
      const userData = localStorage.getItem('user');
      let userId = 1;
      let userRole = 'normal';
      
      try {
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.id || 1;
          userRole = user.role || 'normal';
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
      
      // Obtener profile_id del usuario actual
      try {
        const profileRes = await fetch(`/api/comunidad/profiles?user_id=${userId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.profile) {
            setCurrentUser({ 
              id: userId, 
              role: userRole,
              profileId: profileData.profile.id 
            });
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching current profile:', e);
      }
      
      setCurrentUser({ id: userId, role: userRole, profileId: userId });
    };
    
    loadCurrentUser();
  }, []);

  // Cargar datos del perfil
  useEffect(() => {
    if (!id) return;
    
    const loadProfileData = async () => {
      setLoading(true);
      
      try {
        // Obtener datos del perfil desde la API
        const profileRes = await fetch(`/api/comunidad/profiles?user_id=${id}`);
        
        if (!profileRes.ok) {
          console.error('Error fetching profile:', profileRes.status);
          setLoading(false);
          return;
        }
        
        const profileData = await profileRes.json();
        
        if (!profileData.profile) {
          setLoading(false);
          return;
        }
        
        const p = profileData.profile;
        
        // Transformar datos del perfil al formato esperado
        const profileInfo: ProfileData = {
          id: p.id,
          userId: p.user_id,
          name: p.name || p.username || 'Usuario',
          username: p.username || `user_${p.user_id}`,
          bio: p.bio || '',
          avatar: p.avatar || null,
          coverImage: p.cover_image || null,
          country: p.country || '',
          region: p.region || '',
          website: p.website || null,
          instagram: p.instagram || null,
          twitter: p.twitter || null,
          linkedin: p.linkedin || null,
          contactEmail: p.contact_email || null,
          mapLocation: p.map_location || null,
          followersCount: p.followers_count || 0,
          followingCount: p.following_count || 0,
          postsCount: p.posts_count || 0,
          averageRating: 0,
          totalReviews: 0,
          isFollowing: false,
          isOwnProfile: currentUser ? String(p.user_id) === String(currentUser.id) : false,
          isPrivate: p.profile_visibility === 'private',
          role: 'normal'
        };
        
        setProfile(profileInfo);
        
        // Cargar reseñas
        const reviewsRes = await fetch(`/api/comunidad/reviews?profile_id=${p.id}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          if (reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
            const transformedReviews: Review[] = reviewsData.reviews.map((r: any) => ({
              id: r.id,
              reviewerId: r.reviewer_profile_id,
              reviewerName: r.reviewer_name || r.reviewer_username || 'Usuario',
              reviewerUsername: r.reviewer_username || 'usuario',
              reviewerAvatar: r.reviewer_avatar || null,
              rating: r.rating,
              comment: r.comment || '',
              createdAt: r.created_at
            }));
            setReviews(transformedReviews);
            
            // Calcular rating promedio
            if (reviewsData.reviews.length > 0) {
              const totalRating = reviewsData.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
              profileInfo.averageRating = Math.round((totalRating / reviewsData.reviews.length) * 10) / 10;
              profileInfo.totalReviews = reviewsData.reviews.length;
              setProfile({...profileInfo});
            }
          }
        }
        
        // Cargar posts
        const postsRes = await fetch(`/api/comunidad/posts?profile_id=${p.id}&limit=20`);
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          if (postsData.posts && Array.isArray(postsData.posts)) {
            const transformedPosts: Post[] = postsData.posts.map((p: any) => ({
              id: p.post_id,
              authorId: p.author_user_id,
              content: p.content,
              imageUrl: p.image_url || null,
              likesCount: p.likes_count || 0,
              sharesCount: p.shares_count || 0,
              isLiked: p.is_liked === 1 || p.is_liked === true,
              createdAt: p.created_at
            }));
            setPosts(transformedPosts);
            profileInfo.postsCount = postsData.posts.length;
            setProfile({...profileInfo});
          }
        }
        
        // Actualizar formulario de edición
        setEditForm({
          bio: profileInfo.bio,
          country: profileInfo.country,
          region: profileInfo.region,
          website: profileInfo.website || '',
          instagram: profileInfo.instagram || '',
          twitter: profileInfo.twitter || '',
          linkedin: profileInfo.linkedin || '',
          contactEmail: profileInfo.contactEmail || ''
        });
        
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileData();
  }, [id, currentUser]);

  const handleFollow = async () => {
    if (!profile || !currentUser?.profileId) return;
    
    try {
      const method = profile.isFollowing ? 'DELETE' : 'POST';
      const res = await fetch('/api/comunidad/follows', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          follower_profile_id: currentUser.profileId,
          following_profile_id: profile.id
        })
      });
      
      if (res.ok) {
        setProfile({
          ...profile,
          isFollowing: !profile.isFollowing,
          followersCount: profile.isFollowing ? profile.followersCount - 1 : profile.followersCount + 1
        });
      }
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
    }
  };

  const handleLike = async (postId: number) => {
    if (!currentUser?.profileId) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    try {
      const method = post.isLiked ? 'DELETE' : 'POST';
      const res = await fetch('/api/comunidad/likes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          profile_id: currentUser.profileId
        })
      });
      
      if (res.ok) {
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
            };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error('Error al dar/quitar like:', error);
    }
  };

  const handleShare = async (postId: number) => {
    const shareUrl = `${window.location.origin}/comunidad/post/${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Enlace copiado al portapapeles!');
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) return;
    
    try {
      const res = await fetch(`/api/comunidad/posts?id=${postId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setPosts(posts.filter(post => post.id !== postId));
        if (profile) {
          setProfile({...profile, postsCount: profile.postsCount - 1});
        }
      }
    } catch (error) {
      console.error('Error al eliminar post:', error);
    }
    
    setShowDeleteConfirm(null);
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!profile || !currentUser?.profileId) return;
    if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) return;
    
    try {
      const res = await fetch(
        `/api/comunidad/reviews?review_id=${reviewId}&profile_id=${currentUser.profileId}&is_admin=${isAdminOrModerator}`,
        { method: 'DELETE' }
      );
      
      if (res.ok) {
        const updatedReviews = reviews.filter(review => review.id !== reviewId);
        setReviews(updatedReviews);
        
        // Actualizar rating promedio
        if (updatedReviews.length > 0) {
          const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
          setProfile({
            ...profile,
            averageRating: Math.round((totalRating / updatedReviews.length) * 10) / 10,
            totalReviews: updatedReviews.length
          });
        } else {
          setProfile({
            ...profile,
            averageRating: 0,
            totalReviews: 0
          });
        }
      }
    } catch (error) {
      console.error('Error al eliminar reseña:', error);
    }
    
    setShowDeleteConfirm(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || !profile || !currentUser?.profileId) return;

    setSubmittingReview(true);
    
    try {
      const res = await fetch('/api/comunidad/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_profile_id: currentUser.profileId,
          reviewed_profile_id: profile.id,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        const newReview: Review = {
          id: data.review?.id || Date.now(),
          reviewerId: currentUser.profileId,
          reviewerName: 'Tú',
          reviewerUsername: currentUser.id.toString(),
          reviewerAvatar: null,
          rating: reviewRating,
          comment: reviewComment,
          createdAt: new Date().toISOString()
        };
        
        const updatedReviews = [newReview, ...reviews];
        setReviews(updatedReviews);
        
        // Actualizar rating promedio
        const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        setProfile({
          ...profile,
          averageRating: Math.round((totalRating / updatedReviews.length) * 10) / 10,
          totalReviews: updatedReviews.length
        });
        
        setShowReviewModal(false);
        setReviewComment('');
        setReviewRating(5);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al crear la reseña');
      }
    } catch (error) {
      console.error('Error al crear reseña:', error);
      alert('Error al crear la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSavingProfile(true);
    
    try {
      const res = await fetch('/api/comunidad/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          ...editForm
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        setProfile({
          ...profile,
          bio: editForm.bio,
          country: editForm.country,
          region: editForm.region,
          website: editForm.website || null,
          instagram: editForm.instagram || null,
          twitter: editForm.twitter || null,
          linkedin: editForm.linkedin || null,
          contactEmail: editForm.contactEmail || null
        });
        
        setShowEditProfileModal(false);
        alert('Perfil actualizado correctamente');
      } else {
        const error = await res.json();
        alert(error.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Por favor selecciona o escribe un motivo de denuncia');
      return;
    }
    
    try {
      const res = await fetch('/api/comunidad/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_profile_id: currentUser?.profileId || 1,
          reported_profile_id: reportType === 'profile' ? reportTargetId : null,
          post_id: reportType === 'post' ? reportTargetId : null,
          review_id: reportType === 'review' ? reportTargetId : null,
          report_type: reportType,
          reason: reportReason,
          description: ''
        })
      });
      
      if (res.ok) {
        alert('Denuncia enviada. Gracias por tu reporte.');
        setShowReportModal(false);
        setReportReason('');
      } else {
        alert('Error al enviar la denuncia');
      }
    } catch (error) {
      console.error('Error al denunciar:', error);
      alert('Error al enviar la denuncia');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  // Verificar si puede eliminar un post
  const canDeletePost = (post: Post) => {
    return profile?.isOwnProfile || (isAdminOrModerator && post.authorId !== currentUser?.id);
  };

  // Verificar si puede eliminar una reseña
  const canDeleteReview = (review: Review) => {
    return review.reviewerId === currentUser?.profileId || isAdminOrModerator;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Perfil no encontrado</p>
          <Link href="/comunidad/feed" className="text-pink-500 hover:underline">
            Volver al feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.name} - Comunidad Ajayu</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/comunidad/feed" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Volver al feed</span>
              </Link>
              {/* Badge de rol para admins/moderadores */}
              {isAdminOrModerator && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 text-sm font-medium rounded-full flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {currentUser?.role === 'administrador' ? 'Administrador' : 'Moderador'}
                  </span>
                  <Link 
                    href="/comunidad/moderacion"
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Panel de Moderación
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Profile Header */}
        <div className="bg-white border-b border-gray-200">
          {/* Cover Image */}
          <div className="h-32 sm:h-48 bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 relative">
            {profile.coverImage && (
              <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Profile Info */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-16 sm:-mt-20 mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full border-4 border-white flex items-center justify-center overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white text-3xl sm:text-4xl font-bold">{profile.name[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  {profile.isPrivate && <span className="text-gray-500 text-sm">(Privado)</span>}
                  {profile.role !== 'normal' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      profile.role === 'administrador' ? 'bg-purple-100 text-purple-700' :
                      profile.role === 'moderador' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {profile.role}
                    </span>
                  )}
                </div>
                <p className="text-gray-500">@{profile.username}</p>
                {profile.country && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    {profile.region ? `${profile.region}, ` : ''}{profile.country}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {profile.isOwnProfile ? (
                  <button 
                    onClick={() => setShowEditProfileModal(true)}
                    className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-full font-medium hover:bg-pink-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar perfil
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                        profile.isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-pink-500 text-white hover:bg-pink-600'
                      }`}
                    >
                      {profile.isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Siguiendo
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Seguir
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setReportType('profile');
                        setReportTargetId(profile.id);
                        setShowReportModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Denunciar perfil"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-700 mb-4 max-w-2xl">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 pb-4 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">{profile.followersCount}</span>
                <span className="text-gray-500">seguidores</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">{profile.followingCount}</span>
                <span className="text-gray-500">siguiendo</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">{profile.postsCount}</span>
                <span className="text-gray-500">publicaciones</span>
              </div>
              {profile.totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(profile.averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">{profile.averageRating.toFixed(1)}</span>
                  <span className="text-gray-500">({profile.totalReviews} reseñas)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              {(['posts', 'reviews', 'info'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'posts' ? 'Publicaciones' : tab === 'reviews' ? 'Reseñas' : 'Información'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">No hay publicaciones aún</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatTimeAgo(post.createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Menú de opciones */}
                          {(canDeletePost(post) || !profile.isOwnProfile) && (
                            <div className="relative group">
                              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <MoreHorizontal className="w-5 h-5 text-gray-400" />
                              </button>
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-10">
                                {!profile.isOwnProfile && (
                                  <button
                                    onClick={() => {
                                      setReportType('post');
                                      setReportTargetId(post.id);
                                      setShowReportModal(true);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Flag className="w-4 h-4" />
                                    Denunciar publicación
                                  </button>
                                )}
                                {canDeletePost(post) && (
                                  <button
                                    onClick={() => setShowDeleteConfirm({type: 'post', id: post.id})}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="Post image" className="rounded-xl w-full mb-4" />
                      )}
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        >
                          <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{post.likesCount}</span>
                        </button>
                        <button
                          onClick={() => handleShare(post.id)}
                          className="flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.sharesCount}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {!profile.isOwnProfile && profile.isFollowing && !reviews.find(r => r.reviewerId === currentUser?.profileId) && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full bg-pink-500 text-white py-3 rounded-xl font-medium hover:bg-pink-600 transition-colors"
                >
                  Dejar una reseña
                </button>
              )}

              {reviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">No hay reseñas aún</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center overflow-hidden">
                          {review.reviewerAvatar ? (
                            <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-semibold text-sm">{review.reviewerName[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{review.reviewerName}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-gray-500 text-sm">{formatTimeAgo(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {/* Opciones de eliminación */}
                      {canDeleteReview(review) && (
                        <button
                          onClick={() => setShowDeleteConfirm({type: 'review', id: review.id})}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Eliminar reseña"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 mt-3">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Información del perfil</h3>
              <div className="space-y-4">
                {profile.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile.instagram && (
                  <div className="flex items-center gap-3">
                    <Instagram className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{profile.instagram}</span>
                  </div>
                )}
                {profile.twitter && (
                  <div className="flex items-center gap-3">
                    <Twitter className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{profile.twitter}</span>
                  </div>
                )}
                {profile.linkedin && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{profile.linkedin}</span>
                  </div>
                )}
                {profile.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a href={`mailto:${profile.contactEmail}`} className="text-pink-600 hover:underline">
                      {profile.contactEmail}
                    </a>
                  </div>
                )}
                {!profile.website && !profile.instagram && !profile.twitter && !profile.linkedin && !profile.contactEmail && (
                  <p className="text-gray-500">No hay información adicional</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Deja tu reseña</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tu comentario</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Comparte tu experiencia con este usuario..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">{reviewComment.length}/500 caracteres</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Enviando...' : 'Enviar reseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Editar perfil</h3>
              <button onClick={() => setShowEditProfileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
                  <input
                    type="text"
                    value={editForm.region}
                    onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="text"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm({...editForm, instagram: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="@usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                <input
                  type="text"
                  value={editForm.twitter}
                  onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="@usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="text"
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                Denunciar {reportType === 'post' ? 'publicación' : reportType === 'review' ? 'reseña' : 'perfil'}
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Tu reporte será revisado por nuestro equipo de moderación. Gracias por ayudar a mantener una comunidad segura.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de la denuncia</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Selecciona un motivo</option>
                  <option value="spam">Contenido spam o publicidad</option>
                  <option value="inapropiado">Contenido inapropiado</option>
                  <option value="acoso">Acoso o intimidación</option>
                  <option value="informacion_falsa">Información falsa</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Enviar denuncia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                {showDeleteConfirm.type === 'post' 
                  ? '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.'
                  : '¿Estás seguro de que quieres eliminar esta reseña? Esta acción no se puede deshacer.'
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'post') {
                      handleDeletePost(showDeleteConfirm.id);
                    } else {
                      handleDeleteReview(showDeleteConfirm.id);
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
