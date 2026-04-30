import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Clock, Users, Star, Award, BookOpen } from 'lucide-react';
import Reviews from '@/components/reviews';

interface Lesson {
  id: number;
  title: string;
  description: string;
  content_type: string;
  duration_minutes: number;
  lesson_order: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_name: string;
  level: string;
  duration_hours: number;
  price: number;
  category: string;
  published: boolean;
  lessons: Lesson[];
  average_rating: number;
  total_reviews: number;
  total_students: number;
  lesson_count: number;
  features: string[];
}

export default function CourseDetail() {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollingCourse, setEnrollingCourse] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        setMessage('Curso no encontrado');
      }
    } catch (error) {

      setMessage('Error cargando datos del curso');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setEnrollingCourse(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ course_id: courseId })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('¡Te has inscrito exitosamente al curso!');
        // Optionally refresh course data to show updated enrollment
        setTimeout(() => {
          fetchCourseData();
        }, 1000);
      } else {
        setMessage(data.message || 'Error al inscribirse al curso');
      }
    } catch (error) {

      setMessage('Error al inscribirse al curso');
    } finally {
      setEnrollingCourse(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'principiante': return 'bg-green-100 text-green-800';
      case 'intermedio': return 'bg-yellow-100 text-yellow-800';
      case 'avanzado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#C33B80] mx-auto"></div>
            <p className="mt-4 text-neutral-600">Cargando curso...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Curso no encontrado</h1>
            <Link href="/cursos" className="text-[#C33B80] hover:text-[#FF69B4]">
              Volver a cursos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#FF69B4]/10 to-[#C33B80]/10 py-16">
          <div className="container">
            <div className="max-w-6xl mx-auto">
              <Link href="/cursos" className="text-[#C33B80] hover:text-[#FF69B4] mb-4 inline-block">
                ← Volver a cursos
              </Link>
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                    <span className="text-neutral-600 text-sm">{course.category}</span>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                    {course.title}
                  </h1>
                  
                  <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-neutral-500 mb-6">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.total_students || 0} estudiantes
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400" />
                      {course.average_rating || 4.8} ({course.total_reviews || 0} reseñas)
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration_hours || 0}h
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF69B4] to-[#C33B80] flex items-center justify-center text-white font-bold">
                      {course.instructor_name?.charAt(0) || 'I'}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">Instructor</p>
                      <p className="text-neutral-600">{course.instructor_name || 'Instructor'}</p>
                    </div>
                  </div>
                  
                  {message && (
                    <div className={`mb-4 p-3 rounded-md ${
                      message.includes('exitosamente') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {message}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={enrollInCourse}
                      disabled={enrollingCourse}
                      className={`flex-1 px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                        enrollingCourse
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : course.price === 0
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg'
                          : 'bg-gradient-to-r from-[#FF69B4] to-[#C33B80] text-white hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      {enrollingCourse ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Inscribiendo...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          {course.price === 0 ? 'Inscribirse Gratis' : `Inscribirse - $${course.price}`}
                        </>
                      )}
                    </button>
                    
                    <Link
                      href={`/courses/${courseId}/lessons`}
                      className="flex-1 px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center bg-white border-2 border-[#FF69B4] text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Ver Lecciones
                    </Link>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">Lo que aprenderás</h3>
                  <ul className="space-y-3">
                    {course.features?.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-neutral-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="flex items-center justify-between text-sm text-neutral-600">
                      <span>Duración total</span>
                      <span className="font-medium">{course.duration_hours || 0} horas</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-600 mt-2">
                      <span>Lecciones</span>
                      <span className="font-medium">{course.lesson_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-600 mt-2">
                      <span>Nivel</span>
                      <span className="font-medium">{course.level}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">Contenido del curso</h2>
                    <p className="text-neutral-600 mb-6">
                      {course.lessons?.length || 0} lecciones • {course.duration_hours || 0} horas de contenido
                    </p>
                    
                    {course.lessons && course.lessons.length > 0 ? (
                      <div className="space-y-3">
                        {course.lessons.map((lesson, index) => (
                          <div key={lesson.id} className="flex items-center p-3 bg-neutral-50 rounded-lg">
                            <div className="w-8 h-8 bg-[#C33B80] text-white rounded-full flex items-center justify-center text-sm font-medium mr-4">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">{lesson.title}</h4>
                              {lesson.description && (
                                <p className="text-sm text-neutral-600 mt-1">{lesson.description}</p>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-neutral-500">
                              <Clock className="w-4 h-4 mr-1" />
                              {lesson.duration_minutes || 30}min
                            </div>
                          </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <Link
                            href={`/courses/${courseId}/lessons`}
                            className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center bg-gradient-to-r from-[#FF69B4] to-[#C33B80] text-white hover:shadow-lg"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Comenzar a Estudiar
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                        <p className="text-neutral-600">No hay lecciones disponibles aún</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Sidebar */}
                <div>
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sticky top-4">
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Información del curso</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Instructor</h4>
                        <p className="text-neutral-600">{course.instructor_name || 'Instructor'}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Nivel</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Categoría</h4>
                        <p className="text-neutral-600">{course.category}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Duración</h4>
                        <p className="text-neutral-600">{course.duration_hours || 0} horas</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Lecciones</h4>
                        <p className="text-neutral-600">{course.lesson_count || 0} lecciones</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Estudiantes</h4>
                        <p className="text-neutral-600">{course.total_students || 0} inscritos</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Calificación</h4>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-neutral-600">{course.average_rating || 4.8} ({course.total_reviews || 0} reseñas)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <Reviews courseId={courseId as string} />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}