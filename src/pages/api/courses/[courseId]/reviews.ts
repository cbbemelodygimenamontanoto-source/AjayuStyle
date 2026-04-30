import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);

  if (req.method === 'GET') {
    try {
      const { courseId } = req.query;
      const courseIdNum = parseInt(courseId as string);

      if (!courseIdNum) {
        return res.status(400).json({ message: 'ID del curso requerido' });
      }

      // Obtener reseñas del curso
      const reviewsQuery = `
        SELECT 
          cr.id,
          cr.rating,
          cr.review_text as comment,
          cr.created_at,
          cr.updated_at,
          u.name as user_name,
          u.avatar as user_avatar,
          COALESCE(cr.helpful_count, 0) as helpful_votes,
          COALESCE(cr.reported_count, 0) as unhelpful_votes
        FROM course_reviews cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.course_id = ?
        ORDER BY cr.created_at DESC
      `;

      const reviews = await executeQuery(reviewsQuery, [courseIdNum]);

      // Calcular promedio de calificaciones
      const statsQuery = `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM course_reviews
        WHERE course_id = ?
      `;

      const stats = await executeQuery(statsQuery, [courseIdNum]);

      return res.status(200).json({
        reviews: reviews || [],
        stats: stats[0] || {
          total_reviews: 0,
          average_rating: 0,
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0
        }
      });

    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    // Crear o actualizar reseña
    if (!user) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    try {
      const { courseId } = req.query;
      const courseIdNum = parseInt(courseId as string);
      const { rating, comment } = req.body;

      if (!courseIdNum || !rating) {
        return res.status(400).json({ message: 'ID del curso y calificación son requeridos' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
      }

      // Verificar que el estudiante está inscrito en el curso
      const enrollment = await executeQuery(
        'SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?',
        [courseIdNum, user.id]
      );

      if (!enrollment || enrollment.length === 0) {
        return res.status(403).json({ message: 'Solo puedes reseñar cursos en los que estés inscrito' });
      }

      // Verificar si ya existe una reseña
      const existingReview = await executeQuery(
        'SELECT * FROM course_reviews WHERE course_id = ? AND user_id = ?',
        [courseIdNum, user.id]
      );

      if (req.method === 'POST') {
        if (existingReview && existingReview.length > 0) {
          return res.status(400).json({ message: 'Ya has dejado una reseña para este curso' });
        }

        // Crear la reseña
        const result = await executeQuery(
          'INSERT INTO course_reviews (course_id, user_id, rating, review_text, created_at) VALUES (?, ?, ?, ?, NOW())',
          [courseIdNum, user.id, rating, comment || '']
        );

        return res.status(201).json({ 
          message: 'Reseña creada exitosamente', 
          review_id: result.insertId 
        });
      } else {
        // PUT - Actualizar reseña existente
        if (!existingReview || existingReview.length === 0) {
          return res.status(404).json({ message: 'No se encontró reseña para actualizar' });
        }

        await executeQuery(
          'UPDATE course_reviews SET rating = ?, review_text = ?, updated_at = NOW() WHERE course_id = ? AND user_id = ?',
          [rating, comment || '', courseIdNum, user.id]
        );

        return res.status(200).json({ 
          message: 'Reseña actualizada exitosamente' 
        });
      }

    } catch (error) {
      console.error('Error managing review:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  return res.status(405).json({ message: 'Método no permitido' });
}