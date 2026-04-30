import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CourseProgress {
  course_id: number;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  total_assignments: number;
  submitted_assignments: number;
  graded_assignments: number;
  average_grade: number;
  completion_percentage: number;
  last_activity: string;
  enrolled_at: string;
  lessons_progress: Array<{
    lesson_id: number;
    title: string;
    completed: boolean;
    completed_at: string | null;
    time_spent_minutes: number;
    assignment_submitted?: boolean;
    assignment_grade?: number;
    assignment_feedback?: string;
  }>;
  overall_grade: number;
  certificate_earned: boolean;
  next_lesson: {
    id: number;
    title: string;
    type: string;
  };
}

interface StudentProgressProps {
  userId: number;
  courseId: number;
}

export default function StudentProgress({ userId, courseId }: StudentProgressProps) {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgress();
  }, [courseId]);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/student/progress?courseId=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      } else {
        setError('Error cargando el progreso');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error cargando el progreso');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          {error || 'No se pudo cargar el progreso'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Progreso del Curso
        </h2>
        <h3 className="text-lg text-gray-700 mb-4">{progress.course_title}</h3>
        
        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progreso General</span>
            <span>{progress.completion_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.completion_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.completed_lessons}/{progress.total_lessons}
            </div>
            <div className="text-sm text-gray-600">Lecciones Completadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress.submitted_assignments}/{progress.total_assignments}
            </div>
            <div className="text-sm text-gray-600">Tareas Enviadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {progress.average_grade || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Calificación Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {progress.overall_grade || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Calificación Final</div>
          </div>
        </div>

        {/* Próxima lección */}
        {!progress.certificate_earned && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Continúa Aprendiendo</h4>
            <p className="text-blue-800 mb-3">
              Tu siguiente {progress.next_lesson.type === 'assignment' ? 'tarea' : 'lección'}: 
              <span className="font-medium"> {progress.next_lesson.title}</span>
            </p>
            <Link 
              href={`/courses/${courseId}/lessons`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Continuar Aprendiendo
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Certificado */}
        {progress.certificate_earned && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-green-900">¡Felicidades!</h4>
                <p className="text-green-800">Has completado el curso y ganado tu certificado.</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de lecciones */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalles del Progreso</h4>
          <div className="space-y-3">
            {progress.lessons_progress.map((lesson) => (
              <div key={lesson.lesson_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {lesson.completed ? (
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                      <h5 className={`font-medium ${lesson.completed ? 'text-green-900' : 'text-gray-700'}`}>
                        {lesson.title}
                      </h5>
                    </div>
                    
                    {lesson.completed && lesson.completed_at && (
                      <div className="text-sm text-gray-600 mb-2">
                        Completado el {new Date(lesson.completed_at).toLocaleDateString()} • 
                        Tiempo: {lesson.time_spent_minutes} minutos
                      </div>
                    )}

                    {/* Información de tarea */}
                    {lesson.assignment_submitted && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-800">Tarea enviada</span>
                          {lesson.assignment_grade && (
                            <span className="font-medium text-blue-900">
                              Calificación: {lesson.assignment_grade}
                            </span>
                          )}
                        </div>
                        {lesson.assignment_feedback && (
                          <div className="mt-1 text-blue-700">
                            <strong>Retroalimentación:</strong> {lesson.assignment_feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Link
                    href={`/courses/${courseId}/lessons`}
                    className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {lesson.completed ? 'Revisar' : (lesson.assignment_submitted ? 'Ver' : 'Comenzar')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}