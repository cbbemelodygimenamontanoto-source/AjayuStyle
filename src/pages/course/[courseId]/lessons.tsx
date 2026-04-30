import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Clock, CheckCircle, Lock, BookOpen, Award, FileText } from 'lucide-react';

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description: string;
  content: string;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
  completed: boolean;
  content_type: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_name: string;
  level: string;
  lesson_count: number;
  progress_percentage: number;
}

export default function CourseLessons() {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completingLesson, setCompletingLesson] = useState<number | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      
      // Construir headers para la petición
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Si hay usuario autenticado, agregar token
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      // Llamar a la API real
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'GET',
        headers,
      });
      

      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const courseData = await response.json();

      
      // Transformar datos de la API al formato esperado por el componente
      setCourse({
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        instructor_name: courseData.instructor?.name || 'Instructor',
        level: courseData.level,
        lesson_count: courseData.lesson_count || 0,
        progress_percentage: courseData.enrollment?.progress_percentage || 0
      });
      
      // Obtener progreso real de las lecciones desde la BD
      let lessonProgress = [];
      if (user?.token) {
        try {
          const progressResponse = await fetch(`/api/courses/${courseId}/lessons`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            lessonProgress = progressData.lessons || [];
          }
        } catch (error) {

        }
      }

      // Transformar lecciones con progreso real
      const transformedLessons = courseData.lessons?.map((lesson: any) => {
        // Buscar progreso de esta lección específica
        const lessonProgressData = lessonProgress.find((lp: any) => lp.id === lesson.id);
        
        return {
          id: lesson.id,
          course_id: courseData.id,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          duration_minutes: lesson.duration_minutes,
          order_index: lesson.lesson_order,
          is_preview: lesson.is_preview,
          completed: lessonProgressData?.completed || false, // Usar progreso real de la BD
          content_type: lesson.content_type || 'video',
          video_progress_seconds: lessonProgressData?.video_progress_seconds || 0,
          watch_percentage: lessonProgressData?.watch_percentage || 0
        };
      }) || [];
      
      setLessons(transformedLessons);
      

      
    } catch (error: any) {

      
      // Mostrar error específico según el tipo
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('No se puede conectar con el servidor. Verifica que el servidor Next.js esté ejecutándose.');
      } else if (error.message.includes('404')) {
        setError(`El curso con ID ${courseId} no existe en la base de datos.`);
      } else if (error.message.includes('500')) {
        setError('Error interno del servidor. Verifica la conexión a la base de datos MySQL.');
      } else {
        setError(`Error cargando el curso: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowLessonModal(true);
  };

  const closeLessonModal = () => {
    setShowLessonModal(false);
    setSelectedLesson(null);
  };

  const completeLesson = async (lessonId: number) => {
    if (!user?.token) {
      setError('Debes estar autenticado para marcar lecciones como completadas');
      return;
    }

    setCompletingLesson(lessonId);
    
    try {
      const response = await fetch('/api/student/complete-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ lessonId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error marcando lección como completada');
      }

      const data = await response.json();
      
      // Actualizar el estado local de las lecciones
      setLessons(prevLessons => 
        prevLessons.map(lesson => 
          lesson.id === lessonId 
            ? { ...lesson, completed: true }
            : lesson
        )
      );

      // Actualizar el progreso del curso
      if (course && data.progress) {
        setCourse(prev => prev ? {
          ...prev,
          progress_percentage: data.progress.course_progress
        } : null);
      }


      
    } catch (error: any) {

      setError(`Error completando lección: ${error.message}`);
    } finally {
      setCompletingLesson(null);
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
            <p className="mt-4 text-neutral-600">Cargando lecciones...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error al cargar curso</h1>
            <p className="text-neutral-600 mb-4">{error}</p>
            <div className="bg-gray-100 p-4 rounded-lg text-left text-sm">
              <h3 className="font-semibold mb-2">🔍 Información de Debug:</h3>
              <p><strong>Curso ID:</strong> {courseId}</p>
              <p><strong>Usuario:</strong> {user?.name || 'No autenticado'}</p>
              <p><strong>Estado BD:</strong> Verificando conexión...</p>
            </div>
            <div className="mt-4 space-x-4">
              <Link href="/dashboard" className="text-[#C33B80] hover:text-[#FF69B4]">
                Volver al dashboard
              </Link>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-[#C33B80] text-white px-4 py-2 rounded hover:bg-[#9338d4]"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Curso no encontrado</h1>
            <div className="bg-gray-100 p-4 rounded-lg text-left text-sm mb-4">
              <h3 className="font-semibold mb-2">🔍 Información de Debug:</h3>
              <p><strong>Curso ID:</strong> {courseId}</p>
              <p><strong>Estado de carga:</strong> {loading ? 'Cargando desde BD...' : 'Completado'}</p>
              <p><strong>Fuente de datos:</strong> Base de datos MySQL</p>
            </div>
            <Link href="/dashboard" className="text-[#C33B80] hover:text-[#FF69B4]">
              Volver al dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        {/* Debug Info */}
        <section className="bg-gray-100 border-b border-gray-200">
          <div className="container py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold">🔍 Debug:</span> Curso ID: {courseId} | 
                  <span className="font-semibold text-green-600 ml-1">
                    Base de datos MySQL
                  </span> | 
                  Usuario: {user?.name || 'No autenticado'}
                </div>
                <div>
                  <span className="text-gray-500">Lecciones: {lessons.length}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Header */}
        <section className="bg-white border-b border-neutral-200">
          <div className="container py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Link href="/dashboard" className="text-[#C33B80] hover:text-[#FF69B4] mb-4 inline-block">
                    ← Volver al dashboard
                  </Link>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">{course.title}</h1>
                  <p className="text-neutral-600">{course.description}</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(course.level)}`}>
                    {course.level}
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#FF69B4]">{course.progress_percentage}%</div>
                    <div className="text-sm text-neutral-600">Completado</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-sm text-neutral-600">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {course.lesson_count} lecciones
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Instructor: {course.instructor_name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lessons List */}
        <section className="py-8">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Contenido del Curso</h2>
              
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`bg-white rounded-xl shadow-sm border border-neutral-200 p-6 transition-all duration-300 ${
                      lesson.completed ? 'border-green-200 bg-green-50' : 'hover:shadow-md cursor-pointer'
                    }`}
                    onClick={() => !lesson.completed && openLesson(lesson)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          lesson.completed 
                            ? 'bg-green-500' 
                            : lesson.is_preview 
                            ? 'bg-[#C33B80]' 
                            : 'bg-neutral-400'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                            {lesson.title}
                          </h3>
                          <p className="text-neutral-600 text-sm mb-2">
                            {lesson.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-neutral-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {lesson.duration_minutes} minutos
                            </div>
                            <div className="flex items-center">
                              <Play className="w-4 h-4 mr-1" />
                              {lesson.content_type === 'video' ? 'Video' : 'Texto'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {lesson.is_preview && !lesson.completed && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            Vista previa
                          </span>
                        )}
                        
                        {lesson.completed ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Completado
                          </span>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openLesson(lesson);
                            }}
                            className="bg-gradient-to-r from-[#FF69B4] to-[#C33B80] text-white font-medium py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {index === 0 ? 'Comenzar' : 'Continuar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Lesson Modal */}
        {showLessonModal && selectedLesson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-neutral-900">{selectedLesson.title}</h2>
                  <button
                    onClick={closeLessonModal}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-neutral-600 mt-2">{selectedLesson.description}</p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-[#FF69B4]/20 to-[#C33B80]/20 rounded-lg p-8 text-center">
                    <Play className="w-16 h-16 text-[#C33B80] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      Contenido de la Lección
                    </h3>
                    <p className="text-neutral-600">
                      Aquí se mostraría el video o contenido de la lección
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h4 className="font-semibold text-neutral-900 mb-2">Información de la Lección</h4>
                    <div className="space-y-2 text-sm text-neutral-600">
                      <div className="flex justify-between">
                        <span>Duración:</span>
                        <span>{selectedLesson.duration_minutes} minutos</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <span>{selectedLesson.content_type === 'video' ? 'Video' : 'Texto'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Orden:</span>
                        <span>Lección {selectedLesson.order_index}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <h4 className="font-semibold text-neutral-900 mb-2">Acciones</h4>
                    <div className="space-y-2">
                      <Link
                        href={`/course/${courseId}/lessons/${selectedLesson.id}/assignment`}
                        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Tarea
                      </Link>
                      <button 
                        onClick={() => completeLesson(selectedLesson.id)}
                        disabled={completingLesson === selectedLesson.id}
                        className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {completingLesson === selectedLesson.id ? 'Completando...' : 'Marcar como Completada'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}