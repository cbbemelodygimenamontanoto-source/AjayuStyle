import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureCommunityTables, getSocialProfileByUserId, updateSocialProfile, searchProfiles } from '@/lib/social_database';

// ============================================================================
// PROFILES - API ROUTES
// ============================================================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Asegurar que las tablas existan
    await ensureCommunityTables();

    if (req.method === 'GET') {
      const { user_id, profile_id, username, search, current_profile_id } = req.query;

      // Buscar por user_id
      if (user_id) {
        const profile = await getSocialProfileByUserId(parseInt(user_id as string));
        if (!profile) {
          return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        return res.status(200).json({ profile });
      }

      // Buscar por profile_id
      if (profile_id) {
        const profile = await getSocialProfileByUserId(parseInt(profile_id as string));
        if (!profile) {
          return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        return res.status(200).json({ profile });
      }

      // Buscar por username
      if (username) {
        const profile = await getSocialProfileByUserId(parseInt(username as string));
        if (!profile) {
          return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        return res.status(200).json({ profile });
      }

      // Búsqueda general
      if (search) {
        const results = await searchProfiles(search as string, 20);
        return res.status(200).json({ profiles: results });
      }

      return res.status(400).json({ error: 'Se requiere un parámetro de búsqueda' });
    }

    if (req.method === 'PUT') {
      const { profile_id, ...updateData } = req.body;

      if (!profile_id) {
        return res.status(400).json({ error: 'Se requiere profile_id' });
      }

      const profile = await updateSocialProfile(parseInt(profile_id), updateData);
      return res.status(200).json({ profile });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  } catch (error: any) {
    console.error('Error en API de perfiles:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}