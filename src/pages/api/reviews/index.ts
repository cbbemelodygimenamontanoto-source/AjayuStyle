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

    if (req.method === 'POST') {
      // Crear reseña
      const { course_id, rating, comment } = req.body;

      if (!course_id || !rating) {
        return res.status(400).json({ message: 'ID del curso y calificación son requeridos' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
      }

      // Verificar que el estudiante está inscrito en el curso
      const enrollment = await executeQuery(
        'SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?',
        [course_id, userId]
      );

      if (!enrollment || enrollment.length === 0) {
        return res.status(403).json({ message: 'Solo puedes reseñar cursos en los que estés inscrito' });
      }

      // Verificar si ya existe una reseña
      const existingReview = await executeQuery(
        'SELECT * FROM course_reviews WHERE course_id = ? AND student_id = ?',
        [course_id, userId]
      );

      if (existingReview && existingReview.length > 0) {
        return res.status(400).json({ message: 'Ya has dejado una reseña para este curso' });
      }

      // Crear la reseña
      const result = await executeQuery(
        'INSERT INTO course_reviews (course_id, student_id, rating, comment, status, created_at) VALUES (?, ?, ?, ?, "approved", NOW())',
        [course_id, userId, rating, comment || '']
      );

      return res.status(201).json({ 
        message: 'Reseña creada exitosamente', 
        review_id: result.insertId 
      });

    } else if (req.method === 'GET') {
      // Obtener reseñas de un curso
      const { course_id } = req.query;

      if (!course_id || typeof course_id !== 'string') {
        return res.status(400).json({ message: 'ID del curso requerido' });
      }

      const reviews = await executeQuery(
        `SELECT r.*, u.name as student_name, u.avatar as student_avatar 
         FROM course_reviews r 
         JOIN users u ON r.student_id = u.id 
         WHERE r.course_id = ? AND r.status = 'approved'
         ORDER BY r.created_at DESC`,
        [course_id]
      );

      return res.status(200).json({ reviews });

    } else {
      return res.status(405).json({ message: 'Método no permitido' });
    }

  } catch (error: any) {
    console.error('Error en reviews:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}