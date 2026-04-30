import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import { verifyAuthToken } from '@/lib/auth';

// Obtener envío de tarea de un estudiante
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { assignmentId } = req.query;

    if (!assignmentId) {
      return res.status(400).json({ message: 'ID de la tarea requerido' });
    }

    // Verificar autenticación
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    const user = await verifyAuthToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    console.log(`🔍 Obteniendo envío de tarea ${assignmentId} para usuario ${user.id}`);

    // Obtener el envío del estudiante
    const submissionQuery = `
      SELECT 
        s.id,
        s.file_name,
        s.file_path,
        s.submitted_at,
        s.score,
        s.feedback,
        s.grade_status,
        s.graded_at,
        a.title as assignment_title,
        a.points_possible
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE s.assignment_id = ? AND s.student_id = ?
      ORDER BY s.submitted_at DESC
      LIMIT 1
    `;

    const submissionData = await executeQuery(submissionQuery, [assignmentId, user.id]);

    if (!submissionData || submissionData.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontró envío para esta tarea',
        submission: null 
      });
    }

    const submission = submissionData[0];

    // Formatear respuesta
    const response = {
      submission: {
        id: submission.id,
        file_name: submission.file_name,
        file_path: submission.file_path,
        submitted_at: submission.submitted_at,
        score: submission.score,
        feedback: submission.feedback,
        grade_status: submission.grade_status,
        graded_at: submission.graded_at,
        assignment_title: submission.assignment_title,
        points_possible: submission.points_possible
      }
    };

    console.log(`✅ Envío encontrado: ${submission.file_name}`);

    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Error obteniendo envío de tarea:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}