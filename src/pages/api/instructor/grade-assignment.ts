import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import { verifyAuthToken } from '@/lib/auth';

// Calificar entrega de tarea por el instructor
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Verificar autenticación
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const user = await verifyAuthToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const { submissionId, score, maxScore, feedback, status } = req.body;

    if (!submissionId || score === undefined || !maxScore) {
      return res.status(400).json({ 
        message: 'ID de entrega, puntuación y puntuación máxima requeridos' 
      });
    }

    console.log(`🎓 Instructor ${user.id} calificando entrega ${submissionId}`);

    // Verificar que el usuario es instructor del curso de esta tarea
    const assignmentCheck = `
      SELECT a.id as assignment_id, a.course_id, c.instructor_id
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.id = ?
    `;

    const assignmentData = await executeQuery(assignmentCheck, [submissionId]);

    if (!assignmentData || assignmentData.length === 0) {
      return res.status(404).json({ message: 'Entrega no encontrada' });
    }

    const assignment = assignmentData[0];

    if (assignment.instructor_id !== user.id) {
      return res.status(403).json({ 
        message: 'No tienes permisos para calificar esta tarea' 
      });
    }

    // Calcular porcentaje
    const percentage = (score / maxScore) * 100;
    const passed = percentage >= 71; // 71% es la nota mínima para aprobar

    // Crear o actualizar la calificación
    const gradeQuery = `
      INSERT INTO assignment_grades (
        submission_id, grader_id, score, max_score, percentage, passed, 
        feedback, status, graded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        score = VALUES(score),
        max_score = VALUES(max_score),
        percentage = VALUES(percentage),
        passed = VALUES(passed),
        feedback = VALUES(feedback),
        status = VALUES(status),
        graded_at = NOW()
    `;

    await executeQuery(gradeQuery, [
      submissionId,
      user.id,
      score,
      maxScore,
      percentage,
      passed,
      feedback || '',
      status || 'approved'
    ]);

    // Actualizar estado de la entrega
    const submissionStatus = status === 'rejected' ? 'returned' : 'graded';
    await executeQuery(
      'UPDATE assignment_submissions SET status = ?, score = ?, percentage = ?, passed = ?, graded_by = ?, graded_at = NOW() WHERE id = ?',
      [submissionStatus, score, percentage, passed, user.id, submissionId]
    );

    // Verificar si todas las tareas del curso están calificadas para actualizar progreso
    const courseAssignmentsQuery = `
      SELECT COUNT(*) as total_assignments
      FROM assignments 
      WHERE course_id = ?
    `;

    const courseData = await executeQuery(courseAssignmentsQuery, [assignment.course_id]);
    const totalAssignments = courseData[0].total_assignments;

    // Obtener enrollment del estudiante para actualizar progreso
    const enrollmentQuery = `
      SELECT e.id, e.user_id
      FROM assignment_submissions s
      JOIN course_enrollments e ON s.enrollment_id = e.id
      WHERE s.id = ?
    `;

    const enrollmentData = await executeQuery(enrollmentQuery, [submissionId]);
    if (enrollmentData && enrollmentData.length > 0) {
      const enrollment = enrollmentData[0];

      // Calcular tareas completadas y aprobadas
      const completedAssignmentsQuery = `
        SELECT COUNT(*) as completed
        FROM assignment_submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.enrollment_id = ? 
        AND s.status IN ('graded', 'approved')
        AND s.passed = TRUE
      `;

      const completedData = await executeQuery(completedAssignmentsQuery, [enrollment.id]);
      const completedAssignments = completedData[0].completed;

      // Actualizar progreso basado en tareas completadas
      const assignmentProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

      await executeQuery(
        'UPDATE course_enrollments SET progress_percentage = ? WHERE id = ?',
        [assignmentProgress, enrollment.id]
      );

      console.log(`✅ Tarea calificada. Progreso actualizado: ${assignmentProgress.toFixed(1)}%`);
    }

    res.status(200).json({
      success: true,
      message: 'Tarea calificada exitosamente',
      grade: {
        score,
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        passed,
        status: submissionStatus
      }
    });

  } catch (error: any) {
    console.error('❌ Error calificando tarea:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}