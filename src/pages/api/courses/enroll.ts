import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getCourseById, enrollUserInCourse } from '@/lib/courses_database_new';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { course_id, user_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ message: 'ID del curso requerido' });
    }

    // Obtener userId del token si no se proporciona
    let userId = user_id;
    if (!userId) {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024'
          ) as { userId: number; email: string };
          userId = decoded.userId;
        }
      } catch (error) {
        console.log('No se pudo obtener userId del token, usando 1');
      }
    }
    
    // Fallback por defecto
    if (!userId) {
      userId = 1;
    }

    // Verificar que el curso existe
    const course = await getCourseById(course_id);
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // Inscribirse al curso
    const success = await enrollUserInCourse(userId, course_id);
    
    if (!success) {
      return res.status(500).json({ message: 'Error al inscribirse al curso o ya está inscrito' });
    }

    res.status(200).json({ 
      message: 'Inscripción exitosa', 
      success: true
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}