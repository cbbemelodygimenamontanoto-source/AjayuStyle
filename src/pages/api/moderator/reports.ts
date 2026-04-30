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
      const status = req.query.status as string || 'pending';
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;

      // Obtener reportes usando nombres correctos de tabla
      const reportsQuery = `
        SELECT 
          cr.id,
          cr.content_type,
          cr.reason,
          cr.description,
          cr.status,
          cr.created_at,
          cr.evidence_urls,
          reporter.name as reporter_name,
          reporter.email as reporter_email
        FROM content_reports cr
        JOIN users reporter ON cr.reporter_id = reporter.id
        WHERE cr.status = ?
        ORDER BY cr.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const reportsResult = await executeQuery(reportsQuery, [status, limit, offset]);

      // Formatear datos para el frontend
      const formattedReports = reportsResult.map((report: any) => ({
        id: report.id,
        content_type: report.content_type,
        reason: report.reason,
        description: report.description,
        status: report.status,
        created_at: report.created_at,
        evidence_urls: report.evidence_urls ? JSON.parse(report.evidence_urls) : [],
        reporter: {
          name: report.reporter_name,
          email: report.reporter_email
        }
      }));

      // Obtener total para paginación
      const countQuery = `
        SELECT COUNT(*) as total
        FROM content_reports cr
        WHERE cr.status = ?
      `;

      const countResult = await executeQuery(countQuery, [status]);
      const total = countResult[0].total;

      res.status(200).json({
        success: true,
        data: formattedReports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Error fetching moderator reports:', error);
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