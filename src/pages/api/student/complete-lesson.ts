import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';
import { verifyAuthToken } from '@/lib/auth';

// Marcar una lección como completada
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({ message: 'ID de la lección requerido' });
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

    console.log(`🔍 Marcando lección ${lessonId} como completada para usuario ${user.id}`);

    // Verificar que la lección existe y obtener información del curso
    const lessonQuery = `
      SELECT l.id, l.course_id, l.title, l.estimated_minutes
      FROM lessons l
      WHERE l.id = ?
    `;

    const lessonData = await executeQuery(lessonQuery, [lessonId]);

    if (!lessonData || lessonData.length === 0) {
      return res.status(404).json({ message: 'Lección no encontrada' });
    }

    const lesson = lessonData[0];

    // Verificar que el usuario está inscrito en el curso
    const enrollmentQuery = `
      SELECT id, progress_percentage
      FROM course_enrollments 
      WHERE user_id = ? AND course_id = ?
    `;

    const enrollmentData = await executeQuery(enrollmentQuery, [user.id, lesson.course_id]);

    if (!enrollmentData || enrollmentData.length === 0) {
      return res.status(403).json({ message: 'No estás inscrito en este curso' });
    }

    const enrollment = enrollmentData[0];

    // Verificar si ya está marcada como completada
    const existingProgressQuery = `
      SELECT id, completed
      FROM lesson_progress 
      WHERE user_id = ? AND lesson_id = ?
    `;

    const existingProgress = await executeQuery(existingProgressQuery, [user.id, lessonId]);

    if (existingProgress && existingProgress.length > 0 && existingProgress[0].completed) {
      return res.status(200).json({ 
        message: 'La lección ya está marcada como completada',
        already_completed: true 
      });
    }

    // Insertar o actualizar progreso de la lección
    const timeSpent = lesson.estimated_minutes * 60; // Convertir minutos a segundos

    const progressQuery = `
      INSERT INTO lesson_progress (
        user_id, 
        lesson_id, 
        enrollment_id, 
        status, 
        completed, 
        completed_at, 
        time_spent_seconds
      ) VALUES (?, ?, ?, 'completed', TRUE, NOW(), ?)
      ON DUPLICATE KEY UPDATE
        status = 'completed',
        completed = TRUE,
        completed_at = NOW(),
        time_spent_seconds = time_spent_seconds + VALUES(time_spent_seconds)
    `;

    await executeQuery(progressQuery, [user.id, lessonId, enrollment.id, timeSpent]);

    // Calcular nuevo progreso del curso
    const totalLessonsQuery = `
      SELECT COUNT(*) as total_lessons
      FROM lessons
      WHERE course_id = ?
    `;

    const totalLessonsData = await executeQuery(totalLessonsQuery, [lesson.course_id]);
    const totalLessons = totalLessonsData[0].total_lessons;

    const completedLessonsQuery = `
      SELECT COUNT(*) as completed_lessons
      FROM lesson_progress
      WHERE user_id = ? AND lesson_id IN (
        SELECT id FROM lessons WHERE course_id = ?
      ) AND completed = TRUE
    `;

    const completedLessonsData = await executeQuery(completedLessonsQuery, [user.id, lesson.course_id]);
    const completedLessons = completedLessonsData[0].completed_lessons;

    // Calcular porcentaje de progreso
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Actualizar progreso en la inscripción
    const updateEnrollmentQuery = `
      UPDATE course_enrollments 
      SET progress_percentage = ?, 
          last_activity_at = NOW()
      WHERE user_id = ? AND course_id = ?
    `;

    await executeQuery(updateEnrollmentQuery, [progressPercentage, user.id, lesson.course_id]);

    console.log(`✅ Lección marcada como completada. Progreso del curso: ${progressPercentage}%`);

    res.status(200).json({
      success: true,
      message: 'Lección marcada como completada',
      progress: {
        lesson_completed: true,
        course_progress: progressPercentage,
        completed_lessons: completedLessons,
        total_lessons: totalLessons
      }
    });

  } catch (error: any) {
    console.error('❌ Error marcando lección como completada:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}