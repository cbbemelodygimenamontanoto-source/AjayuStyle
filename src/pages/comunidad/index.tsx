import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Users, 
  Heart, 
  Share2, 
  Star, 
  MessageCircle,
  Shield,
  Zap,
  Award
} from 'lucide-react';

// Componente principal de la landing de comunidad
export default function ComunidadLanding() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si el usuario ya tiene cuenta de comunidad
  useEffect(() => {
    const token = localStorage.getItem('ajayu_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        if (user.social_activated) {
          router.push('/comunidad/feed');
        }
      } catch (e) {
        console.error('Error parsing user data');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simular login - en produccion esto ira a la API
      const response = await fetch('/api/comunidad/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ajayu_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/comunidad/feed');
      } else {
        const data = await response.json();
        setError(data.message || 'Error al iniciar sesion');
      }
    } catch (err) {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = () => {
    // Simular login con cuenta existente de cursos
    const mockUser = {
      id: 1,
      name: 'Usuario Existente',
      email: email,
      role: 'normal',
      social_activated: true,
      avatar: null
    };
    localStorage.setItem('ajayu_token', 'mock-token-social');
    localStorage.setItem('user', JSON.stringify(mockUser));
    router.push('/comunidad/feed');
  };

  return (
    <>
      <Head>
        <title>Comunidad Ajayu - Conecta, Aprende y Crece</title>
        <meta name="description" content="Unete a la comunidad Ajayu y conecta con otros estudiantes" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-lg bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-white text-xl font-bold">Ajayu</span>
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <a href="/" className="text-gray-300 hover:text-white transition-colors">Inicio</a>
                <a href="/cursos" className="text-gray-300 hover:text-white transition-colors">Cursos</a>
                <a href="/comunidad" className="text-white font-medium">Comunidad</a>
              </nav>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/login')}
                  className="text-gray-300 hover:text-white transition-colors px-4 py-2"
                >
                  Iniciar Sesion
                </button>
                <button 
                  onClick={() => router.push('/register')}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5 bg-grid-16" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Tu comunidad de
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> aprendizaje </span>
              y crecimiento
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Conecta con estudiantes, comparte conocimiento y construye tu presencia digital en una comunidad libre de odio y enfocada en el desarrollo personal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setShowRegister(true)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-violet-500/25"
              >
                Unete a la comunidad
              </button>
              <button 
                onClick={() => router.push('/comunidad/feed')}
                className="border-2 border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Explorar como invitado
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Por que unirte a la comunidad?
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<Users className="w-8 h-8" />}
                title="Conexiones significativas"
                description="Encuentra personas con intereses similares y construye relaciones que te impulsen hacia adelante."
              />
              <FeatureCard 
                icon={<Heart className="w-8 h-8" />}
                title="Ambiente positivo"
                description="Solo likes y compartir. Sin comentarios negativos para mantener la comunidad libre de odio."
              />
              <FeatureCard 
                icon={<Star className="w-8 h-8" />}
                title="Reseñas de perfil"
                description="Evalua a tus companeros con calificaciones de 1 a 5 estrellas y ayuda a otros a encontrar grandes colaboradores."
              />
              <FeatureCard 
                icon={<Zap className="w-8 h-8" />}
                title="Contenido de valor"
                description="Accede a publicaciones inspiradoras y conocimientos compartidos por la comunidad."
              />
            </div>
          </div>
        </section>

        {/* Login/Register Section */}
        <section className="py-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
              {!showRegister ? (
                <>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Inicia sesion en la comunidad
                  </h3>
                  
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Correo electronico
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="tu@correo.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contrasena
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="Tu contrasena"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? 'Iniciando sesion...' : 'Entrar'}
                    </button>
                  </form>
                  
                  <div className="mt-6 text-center">
                    <p className="text-gray-400 mb-2">Ya tienes cuenta en Ajayu Cursos?</p>
                    <button
                      onClick={handleSocialLogin}
                      className="text-violet-400 hover:text-violet-300 font-medium"
                    >
                      Activa tu cuenta de comunidad
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Crea tu perfil de comunidad
                  </h3>
                  
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre de usuario
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="@tu_usuario"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Correo electronico
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="tu@correo.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Pais
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecciona tu pais</option>
                        <option value="MX">Mexico</option>
                        <option value="CO">Colombia</option>
                        <option value="AR">Argentina</option>
                        <option value="CL">Chile</option>
                        <option value="PE">Peru</option>
                        <option value="ES">Espana</option>
                        <option value="US">Estados Unidos</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contrasena
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="Nueva contrasena"
                        required
                      />
                    </div>
                    
                    <button
                      type="button"
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                      Crear mi perfil
                    </button>
                  </form>
                  
                  <button
                    onClick={() => setShowRegister(false)}
                    className="mt-4 w-full text-gray-400 hover:text-white text-center"
                  >
                    Ya tienes cuenta? Inicia sesion
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              Ajayu Education Platform - Construyendo comunidades positivas
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

// Componente FeatureCard para las caracteristicas
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-violet-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
