import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import { getUserById } from '@/lib/database';
import { verifyAuthToken } from '@/lib/auth';

// Obtener todas las inscripciones del estudiante con información del curso
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



    // Verificar que el usuario existe
    const userCheck = await executeQuery('SELECT id, name, email FROM users WHERE id = ?', [user.id]);
    if (!userCheck || userCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado',
        debug: { userId: user.id }
      });
    }

    // Verificar las inscripciones del estudiante
    const enrollmentCheck = await executeQuery(`
      SELECT COUNT(*) as total_enrollments 
      FROM course_enrollments 
      WHERE user_id = ?
    `, [user.id]);



    // Debug: Mostrar datos del usuario


    // Obtener inscripciones del estudiante con información del curso
    const enrollments = await executeQuery(`
      SELECT 
        e.id,
        e.enrolled_at,
        e.progress_percentage,
        e.status as enrollment_status,
        c.id as course_id,
        c.title as course_title,
        c.description as course_description,
        c.level,
        c.price,
        c.duration_hours,
        c.thumbnail as course_thumbnail,
        c.published,
        c.created_at as course_created_at,
        i.name as instructor_name,
        i.avatar as instructor_avatar,
        cat.name as category_name,
        COALESCE((SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id), 0) as total_lessons,
        COALESCE((SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id), 0) as total_assignments,
        COALESCE((SELECT COUNT(*) FROM assignment_submissions s 
         JOIN assignments a ON s.assignment_id = a.id 
         WHERE a.course_id = c.id AND s.user_id = ?), 0) as submitted_assignments,
        COALESCE((SELECT COUNT(*) FROM course_reviews r WHERE r.course_id = c.id AND r.user_id = ? AND r.status = 'approved'), 0) as has_review,
        COALESCE((SELECT AVG(rating) FROM course_reviews r WHERE r.course_id = c.id AND r.status = 'approved'), 0) as course_rating_average,
        COALESCE((SELECT COUNT(*) FROM course_reviews r WHERE r.course_id = c.id AND r.status = 'approved'), 0) as course_rating_count
      FROM course_enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users i ON c.instructor_id = i.id
      LEFT JOIN course_categories cat ON c.category_id = cat.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `, [user.id, user.id, user.id]);




    // Si no hay inscripciones, retornar array vacío
    if (!enrollments || enrollments.length === 0) {

      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Formatear los datos para el frontend
    const formattedEnrollments = enrollments.map((enrollment: any) => ({
      id: enrollment.id,
      enrolled_at: enrollment.enrolled_at,
      progress_percentage: enrollment.progress_percentage || 0,
      status: enrollment.enrollment_status || 'active',
      course: {
        id: enrollment.course_id,
        title: enrollment.course_title,
        description: enrollment.course_description,
        level: enrollment.level,
        price: enrollment.price,
        duration_hours: enrollment.duration_hours,
        thumbnail: enrollment.course_thumbnail,
        published: enrollment.published,
        created_at: enrollment.course_created_at,
        instructor: {
          name: enrollment.instructor_name,
          avatar: enrollment.instructor_avatar
        },
        category: {
          name: enrollment.category_name || 'General'
        },
        rating_average: parseFloat(enrollment.course_rating_average) || 0,
        total_lessons: enrollment.total_lessons,
        total_assignments: enrollment.total_assignments,
        submitted_assignments: enrollment.submitted_assignments,
        has_review: enrollment.has_review > 0,
        rating_count: enrollment.course_rating_count
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedEnrollments
    });

  } catch (error: any) {
    console.error('❌ Error en API de inscripciones del estudiante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}