import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { Play, CheckCircle, Clock, Book, Download, FileText, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface Lesson {
  id: number;
  title: string;
  description?: string;
  video_url?: string;
  duration_minutes?: number;
  order_number: number;
  completed: boolean;
  video_progress_seconds?: number;
  video_total_seconds?: number;
  watch_percentage: number;
  resources?: CourseResource[];
}

interface CourseResource {
  id: number;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface Course {
  id: number;
  title: string;
  description?: string;
  instructor_id: number;
  instructor_name?: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
}

export default function LessonsPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingProgress, setUpdatingProgress] = useState(false);

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
      fetchLessons();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem('ajayu_token');
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const token = localStorage.getItem('ajayu_token');
      const response = await fetch(`/api/courses/${courseId}/lessons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || []);
        if (data.lessons && data.lessons.length > 0) {
          setCurrentLesson(data.lessons[0]);
        }
      } else {
        const errorData = await response.json();
        console.error('Error fetching lessons:', errorData.message);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: number) => {
    setUpdatingProgress(true);
    try {
      const token = localStorage.getItem('ajayu_token');
      const response = await fetch(`/api/student/complete-lesson`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          completed: true
        })
      });

      if (response.ok) {
        // Actualizar estado local
        setLessons(prev => prev.map(lesson => 
          lesson.id === lessonId 
            ? { ...lesson, completed: true, watch_percentage: 100 }
            : lesson
        ));
        setCurrentLesson(prev => prev ? { ...prev, completed: true, watch_percentage: 100 } : null);
      } else {
        const errorData = await response.json();
        console.error('Error updating progress:', errorData.message);
        alert('Error al actualizar el progreso: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error al actualizar el progreso');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00FFE2]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
                <p className="text-gray-600 mt-2">Instructor: {course?.instructor_name}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Progreso del curso</div>
                <div className="text-2xl font-bold text-[#00FFE2]">{course?.progress_percentage}%</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-[#00FFE2] to-[#A848F0] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course?.progress_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Lista de Lecciones */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Book className="w-5 h-5 mr-2" />
                  Lecciones ({lessons.length})
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
                        currentLesson?.id === lesson.id
                          ? 'bg-[#00FFE2] bg-opacity-10 border-[#00FFE2]'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => setCurrentLesson(lesson)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 mr-2">
                              {index + 1}.
                            </span>
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {lesson.title}
                            </h3>
                          </div>
                          {lesson.duration_minutes && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {lesson.duration_minutes} min
                            </div>
                          )}
                        </div>
                        {lesson.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Play className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      {lesson.watch_percentage > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-[#00FFE2] h-1 rounded-full transition-all duration-300"
                              style={{ width: `${lesson.watch_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reproductor de Video */}
            <div className="lg:col-span-3">
              {currentLesson ? (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h2>
                      <div className="flex items-center space-x-4">
                        {currentLesson.video_url && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Video className="w-4 h-4 mr-1" />
                            Video
                          </div>
                        )}
                        {currentLesson.completed ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-5 h-5 mr-1" />
                            Completada
                          </div>
                        ) : (
                          <Button
                            onClick={() => markLessonComplete(currentLesson.id)}
                            disabled={updatingProgress}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {updatingProgress ? 'Actualizando...' : 'Marcar como Completada'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {currentLesson.description && (
                      <p className="text-gray-600 mb-6">{currentLesson.description}</p>
                    )}

                    {/* Reproductor de Video */}
                    {currentLesson.video_url ? (
                      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        <video
                          controls
                          className="w-full h-full"
                          src={currentLesson.video_url}
                          onTimeUpdate={(e) => {
                            const video = e.target as HTMLVideoElement;
                            const progress = (video.currentTime / video.duration) * 100;
                            // Aquí podrías actualizar el progreso en tiempo real
                          }}
                          onEnded={() => {
                            // Marcar como completado automáticamente
                            if (!currentLesson.completed) {
                              markLessonComplete(currentLesson.id);
                            }
                          }}
                        >
                          Tu navegador no soporta el elemento de video.
                        </video>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-12 text-center">
                        <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Contenido de Texto
                        </h3>
                        <p className="text-gray-600">
                          Esta lección contiene material de lectura sin video.
                        </p>
                      </div>
                    )}

                    {/* Recursos */}
                    {currentLesson.resources && currentLesson.resources.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Recursos de la Lección
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {currentLesson.resources.map((resource) => (
                            <div
                              key={resource.id}
                              className="flex items-center p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex items-center justify-center w-10 h-10 bg-[#00FFE2] bg-opacity-20 rounded-lg mr-3">
                                {getResourceIcon(resource.file_type)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{resource.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {(resource.file_size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <a
                                href={resource.file_url}
                                download
                                className="ml-3 p-2 text-[#00FFE2] hover:bg-[#00FFE2] hover:bg-opacity-10 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona una Lección
                  </h3>
                  <p className="text-gray-600">
                    Elige una lección de la lista para comenzar a estudiar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}