import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newsletter: true,
    courseUpdates: true,
    socialUpdates: false
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

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
          <p className="text-neutral-600">Debes iniciar sesión para ver la configuración.</p>
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
            {/* Header */}
            <div className="px-6 py-8 border-b border-neutral-200">
              <h1 className="text-2xl font-bold text-neutral-900">Configuración</h1>
              <p className="text-neutral-600 mt-2">Personaliza tu experiencia en Ajayu</p>
            </div>

            <div className="p-6">
              {/* Notificaciones */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Notificaciones</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Notificaciones por email</p>
                      <p className="text-sm text-neutral-600">Recibe actualizaciones importantes por correo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00FFE2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#00FFE2] peer-checked:to-[#A848F0]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Notificaciones push</p>
                      <p className="text-sm text-neutral-600">Recibe notificaciones en tiempo real</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00FFE2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#00FFE2] peer-checked:to-[#A848F0]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Newsletter</p>
                      <p className="text-sm text-neutral-600">Recibe noticias y tips de diseño</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.newsletter}
                        onChange={(e) => handleSettingChange('newsletter', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00FFE2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#00FFE2] peer-checked:to-[#A848F0]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Módulos */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Módulos</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Actualizaciones de cursos</p>
                      <p className="text-sm text-neutral-600">Recibe notificaciones sobre nuevos cursos y contenido</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.courseUpdates}
                        onChange={(e) => handleSettingChange('courseUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00FFE2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#00FFE2] peer-checked:to-[#A848F0]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">Actualizaciones de red social</p>
                      <p className="text-sm text-neutral-600">Recibe notificaciones sobre actividades en la red social</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.socialUpdates}
                        onChange={(e) => handleSettingChange('socialUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00FFE2]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#00FFE2] peer-checked:to-[#A848F0]"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="primary"
                  className="bg-gradient-to-r from-[#00FFE2] to-[#A848F0] hover:from-[#00E6CC] hover:to-[#9339D9] text-white border-0"
                >
                  Guardar cambios
                </Button>
                <Button variant="outline">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
