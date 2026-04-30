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
    const { submission_id, score, feedback } = req.body;

    if (!submission_id || score === undefined) {
      return res.status(400).json({ message: 'ID de entrega y calificación requeridos' });
    }

    const graderId = 1; // Por simplicidad, usar instructor con ID 1

    // Verificar que el usuario es instructor del curso
    const verifyInstructorQuery = `
      SELECT c.instructor_id 
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.id = ?
    `;

    const course = await executeQuery(verifyInstructorQuery, [submission_id]);

    if (!course || course.length === 0) {
      return res.status(404).json({ message: 'Entrega no encontrada' });
    }

    if (course[0].instructor_id !== graderId) {
      return res.status(403).json({ message: 'No tienes permisos para calificar esta tarea' });
    }

    // Actualizar la entrega con la calificación
    await executeQuery(`
      UPDATE submissions 
      SET score = ?, feedback = ?, graded_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `, [score, feedback, submission_id]);

    // Crear registro de calificación
    await executeQuery(`
      INSERT INTO grades (submission_id, grader_id, total_score, percentage, passed, overall_feedback, graded_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        total_score = VALUES(total_score),
        percentage = VALUES(percentage),
        passed = VALUES(passed),
        overall_feedback = VALUES(overall_feedback),
        graded_at = NOW()
    `, [
      submission_id, 
      graderId, 
      score, 
      score, // Por ahora usar el mismo valor
      score >= 60, // Considerar aprobado con 60 o más
      feedback
    ]);

    res.status(200).json({
      message: 'Tarea calificada exitosamente',
      success: true
    });

  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}