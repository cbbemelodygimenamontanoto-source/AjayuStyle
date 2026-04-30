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

    if (req.method === 'POST') {
      // Crear nueva lección
      const { courseId, title, description, content, video_url, lesson_type, estimated_minutes, order_index, is_preview } = req.body;

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

      const result = await executeQuery(
        `INSERT INTO lessons (
          course_id, title, description, content, video_url, 
          estimated_minutes, order_index, is_preview, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          courseId, title, description || '', content || '', video_url || '',
          estimated_minutes || 30, order_index || 1, is_preview || false
        ]
      );

      // Obtener la lección creada
      const newLesson = await executeQuery(
        'SELECT * FROM lessons WHERE id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        message: 'Lección creada exitosamente',
        lesson: newLesson[0]
      });
    }

    if (req.method === 'GET') {
      // Obtener lecciones del curso
      const { courseId } = req.query;

      if (!courseId) {
        return res.status(400).json({ message: 'CourseId es requerido' });
      }

      // Verificar que el curso pertenece al instructor
      const courseCheck = await executeQuerySingle(
        'SELECT id FROM courses WHERE id = ? AND instructor_id = ?',
        [courseId, userId]
      );

      if (!courseCheck) {
        return res.status(404).json({ message: 'Curso no encontrado o no tienes permisos' });
      }

      const lessons = await executeQuery(
        'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
        [courseId]
      );

      return res.status(200).json({ lessons });
    }

    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error) {
    console.error('Error in lessons API:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}