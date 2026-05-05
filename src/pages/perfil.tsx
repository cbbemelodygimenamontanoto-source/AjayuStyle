import React from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="animate-pulse">Cargando...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Acceso requerido</h1>
          <p className="text-neutral-600">Debes iniciar sesión para ver tu perfil.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Header del perfil */}
            <div className="bg-gradient-to-r from-[#00FFE2] to-[#A848F0] px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-white/80">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Contenido del perfil */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Información Personal</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Nombre completo
                      </label>
                      <p className="text-neutral-900">{user.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email
                      </label>
                      <p className="text-neutral-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Fecha de registro
                      </label>
                      <p className="text-neutral-900">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Configuración</h3>
                  <div className="space-y-4">
                    <button className="w-full text-left px-4 py-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors">
                      Editar perfil
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors">
                      Cambiar contraseña
                    </button>
                    <button className="w-full text-left px-4 py-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors">
                      Notificaciones
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
