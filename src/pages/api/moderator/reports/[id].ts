import { NextApiRequest, NextApiResponse } from 'next';
import { executeUpdate } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  // Verificar que el usuario sea moderador o administrador
  if (!user.roles?.some((role: any) => ['moderador', 'administrador'].includes(role.name))) {
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { action, notes, reviewed_by } = req.body;

      let newStatus = '';
      let resolutionNotes = notes || '';

      switch (action) {
        case 'resolve':
          newStatus = 'resuelto';
          break;
        case 'dismiss':
          newStatus = 'descartado';
          break;
        case 'sanction':
          newStatus = 'sancionado';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Acción no válida'
          });
      }

      // Actualizar el reporte
      const updateQuery = `
        UPDATE reports 
        SET status = ?, 
            reviewed_by = ?, 
            reviewed_at = NOW(), 
            resolution_notes = ?,
            updated_at = NOW()
        WHERE id = ?
      `;

      const result = await executeUpdate(updateQuery, [
        newStatus,
        reviewed_by,
        resolutionNotes,
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reporte no encontrado'
        });
      }

      // Si se sanciona, también actualizar el usuario si es necesario
      if (action === 'sanction') {
        // Aquí podrías implementar lógica adicional para sancionar al usuario
        // como suspender cuenta,限制 acceso, etc.
      }

      res.status(200).json({
        success: true,
        message: 'Reporte actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}