import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { assignment_id, submission_text, file_url } = req.body;

    if (!assignment_id) {
      return res.status(400).json({ message: 'ID de la tarea requerido' });
    }

    const userId = 1; // Por simplicidad

    // Obtener enrollment_id del usuario y la tarea
    const enrollmentQuery = `
      SELECT ce.id as enrollment_id
      FROM course_enrollments ce
      JOIN assignments a ON ce.course_id = a.course_id
      WHERE ce.user_id = ? AND a.id = ?
    `;

    const enrollment = await executeQuery(enrollmentQuery, [userId, assignment_id]);

    if (!enrollment || enrollment.length === 0) {
      return res.status(404).json({ message: 'No estás inscrito en este curso' });
    }

    const enrollmentId = enrollment[0].enrollment_id;

    // Crear o actualizar entrega
    await executeQuery(`
      INSERT INTO submissions (assignment_id, enrollment_id, submission_text, file_url, submitted_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        submission_text = VALUES(submission_text),
        file_url = VALUES(file_url),
        submitted_at = NOW(),
        score = NULL,
        feedback = NULL,
        graded_at = NULL
    `, [assignment_id, enrollmentId, submission_text, file_url]);

    res.status(200).json({
      message: 'Tarea entregada exitosamente',
      success: true
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}