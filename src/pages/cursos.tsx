import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/lib/courses_sqlite';
import { BookOpen, Play, Clock, Users, Star, Award } from 'lucide-react';

export default function Cursos() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('todos');
  const [enrollingCourse, setEnrollingCourse] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
  
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: number) => {
    if (!user) {
      alert('Debes iniciar sesión para inscribirte a un curso');
      return;
    }

    setEnrollingCourse(courseId);
    try {
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('¡Te has inscrito exitosamente al curso!');
        fetchCourses(); // Refresh courses to update enrollment status
      } else {
        alert(data.message || 'Error al inscribirse al curso');
      }
    } catch (error) {
  
      alert('Error al inscribirse al curso');
    } finally {
      setEnrollingCourse(null);
    }
  };

  const filteredCourses = courses.filter(course => 
    selectedLevel === 'todos' || 
    course.level?.toLowerCase() === selectedLevel.toLowerCase() ||
    course.level === selectedLevel
  );

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'principiante': return 'from-green-400 to-green-600';
      case 'intermedio': return 'from-yellow-400 to-orange-500';
      case 'avanzado': return 'from-red-500 to-red-700';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getLevelText = (level: string) => {
    switch (level.toLowerCase()) {
      case 'principiante': return 'Principiante';
      case 'intermedio': return 'Intermedio';
      case 'avanzado': return 'Avanzado';
      default: return level;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#00FFE2]/10 to-[#A848F0]/10 py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
                Cursos de <span className="bg-gradient-to-r from-[#00FFE2] to-[#A848F0] bg-clip-text text-transparent">Diseño de Moda</span>
              </h1>
              <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                Descubre nuestra colección de cursos diseñados para llevarte desde los fundamentos 
                hasta convertirte en un profesional del diseño de moda. Aprende con contenido de alta calidad, 
                proyectos prácticos y seguimiento personalizado.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 border-b border-neutral-200 bg-white">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'todos', label: 'Todos los Niveles' },
                  { key: 'principiante', label: 'Principiante' },
                  { key: 'intermedio', label: 'Intermedio' },
                  { key: 'avanzado', label: 'Avanzado' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedLevel(filter.key)}
                    className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                      selectedLevel === filter.key
                        ? 'bg-gradient-to-r from-[#00FFE2] to-[#A848F0] text-white shadow-lg'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              <div className="text-sm text-neutral-500">
                {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} disponible{filteredCourses.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="py-12">
          <div className="container">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#00FFE2] border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Course Thumbnail */}
                    <div className="relative h-48 bg-gradient-to-br from-[#00FFE2]/20 to-[#A848F0]/20">
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="w-16 h-16 text-[#A848F0]" />
                        </div>
                      )}
                      
                      {/* Level Badge */}
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getLevelColor(course.level)} text-white shadow-lg`}>
                        {getLevelText(course.level)}
                      </div>

                      {/* Price Badge */}
                      <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm font-bold ${
                        course.price === 0 || course.price === null || course.price === undefined
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          : 'bg-black/80 text-white'
                      }`}>
                        {course.price === 0 || course.price === null || course.price === undefined
                          ? 'GRATIS'
                          : `$${course.price}`
                        }
                      </div>
                    </div>

                    {/* Course Content */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-neutral-500 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          {course.duration_hours ? `${course.duration_hours}h` : 'Duración flexible'}
                        </div>
                        <div className="flex items-center text-neutral-500 text-sm">
                          <Play className="w-4 h-4 mr-1" />
                          {course.lesson_count ? `${course.lesson_count} lecciones` : '0 lecciones'}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-[#A848F0] transition-colors duration-300">
                        {course.title}
                      </h3>
                      
                      <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                        {course.description}
                      </p>

                      {/* Instructor */}
                      {course.instructor_name && (
                        <div className="flex items-center space-x-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00FFE2] to-[#A848F0] flex items-center justify-center text-xs font-bold text-white">
                            {course.instructor_name.charAt(0)}
                          </div>
                          <span className="text-sm text-neutral-700">Por {course.instructor_name}</span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>Estudiantes activos</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-yellow-400" />
                          <span>4.8</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <button
                          className="w-full px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors duration-300"
                          onClick={() => window.location.href = `/cursos/${course.id}`}
                        >
                          Ver Detalles del Curso
                        </button>
                        
                        {user ? (
                          <button
                            onClick={() => enrollInCourse(course.id)}
                            disabled={enrollingCourse === course.id}
                            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                              enrollingCourse === course.id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#00FFE2] to-[#A848F0] text-white hover:shadow-lg hover:scale-105'
                            }`}
                          >
                            {enrollingCourse === course.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Inscribiendo...
                              </>
                            ) : (
                              <>
                                <Award className="w-4 h-4 mr-2" />
                                Inscribirse al Curso
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-transform duration-300"
                          >
                            Iniciar Sesión para Inscribirse
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && filteredCourses.length === 0 && (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-600 mb-2">No hay cursos disponibles</h3>
                <p className="text-neutral-500">No se encontraron cursos para el nivel seleccionado.</p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                ¿Por qué elegir nuestros cursos?
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Una experiencia de aprendizaje completa diseñada para el éxito en la industria de la moda
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Contenido Interactivo</h3>
                <p className="text-neutral-600">Videos HD, documentos PDF, ejercicios prácticos y proyectos reales</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Certificación</h3>
                <p className="text-neutral-600">Obtén certificados digitales al completar cada curso</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Comunidad Activa</h3>
                <p className="text-neutral-600">Conecta con otros estudiantes y comparte tus proyectos</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[#00FFE2] to-[#A848F0]">
          <div className="container text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-white"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                ¿Listo para comenzar tu carrera en diseño de moda?
              </h2>
              <p className="text-lg mb-8 text-white/90">
                Únete a miles de estudiantes que ya están transformando su pasión en profesión. 
                Aprende de expertos de la industria y desarrolla habilidades que te abrirán puertas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-white text-[#A848F0] font-semibold py-4 px-8 rounded-lg hover:bg-neutral-100 transition-colors text-lg"
                  >
                    Ir a Mi Dashboard
                  </button>
                ) : (
                  <button 
                    onClick={() => window.location.href = '/register'}
                    className="bg-white text-[#A848F0] font-semibold py-4 px-8 rounded-lg hover:bg-neutral-100 transition-colors text-lg"
                  >
                    Registrarse Gratis
                  </button>
                )}
                <button 
                  onClick={() => window.location.href = '/cursos'}
                  className="border-2 border-white text-white font-semibold py-4 px-8 rounded-lg hover:bg-white hover:text-[#A848F0] transition-colors text-lg"
                >
                  Explorar Cursos
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}