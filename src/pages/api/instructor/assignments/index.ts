import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { executeQuery, executeQuerySingle } from '@/lib/database';

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

    // Verificar que el usuario sea instructor usando el sistema de roles correcto
    const userRoles = await executeQuery(
      'SELECT ur.name as role_name FROM user_roles ur JOIN user_role_assignments ura ON ur.id = ura.role_id WHERE ura.user_id = ?',
      [userId]
    );

    const isInstructor = userRoles.some((role: any) => 
      role.role_name === 'instructor' || role.role_name === 'administrador'
    );

    if (!isInstructor) {
      return res.status(403).json({ message: 'No tienes permisos de instructor' });
    }

    if (req.method === 'GET') {
      // Obtener tareas del curso
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({ message: 'CourseId es requerido' });
      }

      // Verificar que el curso pertenece al instructor
      const courseCheck = await executeQuery(
        'SELECT id FROM courses WHERE id = ? AND instructor_id = ?',
        [courseId, userId]
      );

      if (courseCheck.length === 0) {
        return res.status(404).json({ message: 'Curso no encontrado o no tienes permisos' });
      }

      // Obtener tareas con información de envíos
      const assignments = await executeQuery(
        `SELECT 
          a.id,
          a.lesson_id,
          a.title,
          a.description,
          a.due_date,
          a.points_possible as max_points,
          COALESCE(s.submissions_count, 0) as submissions_count,
          COALESCE(s.avg_score, NULL) as average_grade
        FROM assignments a
        LEFT JOIN (
          SELECT 
            assignment_id,
            COUNT(*) as submissions_count,
            AVG(ag.total_score) as avg_score
          FROM assignment_submissions s
          LEFT JOIN assignment_grades ag ON s.id = ag.submission_id
          GROUP BY assignment_id
        ) s ON a.id = s.assignment_id
        WHERE a.course_id = ?
        ORDER BY a.id DESC`,
        [courseId]
      );

      return res.status(200).json({ assignments });
    }

    if (req.method === 'POST') {
      // Crear nueva tarea
      const { courseId, lessonId, title, description, dueDate, maxPoints, allowedFileTypes } = req.body;

      if (!courseId || !title) {
        return res.status(400).json({ message: 'CourseId y título son requeridos' });
      }

      // Verificar que el curso pertenece al instructor
      const courseCheck = await executeQuerySingle(
        'SELECT id FROM courses WHERE id = ? AND instructor_id = ?',
        [courseId, userId]
      );

      if (!courseCheck) {
        return res.status(404).json({ message: 'Curso no encontrado o no tienes permisos' });
      }

      // Si se proporciona lessonId, verificar que pertenece al curso
      if (lessonId) {
        const lessonCheck = await executeQuerySingle(
          'SELECT id FROM lessons WHERE id = ? AND course_id = ?',
          [lessonId, courseId]
        );

        if (!lessonCheck) {
          return res.status(404).json({ message: 'Lección no encontrada o no pertenece al curso' });
        }
      }

      const result = await executeQuery(
        `INSERT INTO assignments (
          course_id, lesson_id, title, description, due_date, points_possible, 
          file_types_allowed, max_file_size_mb, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          courseId, 
          lessonId || null, 
          title, 
          description || '', 
          dueDate || null, 
          maxPoints || 100,
          (allowedFileTypes || ['pdf', 'docx', 'txt']).join(','),
          10
        ]
      );

      // Obtener la tarea creada
      const newAssignment = await executeQuery(
        'SELECT * FROM assignments WHERE id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        message: 'Tarea creada exitosamente',
        assignment: newAssignment[0]
      });
    }

    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error) {
    console.error('Error in assignments API:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}