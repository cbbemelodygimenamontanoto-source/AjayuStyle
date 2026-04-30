import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface AssignmentSubmissionProps {
  lessonId: number;
  assignmentTitle: string;
  onSubmit?: () => void;
}

export default function AssignmentSubmission({ lessonId, assignmentTitle, onSubmit }: AssignmentSubmissionProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Por favor escribe el contenido de tu tarea');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lessonId,
          assignmentTitle,
          content: content.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Tarea enviada exitosamente');
        setContent('');
        onSubmit?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error enviando la tarea');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error enviando la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Enviar Tarea: {assignmentTitle}
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="assignment-content" className="block text-sm font-medium text-gray-700 mb-2">
            Tu respuesta:
          </label>
          <textarea
            id="assignment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Escribe aquí tu respuesta, código, o cualquier material relacionado con la tarea..."
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar Tarea'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">Consejos para enviar tu tarea:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Asegúrate de que tu respuesta esté completa y bien organizada</li>
          <li>• Si es código, incluye comentarios explicativos</li>
          <li>• Revisa la ortografía y gramática antes de enviar</li>
          <li>• Una vez enviada, no podrás editarla (contacta al instructor si necesitas hacer cambios)</li>
        </ul>
      </div>
    </div>
  );
}