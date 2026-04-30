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
    const { lessonId } = req.query;

    if (!lessonId || isNaN(Number(lessonId))) {
      return res.status(400).json({ message: 'ID de lección inválido' });
    }

    // Verificar que el usuario sea instructor
    const userRoles = await executeQuery(
      'SELECT ur.name FROM user_roles ur JOIN user_role_assignments ura ON ur.id = ura.role_id WHERE ura.user_id = ?',
      [userId]
    );

    const isInstructor = userRoles.some((role: any) => 
      role.name === 'instructor' || role.name === 'administrador'
    );

    if (!isInstructor) {
      return res.status(403).json({ message: 'No tienes permisos de instructor' });
    }

    // Verificar que la lección pertenece al instructor
    const lessonCheck = await executeQuery(
      `SELECT l.*, c.instructor_id 
       FROM lessons l 
       JOIN courses c ON l.course_id = c.id 
       WHERE l.id = ? AND c.instructor_id = ?`,
      [lessonId, userId]
    );

    if (lessonCheck.length === 0) {
      return res.status(404).json({ message: 'Lección no encontrada o no tienes permisos' });
    }

    if (req.method === 'PUT') {
      // Actualizar lección
      const { title, description, content, video_url, lesson_type, estimated_minutes, order_index, is_preview } = req.body;

      await executeQuery(
        `UPDATE lessons SET 
          title = ?, description = ?, content = ?, video_url = ?, 
          lesson_type = ?, estimated_minutes = ?, order_index = ?, 
          is_preview = ?, updated_at = NOW()
        WHERE id = ?`,
        [
          title, description || '', content || '', video_url || '',
          lesson_type || 'video', estimated_minutes || 30, order_index || 1, 
          is_preview || false, lessonId
        ]
      );

      // Obtener la lección actualizada
      const updatedLesson = await executeQuery(
        'SELECT * FROM lessons WHERE id = ?',
        [lessonId]
      );

      return res.status(200).json({
        message: 'Lección actualizada exitosamente',
        lesson: updatedLesson[0]
      });
    }

    if (req.method === 'DELETE') {
      // Eliminar lección
      await executeQuery('DELETE FROM lessons WHERE id = ?', [lessonId]);

      return res.status(200).json({
        message: 'Lección eliminada exitosamente'
      });
    }

    if (req.method === 'GET') {
      // Obtener lección específica
      return res.status(200).json({
        lesson: lessonCheck[0]
      });
    }

    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error) {
    console.error('Error in lesson API:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}