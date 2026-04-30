import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import { verifyAuthToken } from '@/lib/auth';

// API para actividad reciente del estudiante usando la BD real
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Verificar autenticación
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const user = await verifyAuthToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    // Obtener actividad reciente del estudiante desde la BD real
    const activityQuery = `
      SELECT 
        'lesson_completed' as type,
        CONCAT('Completaste la lección: ', l.title) as description,
        lp.completed_at as date,
        c.title as course_title
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN courses c ON l.course_id = c.id
      WHERE lp.user_id = ? AND lp.completed_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'course_completed' as type,
        CONCAT('Completaste el curso: ', c.title) as description,
        e.completed_at as date,
        c.title as course_title
      FROM course_enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ? AND e.status = 'completed' AND e.completed_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'assignment_submitted' as type,
        CONCAT('Enviaste la tarea: ', a.title) as description,
        s.submitted_at as date,
        c.title as course_title
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.student_id = ?
      
      UNION ALL
      
      SELECT 
        'grade_received' as type,
        CONCAT('Recibiste calificación en ', a.title, ': ', ROUND(g.score / g.max_score * 100, 1), '%') as description,
        g.graded_at as date,
        c.title as course_title
      FROM grades g
      JOIN submissions s ON g.submission_id = s.id
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.student_id = ? AND g.graded_at IS NOT NULL
      
      ORDER BY date DESC
      LIMIT ?
    `;

    const activityResult = await executeQuery(activityQuery, [user.id, user.id, user.id, user.id, limit]);

    // Formatear datos para el frontend
    const formattedActivity = activityResult.map((activity: any) => ({
      type: activity.type,
      description: activity.description,
      date: activity.date,
      course_title: activity.course_title
    }));

    res.status(200).json({
      success: true,
      data: formattedActivity
    });

  } catch (error: any) {
    console.error('❌ Error en API de actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}