import React from 'react';
import { useSession, signIn } from 'next-auth/react';
import Layout from '@/components/layout/Layout';
import ModuleCard from '@/components/ui/ModuleCard';
import { BookOpen, Brain, Users, Palette, ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { ModuleCard as ModuleCardType } from '@/types';
import { cn } from '@/lib/utils';

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
  const { data: session, status } = useSession();
  const router = useRouter();

  // Mostrar loading mientras carga la sesión
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-accent-gold/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-accent-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Landing page para usuarios no autenticados
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-900 to-neutral-900 flex items-center justify-center p-4">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-4xl relative z-10">
          {/* Hero section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src="/images/Ajayulogo.png" 
                alt="AJAYU Logo" 
                className="mx-auto h-24 w-auto mb-8"
              />
              <h1 className="text-6xl font-bold text-white mb-6">
                Bienvenido a <span className="text-accent-gold">AJAYU</span>
              </h1>
              <p className="text-xl text-primary-200 mb-8 max-w-3xl mx-auto">
                Tu plataforma integral para el aprendizaje de diseño de moda. 
                Explora cursos, utiliza inteligencia artificial y crea avatares personalizados.
              </p>
            </motion.div>
          </div>

          {/* Features preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          >
            {modules.slice(0, 4).map((module, index) => (
              <div
                key={module.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6"
              >
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', module.color)}>
                  {module.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{module.title}</h3>
                <p className="text-primary-200 text-sm">{module.description}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-accent-gold mr-2" />
                <h2 className="text-2xl font-bold text-white">Comienza tu Journey</h2>
              </div>
              <p className="text-primary-200 mb-6">
                Únete a miles de estudiantes que ya están transformando su carrera en diseño
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => signIn()}
                  className="bg-accent-gold hover:bg-accent-gold/90 text-primary-900 font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="/register"
                  className="border border-white/20 text-white hover:bg-white/10 font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  Crear Cuenta
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Dashboard para usuarios autenticados
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-gold/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img 
              src="/images/Ajayulogo.png" 
              alt="AJAYU Logo" 
              className="mx-auto h-24 w-auto mb-8"
            />
            <h1 className="text-5xl font-bold text-primary-900 mb-6">
              ¡Hola, <span className="text-accent-gold">{session.user?.name}</span>!
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Bienvenido de vuelta a tu plataforma de aprendizaje de diseño de moda. 
              Continúa tu educación y explora nuevas herramientas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/cursos')}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                Ir a Cursos
              </Button>
              <Button
                onClick={() => router.push('/ia')}
                variant="outline"
                className="border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-white"
              >
                Usar IA
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
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