import React from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Users, Heart, MessageCircle, Share2, Camera } from 'lucide-react';

export default function Social() {
  const samplePosts = [
    {
      id: 1,
      author: 'Ana García',
      avatar: 'AG',
      content: 'Acabo de terminar mi primer diseño usando las herramientas de IA. ¡Estoy emocionada!',
      image: null,
      likes: 24,
      comments: 8,
      timeAgo: '2h'
    },
    {
      id: 2,
      author: 'Carlos López',
      avatar: 'CL',
      content: 'Nuevo curso de patronaje básico disponible. ¿Alguien se apunta?',
      image: null,
      likes: 15,
      comments: 12,
      timeAgo: '5h'
    },
    {
      id: 3,
      author: 'María Rodríguez',
      avatar: 'MR',
      content: 'Compartiendo mi diseño de vestido inspirado en los años 50.',
      image: null,
      likes: 42,
      comments: 18,
      timeAgo: '1d'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#FF69B4]/10 to-[#C33B80]/10 py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
                Red Social de <span className="bg-gradient-to-r from-[#FF69B4] to-[#C33B80] bg-clip-text text-transparent">Diseñadores</span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8">
                Conecta con otros diseñadores, comparte tus creaciones y encuentra inspiración. 
                Construye tu red profesional en el mundo de la moda.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Compartir publicación */}
        <section className="py-8 border-b border-neutral-200">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FF69B4] to-[#C33B80] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">TU</span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="Comparte tu última creación o inspirate..."
                      className="w-full p-3 border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        <button className="p-2 text-neutral-500 hover:text-[#FF69B4] transition-colors">
                          <Camera className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-neutral-500 hover:text-[#C33B80] transition-colors">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                      <button className="bg-gradient-to-r from-[#FF69B4] to-[#C33B80] hover:from-[#FF69B4] hover:to-[#89004F] text-white px-6 py-2 rounded-lg transition-all duration-300">
                        Publicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feed de publicaciones */}
        <section className="py-8">
          <div className="container">
            <div className="max-w-2xl mx-auto space-y-6">
              {samplePosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
                >
                  {/* Header del post */}
                  <div className="p-4 border-b border-neutral-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FF69B4] to-[#C33B80] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{post.avatar}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{post.author}</h3>
                        <p className="text-sm text-neutral-500">hace {post.timeAgo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contenido del post */}
                  <div className="p-4">
                    <p className="text-neutral-800 mb-4">{post.content}</p>
                    
                    {post.image && (
                      <div className="aspect-video bg-neutral-100 rounded-lg mb-4 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-neutral-400" />
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-6">
                        <button className="flex items-center space-x-2 text-neutral-500 hover:text-red-500 transition-colors">
                          <Heart className="w-5 h-5" />
                          <span className="text-sm">{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-neutral-500 hover:text-[#FF69B4] transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.comments}</span>
                        </button>
                      </div>
                      <button className="text-neutral-500 hover:text-[#C33B80] transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Modalidad */}
        <section className="py-16">
          <div className="container text-center">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 max-w-2xl mx-auto">
              <Users className="w-16 h-16 text-[#C33B80] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Módulo Opcional
              </h2>
              <p className="text-neutral-600 mb-6">
                La red social es completamente opcional. Puedes usar todos los demás módulos 
                sin necesidad de registrarte en la red social.
              </p>
              <button className="text-[#FF69B4] hover:text-[#C33B80] font-medium transition-colors">
                Explorar otros módulos →
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
