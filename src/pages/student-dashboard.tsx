import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  BookOpenIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  PlayCircleIcon,
  AcademicCapIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface StudentStats {
  enrolled_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_study_hours: number;
  certificates_earned: number;
  average_grade: number;
  current_streak: number;
}

interface EnrollmentWithCourse {
  id: number;
  enrolled_at: string;
  progress_percentage: number;
  status: string;
  course: {
    id: number;
    title: string;
    thumbnail?: string;
    instructor: {
      name: string;
      last_name: string;
    };
    category: {
      name: string;
    };
    rating_average: number;
  };
}

interface RecentActivity {
  type: string;
  description: string;
  date: string;
  course_title?: string;
}

export default function StudentDashboard() {
  console.log('🔍 STUDENT DASHBOARD: Componente cargando...');
  
  const { user, loading, hasAnyRole } = useAuth();
  console.log('🔍 STUDENT DASHBOARD: Usuario:', user ? `ID: ${user.id}, Email: ${user.email}` : 'NULL');
  console.log('🔍 STUDENT DASHBOARD: Loading:', loading);
  
  const router = useRouter();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !hasAnyRole(['normal', 'instructor', 'moderador', 'administrador'])) {
      router.push('/login');
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    try {
      setStatsLoading(true);
      
      // Obtener token del localStorage
      const token = localStorage.getItem('ajayu_token');
      
      // Cargar estadísticas del estudiante
      const statsResponse = await fetch('/api/student/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const statsData = await statsResponse.json();
      
      // Cargar inscripciones del estudiante
      const enrollmentsResponse = await fetch('/api/student/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const enrollmentsData = await enrollmentsResponse.json();
      
      console.log('📊 Debug - Respuesta de enrollments:', enrollmentsData);
      
      // Cargar actividad reciente
      const activityResponse = await fetch('/api/student/activity', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const activityData = await activityResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      
      if (enrollmentsData.success) {
        console.log('🎯 Datos de enrollments procesados:', enrollmentsData.data);
        setEnrollments(enrollmentsData.data);
      } else {
        console.log('❌ Error en enrollments:', enrollmentsData.message);
      }
      
      if (activityData.success) {
        setRecentActivity(activityData.data);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours}h`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_completed':
        return <PlayCircleIcon className="w-5 h-5 text-green-500" />;
      case 'course_completed':
        return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
      case 'assignment_submitted':
        return <BookOpenIcon className="w-5 h-5 text-blue-500" />;
      case 'certificate_earned':
        return <AcademicCapIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <ChartBarIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Estudiante | Ajayu</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getGreeting()}, {user?.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Continúa tu viaje de aprendizaje
                </p>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/courses"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Explorar Cursos
                </Link>
                <Link
                  href="/certificates"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Mis Certificados
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Estadísticas principales */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpenIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Cursos Inscritos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.enrolled_courses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrophyIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed_courses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Horas Estudiadas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatDuration(stats.total_study_hours)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Certificados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.certificates_earned}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cursos en progreso */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Mis Cursos</h2>
                </div>
                <div className="p-6">
                  {enrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No tienes cursos inscritos
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Explora nuestro catálogo de cursos y comienza a aprender
                      </p>
                      <div className="mt-6">
                        <Link
                          href="/courses"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Explorar Cursos
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              {enrollment.course.thumbnail ? (
                                <img
                                  className="h-16 w-16 rounded-lg object-cover"
                                  src={enrollment.course.thumbnail}
                                  alt={enrollment.course.title}
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <BookOpenIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {enrollment.course.title}
                                </h3>
                                <div className="flex items-center space-x-1">
                                  <StarIcon className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm text-gray-600">
                                    {enrollment.course.rating_average.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {enrollment.course.instructor.name} {enrollment.course.instructor.last_name}
                              </p>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    Progreso: {enrollment.progress_percentage}%
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      enrollment.status === 'completado'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {enrollment.status}
                                  </span>
                                </div>
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${getProgressColor(
                                      enrollment.progress_percentage
                                    )}`}
                                    style={{ width: `${enrollment.progress_percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <Link
                                href={`/courses/${enrollment.course.id}/lessons`}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Continuar
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Racha de estudio */}
              {stats && stats.current_streak > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <FireIcon className="h-8 w-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Racha Actual</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.current_streak} días
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    ¡Sigue así! Mantén tu racha de estudio activa
                  </p>
                </div>
              )}

              {/* Calificación promedio */}
              {stats && stats.average_grade > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <StarIcon className="h-8 w-8 text-yellow-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Promedio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.average_grade.toFixed(1)}/100
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actividad reciente */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Actividad Reciente</h2>
                </div>
                <div className="p-6">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay actividad reciente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            {activity.course_title && (
                              <p className="text-xs text-gray-500 mt-1">
                                {activity.course_title}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recomendaciones */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <h3 className="text-lg font-medium mb-2">¿Listo para el siguiente nivel?</h3>
                <p className="text-blue-100 mb-4">
                  Descubre cursos recomendados basados en tu progreso
                </p>
                <Link
                  href="/courses/recommended"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  Ver Recomendaciones
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}