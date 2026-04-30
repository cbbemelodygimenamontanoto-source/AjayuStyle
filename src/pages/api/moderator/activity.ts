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
      const limit = parseInt(req.query.limit as string) || 50;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;

      // Obtener logs de actividad usando nombres correctos de tabla
      const logsQuery = `
        SELECT 
          sal.id,
          sal.activity_type,
          sal.description,
          sal.details,
          sal.ip_address,
          sal.created_at,
          u.name as user_name,
          u.email as user_email
        FROM student_activity_logs sal
        LEFT JOIN users u ON sal.user_id = u.id
        WHERE sal.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY sal.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const logsResult = await executeQuery(logsQuery, [limit, offset]);

      // Formatear datos para el frontend
      const formattedLogs = logsResult.map((log: any) => ({
        id: log.id,
        activity_type: log.activity_type,
        description: log.description,
        details: log.details ? JSON.parse(log.details) : null,
        ip_address: log.ip_address,
        created_at: log.created_at,
        user: log.user_name ? {
          name: log.user_name,
          email: log.user_email
        } : null
      }));

      // Obtener total para paginación
      const countQuery = `
        SELECT COUNT(*) as total
        FROM student_activity_logs sal
        WHERE sal.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `;

      const countResult = await executeQuery(countQuery);
      const total = countResult[0].total;

      res.status(200).json({
        success: true,
        data: formattedLogs,
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
      console.error('Error fetching moderator activity logs:', error);
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