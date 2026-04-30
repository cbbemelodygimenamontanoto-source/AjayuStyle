import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_name: string;
  file_path: string;
  submitted_at: string;
  status: string;
  student_name: string;
  student_email: string;
  score?: number;
  max_score?: number;
  feedback?: string;
  grade_status?: string;
  assignment_title?: string;
  max_points?: number;
}

interface GradeForm {
  score: string;
  max_score: string;
  feedback: string;
  status: 'approved' | 'rejected' | 'needs_revision';
}

export default function GradeAssignments() {
  const router = useRouter();
  const { courseId, assignmentId } = router.query;
  const { user, token } = useAuth();
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  const [gradeForm, setGradeForm] = useState<GradeForm>({
    score: '',
    max_score: '100',
    feedback: '',
    status: 'approved'
  });

  useEffect(() => {
    if (courseId && assignmentId && user) {
      loadSubmissions();
    }
  }, [courseId, assignmentId, user]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `/api/courses/${courseId}/assignments/${assignmentId}/submissions`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
        
        // Obtener el título de la tarea (de la primera entrega)
        if (data.length > 0 && data[0].assignment_title) {
          setAssignmentTitle(data[0].assignment_title);
        }
      }
    } catch (error) {
      console.error('Error cargando entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      score: submission.score?.toString() || '',
      max_score: submission.max_score?.toString() || '100',
      feedback: submission.feedback || '',
      status: submission.grade_status || 'approved'
    });
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;

    const score = parseFloat(gradeForm.score);
    const maxScore = parseFloat(gradeForm.max_score);

    if (score < 0 || score > maxScore) {
      alert('La puntuación debe estar entre 0 y la puntuación máxima');
      return;
    }

    try {
      setGradingSubmission(selectedSubmission.id);

      const response = await fetch(
        `/api/courses/${courseId}/assignments/${assignmentId}/grade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            submission_id: selectedSubmission.id,
            instructor_id: user?.id,
            score,
            max_score: maxScore,
            feedback: gradeForm.feedback,
            status: gradeForm.status
          })
        }
      );

      if (response.ok) {
        alert('Calificación guardada exitosamente');
        setShowGradeModal(false);
        await loadSubmissions(); // Recargar datos
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error guardando calificación:', error);
      alert('Error guardando la calificación');
    } finally {
      setGradingSubmission(null);
    }
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    return Math.round((score / maxScore) * 100);
  };

  const getGradeStatus = (score: number, maxScore: number) => {
    const percentage = calculatePercentage(score, maxScore);
    if (percentage >= 71) return { text: 'Aprobado', color: 'text-green-600 bg-green-100' };
    return { text: 'Reprobado', color: 'text-red-600 bg-red-100' };
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-yellow-600 bg-yellow-100';
      case 'graded': return 'text-blue-600 bg-blue-100';
      case 'late': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Calificar Tareas
        </h1>
        {assignmentTitle && (
          <p className="text-xl text-gray-700 mb-2">{assignmentTitle}</p>
        )}
        <p className="text-gray-600">
          {submissions.length} entrega(s) recibida(s)
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500 text-lg">
            No hay entregas para calificar.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Entrega
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
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.student_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.student_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">📄</span>
                        <div>
                          <div className="text-sm text-gray-900">
                            {submission.file_name}
                          </div>
                          <button className="text-xs text-blue-600 hover:underline">
                            Descargar
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(submission.submitted_at).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubmissionStatusColor(submission.status)}`}>
                        {submission.status === 'submitted' ? 'Entregado' : 
                         submission.status === 'graded' ? 'Calificado' : 'Tardío'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.score !== undefined ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.score}/{submission.max_score}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({calculatePercentage(submission.score, submission.max_score)}%)
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGradeStatus(submission.score, submission.max_score).color}`}>
                            {getGradeStatus(submission.score, submission.max_score).text}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sin calificar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openGradeModal(submission)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        {submission.score !== undefined ? 'Editar' : 'Calificar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Calificación */}
      {showGradeModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Calificar Entrega - {selectedSubmission.student_name}
              </h2>
              <button
                onClick={() => setShowGradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Archivo:</strong> {selectedSubmission.file_name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Entregado:</strong> {new Date(selectedSubmission.submitted_at).toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puntuación Obtenida *
                  </label>
                  <input
                    type="number"
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, score: e.target.value }))}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puntuación Máxima *
                  </label>
                  <input
                    type="number"
                    value={gradeForm.max_score}
                    onChange={(e) => setGradeForm(prev => ({ ...prev, max_score: e.target.value }))}
                    min="1"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de la Calificación
                </label>
                <select
                  value={gradeForm.status}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Reprobado</option>
                  <option value="needs_revision">Necesita Revisión</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retroalimentación
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Escribe comentarios y sugerencias para el estudiante..."
                />
              </div>

              {/* Vista previa de la calificación */}
              {gradeForm.score && gradeForm.max_score && (
                <div className="p-3 bg-blue-50 rounded border">
                  <h4 className="font-medium text-blue-900 mb-2">Vista Previa</h4>
                  <div className="text-sm text-blue-800">
                    <p>
                      <strong>Porcentaje:</strong> {calculatePercentage(
                        parseFloat(gradeForm.score), 
                        parseFloat(gradeForm.max_score)
                      )}%
                    </p>
                    <p>
                      <strong>Estado:</strong> {getGradeStatus(
                        parseFloat(gradeForm.score), 
                        parseFloat(gradeForm.max_score)
                      ).text}
                    </p>
                    <p>
                      <strong>Criterio:</strong> ≥ 71% = Aprobado, &lt; 71% = Reprobado
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={gradingSubmission === selectedSubmission.id}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {gradingSubmission === selectedSubmission.id ? 'Guardando...' : 'Guardar Calificación'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}