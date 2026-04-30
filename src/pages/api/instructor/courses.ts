import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { executeQuery } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token de autenticación requerido' });
  }

  try {
    // Verificar token y obtener usuario
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024') as any;
    const userId = decoded.userId;

    // Verificar que el usuario sea instructor
    const userRoles = await executeQuery(
      'SELECT ur.name FROM user_roles ur JOIN user_role_assignments ura ON ur.id = ura.role_id WHERE ura.user_id = ?',
      [userId]
    );

    const isInstructor = userRoles.some((role: any) => 
      role.name === 'instructor' || role.name === 'administrador'
    );

    if (!isInstructor) {
      return res.status(403).json({ message: 'No tienes permisos de instructor' });
    }

    // Obtener cursos del instructor con estadísticas (versión robusta con fallback)
    let courses;
    
    try {
      // Intentar consulta completa con estadísticas
      courses = await executeQuery(
        `SELECT 
          c.*,
          COALESCE(lesson_counts.lesson_count, 0) as lesson_count,
          COALESCE(enrollment_counts.student_count, 0) as student_count,
          COALESCE(review_stats.average_rating, 0) as average_rating,
          COALESCE(review_stats.review_count, 0) as review_count
         FROM courses c
         LEFT JOIN (
           SELECT 
             course_id, 
             COUNT(*) as lesson_count 
           FROM lessons 
           GROUP BY course_id
         ) lesson_counts ON c.id = lesson_counts.course_id
         LEFT JOIN (
           SELECT 
             course_id, 
             COUNT(*) as student_count 
           FROM course_enrollments 
           GROUP BY course_id
         ) enrollment_counts ON c.id = enrollment_counts.course_id
         LEFT JOIN (
           SELECT 
             course_id,
             AVG(rating) as average_rating,
             COUNT(*) as review_count
           FROM course_reviews 
           WHERE status = 'approved'
           GROUP BY course_id
         ) review_stats ON c.id = review_stats.course_id
         WHERE c.instructor_id = ?
         ORDER BY c.created_at DESC`,
        [userId]
      );
    } catch (error: any) {
      console.warn('Error en consulta compleja, usando consulta simple:', error.message);
      
      // Fallback: consulta simple sin estadísticas
      try {
        courses = await executeQuery(
          `SELECT 
            c.*,
            0 as lesson_count,
            0 as student_count,
            0 as average_rating,
            0 as review_count
           FROM courses c
           WHERE c.instructor_id = ?
           ORDER BY c.created_at DESC`,
          [userId]
        );
      } catch (fallbackError: any) {
        console.error('Error en consulta fallback:', fallbackError.message);
        return res.status(500).json({ 
          message: 'Error al cargar cursos del instructor',
          error: fallbackError.message 
        });
      }
    }

    // Asegurar que siempre devuelva un array
    const coursesArray = Array.isArray(courses) ? courses : [];
    
    return res.status(200).json(coursesArray);

  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}