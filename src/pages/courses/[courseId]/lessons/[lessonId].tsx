import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AssignmentSubmission from '@/components/AssignmentSubmission';

interface Lesson {
  id: number;
  title: string;
  content: string;
  lesson_type: string;
  order_index: number;
  estimated_minutes: number;
  resources?: string;
}

interface Course {
  id: number;
  title: string;
  lessons: Lesson[];
}

export default function LessonPage() {
  const router = useRouter();
  const { courseId, lessonId } = router.query;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  useEffect(() => {
    if (courseId && lessonId) {
      fetchCourseAndLesson();
    }
  }, [courseId, lessonId]);

  const fetchCourseAndLesson = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data);
        
        // Encontrar la lección actual
        const lesson = data.lessons?.find((l: Lesson) => l.id === parseInt(lessonId as string));
        setCurrentLesson(lesson);
        
        // Encontrar el índice de la lección actual
        const index = data.lessons?.findIndex((l: Lesson) => l.id === parseInt(lessonId as string)) || 0;
        setCurrentLessonIndex(index);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = () => {
    // Marcar lección como completada y pasar a la siguiente
    if (course && currentLessonIndex < course.lessons.length - 1) {
      const nextLesson = course.lessons[currentLessonIndex + 1];
      router.push(`/courses/${courseId}/lessons/${nextLesson.id}`);
    }
  };

  const handleSubmissionSuccess = () => {
    // Actualizar el estado local para reflejar la nueva submission
    toast.success('Tarea enviada exitosamente');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando lección...</p>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lección no encontrada</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  const resources = currentLesson.resources ? JSON.parse(currentLesson.resources) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/courses/${courseId}`}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al curso
          </Link>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentLesson.title}
                </h1>
                <p className="text-gray-600">
                  Lección {currentLessonIndex + 1} de {course.lessons.length} • 
                  {currentLesson.estimated_minutes} minutos estimados
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentLesson.lesson_type === 'video' ? 'bg-blue-100 text-blue-800' :
                  currentLesson.lesson_type === 'assignment' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {currentLesson.lesson_type === 'video' ? 'Video' :
                   currentLesson.lesson_type === 'assignment' ? 'Tarea' :
                   'Lectura'}
                </span>
              </div>
            </div>

            {/* Barra de progreso del curso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progreso del curso</span>
                <span>{Math.round(((currentLessonIndex + 1) / course.lessons.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentLessonIndex + 1) / course.lessons.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de la lección */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {currentLesson.content}
                </div>
              </div>

              {/* Recursos */}
              {resources.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recursos</h3>
                  <ul className="space-y-2">
                    {resources.map((resource: string, index: number) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                          {resource}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sección de tarea si es una lección de tipo assignment */}
            {currentLesson.lesson_type === 'assignment' && (
              <AssignmentSubmission
                lessonId={currentLesson.id}
                assignmentTitle={currentLesson.title}
                onSubmit={handleSubmissionSuccess}
              />
            )}
          </div>

          {/* Sidebar - Lista de lecciones */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contenido del Curso
              </h3>
              
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      lesson.id === currentLesson.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => router.push(`/courses/${courseId}/lessons/${lesson.id}`)}
                  >
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5 ${
                        index < currentLessonIndex 
                          ? 'bg-green-500 text-white' 
                          : index === currentLessonIndex
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index < currentLessonIndex ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          lesson.id === currentLesson.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {lesson.lesson_type === 'video' ? 'Video' :
                           lesson.lesson_type === 'assignment' ? 'Tarea' :
                           'Lectura'} • {lesson.estimated_minutes} min
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botones de navegación */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      if (currentLessonIndex > 0) {
                        const prevLesson = course.lessons[currentLessonIndex - 1];
                        router.push(`/courses/${courseId}/lessons/${prevLesson.id}`);
                      }
                    }}
                    disabled={currentLessonIndex === 0}
                    className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Anterior
                  </button>
                  
                  <button
                    onClick={() => {
                      if (currentLessonIndex < course.lessons.length - 1) {
                        const nextLesson = course.lessons[currentLessonIndex + 1];
                        router.push(`/courses/${courseId}/lessons/${nextLesson.id}`);
                      }
                    }}
                    disabled={currentLessonIndex === course.lessons.length - 1}
                    className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}