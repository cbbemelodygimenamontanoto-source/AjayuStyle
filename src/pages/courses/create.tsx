import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface CourseForm {
  title: string;
  description: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  imageUrl: string;
  category: string;
}

export default function CreateCourse() {
  const { user, loading, hasAnyRole } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    description: '',
    price: 0,
    level: 'beginner',
    estimatedHours: 10,
    imageUrl: '',
    category: 'Fundamentos'
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !hasAnyRole(['instructor', 'administrador'])) {
      router.push('/dashboard');
      return;
    }
  }, [user, loading]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (formData.price < 0) {
      newErrors.price = 'El precio no puede ser negativo';
    }

    if (formData.estimatedHours <= 0) {
      newErrors.estimatedHours = 'Las horas estimadas deben ser mayor a 0';
    }

    if (formData.title.length > 255) {
      newErrors.title = 'El título no puede exceder 255 caracteres';
    }

    if (formData.description.length > 2000) {
      newErrors.description = 'La descripción no puede exceder 2000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Obtener token de autenticación del localStorage
      const token = localStorage.getItem('ajayu_token');
      if (!token) {
        setErrors({ submit: 'Sesión no válida. Por favor, inicie sesión nuevamente.' });
        return;
      }

      // Llamar a la API route para crear el curso
      const response = await fetch('/api/courses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: formData.price,
          level: formData.level,
          estimatedHours: formData.estimatedHours,
          imageUrl: formData.imageUrl.trim() || undefined,
          category: formData.category
        })
      });

      const result = await response.json();

      if (result.success && result.course) {
        // Redirigir a la página de gestión de lecciones del curso recién creado
        router.push(`/courses/${result.course.id}/lessons`);
      } else {
        setErrors({ submit: result.message || 'Error al crear el curso. Por favor intenta de nuevo.' });
      }
    } catch (error) {
      console.error('Error creando curso:', error);
      setErrors({ submit: 'Error al crear el curso. Por favor intenta de nuevo.' });
    } finally {
      setSaving(false);
    }
  };

  const levels = [
    { value: 'beginner', label: 'Principiante', description: 'Para personas sin experiencia previa' },
    { value: 'intermediate', label: 'Intermedio', description: 'Para personas con conocimientos básicos' },
    { value: 'advanced', label: 'Avanzado', description: 'Para personas con experiencia avanzada' }
  ];

  const categories = [
    'Fundamentos',
    'Técnica',
    'Digital',
    'Negocios',
    'Sostenibilidad',
    'Historia',
    'Marketing',
    'Otros'
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-2 border-[#00FFE2] border-t-transparent mx-auto"></div>
            <p className="mt-4 text-neutral-600">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Crear Nuevo Curso - Ajayu</title>
      </Head>

      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#00FFE2]/10 to-[#A848F0]/10 py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="p-2 rounded-lg bg-white/80 hover:bg-white text-[#A848F0] transition-all duration-300 shadow-sm"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#00FFE2] to-[#A848F0] flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-3">
                  Crear <span className="bg-gradient-to-r from-[#00FFE2] to-[#A848F0] bg-clip-text text-transparent">Nuevo Curso</span>
                </h1>
                <p className="text-lg text-neutral-600 leading-relaxed">
                  Comparte tu conocimiento con el mundo. Crea un curso que inspire y transforme 
                  la vida de tus estudiantes en el fascinante mundo del diseño de moda.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-white/80 hover:bg-white text-neutral-700 font-medium rounded-lg transition-all duration-300 shadow-sm border border-neutral-200"
                >
                  Volver al Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-12">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00FFE2]/5 to-[#A848F0]/5 px-6 py-4 border-b border-neutral-200">
                  <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#00FFE2] to-[#A848F0] flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    Información del Curso
                  </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Título del curso */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-3">
                  Título del Curso *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A848F0] focus:border-[#A848F0] transition-all duration-300 ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-neutral-300 hover:border-neutral-400'
                  }`}
                  placeholder="Ej: Fundamentos del Diseño de Moda"
                  maxLength={255}
                />
                <div className="flex items-center justify-between mt-2">
                  {errors.title && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{errors.title}</p>
                    </div>
                  )}
                  <p className="text-sm text-neutral-500 ml-auto">
                    {formData.title.length}/255 caracteres
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-3">
                  Descripción del Curso *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A848F0] focus:border-[#A848F0] transition-all duration-300 resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-neutral-300 hover:border-neutral-400'
                  }`}
                  placeholder="Describe qué aprenderán los estudiantes en este curso. Sé específico sobre los objetivos y beneficios..."
                  maxLength={2000}
                />
                <div className="flex items-center justify-between mt-2">
                  {errors.description && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{errors.description}</p>
                    </div>
                  )}
                  <p className="text-sm text-neutral-500 ml-auto">
                    {formData.description.length}/2000 caracteres
                  </p>
                </div>
              </div>

              {/* Nivel y Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-neutral-700 mb-3">
                    Nivel de Dificultad *
                  </label>
                  <div className="relative">
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A848F0] focus:border-[#A848F0] transition-all duration-300 appearance-none bg-white"
                    >
                      {levels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm text-neutral-600">
                    <CheckCircle className="w-4 h-4 text-[#00FFE2]" />
                    <p>{levels.find(l => l.value === formData.level)?.description}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-3">
                    Categoría
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A848F0] focus:border-[#A848F0] transition-all duration-300 appearance-none bg-white"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precio y Duración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-3">
                    Precio
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-neutral-500 font-medium">$</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="1000"
                      className={`w-full pl-8 pr-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A848F0] focus:border-[#A848F0] transition-all duration-300 ${
                        errors.price ? 'border-red-300 bg-red-50' : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {errors.price && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm">{errors.price}</p>
                      </div>
                    )}
                    <p className="text-sm text-neutral-500 ml-auto">
                      {formData.price === 0 ? (
                        <span className="text-green-600 font-medium">Curso Gratuito</span>
                      ) : (
                        `$${formData.price.toLocaleString()} COP`
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="estimatedHours" className="block text-sm font-medium text-neutral-700 mb-3">
                    Duración Estimada (horas) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="estimatedHours"
                      name="estimatedHours"
                      value={formData.estimatedHours}
                      onChange={handleInputChange}
                      min="1"
                      max="1000"
                      className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A848F0] focus:border-[#A848F0] transition-all duration-300 ${
                        errors.estimatedHours ? 'border-red-300 bg-red-50' : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                      placeholder="10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-neutral-400 text-sm">h</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {errors.estimatedHours && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm">{errors.estimatedHours}</p>
                      </div>
                    )}
                    <p className="text-sm text-neutral-500 ml-auto">
                      Aproximadamente {Math.ceil(formData.estimatedHours / 2)} semanas
                    </p>
                  </div>
                </div>
              </div>

              {/* URL de imagen */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-neutral-700 mb-3">
                  URL de Imagen del Curso
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A848F0] focus:border-[#A848F0] transition-all duration-300"
                  placeholder="https://ejemplo.com/imagen-curso.jpg"
                />
                <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                  <CheckCircle className="w-4 h-4 text-[#00FFE2]" />
                  <p>Opcional. Si no proporcionas una imagen, se usará una por defecto.</p>
                </div>
              </div>

              {/* Error general */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 font-medium rounded-lg transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    saving
                      ? 'bg-neutral-400 cursor-not-allowed text-neutral-200'
                      : 'bg-gradient-to-r from-[#00FFE2] to-[#A848F0] hover:shadow-lg hover:scale-105 text-white'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Crear Curso
                    </>
                  )}
                </button>
              </div>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}