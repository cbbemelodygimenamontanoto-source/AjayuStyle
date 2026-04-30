import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  BookOpen, 
  Users, 
  Star,
  Save,
  X,
  Eye,
  Calendar,
  Clock,
  FileText,
  Award
} from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  description?: string;
  content: string;
  video_url?: string;
  lesson_type: 'video' | 'document' | 'text' | 'quiz' | 'assignment' | 'live';
  estimated_minutes: number;
  order_index: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  price: number;
  published: boolean;
  instructor_id: number;
  lessons: Lesson[];
  lesson_count: number;
  average_rating: number;
  total_reviews: number;
  total_students: number;
}

interface Assignment {
  id: number;
  lesson_id: number;
  title: string;
  description: string;
  due_date?: string;
  max_points: number;
  submissions_count: number;
  average_grade?: number;
}

export default function ManageCourse() {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [newLesson, setNewLesson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Estados para formularios
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
    lesson_type: 'video',
    estimated_minutes: 30,
    order_index: 1,
    is_preview: false
  });

  // Estados para formulario de tareas
  const [assignmentForm, setAssignmentForm] = useState({
    lesson_id: '',
    title: '',
    description: '',
    due_date: '',
    points_possible: 100,
    file_types_allowed: ['pdf', 'docx', 'txt'],
    max_file_size_mb: 10
  });

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ajayu_token');
      
      // Obtener datos del curso
      const courseResponse = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData);
        setLessons(courseData.lessons || []);
      }

      // Obtener tareas del curso
      const assignmentsResponse = await fetch(`/api/instructor/assignments?courseId=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments || []);
      }

    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('ajayu_token');
      
      const response = await fetch(`/api/instructor/lessons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: parseInt(courseId as string),
          ...lessonForm
        })
      });

      if (response.ok) {
        await fetchCourseData();
        setNewLesson(false);
        resetLessonForm();
        alert('Lección creada exitosamente');
      } else {
        alert('Error al crear la lección');
      }
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Error al crear la lección');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('ajayu_token');
      
      const response = await fetch(`/api/instructor/lessons/${editingLesson.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonForm)
      });

      if (response.ok) {
        await fetchCourseData();
        setEditingLesson(null);
        resetLessonForm();
        alert('Lección actualizada exitosamente');
      } else {
        alert('Error al actualizar la lección');
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('Error al actualizar la lección');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      return;
    }

    try {
      const token = localStorage.getItem('ajayu_token');
      
      const response = await fetch(`/api/instructor/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchCourseData();
        alert('Lección eliminada exitosamente');
      } else {
        alert('Error al eliminar la lección');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Error al eliminar la lección');
    }
  };

  const handleCreateAssignment = () => {
    setShowAssignmentModal(true);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('ajayu_token');
      
      const response = await fetch(`/api/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lesson_id: assignmentForm.lesson_id || null,
          title: assignmentForm.title,
          description: assignmentForm.description,
          due_date: assignmentForm.due_date || null,
          points_possible: assignmentForm.points_possible,
          file_types_allowed: assignmentForm.file_types_allowed,
          max_file_size_mb: assignmentForm.max_file_size_mb
        })
      });

      if (response.ok) {
        await fetchCourseData();
        setShowAssignmentModal(false);
        resetAssignmentForm();
        alert('Tarea creada exitosamente');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al crear la tarea');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Error al crear la tarea');
    } finally {
      setSaving(false);
    }
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      lesson_id: '',
      title: '',
      description: '',
      due_date: '',
      points_possible: 100,
      file_types_allowed: ['pdf', 'docx', 'txt'],
      max_file_size_mb: 10
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      description: '',
      content: '',
      video_url: '',
      lesson_type: 'video',
      estimated_minutes: 30,
      order_index: lessons.length + 1,
      is_preview: false
    });
  };

  const startEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      lesson_type: lesson.lesson_type,
      estimated_minutes: lesson.estimated_minutes,
      order_index: lesson.order_index,
      is_preview: lesson.is_preview
    });
  };

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'document': return 'bg-green-100 text-green-800';
      case 'text': return 'bg-gray-100 text-gray-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      case 'assignment': return 'bg-orange-100 text-orange-800';
      case 'live': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video';
      case 'document': return 'Documento';
      case 'text': return 'Texto';
      case 'quiz': return 'Quiz';
      case 'assignment': return 'Tarea';
      case 'live': return 'En Vivo';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando gestión del curso...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso no encontrado</h1>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              Volver al dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
                  ← Volver al Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">Gestionar Curso</h1>
                <p className="text-gray-600 mt-1">{course.title}</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/courses/${courseId}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Info
                </Link>
                <Link
                  href={`/courses/${courseId}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Público
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lessons'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Lecciones ({lessons.length})
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tareas ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'submissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Envíos de Estudiantes
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Curso</h3>
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Título</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.description}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nivel</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.level === 'principiante' ? 'bg-green-100 text-green-800' :
                          course.level === 'intermedio' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {course.level}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Precio</dt>
                      <dd className="mt-1 text-sm text-gray-900">${course.price}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Estado</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.published ? 'Publicado' : 'Borrador'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Lecciones</p>
                        <p className="text-lg font-semibold">{course.lesson_count || lessons.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Estudiantes</p>
                        <p className="text-lg font-semibold">{course.total_students || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Calificación</p>
                        <p className="text-lg font-semibold">{course.average_rating || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Lecciones</h3>
                <button
                  onClick={() => setNewLesson(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Lección
                </button>
              </div>

              {/* Formulario de nueva/edición de lección */}
              {(newLesson || editingLesson) && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {editingLesson ? 'Editar Lección' : 'Nueva Lección'}
                    </h4>
                    <button
                      onClick={() => {
                        setNewLesson(false);
                        setEditingLesson(null);
                        resetLessonForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título de la Lección
                      </label>
                      <input
                        type="text"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ingresa el título de la lección"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Contenido
                      </label>
                      <select
                        value={lessonForm.lesson_type}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, lesson_type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="video">Video</option>
                        <option value="document">Documento</option>
                        <option value="text">Texto</option>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Tarea</option>
                        <option value="live">En Vivo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración Estimada (minutos)
                      </label>
                      <input
                        type="number"
                        value={lessonForm.estimated_minutes}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, estimated_minutes: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Orden
                      </label>
                      <input
                        type="number"
                        value={lessonForm.order_index}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL del Video (opcional)
                      </label>
                      <input
                        type="url"
                        value={lessonForm.video_url}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, video_url: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://ejemplo.com/video.mp4"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={lessonForm.description}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe el contenido de la lección"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contenido
                      </label>
                      <textarea
                        value={lessonForm.content}
                        onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contenido detallado de la lección"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={lessonForm.is_preview}
                          onChange={(e) => setLessonForm(prev => ({ ...prev, is_preview: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Mostrar como vista previa gratuita
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setNewLesson(false);
                        setEditingLesson(null);
                        resetLessonForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}
                      disabled={saving || !lessonForm.title}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Guardando...' : 'Guardar Lección'}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de lecciones */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">Lecciones del Curso</h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {lessons.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay lecciones creadas aún</p>
                      <p className="text-sm">Haz clic en "Nueva Lección" para empezar</p>
                    </div>
                  ) : (
                    lessons.map((lesson) => (
                      <div key={lesson.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-500">
                                Lección {lesson.order_index}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLessonTypeColor(lesson.lesson_type)}`}>
                                {getLessonTypeLabel(lesson.lesson_type)}
                              </span>
                              {lesson.is_preview && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Vista Previa
                                </span>
                              )}
                            </div>
                            <h5 className="text-lg font-semibold text-gray-900 mt-1">{lesson.title}</h5>
                            {lesson.description && (
                              <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {lesson.estimated_minutes} min
                              </div>
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-1" />
                                {lesson.content ? 'Con contenido' : 'Sin contenido'}
                              </div>
                              {lesson.video_url && (
                                <div className="flex items-center">
                                  <Play className="w-4 h-4 mr-1" />
                                  Con video
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditLesson(lesson)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Tareas</h3>
                <button 
                  onClick={handleCreateAssignment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Tarea
                </button>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">Tareas del Curso</h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {assignments.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay tareas creadas aún</p>
                      <p className="text-sm">Las tareas se pueden crear para lecciones específicas</p>
                    </div>
                  ) : (
                    assignments.map((assignment) => (
                      <div key={assignment.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="text-lg font-semibold text-gray-900">{assignment.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Award className="w-4 h-4 mr-1" />
                                {assignment.max_points} puntos
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {assignment.submissions_count} envíos
                              </div>
                              {assignment.average_grade && (
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 mr-1" />
                                  Promedio: {assignment.average_grade}%
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Envíos de Estudiantes</h3>
              
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-900">Revisar Tareas Enviadas</h4>
                    <Link
                      href="/instructor/submissions"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver Todos los Envíos →
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay envíos para revisar</p>
                    <p className="text-sm">Los estudiantes aparecerán aquí cuando envíen tareas</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear tarea */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Crear Nueva Tarea</h3>
            <form onSubmit={handleSubmitAssignment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignar a Lección (Opcional)
                  </label>
                  <select
                    value={assignmentForm.lesson_id}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, lesson_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin asignar a lección específica</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        Lección {lesson.order_index}: {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título de la tarea *
                  </label>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Ejercicio práctico 1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe qué deben hacer los estudiantes..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    value={assignmentForm.due_date}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puntos máximos *
                  </label>
                  <input
                    type="number"
                    value={assignmentForm.points_possible}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, points_possible: parseInt(e.target.value) || 100 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipos de archivo permitidos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['pdf', 'docx', 'txt', 'zip', 'jpg', 'png'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={assignmentForm.file_types_allowed.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignmentForm(prev => ({
                                ...prev,
                                file_types_allowed: [...prev.file_types_allowed, type]
                              }));
                            } else {
                              setAssignmentForm(prev => ({
                                ...prev,
                                file_types_allowed: prev.file_types_allowed.filter(t => t !== type)
                              }));
                            }
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm">{type.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño máximo de archivo (MB)
                  </label>
                  <input
                    type="number"
                    value={assignmentForm.max_file_size_mb}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, max_file_size_mb: parseInt(e.target.value) || 10 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignmentModal(false);
                    resetAssignmentForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}