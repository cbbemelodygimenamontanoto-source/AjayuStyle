import React from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Palette, User, Star, Heart } from 'lucide-react';

export default function Avatares() {
  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#00FFE2]/10 to-[#A848F0]/10 py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Crea <span className="bg-gradient-to-r from-[#00FFE2] to-[#A848F0] bg-clip-text text-transparent">Avatares</span> Únicos
              </h1>
              <p className="text-xl text-neutral-600 mb-8">
                Diseña avatares personalizados para mostrar tus creaciones de moda. 
                Personalización completa con características modulares.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Características */}
        <section className="py-12">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <User className="w-8 h-8" />,
                  title: 'Avatares Prediseñados',
                  description: 'Elige entre una amplia variedad de avatares base'
                },
                {
                  icon: <Palette className="w-8 h-8" />,
                  title: 'Personalización Total',
                  description: 'Modifica características, ropa y accesorios'
                },
                {
                  icon: <Star className="w-8 h-8" />,
                  title: 'Galería de Favoritos',
                  description: 'Guarda y organiza tus avatares favoritos'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 text-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Avatares de ejemplo */}
        <section className="py-12">
          <div className="container">
            <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">
              Galería de Avatares
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((avatar) => (
                <motion.div
                  key={avatar}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: (avatar % 6) * 0.1 }}
                  className="aspect-square bg-gradient-to-br from-[#00FFE2]/20 to-[#A848F0]/20 rounded-xl flex items-center justify-center cursor-pointer hover:shadow-md transition-all duration-300 group"
                >
                  <User className="w-8 h-8 text-[#A848F0] group-hover:scale-110 transition-transform" />
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button className="bg-gradient-to-r from-[#00FFE2] to-[#A848F0] hover:from-[#00E6CC] hover:to-[#9339D9] text-white px-8 py-3 rounded-lg font-medium transition-all duration-300">
                Crear Nuevo Avatar
              </button>
            </div>
          </div>
        </section>

        {/* Próximamente */}
        <section className="py-16">
          <div className="container text-center">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 max-w-2xl mx-auto">
              <Palette className="w-16 h-16 text-[#A848F0] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Editor en Desarrollo
              </h2>
              <p className="text-neutral-600 mb-6">
                Estamos creando el editor de avatares más avanzado para diseñadores de moda. 
                ¡Pronto podrás crear avatares únicos para tus diseños!
              </p>
              <button className="text-[#00FFE2] hover:text-[#A848F0] font-medium transition-colors">
                Notificarme cuando esté listo →
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
