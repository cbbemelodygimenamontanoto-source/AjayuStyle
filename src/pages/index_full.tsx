import React from 'react';
import Layout from '@/components/layout/Layout';
import ModuleCard from '@/components/ui/ModuleCard';
import { BookOpen, Brain, Users, Palette } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ModuleCard as ModuleCardType } from '@/types';

const modules: ModuleCardType[] = [
  {
    id: 'cursos',
    title: 'Cursos Interactivos',
    description: 'Aprende diseño de moda con nuestro sistema tipo Moodle. Cursos secuenciales, tareas, progreso y certificados.',
    icon: <BookOpen className="w-8 h-8" />,
    href: '/cursos',
    color: 'bg-blue-100 text-blue-600',
    features: [
      'Lecciones secuenciales obligatorias',
      'Videos, documentos y tareas',
      'Seguimiento de progreso',
      'Certificados digitales',
      'Perfiles de instructores'
    ],
    isOptional: false,
  },
  {
    id: 'ia',
    title: 'Inteligencia Artificial',
    description: 'Asistencia de diseño con IA: patronaje, cálculo de tallas, análisis de telas y recomendaciones personalizadas.',
    icon: <Brain className="w-8 h-8" />,
    href: '/ia',
    color: 'bg-purple-100 text-purple-600',
    features: [
      'Generación de patrones',
      'Cálculo automático de tallas',
      'Asistencia en diseño',
      'Análisis de telas',
      'Historial de diseños'
    ],
    isOptional: false,
  },
  {
    id: 'avatares',
    title: 'Avatares Personalizados',
    description: 'Crea y personaliza avatares para tus diseños. Opciones predefinidas y completamente personalizables.',
    icon: <Palette className="w-8 h-8" />,
    href: '/avatares',
    color: 'bg-pink-100 text-pink-600',
    features: [
      'Avatares prediseñados',
      'Personalización completa',
      'Características modulares',
      'Galería de avatares',
      'Sistema de favoritos'
    ],
    isOptional: false,
  },
  {
    id: 'social',
    title: 'Red Social',
    description: 'Conecta con otros diseñadores, comparte tus creaciones y encuentra inspiración. Verificación con Google.',
    icon: <Users className="w-8 h-8" />,
    href: '/social',
    color: 'bg-green-100 text-green-600',
    features: [
      'Perfiles profesionales',
      'Compartir diseños',
      'Sistema de follows',
      'Mensajería directa',
      'Verificación Google'
    ],
    isOptional: true,
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-neutral-100 section-spacing overflow-hidden">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-neutral-900 mb-6 leading-tight">
              Diseña el{' '}
              <span className="text-gradient">Futuro</span>{' '}
              de la Moda
            </h1>
            
            <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed mb-8 max-w-3xl mx-auto">
              Combina tu creatividad con inteligencia artificial. 
              Aprende, crea y conecta en una plataforma integral 
              diseñada para diseñadores de moda del futuro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="gold"
                size="lg"
                onClick={() => router.push('/auth/register')}
                className="min-w-[200px]"
              >
                Regístrate Gratis
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explorar Funciones
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-100 rounded-full opacity-60"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-accent-gold/20 rounded-full opacity-60"></div>
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-primary-500/10 rounded-full opacity-60"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-spacing bg-neutral-0">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-neutral-900 mb-6">
              Módulos Integrados
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Cuatro módulos diseñados para trabajar juntos o de forma independiente, 
              adaptándose a tus necesidades específicas como diseñador.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                onClick={() => router.push(module.href)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="section-spacing bg-neutral-100">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-neutral-900 mb-6">
              Arquitectura Modular
            </h2>
            <p className="text-xl text-neutral-600 leading-relaxed mb-8">
              Nuestra plataforma utiliza una arquitectura flexible que permite 
              usar los módulos de forma independiente. La red social es completamente opcional.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {modules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3',
                    module.color
                  )}>
                    {module.icon}
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {module.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {module.isOptional ? 'Opcional' : 'Obligatorio'}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-primary-900 text-neutral-0">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
              Comienza Tu Viaje de Diseño
            </h2>
            <p className="text-xl text-primary-100 leading-relaxed mb-8">
              Únete a miles de diseñadores que ya están creando el futuro 
              de la moda con nuestras herramientas integradas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="gold"
                size="lg"
                onClick={() => router.push('/auth/register')}
                className="min-w-[200px]"
              >
                Crear Cuenta Gratis
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-neutral-0 text-neutral-0 hover:bg-neutral-0 hover:text-primary-900"
                onClick={() => router.push('/auth/login')}
              >
                Ya tengo cuenta
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;