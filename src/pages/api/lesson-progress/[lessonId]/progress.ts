import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import { getDbConnection } from '@/lib/database';

interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { lessonId } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { completed, video_progress_seconds, video_total_seconds } = req.body;

    const connection = await getDbConnection();

    // Verificar que el usuario está inscrito en el curso de la lección
    const [lessonRows] = await connection.execute(
      'SELECT l.course_id FROM lessons l JOIN course_enrollments ce ON l.course_id = ce.course_id WHERE l.id = ? AND ce.student_id = ?',
      [lessonId, user.id]
    );

    if (lessonRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Lección no encontrada o no tienes acceso' });
    }

    // Verificar si ya existe progreso
    const [existingProgress] = await connection.execute(
      'SELECT id FROM lesson_progress WHERE lesson_id = ? AND student_id = ?',
      [lessonId, user.id]
    );

    if (existingProgress.length > 0) {
      // Actualizar progreso existente
      await connection.execute(
        'UPDATE lesson_progress SET completed = ?, video_progress_seconds = ?, video_total_seconds = ?, updated_at = NOW() WHERE lesson_id = ? AND student_id = ?',
        [completed ? 1 : 0, video_progress_seconds || 0, video_total_seconds || 0, lessonId, user.id]
      );
    } else {
      // Crear nuevo progreso
      await connection.execute(
        'INSERT INTO lesson_progress (lesson_id, student_id, completed, video_progress_seconds, video_total_seconds) VALUES (?, ?, ?, ?, ?)',
        [lessonId, user.id, completed ? 1 : 0, video_progress_seconds || 0, video_total_seconds || 0]
      );
    }

    await connection.end();

    res.status(200).json({ 
      message: 'Progreso actualizado exitosamente',
      completed,
      video_progress_seconds,
      video_total_seconds
    });

  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}