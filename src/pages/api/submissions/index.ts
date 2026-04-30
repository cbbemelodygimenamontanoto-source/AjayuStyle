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

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Método no permitido' });
    }

    const { assignment_id, file_name, file_path } = req.body;

    if (!assignment_id || !file_name || !file_path) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar que la tarea existe
    const assignment = await executeQuery(
      'SELECT * FROM assignments WHERE id = ?',
      [assignment_id]
    );

    if (!assignment || assignment.length === 0) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    // Verificar que el estudiante está inscrito en el curso
    const enrollment = await executeQuery(
      'SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?',
      [assignment[0].course_id, userId]
    );

    if (!enrollment || enrollment.length === 0) {
      return res.status(403).json({ message: 'No estás inscrito en este curso' });
    }

    // Verificar si ya envió una tarea
    const existingSubmission = await executeQuery(
      'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignment_id, userId]
    );

    if (existingSubmission && existingSubmission.length > 0) {
      return res.status(400).json({ message: 'Ya has enviado una tarea para este assignment' });
    }

    // Crear la entrega
    const result = await executeQuery(
      'INSERT INTO submissions (assignment_id, student_id, file_name, file_path, submitted_at) VALUES (?, ?, ?, ?, NOW())',
      [assignment_id, userId, file_name, file_path]
    );

    return res.status(201).json({ 
      message: 'Tarea enviada exitosamente', 
      submission_id: result.insertId 
    });

  } catch (error: any) {
    console.error('Error enviando tarea:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}