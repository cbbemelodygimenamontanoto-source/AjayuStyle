import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import { getDbConnection } from '@/lib/database';

interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { courseId } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const connection = await getDbConnection();

    // Verificar que el usuario esté inscrito en el curso
    const [enrollmentRows] = await connection.execute(
      'SELECT id FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [user.id, courseId]
    );

    if (enrollmentRows.length === 0) {
      await connection.end();
      return res.status(403).json({ message: 'No estás inscrito en este curso' });
    }

    // Obtener lecciones del curso
    const [lessons] = await connection.execute(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.lesson_type as content_type,
        l.estimated_minutes as duration_minutes,
        l.order_index as lesson_order,
        l.video_url,
        l.resources,
        COALESCE(lp.completed, false) as completed,
        COALESCE(lp.video_progress_seconds, 0) as video_progress_seconds,
        COALESCE(lp.video_total_seconds, l.estimated_minutes * 60) as video_total_seconds,
        CASE 
          WHEN lp.video_total_seconds > 0 THEN 
            ROUND((lp.video_progress_seconds / lp.video_total_seconds) * 100)
          ELSE 0 
        END as watch_percentage
      FROM lessons l
      LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.student_id = ?
      WHERE l.course_id = ?
      ORDER BY l.order_index ASC
    `, [user.id, courseId]);

    // Procesar las lecciones para convertir JSON si es necesario
    const processedLessons = lessons.map((lesson: any) => {
      let resources = [];
      try {
        if (lesson.resources) {
          resources = JSON.parse(lesson.resources);
        }
      } catch (e) {
        console.error('Error parsing resources:', e);
      }

      return {
        ...lesson,
        resources,
        watch_percentage: lesson.watch_percentage || 0
      };
    });

    await connection.end();

    res.status(200).json({
      lessons: processedLessons
    });

  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}