import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureCommunityTables, createProfileReview, getProfileReviews, getProfileAverageRating, deleteProfileReview } from '@/lib/social_database';

// ============================================================================
// PROFILE REVIEWS - API ROUTES
// ============================================================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Asegurar que las tablas existan
    await ensureCommunityTables();

    // GET - Obtener reseñas de un perfil
    if (req.method === 'GET') {
      const { profile_id, average_rating } = req.query;

      if (profile_id) {
        // Obtener promedio de rating
        if (average_rating === 'true') {
          const rating = await getProfileAverageRating(parseInt(profile_id as string));
          return res.status(200).json({ rating });
        }

        // Obtener reseñas
        const reviews = await getProfileReviews(parseInt(profile_id as string));
        return res.status(200).json({ reviews });
      }

      return res.status(400).json({ error: 'Se requiere profile_id' });
    }

    // POST - Crear reseña
    if (req.method === 'POST') {
      const { reviewer_profile_id, reviewed_profile_id, rating, comment } = req.body;

      if (!reviewer_profile_id || !reviewed_profile_id || !rating) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      try {
        const review = await createProfileReview(
          parseInt(reviewer_profile_id),
          parseInt(reviewed_profile_id),
          parseInt(rating),
          comment || ''
        );
        return res.status(201).json({ review, message: 'Reseña creada exitosamente' });
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    }

    // DELETE - Eliminar reseña
    if (req.method === 'DELETE') {
      const { review_id, profile_id, is_admin } = req.query;

      if (!review_id || !profile_id) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const success = await deleteProfileReview(
        parseInt(review_id as string),
        parseInt(profile_id as string),
        is_admin === 'true'
      );

      if (success) {
        return res.status(200).json({ success: true, message: 'Reseña eliminada' });
      } else {
        return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta reseña' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  } catch (error: any) {
    console.error('Error en API de reseñas:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}