import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { executeQuery } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token de autenticación requerido' });
  }

  try {
    // Verificar token y obtener usuario
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024') as any;
    const userId = decoded.userId;

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Método no permitido' });
    }

    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ message: 'ID de curso requerido' });
    }

    // Verificar que el estudiante está inscrito
    const enrollment = await executeQuery(
      'SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?',
      [courseId, userId]
    );

    if (!enrollment || enrollment.length === 0) {
      return res.status(403).json({ message: 'No estás inscrito en este curso' });
    }

    // Obtener información del curso
    const course = await executeQuery(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );

    if (!course || course.length === 0) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Obtener lecciones completadas
    const completedLessons = await executeQuery(
      'SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ? AND course_id = ? AND completed = TRUE',
      [userId, courseId]
    );

    // Obtener tareas enviadas
    const submittedAssignments = await executeQuery(
      'SELECT COUNT(*) as count FROM submissions s JOIN assignments a ON s.assignment_id = a.id WHERE s.student_id = ? AND a.course_id = ?',
      [userId, courseId]
    );

    // Obtener calificaciones
    const grades = await executeQuery(
      'SELECT g.*, a.title as assignment_title, a.points_possible FROM grades g JOIN submissions s ON g.submission_id = s.id JOIN assignments a ON s.assignment_id = a.id WHERE s.student_id = ? AND a.course_id = ?',
      [userId, courseId]
    );

    // Calcular progreso general
    const totalLessons = await executeQuery(
      'SELECT COUNT(*) as count FROM lessons WHERE course_id = ?',
      [courseId]
    );

    const totalAssignments = await executeQuery(
      'SELECT COUNT(*) as count FROM assignments WHERE course_id = ?',
      [courseId]
    );

    const lessonProgress = totalLessons[0]?.count > 0 ? (completedLessons[0]?.count / totalLessons[0]?.count) * 100 : 0;
    const assignmentProgress = totalAssignments[0]?.count > 0 ? (submittedAssignments[0]?.count / totalAssignments[0]?.count) * 100 : 0;
    const overallProgress = Math.round((lessonProgress + assignmentProgress) / 2);

    // Calcular promedio de calificaciones
    const averageGrade = grades.length > 0 
      ? grades.reduce((sum: number, grade: any) => sum + (grade.score / grade.max_score * 100), 0) / grades.length
      : 0;

    const courseProgress = {
      course_id: parseInt(courseId as string),
      course_title: course[0].title,
      total_lessons: totalLessons[0]?.count || 0,
      completed_lessons: completedLessons[0]?.count || 0,
      total_assignments: totalAssignments[0]?.count || 0,
      submitted_assignments: submittedAssignments[0]?.count || 0,
      graded_assignments: grades.length,
      average_grade: Math.round(averageGrade * 100) / 100,
      completion_percentage: overallProgress,
      enrolled_at: enrollment[0].enrolled_at,
      last_activity: new Date().toISOString(),
      grades: grades,
      progress: {
        overall_progress: overallProgress,
        lesson_progress: Math.round(lessonProgress),
        assignment_progress: Math.round(assignmentProgress),
        completed_lessons: completedLessons[0]?.count || 0,
        total_lessons: totalLessons[0]?.count || 0,
        submitted_assignments: submittedAssignments[0]?.count || 0,
        total_assignments: totalAssignments[0]?.count || 0,
        average_grade: Math.round(averageGrade * 100) / 100
      }
    };

    return res.status(200).json(courseProgress);
  } catch (error: any) {
    console.error('Error obteniendo progreso:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}