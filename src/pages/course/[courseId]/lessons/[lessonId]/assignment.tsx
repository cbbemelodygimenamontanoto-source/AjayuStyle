import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Download,
  Calendar,
  Award,
  MessageSquare
} from 'lucide-react';
// Removed mock data import - now using real database data

interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description: string;
  file_types_allowed: string;
  max_file_size_mb: number;
  due_date: Date;
  points_possible: number;
  created_at: Date;
  lesson_title: string;
  status: 'pending' | 'submitted' | 'graded';
  submission?: {
    id: number;
    file_name: string;
    submitted_at: Date;
    score?: number;
    feedback?: string;
    grade_status?: string;
  };
}

export default function AssignmentPage() {
  const router = useRouter();
  const { courseId, lessonId } = router.query;
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (courseId && lessonId) {
      fetchAssignmentData();
    }
  }, [courseId, lessonId]);

  const fetchAssignmentData = async () => {
    try {

      
      // Construir headers para la petición
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Si hay usuario autenticado, agregar token
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      
      // Llamar a la API para obtener los datos del curso y sus tareas
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      
      const courseData = await response.json();

      
      // Buscar la tarea específica de esta lección
      const assignment = courseData.assignments?.find((a: any) => a.lesson_id == lessonId);
      
      if (!assignment) {

        setAssignment(null);
        return;
      }
      
      // Obtener información de la lección
      const lesson = courseData.lessons?.find((l: any) => l.id == lessonId);
      
      // Obtener información de envíos si el usuario está autenticado
      let submission = null;
      if (user?.token) {
        try {
          const submissionResponse = await fetch(`/api/assignments/${assignment.id}/submission`, {
            method: 'GET',
            headers,
          });
          
          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            submission = submissionData.submission || null;
          }
        } catch (error) {

        }
      }
      
      // Formatear la tarea
      const formattedAssignment: Assignment = {
        id: assignment.id,
        course_id: parseInt(courseId!.toString()),
        title: assignment.title,
        description: assignment.description,
        file_types_allowed: assignment.file_types_allowed || 'pdf, zip, jpg, png, docx',
        max_file_size_mb: assignment.max_file_size_mb || 50,
        due_date: new Date(assignment.due_date),
        points_possible: assignment.points_possible,
        created_at: new Date(),
        lesson_title: lesson?.title || 'Lección',
        status: submission ? (submission.score !== null ? 'graded' : 'submitted') : 'pending',
        submission: submission ? {
          id: submission.id,
          file_name: submission.file_name,
          submitted_at: new Date(submission.submitted_at),
          score: submission.score,
          feedback: submission.feedback,
          grade_status: submission.grade_status
        } : undefined
      };
      
      setAssignment(formattedAssignment);

      
    } catch (error: any) {

      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmission = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    
    // Simular subida de archivo
    setTimeout(() => {
      setUploading(false);
      setShowSubmissionModal(false);
      setSelectedFile(null);
      
      // Actualizar estado de la tarea
      if (assignment) {
        setAssignment({
          ...assignment,
          status: 'submitted',
          submission: {
            id: Date.now(),
            file_name: selectedFile.name,
            submitted_at: new Date()
          }
        });
      }
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Enviado';
      case 'graded': return 'Calificado';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#A848F0] mx-auto"></div>
            <p className="mt-4 text-neutral-600">Cargando tarea...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!assignment) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Tarea no encontrada</h1>
            <Link href={`/course/${courseId}/lessons`} className="text-[#A848F0] hover:text-[#00FFE2]">
              Volver a las lecciones
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const daysRemaining = Math.ceil((assignment.due_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <section className="bg-white border-b border-neutral-200">
          <div className="container py-8">
            <div className="max-w-4xl mx-auto">
              <Link 
                href={`/course/${courseId}/lessons`}
                className="text-[#A848F0] hover:text-[#00FFE2] mb-4 inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a las lecciones
              </Link>
              
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">{assignment.title}</h1>
                  <p className="text-neutral-600 mb-4">Lección: {assignment.lesson_title}</p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                      {getStatusText(assignment.status)}
                    </span>
                    <div className="flex items-center text-neutral-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      Vence: {assignment.due_date.toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-neutral-600">
                      <Award className="w-4 h-4 mr-1" />
                      {assignment.points_possible} puntos
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {daysRemaining > 0 ? (
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{daysRemaining}</div>
                      <div className="text-sm text-neutral-600">días restantes</div>
                    </div>
                  ) : daysRemaining === 0 ? (
                    <div>
                      <div className="text-2xl font-bold text-orange-600">¡Hoy!</div>
                      <div className="text-sm text-neutral-600">fecha límite</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold text-red-600">{Math.abs(daysRemaining)}</div>
                      <div className="text-sm text-neutral-600">días atrasado</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Assignment Details */}
        <section className="py-8">
          <div className="container">
            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="md:col-span-2 space-y-6">
                {/* Description */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">Descripción de la Tarea</h2>
                  <div className="prose text-neutral-700">
                    <p>{assignment.description}</p>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">Requisitos</h2>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>Formatos permitidos: {assignment.file_types_allowed}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>Tamaño máximo: {assignment.max_file_size_mb} MB</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>Puntuación máxima: {assignment.points_possible} puntos</span>
                    </div>
                  </div>
                </div>

                {/* Submission Status */}
                {assignment.submission && (
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4">Estado de Envío</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                          <div>
                            <p className="font-medium text-neutral-900">Enviado exitosamente</p>
                            <p className="text-sm text-neutral-600">
                              {assignment.submission.file_name} • {assignment.submission.submitted_at.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button className="text-[#A848F0] hover:text-[#00FFE2] font-medium">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      {assignment.submission.score !== undefined && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-neutral-900">Calificación</h3>
                            <span className="text-2xl font-bold text-blue-600">
                              {assignment.submission.score}/{assignment.points_possible}
                            </span>
                          </div>
                          
                          {assignment.submission.feedback && (
                            <div className="mt-3">
                              <h4 className="font-medium text-neutral-900 mb-2">Retroalimentación del instructor:</h4>
                              <div className="bg-white p-3 rounded border">
                                <p className="text-neutral-700">{assignment.submission.feedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Acciones</h3>
                  
                  {assignment.status === 'pending' && (
                    <button
                      onClick={() => setShowSubmissionModal(true)}
                      className="w-full bg-gradient-to-r from-[#00FFE2] to-[#A848F0] text-white font-medium py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Tarea
                    </button>
                  )}
                  
                  {assignment.status === 'submitted' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowSubmissionModal(true)}
                        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Enviar Nueva Versión
                      </button>
                      <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Mi Envío
                      </button>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Cronología</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-[#A848F0] rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium">Tarea publicada</p>
                        <p className="text-neutral-600">{assignment.created_at.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {assignment.submission && (
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium">Enviado</p>
                          <p className="text-neutral-600">{assignment.submission.submitted_at.toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        daysRemaining >= 0 ? 'bg-orange-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">Fecha límite</p>
                        <p className="text-neutral-600">{assignment.due_date.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Submission Modal */}
        {showSubmissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-xl font-bold text-neutral-900">Enviar Tarea</h3>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seleccionar archivo
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept={assignment.file_types_allowed.split(',').map(ext => `.${ext.trim()}`).join(',')}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#A848F0] focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-600 mt-1">
                    Formatos: {assignment.file_types_allowed} • Máximo: {assignment.max_file_size_mb} MB
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSubmissionModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmission}
                    disabled={!selectedFile || uploading}
                    className="flex-1 bg-gradient-to-r from-[#00FFE2] to-[#A848F0] text-white font-medium py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}