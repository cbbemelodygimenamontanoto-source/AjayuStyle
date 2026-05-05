import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Home,
  Search,
  Bell,
  User,
  Menu,
  X,
  Heart,
  Share2,
  MessageCircle,
  MoreHorizontal,
  Image as ImageIcon,
  Send,
  Loader2,
  UserPlus,
  TrendingUp,
  Shield,
  AlertTriangle,
  Flag,
  Camera,
  Upload
} from 'lucide-react';

interface Post {
  id: number;
  author: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    country: string;
    region: string;
  };
  content: string;
  imageUrl: string | null;
  likesCount: number;
  sharesCount: number;
  isLiked: boolean;
  createdAt: string;
}

interface SuggestedUser {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  followersCount: number;
}

interface CurrentUser {
  id: number;
  role: string;
  name: string;
  profile_id?: number;
}

interface SocialProfile {
  id: number;
  user_id: number;
  username: string;
  avatar: string | null;
  country: string;
  region: string;
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [socialProfile, setSocialProfile] = useState<SocialProfile | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [postingError, setPostingError] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      // Verificar autenticacion
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/comunidad');
        return;
      }

      try {
        const user = JSON.parse(userData);
        setCurrentUser({ 
          id: user.id, 
          role: user.role || 'normal', 
          name: user.name || 'Usuario' 
        });

        // Obtener perfil social del usuario
        try {
          const profileRes = await fetch(`/api/comunidad/profiles?user_id=${user.id}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.profile) {
              setSocialProfile(profileData.profile);
            }
          }
        } catch (error) {
          console.log('Perfil social no encontrado');
        }

        // Cargar posts desde API
        try {
          const postsRes = await fetch(`/api/comunidad/posts?profile_id=${socialProfile?.id || user.id}&limit=20`);
          if (postsRes.ok) {
            const postsData = await postsRes.json();
            if (postsData.posts && postsData.posts.length > 0) {
              // Transformar datos de la API al formato del componente
              const transformedPosts = postsData.posts.map((p: any) => ({
                id: p.post_id,
                author: {
                  id: p.author_user_id,
                  name: p.author_name,
                  username: p.author_username,
                  avatar: p.author_avatar,
                  country: p.country || '',
                  region: p.region || ''
                },
                content: p.content,
                imageUrl: p.image_url,
                likesCount: p.likes_count,
                sharesCount: p.shares_count,
                isLiked: Boolean(p.is_liked),
                createdAt: p.created_at
              }));
              setPosts(transformedPosts);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.log('Error cargando posts desde API');
        }

        // Si no hay posts de la API, usar mock data
        setPosts(getMockPosts());
      } catch (e) {
        console.error('Error cargando datos:', e);
        setPosts(getMockPosts());
      }

      // Cargar sugerencias (mock)
      setSuggestedUsers(getMockSuggestions());
      setLoading(false);
    };

    loadData();
  }, [router]);

  // Mock data para desarrollo
  const getMockPosts = (): Post[] => [
    {
      id: 1,
      author: {
        id: 2,
        name: 'Carlos Perez',
        username: 'carlos_instructor',
        avatar: null,
        country: 'Mexico',
        region: 'CDMX'
      },
      content: '刚发布了一门新课程："Patronaje Avanzado"，欢迎大家来学习！ #modadedujacion #patronaje',
      imageUrl: null,
      likesCount: 24,
      sharesCount: 5,
      isLiked: false,
      createdAt: '2026-05-04T10:30:00Z'
    },
    {
      id: 2,
      author: {
        id: 3,
        name: 'Sofia Ramirez',
        username: 'sofia_social',
        avatar: null,
        country: 'Colombia',
        region: 'Bogota'
      },
      content: '刚完成了《Fundamentos del Diseño de Moda》课程，收获满满！老师的讲解非常清晰，推荐给大家。',
      imageUrl: null,
      likesCount: 18,
      sharesCount: 3,
      isLiked: true,
      createdAt: '2026-05-04T08:15:00Z'
    },
    {
      id: 3,
      author: {
        id: 4,
        name: 'Ana Garcia',
        username: 'ana_normal',
        avatar: null,
        country: 'Argentina',
        region: 'Buenos Aires'
      },
      content: '刚加入Ajayu社区，希望能认识更多志同道合的朋友！有没有人也在学习JavaScript？',
      imageUrl: null,
      likesCount: 12,
      sharesCount: 2,
      isLiked: false,
      createdAt: '2026-05-04T06:00:00Z'
    }
  ];

  const getMockSuggestions = (): SuggestedUser[] => [
    { id: 5, name: 'Laura Martinez', username: 'laura_mod', avatar: null, followersCount: 156 },
    { id: 6, name: 'Miguel Torres', username: 'miguel_admin', avatar: null, followersCount: 289 }
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setPostingError('Solo se permiten imágenes en formato JPG, PNG, GIF o WebP');
      return;
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setPostingError('La imagen no puede ser mayor a 5MB');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setPostingError('');
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const res = await fetch('/api/comunidad/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedImageUrl(data.url);
        return data.url;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
    return null;
  };

  const handleLike = async (postId: number) => {
    if (!currentUser?.profile_id) {
      //掉线了,还是更新UI本地
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
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await fetch('/api/comunidad/likes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId, profile_id: currentUser.profile_id })
        });
      } else {
        await fetch('/api/comunidad/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId, profile_id: currentUser.profile_id })
        });
      }
    } catch (error) {
      console.error('Error en like API:', error);
    }

    // Actualizar UI siempre
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!newPost.trim() && !selectedImage) {
      setPostingError('Por favor escribe algo o selecciona una imagen');
      return;
    }

    if (newPost.length > 0 && newPost.length < 3) {
      setPostingError('La publicación debe tener al menos 3 caracteres');
      return;
    }

    if (newPost.length > 500) {
      setPostingError('La publicación no puede exceder 500 caracteres');
      return;
    }

    setPostingError('');
    setPosting(true);
    
    try {
      // Subir imagen si existe
      let imageUrl = uploadedImageUrl;
      if (selectedImage && !uploadedImageUrl) {
        imageUrl = await handleUploadImage();
      }

      // Crear post via API
      const profileId = socialProfile?.id || currentUser?.id || 1;
      const res = await fetch('/api/comunidad/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          content: newPost.trim(),
          image_url: imageUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Agregar el nuevo post al inicio
        const newPostObj: Post = {
          id: data.post.id,
          author: {
            id: currentUser!.id,
            name: currentUser!.name,
            username: socialProfile?.username || currentUser!.name.toLowerCase().replace(' ', '_'),
            avatar: socialProfile?.avatar || null,
            country: socialProfile?.country || '',
            region: socialProfile?.region || ''
          },
          content: newPost.trim(),
          imageUrl: imageUrl,
          likesCount: 0,
          sharesCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString()
        };
        setPosts([newPostObj, ...posts]);
      } else {
        // Si falla la API, agregar mock post (fallback)
        const mockPost: Post = {
          id: Date.now(),
          author: {
            id: currentUser!.id,
            name: currentUser!.name,
            username: socialProfile?.username || 'usuario',
            avatar: socialProfile?.avatar || null,
            country: socialProfile?.country || '',
            region: socialProfile?.region || ''
          },
          content: newPost.trim(),
          imageUrl: imageUrl,
          likesCount: 0,
          sharesCount: 0,
          isLiked: false,
          createdAt: new Date().toISOString()
        };
        setPosts([mockPost, ...posts]);
      }
    } catch (error) {
      console.error('Error creando post:', error);
      //掉线了,添加mock post
      const mockPost: Post = {
        id: Date.now(),
        author: {
          id: currentUser!.id,
          name: currentUser!.name,
          username: socialProfile?.username || 'usuario',
          avatar: socialProfile?.avatar || null,
          country: socialProfile?.country || '',
          region: socialProfile?.region || ''
        },
        content: newPost.trim(),
        imageUrl: uploadedImageUrl,
        likesCount: 0,
        sharesCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString()
      };
      setPosts([mockPost, ...posts]);
    }

    // Limpiar formulario
    setNewPost('');
    setSelectedImage(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPosting(false);
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Por favor selecciona un motivo de denuncia');
      return;
    }

    if (!currentUser?.profile_id) {
      alert('Debes tener un perfil social para denunciar');
      return;
    }

    try {
      await fetch('/api/comunidad/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_profile_id: currentUser.profile_id,
          report_type: 'post',
          target_id: reportPostId,
          reason: reportReason,
          description: ''
        })
      });
    } catch (error) {
      console.error('Error enviando reporte:', error);
    }

    alert('Denuncia enviada. Gracias por tu reporte.');
    setShowReportModal(false);
    setReportReason('');
    setReportPostId(null);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace un momento';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${Math.floor(diffHours / 24)}d`;
  };

  const isAdminOrModerator = currentUser?.role === 'administrador' || currentUser?.role === 'moderador';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Feed - Comunidad Ajayu</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/comunidad/feed" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="hidden sm:block text-xl font-bold text-gray-900">Comunidad</span>
              </Link>

              {/* Search Bar - Desktop */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar personas o posts..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isAdminOrModerator && (
                  <Link 
                    href="/comunidad/moderacion"
                    className="p-2 hover:bg-pink-50 rounded-full transition-colors text-pink-600"
                    title="Panel de Moderacion"
                  >
                    <Shield className="w-6 h-6" />
                  </Link>
                )}
                <Link href="/comunidad/notificaciones" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Link>
                <Link 
                  href={`/comunidad/perfil/${currentUser?.id || 1}`}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <User className="w-6 h-6 text-gray-600" />
                </Link>
                <button 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-4 py-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:border-pink-500 outline-none"
                  />
                </div>
                <Link href="/comunidad/feed" className="flex items-center gap-3 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Home className="w-5 h-5" />
                  Inicio
                </Link>
                <Link href="/comunidad/notificaciones" className="flex items-center gap-3 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-5 h-5" />
                  Notificaciones
                </Link>
                <Link href={`/comunidad/perfil/${currentUser?.id || 1}`} className="flex items-center gap-3 px-2 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <User className="w-5 h-5" />
                  Mi Perfil
                </Link>
                {isAdminOrModerator && (
                  <Link href="/comunidad/moderacion" className="flex items-center gap-3 px-2 py-2 text-pink-700 hover:bg-pink-50 rounded-lg">
                    <Shield className="w-5 h-5" />
                    Panel de Moderacion
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Feed Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <form onSubmit={handleCreatePost}>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {currentUser?.name?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newPost}
                        onChange={(e) => {
                          setNewPost(e.target.value);
                          if (postingError) setPostingError('');
                        }}
                        placeholder="¿Qué está pensando la comunidad?"
                        className="w-full resize-none border-none outline-none text-gray-900 placeholder-gray-500"
                        rows={3}
                      />
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative mt-3 mb-3">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-64 rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 p-1 bg-gray-800/70 text-white rounded-full hover:bg-gray-900"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {/* Error message */}
                      {postingError && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {postingError}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors disabled:opacity-50"
                          >
                            {uploadingImage ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Camera className="w-5 h-5" />
                            )}
                            <span className="text-sm">Imagen</span>
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={posting || (!newPost.trim() && !selectedImage)}
                          className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-full font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {posting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Publicando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Publicar
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{newPost.length}/500 caracteres</p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Posts Feed */}
              {posts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tu feed está vacío</h3>
                  <p className="text-gray-500">Sigue a personas para ver sus publicaciones aquí</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <article key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Post Header */}
                      <div className="p-4 pb-0">
                        <div className="flex items-center justify-between">
                          <Link href={`/comunidad/perfil/${post.author.id}`} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                              {post.author.avatar ? (
                                <img src={post.author.avatar} alt={post.author.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span className="text-white font-semibold text-sm">{post.author.name[0]}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 hover:underline">{post.author.name}</span>
                                <span className="text-gray-500 text-sm">@{post.author.username}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500 text-sm">
                                {post.author.country && <span>{post.author.country}</span>}
                                {post.author.region && <span>· {post.author.region}</span>}
                                <span>· {formatTimeAgo(post.createdAt)}</span>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Menu de opciones del post */}
                          <div className="relative group">
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                              <MoreHorizontal className="w-5 h-5 text-gray-400" />
                            </button>
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-10">
                              <button
                                onClick={() => {
                                  setReportPostId(post.id);
                                  setShowReportModal(true);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Flag className="w-4 h-4" />
                                Denunciar publicación
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-4">
                        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                        {post.imageUrl && (
                          <div className="mt-4">
                            <img src={post.imageUrl} alt="Post image" className="rounded-xl w-full" />
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6">
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
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar - Right */}
            <div className="hidden lg:block space-y-6">
              {/* Suggestions */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  Personas que podrían gustarte
                </h3>
                <div className="space-y-4">
                  {suggestedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Link href={`/comunidad/perfil/${user.id}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{user.name[0]}</span>
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/comunidad/perfil/${user.id}`} className="font-medium text-gray-900 hover:underline block truncate">
                          {user.name}
                        </Link>
                        <span className="text-gray-500 text-sm">@{user.username}</span>
                      </div>
                      <button className="flex items-center gap-1 text-sm text-pink-600 hover:bg-pink-50 px-3 py-1.5 rounded-full transition-colors">
                        <UserPlus className="w-4 h-4" />
                        Seguir
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Enlaces rápidos</h3>
                <div className="space-y-2">
                  <Link href="/comunidad/buscar" className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors">
                    <Search className="w-4 h-4" />
                    Buscar personas
                  </Link>
                  <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors">
                    <Home className="w-4 h-4" />
                    Volver a cursos
                  </Link>
                </div>
              </div>

              {/* Admin/Moderator Quick Access */}
              {isAdminOrModerator && (
                <div className="bg-pink-50 rounded-xl border border-pink-200 p-4">
                  <h3 className="font-semibold text-pink-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Panel de Moderación
                  </h3>
                  <p className="text-sm text-pink-700 mb-3">Tienes acceso al panel de moderación</p>
                  <Link 
                    href="/comunidad/moderacion"
                    className="block w-full text-center bg-pink-500 text-white py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors"
                  >
                    Gestionar Reportes
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                Denunciar publicación
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
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
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
    </>
  );
}