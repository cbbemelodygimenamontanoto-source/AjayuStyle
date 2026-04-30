import type { NextApiRequest, NextApiResponse } from 'next';
import { getPublishedCourses } from '@/lib/courses_database_new';
import { executeQuery } from '@/lib/database';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const courses = await getPublishedCourses();
      res.status(200).json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  } else if (req.method === 'POST') {
    // Crear nuevo curso
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'Token de autenticación requerido' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024') as any;
      const userId = decoded.userId;

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

      const { title, description, category, level, price, thumbnail_url, banner_url } = req.body;

      if (!title || !description) {
        return res.status(400).json({ message: 'Título y descripción son requeridos' });
      }

      const result = await executeQuery(
        `INSERT INTO courses (
          instructor_id, title, description, category, level, price, 
          thumbnail, banner, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId, title, description, category || 'general', 
          level || 'beginner', price || 0, 
          thumbnail_url || '', banner_url || ''
        ]
      );

      // Obtener el curso creado
      const newCourse = await executeQuery(
        'SELECT * FROM courses WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        message: 'Curso creado exitosamente',
        course: newCourse[0]
      });
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ 
        message: 'Error creando curso',
        error: error.message
      });
    }
  } else {
    return res.status(405).json({ message: 'Método no permitido' });
  }
}