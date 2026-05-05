import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureCommunityTables, createReport, getPendingReports, getAllReports, resolveReport, getReportsStats } from '@/lib/social_database';

// ============================================================================
// REPORTS - API ROUTES
// ============================================================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Asegurar que las tablas existan
    await ensureCommunityTables();

    // GET - Obtener reportes
    if (req.method === 'GET') {
      const { status, stats } = req.query;

      // Obtener estadísticas
      if (stats === 'true') {
        const statistics = await getReportsStats();
        return res.status(200).json({ stats: statistics });
      }

      // Obtener reportes pendientes
      if (status === 'pending') {
        const reports = await getPendingReports(50);
        return res.status(200).json({ reports });
      }

      // Obtener todos los reportes
      const reports = await getAllReports(status as string | undefined);
      return res.status(200).json({ reports });
    }

    // POST - Crear reporte
    if (req.method === 'POST') {
      const { reporter_profile_id, report_type, target_id, reason, description, reported_profile_id } = req.body;

      if (!reporter_profile_id || !report_type || !target_id || !reason) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const report = await createReport(
        parseInt(reporter_profile_id),
        report_type,
        parseInt(target_id),
        reason,
        description || ''
      );

      return res.status(201).json({ report, message: 'Reporte creado exitosamente' });
    }

    // PUT - Resolver reporte
    if (req.method === 'PUT') {
      const { report_id, reviewer_profile_id, status, notes } = req.body;

      if (!report_id || !reviewer_profile_id || !status) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const success = await resolveReport(
        parseInt(report_id),
        parseInt(reviewer_profile_id),
        status,
        notes || ''
      );

      if (success) {
        return res.status(200).json({ success: true, message: 'Reporte resuelto' });
      } else {
        return res.status(400).json({ success: false, message: 'No se pudo resolver el reporte' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  } catch (error: any) {
    console.error('Error en API de reportes:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}