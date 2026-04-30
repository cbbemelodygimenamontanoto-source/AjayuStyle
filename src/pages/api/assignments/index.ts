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

    if (req.method === 'GET') {
      const { course_id } = req.query;

      if (!course_id || typeof course_id !== 'string') {
        return res.status(400).json({ message: 'ID del curso requerido' });
      }

      // Obtener tareas del curso
      const assignments = await executeQuery(
        'SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at DESC',
        [course_id]
      );

      // Para cada tarea, obtener si el estudiante la ha enviado y su calificación
      const assignmentsWithProgress = await Promise.all(
        assignments.map(async (assignment: any) => {
          // Verificar si el estudiante ha enviado esta tarea
          const submission = await executeQuery(
            'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?',
            [assignment.id, userId]
          );

          let grade = null;
          if (submission && submission.length > 0) {
            // Obtener calificación si existe
            grade = await executeQuery(
              'SELECT * FROM grades WHERE submission_id = ?',
              [submission[0].id]
            );
          }

          return {
            ...assignment,
            has_submitted: submission && submission.length > 0,
            submission: submission && submission.length > 0 ? submission[0] : null,
            grade: grade && grade.length > 0 ? grade[0] : null
          };
        })
      );

      return res.status(200).json({ assignments: assignmentsWithProgress });

    } else if (req.method === 'POST') {
      // Crear nueva tarea (solo instructores)
      const { title, description, course_id, due_date, points_possible } = req.body;

      // Verificar que el usuario es instructor del curso
      const course = await executeQuery(
        'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
        [course_id, userId]
      );

      if (!course || course.length === 0) {
        return res.status(403).json({ message: 'No tienes permisos para crear tareas en este curso' });
      }

      const result = await executeQuery(
        'INSERT INTO assignments (course_id, title, description, due_date, points_possible, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [course_id, title, description, due_date, points_possible]
      );

      return res.status(201).json({ message: 'Tarea creada exitosamente', assignment_id: result.insertId });

    } else {
      return res.status(405).json({ message: 'Método no permitido' });
    }

  } catch (error: any) {
    console.error('Error en assignments:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}