import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureCommunityTables, getFeedPosts, createPost, getPostById, updatePost, deletePost, likePost, unlikePost } from '@/lib/social_database';

// ============================================================================
// POSTS - API ROUTES
// ============================================================================

// GET - Obtener feed de posts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Asegurar que las tablas existan
    await ensureCommunityTables();

    if (req.method === 'GET') {
      const { profile_id, limit = '20', offset = '0' } = req.query;
      
      if (!profile_id) {
        return res.status(400).json({ error: 'Se requiere profile_id' });
      }

      const posts = await getFeedPosts(
        parseInt(profile_id as string),
        parseInt(limit as string),
        parseInt(offset as string)
      );

      return res.status(200).json({ posts });
    }

    if (req.method === 'POST') {
      const { profile_id, content, image_url } = req.body;

      if (!profile_id || !content) {
        return res.status(400).json({ error: 'Se requiere profile_id y content' });
      }

      // Validaciones
      if (content.length < 3) {
        return res.status(400).json({ error: 'El contenido debe tener al menos 3 caracteres' });
      }

      if (content.length > 500) {
        return res.status(400).json({ error: 'El contenido no puede exceder 500 caracteres' });
      }

      const post = await createPost(parseInt(profile_id), content, image_url || null);
      return res.status(201).json({ post });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  } catch (error: any) {
    console.error('Error en API de posts:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};