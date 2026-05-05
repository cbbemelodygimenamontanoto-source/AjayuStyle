import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureCommunityTables, likePost, unlikePost } from '@/lib/social_database';

// ============================================================================
// LIKES - API ROUTES
// ============================================================================

// POST - Dar like a un post
// DELETE - Quitar like de un post
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Asegurar que las tablas existan
    await ensureCommunityTables();

    if (req.method === 'POST') {
      const { post_id, profile_id } = req.body;

      if (!post_id || !profile_id) {
        return res.status(400).json({ error: 'Se requiere post_id y profile_id' });
      }

      const success = await likePost(parseInt(post_id), parseInt(profile_id));
      
      if (success) {
        return res.status(200).json({ success: true, message: 'Like agregado' });
      } else {
        return res.status(400).json({ success: false, message: 'Ya diste like a este post' });
      }
    }

    if (req.method === 'DELETE') {
      const { post_id, profile_id } = req.query;

      if (!post_id || !profile_id) {
        return res.status(400).json({ error: 'Se requiere post_id y profile_id' });
      }

      const success = await unlikePost(parseInt(post_id as string), parseInt(profile_id as string));
      
      if (success) {
        return res.status(200).json({ success: true, message: 'Like eliminado' });
      } else {
        return res.status(400).json({ success: false, message: 'No habías dado like a este post' });
      }
    }

    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  } catch (error: any) {
    console.error('Error en API de likes:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}