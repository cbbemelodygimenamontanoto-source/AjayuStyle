import React from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Brain, Zap, Palette, Scissors } from 'lucide-react';

export default function IA() {
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
                Inteligencia Artificial para <span className="bg-gradient-to-r from-[#00FFE2] to-[#A848F0] bg-clip-text text-transparent">Diseño de Moda</span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8">
                Potencia tu creatividad con herramientas de IA avanzadas para patronaje, análisis de telas y diseño asistido.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Herramientas de IA */}
        <section className="py-12">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Scissors className="w-8 h-8" />,
                  title: 'Generador de Patrones',
                  description: 'Crea patrones únicos automáticamente con IA'
                },
                {
                  icon: <Palette className="w-8 h-8" />,
                  title: 'Análisis de Telas',
                  description: 'Identifica propiedades y comportamiento de materiales'
                },
                {
                  icon: <Brain className="w-8 h-8" />,
                  title: 'Asistente de Diseño',
                  description: 'Recibe sugerencias inteligentes para tus creaciones'
                },
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: 'Cálculo de Tallas',
                  description: 'Obtén medidas precisas automáticamente'
                }
              ].map((tool, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] rounded-lg flex items-center justify-center text-white mb-4">
                    {tool.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    {tool.description}
                  </p>
                  <button className="text-[#00FFE2] hover:text-[#A848F0] font-medium transition-colors">
                    Probar ahora →
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Próximamente */}
        <section className="py-16">
          <div className="container text-center">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 max-w-2xl mx-auto">
              <Brain className="w-16 h-16 text-[#A848F0] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Módulo en Desarrollo
              </h2>
              <p className="text-neutral-600">
                Estamos trabajando en las herramientas de IA más avanzadas para diseño de moda. 
                ¡Pronto estará disponible!
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
