import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureCommunityTables, followProfile, unfollowProfile, isFollowing } from '@/lib/social_database';

// ============================================================================
// FOLLOWS - API ROUTES
// ============================================================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Asegurar que las tablas existan
    await ensureCommunityTables();

    // POST - Seguir a un usuario
    if (req.method === 'POST') {
      const { follower_profile_id, following_profile_id } = req.body;

      if (!follower_profile_id || !following_profile_id) {
        return res.status(400).json({ error: 'Se requiere follower_profile_id y following_profile_id' });
      }

      try {
        const success = await followProfile(
          parseInt(follower_profile_id),
          parseInt(following_profile_id)
        );

        if (success) {
          return res.status(200).json({ success: true, message: 'Ahora sigues a este usuario' });
        } else {
          return res.status(400).json({ success: false, message: 'Ya sigues a este usuario o no puedes seguirte a ti mismo' });
        }
      } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
      }
    }

    // DELETE - Dejar de seguir
    if (req.method === 'DELETE') {
      const { follower_profile_id, following_profile_id } = req.query;

      if (!follower_profile_id || !following_profile_id) {
        return res.status(400).json({ error: 'Se requiere follower_profile_id y following_profile_id' });
      }

      const success = await unfollowProfile(
        parseInt(follower_profile_id as string),
        parseInt(following_profile_id as string)
      );

      if (success) {
        return res.status(200).json({ success: true, message: 'Has dejado de seguir a este usuario' });
      } else {
        return res.status(400).json({ success: false, message: 'No seguías a este usuario' });
      }
    }

    // GET - Verificar si sigue
    if (req.method === 'GET') {
      const { follower_profile_id, following_profile_id } = req.query;

      if (!follower_profile_id || !following_profile_id) {
        return res.status(400).json({ error: 'Se requiere follower_profile_id y following_profile_id' });
      }

      const following = await isFollowing(
        parseInt(follower_profile_id as string),
        parseInt(following_profile_id as string)
      );

      return res.status(200).json({ is_following: following });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  } catch (error: any) {
    console.error('Error en API de follows:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}