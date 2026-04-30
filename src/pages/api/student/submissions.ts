import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);

  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    if (req.method === 'GET') {
      // Obtener submissions del usuario o de un curso específico
      const { userId, courseId, lessonId } = req.query;
      
      // Por simplicidad, retornamos datos mock
      const mockSubmissions = [
        {
          id: 1,
          user_id: 2,
          lesson_id: 2,
          assignment_title: 'Ejercicio de Variables',
          content: 'Aquí está mi ejercicio de variables en JavaScript...',
          submitted_at: '2024-01-25T10:00:00Z',
          status: 'pending',
          grade: null,
          feedback: null
        },
        {
          id: 2,
          user_id: 2,
          lesson_id: 4,
          assignment_title: 'Control de Flujo',
          content: 'Ejercicios de if/else y bucles...',
          submitted_at: '2024-01-26T10:00:00Z',
          status: 'graded',
          grade: 85,
          feedback: 'Excelente trabajo, solo mejora la sintaxis en algunos lugares.'
        }
      ];

      let submissions = mockSubmissions;
      
      // Filtrar por usuario
      if (userId) {
        submissions = submissions.filter(s => s.user_id === parseInt(userId as string));
      }
      
      // Filtrar por curso
      if (courseId) {
        // En una implementación real, obtendríamos las submissions del curso específico
        // Por ahora retornamos todas las submissions del usuario
      }
      
      // Filtrar por lección
      if (lessonId) {
        submissions = submissions.filter(s => s.lesson_id === parseInt(lessonId as string));
      }

      return res.status(200).json(submissions);
    }

    if (req.method === 'POST') {
      // Crear nueva submission
      const { lessonId, assignmentTitle, content } = req.body;

      if (!lessonId || !assignmentTitle || !content) {
        return res.status(400).json({ message: 'Datos incompletos' });
      }

      // Simular creación de submission
      const newSubmission = {
        id: Date.now(),
        user_id: user.id,
        lesson_id: lessonId,
        assignment_title: assignmentTitle,
        content: content,
        submitted_at: new Date().toISOString(),
        status: 'pending',
        grade: null,
        feedback: null
      };

      return res.status(201).json({
        message: 'Tarea enviada exitosamente',
        submission: newSubmission
      });
    }

    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en submissions API:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}