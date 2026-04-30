import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { lesson_id, time_spent_minutes = 0 } = req.body;

    if (!lesson_id) {
      return res.status(400).json({ message: 'ID de la lección requerido' });
    }

    const userId = 1; // Por simplicidad

    // Marcar lección como completada
    await executeQuery(`
      INSERT INTO lesson_progress (user_id, lesson_id, status, completed_at, time_spent_minutes)
      VALUES (?, ?, 'completed', NOW(), ?)
      ON DUPLICATE KEY UPDATE 
        status = 'completed',
        completed_at = NOW(),
        time_spent_minutes = time_spent_minutes + ?
    `, [userId, lesson_id, time_spent_minutes, time_spent_minutes]);

    // Actualizar progreso general del curso
    const update      UPDATE course_en      SET progressCourseProgress = `
rollments ce
_percentage = (
        SELECT ROUND(
          (COUNT(lp.id) * 100.0 / 
            (SELECT COUNT(*) FROM lessons WHERE course_id = ce.course_id)
          ), 2
        )
        FROM lesson_progress lp
        WHERE lp.user_id = ? 
          AND lp.lesson_id IN (SELECT id FROM lessons WHERE course_id = ce.course_id)
          AND lp.status = 'completed'
      )
      WHERE ce.user_id = ? 
        AND ce.course_id = (SELECT course_id FROM lessons WHERE id = ?)
    `;

    await executeQuery(updateCourseProgress, [userId, userId, lesson_id]);

    res.status(200).json({
      message: 'Lección marcada como completada',
      success: true
    });

  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}