import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { Upload, FileText, Clock, CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface Assignment {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  due_date?: Date;
  max_score: number;
  course_id: number;
  created_at: Date;
  submission?: AssignmentSubmission;
}

interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  file_url?: string;
  text_submission?: string;
  submitted_at?: Date;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
}

interface Course {
  id: number;
  title: string;
  instructor_id: number;
  instructor_name?: string;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [textSubmissions, setTextSubmissions] = useState<Record<number, string>>({});

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
      fetchAssignments();
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

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('ajayu_token');
      const response = await fetch(`/api/student/course/${courseId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      } else {
        const errorData = await response.json();
        console.error('Error fetching assignments:', errorData.message);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (assignmentId: number, file: File) => {
    setUploading(assignmentId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('ajayu_token');
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Actualizar la lista de assignments
        await fetchAssignments();
        alert('¡Archivo subido exitosamente!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo');
    } finally {
      setUploading(null);
    }
  };

  const handleTextSubmission = async (assignmentId: number) => {
    const text = textSubmissions[assignmentId];
    if (!text?.trim()) {
      alert('Por favor escribe tu respuesta antes de enviar');
      return;
    }

    setSubmitting(assignmentId);
    try {
      const token = localStorage.getItem('ajayu_token');
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text_submission: text.trim()
        })
      });

      if (response.ok) {
        await fetchAssignments();
        setTextSubmissions(prev => ({ ...prev, [assignmentId]: '' }));
        alert('¡Respuesta enviada exitosamente!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting text:', error);
      alert('Error al enviar la respuesta');
    } finally {
      setSubmitting(null);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: Date | string) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusIcon = (assignment: Assignment) => {
    if (assignment.submission?.status === 'graded') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (assignment.submission?.status === 'submitted') {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    } else if (assignment.due_date && isOverdue(assignment.due_date)) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = (assignment: Assignment) => {
    if (assignment.submission?.status === 'graded') {
      return `Calificado (${assignment.submission.score}/${assignment.max_score})`;
    } else if (assignment.submission?.status === 'submitted') {
      return 'Enviado - Pendiente de calificación';
    } else if (assignment.due_date && isOverdue(assignment.due_date)) {
      return 'Vencido';
    }
    return 'Pendiente';
  };

  const getStatusColor = (assignment: Assignment) => {
    if (assignment.submission?.status === 'graded') {
      return 'text-green-600';
    } else if (assignment.submission?.status === 'submitted') {
      return 'text-yellow-600';
    } else if (assignment.due_date && isOverdue(assignment.due_date)) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF69B4]"></div>
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
                <h1 className="text-3xl font-bold text-gray-900">Tareas del Curso</h1>
                <p className="text-gray-600 mt-2">{course?.title}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push(`/courses/${courseId}/lessons`)}
                  variant="outline"
                >
                  Volver a Lecciones
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Tareas */}
          <div className="space-y-6">
            {assignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay tareas asignadas
                </h3>
                <p className="text-gray-600">
                  El instructor aún no ha publicado tareas para este curso.
                </p>
              </div>
            ) : (
              assignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-500 mr-3">
                            Tarea {index + 1}
                          </span>
                          <div className="flex items-center">
                            {getStatusIcon(assignment)}
                            <span className={`ml-2 text-sm font-medium ${getStatusColor(assignment)}`}>
                              {getStatusText(assignment)}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {assignment.title}
                        </h3>
                        {assignment.description && (
                          <p className="text-gray-600 mb-4">{assignment.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Puntuación máxima</div>
                        <div className="text-lg font-bold text-gray-900">{assignment.max_score} pts</div>
                      </div>
                    </div>

                    {assignment.instructions && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Instrucciones:</h4>
                        <p className="text-gray-700 text-sm">{assignment.instructions}</p>
                      </div>
                    )}

                    {assignment.due_date && (
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          Fecha límite: {formatDate(assignment.due_date)}
                          {isOverdue(assignment.due_date) && !assignment.submission && (
                            <span className="ml-2 text-red-600 font-medium">(Vencido)</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Feedback del instructor */}
                    {assignment.submission?.feedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">Retroalimentación del Instructor:</h4>
                        <p className="text-blue-800 text-sm">{assignment.submission.feedback}</p>
                      </div>
                    )}

                    {/* Estado de la entrega */}
                    {assignment.submission ? (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Tu Entrega:</h4>
                            {assignment.submission.file_url ? (
                              <div className="flex items-center text-sm text-gray-600">
                                <FileText className="w-4 h-4 mr-1" />
                                <a
                                  href={assignment.submission.file_url}
                                  download
                                  className="text-[#FF69B4] hover:underline flex items-center"
                                >
                                  Descargar archivo enviado
                                  <Download className="w-3 h-3 ml-1" />
                                </a>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                <strong>Respuesta escrita enviada</strong>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Enviado: {assignment.submission.submitted_at && formatDate(assignment.submission.submitted_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            {assignment.submission.status === 'graded' ? (
                              <div>
                                <div className="text-sm text-gray-500">Calificación</div>
                                <div className="text-xl font-bold text-green-600">
                                  {assignment.submission.score}/{assignment.max_score}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-yellow-600">Pendiente de calificación</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Formulario de entrega */
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-4">Entregar Tarea:</h4>
                        
                        {/* Opción de subida de archivo */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subir archivo
                          </label>
                          <div className="flex items-center space-x-4">
                            <input
                              type="file"
                              id={`file-${assignment.id}`}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(assignment.id, file);
                                }
                              }}
                            />
                            <Button
                              onClick={() => document.getElementById(`file-${assignment.id}`)?.click()}
                              disabled={uploading === assignment.id}
                              className="bg-[#FF69B4] hover:bg-[#FF69B4] text-black"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {uploading === assignment.id ? 'Subiendo...' : 'Seleccionar Archivo'}
                            </Button>
                            <span className="text-xs text-gray-500">
                              PDF, DOC, DOCX, TXT, ZIP, RAR (máx. 10MB)
                            </span>
                          </div>
                        </div>

                        {/* Opción de respuesta escrita */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            O escribir respuesta aquí
                          </label>
                          <textarea
                            value={textSubmissions[assignment.id] || ''}
                            onChange={(e) => setTextSubmissions(prev => ({
                              ...prev,
                              [assignment.id]: e.target.value
                            }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF69B4] focus:border-transparent"
                            placeholder="Escribe tu respuesta aquí..."
                          />
                        </div>

                        <Button
                          onClick={() => handleTextSubmission(assignment.id)}
                          disabled={submitting === assignment.id}
                          variant="outline"
                        >
                          {submitting === assignment.id ? 'Enviando...' : 'Enviar Respuesta'}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}