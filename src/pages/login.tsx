import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Obtener el usuario desde localStorage para determinar el rol
        const token = localStorage.getItem('ajayu_token');
        const userData = JSON.parse(localStorage.getItem('ajayu_user') || '{}');
        
        // Determinar ruta de redirección según el rol
        let redirectPath = '/';
        
        if (userData.roles && userData.roles.length > 0) {
          const primaryRole = userData.roles[0].name;
          
          switch (primaryRole) {
            case 'instructor':
              redirectPath = '/instructor-dashboard';
              break;
            case 'administrador':
              redirectPath = '/admin-dashboard';
              break;
            case 'moderador':
              redirectPath = '/moderator-dashboard';
              break;
            default:
              redirectPath = '/dashboard'; // Estudiantes van al dashboard universal
          }
        }
        
        router.push(redirectPath);
      } else {
        setError('Credenciales inválidas. Verifica tu email y contraseña.');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <img 
              src="/images/Ajayulogo.png" 
              alt="AJAYU Logo" 
              className="mx-auto h-16 w-auto mb-6"
            />
            <h2 className="text-3xl font-bold text-neutral-900 mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-neutral-600">
              Accede a tu cuenta de Ajayu
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FFE2] focus:border-transparent transition-all duration-300"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FFE2] focus:border-transparent transition-all duration-300"
                  placeholder="Tu contraseña"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#00FFE2] focus:ring-[#00FFE2] border-neutral-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-[#00FFE2] hover:text-[#00E6CC] transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00FFE2] to-[#A848F0] hover:from-[#00E6CC] hover:to-[#9339D9] text-white border-0"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-neutral-600">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-[#A848F0] hover:text-[#9339D9] font-medium transition-colors">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-neutral-50 text-neutral-500">O continúa con</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => alert('Integración con Google pendiente')}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
