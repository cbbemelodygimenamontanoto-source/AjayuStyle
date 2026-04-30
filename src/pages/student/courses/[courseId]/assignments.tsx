import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
  id: string;
  title: string;
  description: string;
  allowed_file_types: string;
  max_file_size_mb: number;
  due_date?: string;
  points: number;
  lesson_title?: string;
  created_at: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  file_name: string;
  file_path: string;
  submitted_at: string;
  status: string;
  score?: number;
  max_score?: number;
  feedback?: string;
  grade_status?: string;
}

export default function StudentAssignments() {
  const router = useRouter();
  const { courseId } = router.query;
  const { user, token } = useAuth();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<{ [key: string]: Submission }>({});
  const [loading, setLoading] = useState(true);
  const [submittingAssignment, setSubmittingAssignment] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (courseId && user) {
      loadData();
    }
  }, [courseId, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar tareas del curso
      const assignmentsRes = await fetch(`/api/courses/${courseId}/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);
        
        // Cargar entregas del estudiante
        await loadStudentSubmissions(assignmentsData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentSubmissions = async (assignmentsList: Assignment[]) => {
    try {
      // Obtener entregas del estudiante para todas las tareas
      const submissionsData: { [key: string]: Submission } = {};
      
      for (const assignment of assignmentsList) {
        const response = await fetch(
          `/api/courses/${courseId}/assignments/${assignment.id}/submissions?student_id=${user?.id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (response.ok) {
          const studentSubmissions = await response.json();
          // Tomar la última entrega si hay múltiples
          if (studentSubmissions.length > 0) {
            submissionsData[assignment.id] = studentSubmissions[0];
          }
        }
      }
      
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error cargando entregas:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño del archivo
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB por defecto
    if (file.size > maxSizeBytes) {
      alert('El archivo es demasiado grande. El tamaño máximo es 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setSubmittingAssignment(assignmentId);

      // Simular subida de archivo (en un caso real, usarías FormData)
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('student_id', user?.id || '');
      formData.append('file_name', selectedFile.name);
      formData.append('file_path', `/uploads/${selectedFile.name}`);
      formData.append('file_size', selectedFile.size.toString());

      const response = await fetch(
        `/api/courses/${courseId}/assignments/${assignmentId}/submissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        alert('Tarea entregada exitosamente');
        setSelectedFile(null);
        setSubmittingAssignment(null);
        await loadData(); // Recargar datos
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error enviando tarea:', error);
      alert('Error enviando la tarea');
    } finally {
      setSubmittingAssignment(null);
    }
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const submission = submissions[assignment.id];
    if (!submission) return 'not_submitted';
    
    if (submission.grade_status === 'approved') return 'approved';
    if (submission.grade_status === 'rejected') return 'rejected';
    if (submission.status === 'graded') return 'graded';
    return 'submitted';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'graded': return 'text-blue-600 bg-blue-100';
      case 'submitted': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Reprobado';
      case 'graded': return 'Calificado';
      case 'submitted': return 'Entregado';
      default: return 'No entregado';
    }
  };

  const isOverdue = (assignment: Assignment) => {
    if (!assignment.due_date) return false;
    return new Date(assignment.due_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mis Tareas - Curso #{courseId}
        </h1>
        <p className="text-gray-600">
          Entrega tus tareas y revisa tu progreso
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500 text-lg">
            No hay tareas disponibles para este curso.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment) => {
            const submission = submissions[assignment.id];
            const status = getSubmissionStatus(assignment);
            const overdue = isOverdue(assignment);

            return (
              <div key={assignment.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {assignment.title}
                      </h3>
                      {assignment.lesson_title && (
                        <p className="text-sm text-blue-600 mb-2">
                          📚 Lección: {assignment.lesson_title}
                        </p>
                      )}
                      <p className="text-gray-700 mb-4">{assignment.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <span>📁 {JSON.parse(assignment.allowed_file_types).join(', ').toUpperCase()}</span>
                        <span>💾 {assignment.max_file_size_mb}MB máximo</span>
                        <span>🏆 {assignment.points} puntos</span>
                        {assignment.due_date && (
                          <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                            📅 Vence: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Estado de la entrega */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                        {submission && (
                          <span className="text-sm text-gray-500">
                            Entregado: {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                        )}
                        {overdue && status === 'not_submitted' && (
                          <span className="text-red-600 text-sm font-medium">
                            ⚠️ Vencido
                          </span>
                        )}
                      </div>

                      {/* Calificación */}
                      {submission && submission.score !== undefined && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Calificación:</span>
                            <span className={`font-bold ${
                              submission.score / submission.max_score >= 0.71 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {submission.score}/{submission.max_score} 
                              ({Math.round(submission.score / submission.max_score * 100)}%)
                            </span>
                          </div>
                          {submission.feedback && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Retroalimentación:</strong> {submission.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formulario de entrega */}
                  {status === 'not_submitted' && !overdue && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Entregar Tarea</h4>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          accept={JSON.parse(assignment.allowed_file_types).map((type: string) => `.${type}`).join(',')}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                        />
                        <button
                          onClick={() => handleSubmitAssignment(assignment.id)}
                          disabled={!selectedFile || submittingAssignment === assignment.id}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingAssignment === assignment.id ? 'Enviando...' : 'Entregar'}
                        </button>
                      </div>
                      {selectedFile && (
                        <p className="text-sm text-gray-600 mt-2">
                          Archivo seleccionado: {selectedFile.name} 
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Archivo ya entregado */}
                  {submission && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Archivo Entregado</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📄</span>
                        <span>{submission.file_name}</span>
                        <button className="text-blue-600 hover:underline ml-4">
                          Descargar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}