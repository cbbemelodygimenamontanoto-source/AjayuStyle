import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import { verifyAuthToken } from '@/lib/auth';

// API para estadísticas del estudiante usando la BD real
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

    // Obtener estadísticas reales del estudiante
    const statsQueries = await Promise.all([
      // Total de cursos inscritos
      executeQuery(`
        SELECT COUNT(*) as enrolled_courses
        FROM course_enrollments 
        WHERE user_id = ?
      `, [user.id]),

      // Total de cursos completados
      executeQuery(`
        SELECT COUNT(*) as completed_courses
        FROM course_enrollments 
        WHERE user_id = ? AND status = 'completed'
      `, [user.id]),

      // Cursos en progreso
      executeQuery(`
        SELECT COUNT(*) as in_progress_courses
        FROM course_enrollments 
        WHERE user_id = ? AND status = 'enrolled'
      `, [user.id]),

      // Total de horas de estudio (aproximado por duración de cursos)
      executeQuery(`
        SELECT COALESCE(SUM(c.duration_hours), 0) as total_study_hours
        FROM course_enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ?
      `, [user.id]),

      // Certificados obtenidos (cursos completados)
      executeQuery(`
        SELECT COUNT(*) as certificates_earned
        FROM course_enrollments 
        WHERE user_id = ? AND status = 'completed'
      `, [user.id]),

      // Promedio de calificaciones
      executeQuery(`
        SELECT COALESCE(AVG(g.score / g.max_score * 100), 0) as average_grade
        FROM submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN course_enrollments e ON e.user_id = s.student_id AND e.course_id = a.course_id
        JOIN grades g ON s.id = g.submission_id
        WHERE s.student_id = ?
      `, [user.id]),

      // Racha de estudio (días consecutivos con actividad)
      executeQuery(`
        SELECT 
          COALESCE((
            SELECT DATEDIFF(NOW(), MAX(lp.completed_at))
            FROM lesson_progress lp
            WHERE lp.user_id = ?
          ), 0) as current_streak
      `, [user.id])
    ]);

    // Extraer valores de las consultas
    const enrolled_courses = statsQueries[0][0]?.enrolled_courses || 0;
    const completed_courses = statsQueries[1][0]?.completed_courses || 0;
    const in_progress_courses = statsQueries[2][0]?.in_progress_courses || 0;
    const total_study_hours = parseFloat(statsQueries[3][0]?.total_study_hours) || 0;
    const certificates_earned = statsQueries[4][0]?.certificates_earned || 0;
    const average_grade = parseFloat(statsQueries[5][0]?.average_grade) || 0;
    const current_streak = parseInt(statsQueries[6][0]?.current_streak) || 0;

    const stats = {
      enrolled_courses,
      completed_courses,
      in_progress_courses,
      total_study_hours,
      certificates_earned,
      average_grade: Math.round(average_grade * 100) / 100, // Redondear a 2 decimales
      current_streak
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Error en API de estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}