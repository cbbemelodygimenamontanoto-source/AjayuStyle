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
    const { course_id, rating, review_text } = req.body;

    if (!course_id || !rating) {
      return res.status(400).json({ message: 'ID del curso y calificación requeridos' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La calificación debe ser entre 1 y 5' });
    }

    const userId = 1; // Por simplicidad

    // Verificar que el usuario está inscrito en el curso
    const enrollmentCheck = await executeQuery(`
      SELECT id FROM course_enrollments 
      WHERE user_id = ? AND course_id = ?
    `, [userId, course_id]);

    if (!enrollmentCheck || enrollmentCheck.length === 0) {
      return res.status(403).json({ message: 'Debes estar inscrito en el curso para dejar una reseña' });
    }

    // Crear o actualizar reseña
    await executeQuery(`
      INSERT INTO course_reviews (course_id, user_id, rating, review_text, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        review_text = VALUES(review_text),
        updated_at = NOW()
    `, [course_id, userId, rating, review_text]);

    res.status(200).json({
      message: 'Reseña guardada exitosamente',
      success: true
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}