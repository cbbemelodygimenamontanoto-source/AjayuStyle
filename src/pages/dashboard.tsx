import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
// Datos reales únicamente desde la base de datos
import { 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  BarChart3,
  Users,
  Star,
  Plus,
  Edit,
  Eye
} from 'lucide-react';

interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  level: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at?: string;
  status: 'active' | 'completed' | 'dropped';
  lesson_count: number;
  completed_lessons: number;
}

interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHoursStudied: number;
  certificatesEarned: number;
  currentStreak: number;
}

export default function Dashboard() {
  const { user, hasAnyRole, hasRole } = useAuth();
  
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHoursStudied: 0,
    certificatesEarned: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [instructorCourses, setInstructorCourses] = useState<any[]>([]);

  // Redirección automática basada en roles
  useEffect(() => {
    if (user && user.roles && user.roles.length > 0) {
      const primaryRole = user.roles[0].name;
      
      // Solo estudiantes (normal) ven el dashboard universal
      // Otros roles van a sus dashboards específicos
      if (primaryRole !== 'normal') {
        switch (primaryRole) {
          case 'instructor':
            router.replace('/instructor-dashboard');
            return;
          case 'administrador':
            router.replace('/admin-dashboard');
            return;
          case 'moderador':
            router.replace('/moderator-dashboard');
            return;
        }
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (!user) return;
      

      
      // Obtener token del localStorage
      const token = localStorage.getItem('ajayu_token');
      if (!token) {
  
        return;
      }
      
      // Llamar a la API real de enrollments
      const response = await fetch('/api/student/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      

      
      const data = await response.json();

      
      if (data.success) {

        
        // Convertir datos de la API al formato del dashboard
        const realEnrollments = data.data.map((enrollment: any) => {
          return {
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description || 'Curso disponible',
            thumbnail: enrollment.course.thumbnail,
            level: enrollment.course.level || 'Intermedio',
            progress_percentage: enrollment.progress_percentage || 0,
            enrolled_at: new Date(enrollment.enrolled_at),
            status: enrollment.status === 'completado' ? 'completed' : 'active',
            lesson_count: enrollment.course.total_lessons || 0,
            completed_lessons: Math.floor((enrollment.progress_percentage || 0) / 100 * (enrollment.course.total_lessons || 0)),
            average_grade: 85,
            last_activity: new Date(enrollment.enrolled_at).toISOString()
          };
        });
        

        setEnrolledCourses(realEnrollments);
        
        // Calcular estadísticas
        setStats({
          totalCourses: realEnrollments.length,
          completedCourses: realEnrollments.filter(c => c.status === 'completed').length,
          inProgressCourses: realEnrollments.filter(c => c.status === 'active').length,
          totalHoursStudied: realEnrollments.reduce((total, course) => {
            const progress = course.progress_percentage || 0;
            const lessonCount = course.lesson_count || 0;
            const hours = (progress / 100) * (lessonCount * 0.5);
            return total + (isNaN(hours) ? 0 : hours);
          }, 0),
          certificatesEarned: realEnrollments.filter(c => c.status === 'completed').length,
          currentStreak: 3
        });
        

        setLoading(false);
        
      } else {

        setEnrolledCourses([]);
        setStats({
          totalCourses: 0,
          completedCourses: 0,
          inProgressCourses: 0,
          totalHoursStudied: 0,
          certificatesEarned: 0,
          currentStreak: 0
        });
        

        setLoading(false);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'principiante': return 'from-green-400 to-green-600';
      case 'intermedio': return 'from-yellow-400 to-orange-500';
      case 'avanzado': return 'from-red-500 to-red-700';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'dropped': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'active': return 'En Progreso';
      case 'dropped': return 'Abandonado';
      default: return status;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Acceso Requerido</h1>
            <p className="text-neutral-600 mb-6">Debes iniciar sesión para acceder a tu dashboard</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-[#FF69B4] to-[#C33B80] text-white font-semibold py-3 px-6 rounded-lg hover:scale-105 transition-transform duration-300"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <section className="bg-white border-b border-neutral-200">
          <div className="container py-8">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-between"
              >
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    ¡Hola, {user.name}!
                  </h1>
                  <p className="text-neutral-600">
                    Continúa tu journey en el diseño de moda
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#FF69B4]">{stats.currentStreak}</div>
                    <div className="text-sm text-neutral-600">días consecutivos</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FF69B4] to-[#C33B80] flex items-center justify-center text-white font-bold text-lg">
                    {user.name.charAt(0)}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Navigation for Roles */}
        {hasAnyRole(['instructor', 'administrador', 'moderador']) && (
          <section className="py-6 bg-white border-b border-neutral-200">
            <div className="container">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Herramientas de Gestión</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* Dashboard de Instructor */}
                  {hasAnyRole(['instructor', 'administrador']) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      onClick={() => window.location.href = '/instructor-dashboard'}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Dashboard de Instructor</h3>
                          <p className="text-sm opacity-90">Gestiona tus cursos y ve estadísticas</p>
                        </div>
                        <BarChart3 className="w-8 h-8" />
                      </div>
                    </motion.div>
                  )}

                  {/* Ver Envíos de Estudiantes */}
                  {hasAnyRole(['instructor', 'administrador']) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.35 }}
                      onClick={() => window.location.href = '/instructor/submissions'}
                      className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Ver Envíos</h3>
                          <p className="text-sm opacity-90">Califica tareas de estudiantes</p>
                        </div>
                        <Award className="w-8 h-8" />
                      </div>
                    </motion.div>
                  )}

                  {/* Crear Nuevo Curso */}
                  {hasAnyRole(['instructor', 'administrador']) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      onClick={() => window.location.href = '/courses/create'}
                      className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Crear Curso</h3>
                          <p className="text-sm opacity-90">Comparte tu conocimiento</p>
                        </div>
                        <BookOpen className="w-8 h-8" />
                      </div>
                    </motion.div>
                  )}

                  {/* Panel de Administración */}
                  {hasRole('administrador') && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      onClick={() => window.location.href = '/admin-dashboard'}
                      className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Panel Admin</h3>
                          <p className="text-sm opacity-90">Gestiona usuarios y contenido</p>
                        </div>
                        <Users className="w-8 h-8" />
                      </div>
                    </motion.div>
                  )}

                  {/* Mis Cursos */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    onClick={() => window.location.href = '/cursos'}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Explorar Cursos</h3>
                        <p className="text-sm opacity-90">Descubre nuevos contenidos</p>
                      </div>
                      <TrendingUp className="w-8 h-8" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Instructor Courses Management */}
        {hasAnyRole(['instructor', 'administrador']) && instructorCourses.length > 0 && (
          <section className="py-8 bg-white border-b border-neutral-200">
            <div className="container">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900">Mis Cursos Creados</h2>
                  <button 
                    onClick={() => window.location.href = '/courses/create'}
                    className="text-[#C33B80] hover:underline font-medium flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Crear Nuevo Curso
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {instructorCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                    >
                      {/* Course Thumbnail */}
                      <div className="h-32 bg-gradient-to-br from-blue-500/20 to-purple-600/20 relative">
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                          course.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.published ? 'Publicado' : 'Borrador'}
                        </div>
                        
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                          course.level === 'principiante' ? 'bg-green-100 text-green-800' :
                          course.level === 'intermedio' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {course.level}
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                          {course.description}
                        </p>

                        {/* Course Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 mb-4">
                          <div className="flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" />
                            <span>{course.lesson_count} lecciones</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            <span>{course.student_count} estudiantes</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            <span>{course.average_rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>${course.price}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <button 
                            onClick={() => window.location.href = `/instructor/manage-course/${course.id}`}
                            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Gestionar Curso
                          </button>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => window.location.href = `/courses/${course.id}/edit`}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors text-xs flex items-center justify-center"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </button>
                            <button 
                              onClick={() => window.location.href = `/courses/${course.id}`}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors text-xs flex items-center justify-center"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Cards */}
        <section className="py-8">
          <div className="container">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Cursos Inscritos</p>
                      <p className="text-3xl font-bold text-neutral-900">{stats.totalCourses}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-[#FF69B4] to-[#C33B80] rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Completados</p>
                      <p className="text-3xl font-bold text-green-600">{stats.completedCourses}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Horas Estudiadas</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.totalHoursStudied}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Certificados</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.certificatesEarned}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* My Courses */}
        <section className="py-8">
          <div className="container">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900">Mis Cursos</h2>
                <button 
                  onClick={() => window.location.href = '/cursos'}
                  className="text-[#C33B80] hover:underline font-medium"
                >
                  Explorar más cursos
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF69B4] border-t-transparent"></div>
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                    >
                      {/* Course Thumbnail */}
                      <div className="h-48 bg-gradient-to-br from-[#FF69B4]/20 to-[#C33B80]/20 relative">
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getLevelColor(course.level)} text-white`}>
                          {course.level}
                        </div>
                        
                        {/* Progress Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200">
                          <div 
                            className="h-full bg-gradient-to-r from-[#FF69B4] to-[#C33B80]"
                            style={{ width: `${course.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                            {getStatusText(course.status)}
                          </span>
                          <span className="text-sm text-neutral-600">{course.progress_percentage}% completado</span>
                        </div>

                        <h3 className="text-lg font-bold text-neutral-900 mb-2">
                          {course.title}
                        </h3>
                        
                        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>

                        {/* Course Stats */}
                        <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
                          <div className="flex items-center">
                            <Play className="w-4 h-4 mr-1" />
                            <span>{course.completed_lessons || 0}/{course.lesson_count || 0} lecciones</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Inscrito {new Date(course.enrolled_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-neutral-600 mb-1">
                            <span>Progreso</span>
                            <span>{course.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#FF69B4] to-[#C33B80] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <button 
                            onClick={() => window.location.href = `/course/${course.id}/lessons`}
                            className="w-full bg-gradient-to-r from-[#FF69B4] to-[#C33B80] text-white font-medium py-2 px-4 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
                          >
                            {course.progress_percentage === 0 ? 'Comenzar Curso' : 'Continuar Aprendiendo'}
                          </button>
                          
                          <button 
                            onClick={() => window.location.href = `/cursos/${course.id}`}
                            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-600 mb-2">
                    Aún no tienes cursos inscritos
                  </h3>
                  <p className="text-neutral-500 mb-6">
                    Explora nuestro catálogo y comienza tu journey en el diseño de moda
                  </p>
                  <button 
                    onClick={() => window.location.href = '/cursos'}
                    className="bg-gradient-to-r from-[#FF69B4] to-[#C33B80] text-white font-semibold py-3 px-6 rounded-lg hover:scale-105 transition-transform duration-300"
                  >
                    Explorar Cursos
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Detailed Progress */}
        {enrolledCourses.length > 0 && (
          <section className="py-8 bg-gray-50">
            <div className="container">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Tu Progreso Detallado</h2>
                
                <div className="space-y-6">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                        <div className="flex items-center space-x-2">
                          {course.average_grade && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              Promedio: {course.average_grade}
                            </span>
                          )}
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {course.progress_percentage}% completado
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {course.completed_lessons}/{course.lesson_count}
                          </div>
                          <div className="text-sm text-gray-600">Lecciones Completadas</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {course.average_grade ? `${course.average_grade}%` : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">Calificación Promedio</div>
                        </div>
                        
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {course.last_activity ? 'Activo' : 'Inactivo'}
                          </div>
                          <div className="text-sm text-gray-600">Estado</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="w-full max-w-md">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progreso del curso</span>
                            <span>{course.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => router.push(`/courses/${course.id}`)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <section className="py-8 bg-white">
          <div className="container">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Actividad Reciente</h2>
              
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-neutral-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">Completaste la lección "Historia de la Moda"</p>
                    <p className="text-sm text-neutral-600">Hace 2 horas</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-neutral-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">Te inscribiste al curso "Diseño Digital para Moda"</p>
                    <p className="text-sm text-neutral-600">Hace 3 días</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-neutral-50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">¡Obtuviste tu primer certificado!</p>
                    <p className="text-sm text-neutral-600">Hace 1 semana</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}