import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Submission {
  id: number;
  user_id: number;
  assignment_id: number;
  text_submission: string;
  file_url?: string;
  submitted_at: string;
  grade?: number;
  feedback?: string;
  graded_at?: string;
  user_name: string;
  user_email: string;
  course_title: string;
  course_id: number;
  lesson_title: string;
  assignment_title: string;
  max_points: number;
  status: string;
}

interface GradeSubmissionProps {
  submissionId: number;
  onGrade?: () => void;
}

export default function GradeSubmission({ submissionId, onGrade }: GradeSubmissionProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(85);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/instructor/grades?status=pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const submissions = await response.json();
        const currentSubmission = submissions.find((s: Submission) => s.id === submissionId);
        if (currentSubmission) {
          setSubmission(currentSubmission);
          
          // Si ya tiene calificación, cargar los valores
          if (currentSubmission.grade !== null && currentSubmission.grade !== undefined) {
            setGrade(currentSubmission.grade);
          }
          if (currentSubmission.feedback) {
            setFeedback(currentSubmission.feedback);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error cargando la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const maxPoints = submission?.max_points || 100;
    if (grade < 0 || grade > maxPoints) {
      toast.error(`La calificación debe estar entre 0 y ${maxPoints}`);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/instructor/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionId,
          grade,
          feedback: feedback.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Tarea calificada exitosamente');
        onGrade?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error calificando la tarea');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error calificando la tarea');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          Tarea no encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Calificar Tarea
            </h2>
            <p className="text-sm text-gray-600">
              {submission.user_name} • {submission.course_title}
            </p>
            <p className="text-sm text-gray-600">
              {submission.lesson_title} • {submission.assignment_title}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Enviada el {new Date(submission.submitted_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Contenido de la tarea */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Contenido de la Tarea:
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
            {submission.text_submission ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {submission.text_submission}
              </pre>
            ) : submission.file_url ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Archivo adjunto:</p>
                <a 
                  href={submission.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Descargar archivo
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No hay contenido de texto ni archivo adjunto</p>
            )}
          </div>
        </div>

        {/* Formulario de calificación */}
        <form onSubmit={handleSubmitGrade}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                Calificación (0-100)
              </label>
              <input
                type="number"
                id="grade"
                min="0"
                max={submission.max_points || 100}
                value={grade}
                onChange={(e) => setGrade(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="mt-1 text-xs text-gray-500">
                Puntuación máxima: {submission.max_points || 100} puntos
              </div>
            </div>

            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Retroalimentación (opcional)
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Proporciona retroalimentación constructiva al estudiante..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onGrade}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Calificando...' : 'Calificar y Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}