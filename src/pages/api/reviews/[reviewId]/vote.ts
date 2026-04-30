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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { reviewId } = req.query;
    const reviewIdNum = parseInt(reviewId as string);
    const { vote_type } = req.body;

    if (!reviewIdNum || !vote_type) {
      return res.status(400).json({ message: 'ID de reseña y tipo de voto son requeridos' });
    }

    if (!['helpful', 'unhelpful'].includes(vote_type)) {
      return res.status(400).json({ message: 'Tipo de voto inválido' });
    }

    // Verificar que la reseña existe
    const review = await executeQuery(
      'SELECT id FROM course_reviews WHERE id = ?',
      [reviewIdNum]
    );

    if (!review || review.length === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    // Verificar si el usuario ya votó en esta reseña
    const existingVote = await executeQuery(
      'SELECT * FROM review_votes WHERE review_id = ? AND user_id = ?',
      [reviewIdNum, user.id]
    );

    if (existingVote && existingVote.length > 0) {
      // Actualizar voto existente
      await executeQuery(
        'UPDATE review_votes SET vote_type = ? WHERE review_id = ? AND user_id = ?',
        [vote_type, reviewIdNum, user.id]
      );
    } else {
      // Crear nuevo voto
      await executeQuery(
        'INSERT INTO review_votes (review_id, user_id, vote_type) VALUES (?, ?, ?)',
        [reviewIdNum, user.id, vote_type]
      );
    }

    return res.status(200).json({ message: 'Voto registrado exitosamente' });

  } catch (error) {
    console.error('Error voting review:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}