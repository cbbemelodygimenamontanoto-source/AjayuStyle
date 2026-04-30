import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import GradeSubmission from '@/components/GradeSubmission';
import { toast } from 'react-hot-toast';

interface Submission {
  id: number;
  user_id: number;
  lesson_id: number;
  assignment_title: string;
  content: string;
  submitted_at: string;
  status: string;
  user_name: string;
  course_title: string;
  lesson_title: string;
  grade?: number;
  feedback?: string;
  course_id: number;
}

export default function InstructorSubmissions() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  useEffect(() => {
    if (!hasRole('instructor')) {
      router.push('/dashboard');
      return;
    }
    fetchSubmissions();
  }, [filterStatus, selectedCourse]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('status', filterStatus);
      if (selectedCourse) params.append('courseId', selectedCourse);

      const response = await fetch(`/api/instructor/submissions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        toast.error('Error cargando las tareas');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error cargando las tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSuccess = () => {
    setSelectedSubmission(null);
    fetchSubmissions();
    toast.success('Tarea calificada exitosamente');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      graded: 'bg-green-100 text-green-800',
      needs_revision: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendiente',
      graded: 'Calificada',
      needs_revision: 'Necesita Revisión'
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (selectedSubmission) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="mb-6">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a la lista
              </button>
            </div>
            
            <GradeSubmission
              submissionId={selectedSubmission.id}
              onGrade={handleGradeSuccess}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Tareas
            </h1>
            <p className="text-gray-600">
              Califica y gestiona las tareas enviadas por los estudiantes
            </p>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  id="status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pendientes</option>
                  <option value="graded">Calificadas</option>
                  <option value="all">Todas</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                  Curso
                </label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los cursos</option>
                  <option value="7">Introducción a JavaScript</option>
                  <option value="8">React Avanzado</option>
                  <option value="9">Diseño UX/UI</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de tareas */}
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando tareas...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No hay tareas para mostrar
                </h3>
                <p className="text-gray-500">
                  No se encontraron tareas con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Curso / Lección
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarea
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enviada
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Calificación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.user_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {submission.course_title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.lesson_title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {submission.assignment_title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(submission.submitted_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(submission.status)}`}>
                            {getStatusText(submission.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.grade ? (
                            <div className="text-sm">
                              <span className="font-medium text-green-600">{submission.grade}</span>
                              {submission.feedback && (
                                <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                  {submission.feedback}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {submission.status === 'pending' ? 'Calificar' : 'Ver'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}