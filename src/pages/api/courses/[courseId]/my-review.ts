import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);

  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { courseId } = req.query;
    const courseIdNum = parseInt(courseId as string);

    if (!courseIdNum) {
      return res.status(400).json({ message: 'ID del curso requerido' });
    }

    // Obtener la reseña del usuario actual
    const reviewQuery = `
      SELECT 
        cr.id,
        cr.rating,
        cr.review_text as comment,
        cr.created_at,
        cr.updated_at
      FROM course_reviews cr
      WHERE cr.course_id = ? AND cr.user_id = ?
    `;

    const reviews = await executeQuery(reviewQuery, [courseIdNum, user.id]);

    if (!reviews || reviews.length === 0) {
      return res.status(200).json({ review: null });
    }

    return res.status(200).json({ review: reviews[0] });

  } catch (error) {
    console.error('Error fetching user review:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}