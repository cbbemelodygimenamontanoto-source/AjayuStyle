import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import jwt from 'jsonwebtoken';

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

    console.log('Debug: User ID from token:', userId);

    // Verificar que el usuario sea instructor
    const userRoles = await executeQuery(
      'SELECT ur.name FROM user_roles ur JOIN user_role_assignments ura ON ur.id = ura.role_id WHERE ura.user_id = ?',
      [userId]
    );

    console.log('Debug: User roles:', userRoles);

    const isInstructor = userRoles.some((role: any) => 
      role.name === 'instructor' || role.name === 'administrador'
    );

    console.log('Debug: Is instructor:', isInstructor);

    if (!isInstructor) {
      return res.status(403).json({ message: 'No tienes permisos de instructor' });
    }

    // Verificar todos los cursos del usuario
    const allUserCourses = await executeQuery(
      'SELECT * FROM courses WHERE instructor_id = ? ORDER BY created_at DESC',
      [userId]
    );

    console.log('Debug: All user courses:', allUserCourses);

    // Obtener cursos del instructor con estadísticas
    const instructorCourses = await executeQuery(
      `SELECT 
        c.*,
        COUNT(DISTINCT l.id) as lesson_count,
        COUNT(DISTINCT ce.user_id) as student_count,
        COALESCE(AVG(cr.rating), 0) as average_rating,
        COUNT(DISTINCT cr.id) as review_count
       FROM courses c
       LEFT JOIN lessons l ON c.id = l.course_id
       LEFT JOIN course_enrollments ce ON c.id = ce.course_id
       LEFT JOIN course_reviews cr ON c.id = cr.course_id AND cr.status = 'approved'
       WHERE c.instructor_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [userId]
    );

    console.log('Debug: Instructor courses with stats:', instructorCourses);

    return res.status(200).json({
      debug: true,
      userId,
      userRoles,
      isInstructor,
      allUserCourses,
      instructorCourses
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}