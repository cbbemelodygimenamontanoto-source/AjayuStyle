import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
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

  if (req.method === 'GET') {
    try {
      // Estadísticas de moderación usando nombres correctos de tabla
      const statsQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as total_reports_today,
          COUNT(CASE WHEN status = 'resolved' AND DATE(resolved_at) = CURDATE() THEN 1 END) as resolved_reports_today,
          COALESCE(AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)), 0) as average_resolution_time,
          COUNT(CASE WHEN DATE(last_login) = CURDATE() THEN 1 END) as active_users,
          COUNT(CASE WHEN status IN ('pending', 'under_review') THEN 1 END) as flagged_content
        FROM content_reports
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `;

      const statsResult = await executeQuery(statsQuery);
      const stats = statsResult[0] || {};

      // Formatear datos
      const formattedStats = {
        pending_reports: parseInt(stats.pending_reports) || 0,
        total_reports_today: parseInt(stats.total_reports_today) || 0,
        resolved_reports_today: parseInt(stats.resolved_reports_today) || 0,
        average_resolution_time: parseFloat(stats.average_resolution_time) || 0,
        active_users: parseInt(stats.active_users) || 0,
        flagged_content: parseInt(stats.flagged_content) || 0
      };

      res.status(200).json({
        success: true,
        data: formattedStats
      });

    } catch (error) {
      console.error('Error fetching moderator stats:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}