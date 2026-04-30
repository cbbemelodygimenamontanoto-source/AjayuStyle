import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import { verifyAuthToken } from '@/lib/auth';

// Obtener datos completos de un curso con sus lecciones
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ message: 'ID del curso requerido' });
    }



    // Obtener datos del curso
    const courseQuery = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.level,
        c.price,
        c.duration_hours,
        c.thumbnail,
        c.published,
        c.created_at,
        i.name as instructor_name,
        i.avatar as instructor_avatar,
        cat.name as category,
        COALESCE((SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id), 0) as lesson_count,
        COALESCE((SELECT AVG(rating) FROM course_reviews r WHERE r.course_id = c.id), 0) as average_rating,
        COALESCE((SELECT COUNT(*) FROM course_reviews r WHERE r.course_id = c.id), 0) as total_reviews,
        COALESCE((SELECT COUNT(*) FROM course_enrollments e WHERE e.course_id = c.id), 0) as total_students,
        COALESCE((SELECT COUNT(*) FROM assignments a WHERE a.course_id = c.id), 0) as total_assignments
      FROM courses c
      JOIN users i ON c.instructor_id = i.id
      LEFT JOIN course_categories cat ON c.category_id = cat.id
      WHERE c.id = ? AND c.published = TRUE
      LIMIT 1
    `;

    const courseData = await executeQuery(courseQuery, [courseId]);

    if (!courseData || courseData.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const course = courseData[0];

    // Obtener lecciones del curso - usando order_index como está en la BD
    const lessonsQuery = `
      SELECT 
        l.id,
        l.course_id,
        l.title,
        l.description,
        l.content,
        l.estimated_minutes as duration_minutes,
        l.is_preview,
        l.order_index as lesson_order,
        l.lesson_type as content_type
      FROM lessons l
      WHERE l.course_id = ?
      ORDER BY l.order_index ASC
    `;

    const lessonsData = await executeQuery(lessonsQuery, [courseId]);

    // Obtener tareas del curso
    const assignmentsQuery = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.points_possible,
        a.file_types_allowed,
        a.max_file_size_mb,
        a.lesson_id
      FROM assignments a
      WHERE a.course_id = ?
      ORDER BY a.created_at ASC
    `;

    const assignmentsData = await executeQuery(assignmentsQuery, [courseId]);

    // Verificar si el usuario está inscrito (si está autenticado)
    let enrollmentStatus = null;
    let progressPercentage = 0;
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const user = await verifyAuthToken(token);
        if (user) {
          const enrollmentQuery = `
            SELECT 
              status,
              progress_percentage,
              enrolled_at
            FROM course_enrollments 
            WHERE user_id = ? AND course_id = ?
          `;
          
          const enrollmentData = await executeQuery(enrollmentQuery, [user.id, courseId]);
          if (enrollmentData && enrollmentData.length > 0) {
            enrollmentStatus = enrollmentData[0];
            progressPercentage = enrollmentData[0].progress_percentage || 0;
          }
        }
      } catch (error) {
        // Token inválido, pero no es crítico para mostrar el curso

      }
    }

    // Formatear datos de las lecciones
    const formattedLessons = lessonsData.map((lesson: any) => ({
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      description: lesson.description,
      content_type: lesson.content_type,
      duration_minutes: lesson.duration_minutes,
      lesson_order: lesson.lesson_order,
      is_preview: lesson.is_preview,
      content: lesson.content
    }));

    // Formatear datos de las tareas
    const formattedAssignments = assignmentsData.map((assignment: any) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      points_possible: assignment.points_possible,
      file_types_allowed: assignment.file_types_allowed,
      max_file_size_mb: assignment.max_file_size_mb,
      lesson_id: assignment.lesson_id
    }));

    // Respuesta completa del curso
    const response = {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      price: course.price,
      duration_hours: course.duration_hours,
      thumbnail: course.thumbnail,
      published: course.published,
      created_at: course.created_at,
      instructor: {
        name: course.instructor_name,
        avatar: course.instructor_avatar
      },
      category: course.category || 'General',
      lesson_count: course.lesson_count,
      average_rating: parseFloat(course.average_rating) || 0,
      total_reviews: course.total_reviews,
      total_students: course.total_students,
      total_assignments: course.total_assignments,
      lessons: formattedLessons,
      assignments: formattedAssignments,
      enrollment: {
        is_enrolled: !!enrollmentStatus,
        status: enrollmentStatus?.status || null,
        progress_percentage: progressPercentage,
        enrolled_at: enrollmentStatus?.enrolled_at || null
      }
    };



    res.status(200).json(response);

  } catch (error: any) {

    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}