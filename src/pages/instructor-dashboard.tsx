import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';

interface CourseStats {
  course_id: number;
  course_title: string;
  description: string;
  price: number;
  published: boolean;
  created_at: string;
  total_students: number;
  completed_students: number;
  active_students: number;
  not_started_students: number;
  avg_progress: number;
  total_lessons: number;
  completed_lessons_total: number;
}

interface OverallStats {
  total_courses: number;
  published_courses: number;
  total_students: number;
  completed_students: number;
  active_students: number;
  overall_progress: number;
  total_revenue: number;
  total_lessons: number;
}

export default function InstructorDashboard() {
  const { user, loading, hasAnyRole } = useAuth();
  const router = useRouter();
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && !hasAnyRole(['instructor', 'administrador'])) {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadStats();
    }
  }, [user, loading]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      
      // Obtener token de autenticación
      const token = localStorage.getItem('ajayu_token');
      if (!token) {
        console.error('Token no encontrado');
        throw new Error('Sesión no válida. Por favor, inicie sesión nuevamente.');
      }

      // Llamar a la API para obtener cursos del instructor
      const response = await fetch('/api/instructor/courses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const courses = await response.json();
      
      if (Array.isArray(courses)) {
        // Transformar cursos para el formato del dashboard
        const transformedCourses = courses.map(course => ({
          course_id: course.id,
          course_title: course.title,
          description: course.description,
          price: course.price,
          published: course.published || false,
          created_at: course.created_at,
          total_students: course.student_count || 0,
          completed_students: course.student_count || 0,
          active_students: course.student_count || 0,
          not_started_students: 0,
          avg_progress: 0,
          total_lessons: course.lesson_count || 0,
          completed_lessons_total: course.lesson_count || 0
        }));
        
        setCourseStats(transformedCourses);
        
        // Calcular estadísticas generales con datos reales
        const overallStats = {
          total_courses: courses.length,
          published_courses: courses.filter(c => c.published).length,
          total_students: courses.reduce((sum, c) => sum + (c.student_count || 0), 0),
          completed_students: courses.reduce((sum, c) => sum + (c.student_count || 0), 0),
          active_students: courses.reduce((sum, c) => sum + (c.student_count || 0), 0),
          overall_progress: 0,
          total_revenue: courses.reduce((sum, c) => sum + (c.price * (c.student_count || 0)), 0),
          total_lessons: courses.reduce((sum, c) => sum + (c.lesson_count || 0), 0)
        };
        
        setOverallStats(overallStats);
      } else {
        throw new Error('No se pudieron cargar los cursos');
      }

    } catch (error) {
      console.error('Error cargando cursos del instructor:', error);
      
      // Mostrar mensaje útil al usuario
      if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('connect'))) {
        alert('❌ Error de conexión a la base de datos. Verifica que MySQL esté ejecutándose.');
      } else if (error instanceof Error && error.message.includes('ER_ACCESS_DENIED')) {
        alert('❌ Error de credenciales. Verifica la configuración de la base de datos.');
      } else if (error instanceof Error && error.message.includes('ER_BAD_DB_ERROR')) {
        alert('❌ Base de datos no encontrada. Verifica que la base de datos "ajayu_db" exista.');
      } else {
        alert('❌ Error cargando cursos. Revisa la consola para más detalles.');
      }
      
      // Limpiar datos para evitar mostrar información incorrecta
      setCourseStats([]);
      setOverallStats({
        total_courses: 0,
        published_courses: 0,
        total_students: 0,
        completed_students: 0,
        active_students: 0,
        overall_progress: 0,
        total_revenue: 0,
        total_lessons: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <Layout>
      <Head>
        <title>Dashboard de Instructor - Ajayu</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Page Title */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dashboard de Instructor
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Bienvenido, {user?.name}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/courses/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Crear Nuevo Curso
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Ver Mis Cursos
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Estadísticas Generales */}
          {overallStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Cursos</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overallStats.total_courses}
                    </p>
                    <p className="text-xs text-gray-500">
                      {overallStats.published_courses} publicados
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overallStats.total_students}
                    </p>
                    <p className="text-xs text-gray-500">
                      {overallStats.active_students} activos
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Progreso Promedio</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatPercentage(overallStats.overall_progress)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {overallStats.completed_students} completados
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(overallStats.total_revenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {overallStats.total_lessons} lecciones
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Cursos */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Mis Cursos</h2>
            </div>
            
            {courseStats.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos aún</h3>
                <p className="text-gray-600 mb-4">Crea tu primer curso para empezar a enseñar</p>
                <button
                  onClick={() => router.push('/courses/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  Crear Mi Primer Curso
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {courseStats.map((course) => (
                  <div key={course.course_id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {course.course_title}
                          </h3>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {course.published ? 'Publicado' : 'Borrador'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {course.description}
                        </p>
                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                          <span>{course.total_students} estudiantes</span>
                          <span>{course.total_lessons} lecciones</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(course.price)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-6 flex space-x-2">
                        <button
                          onClick={() => router.push(`/instructor/manage-course/${course.course_id}`)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Editar Curso
                        </button>
                        <button
                          onClick={() => router.push(`/instructor/manage-course/${course.course_id}`)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Gestionar Lecciones
                        </button>
                      </div>
                    </div>
                    
                    {/* Progreso del curso */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso promedio</span>
                        <span>{formatPercentage(course.avg_progress)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.avg_progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>{course.active_students} activos</span>
                        <span>{course.completed_students} completados</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}