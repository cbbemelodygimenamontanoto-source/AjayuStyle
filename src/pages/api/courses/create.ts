import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery, getUserById } from '@/lib/database';
import jwt from 'jsonwebtoken';

// Función para verificar token y obtener usuario
async function getUserFromRequest(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024'
    ) as { userId: number; email: string };

    const user = await getUserById(decoded.userId.toString());
    return user;
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { 
      title, 
      description, 
      level, 
      duration_hours, 
      price, 
      category, 
      published = false 
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Título y descripción requeridos' });
    }

    // Obtener usuario autenticado
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Verificar que el usuario tenga permisos de instructor o administrador
    const allowedRoles = ['instructor', 'administrador'];
    const userRoles = user.roles?.map(role => role.name) || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'No tienes permisos para crear cursos' });
    }

    const instructorId = user.id;

    // Crear curso con la estructura correcta de la BD
    const courseQuery = `
      INSERT INTO courses (
        title, slug, description, instructor_id, level, duration_hours, 
        price, is_free, category_id, published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    // Generar slug único basado en el título
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + '-' + Date.now();

    // Obtener category_id basado en el nombre de categoría proporcionado
    let categoryId = null;
    if (category) {
      try {
        const categoryResult = await executeQuery(
          'SELECT id FROM course_categories WHERE name = ? LIMIT 1',
          [category]
        );
        if (categoryResult.length > 0) {
          categoryId = categoryResult[0].id;
        }
      } catch (error) {
        console.log('Categoría no encontrada, usando NULL');
      }
    }

    // Normalizar el nivel según el ENUM de la BD
    const normalizeLevel = (levelValue: string) => {
      const levelMap: Record<string, string> = {
        'beginner': 'principiante',
        'principiante': 'principiante',
        'Principiante': 'principiante',
        'intermediate': 'intermedio',
        'intermedio': 'intermedio',
        'Intermedio': 'intermedio',
        'advanced': 'avanzado',
        'avanzado': 'avanzado',
        'Avanzado': 'avanzado'
      };
      
      return levelMap[levelValue] || 'principiante';
    };

    const normalizedLevel = normalizeLevel(level || 'principiante');
    console.log('Datos del curso:', {
      title,
      slug,
      level: normalizedLevel,
      duration_hours: duration_hours || 10,
      price: price || 0,
      is_free: price === 0,
      categoryId,
      published
    });

    const result = await executeQuery(courseQuery, [
      title, slug, description, instructorId, 
      normalizedLevel, duration_hours || 10, 
      price || 0, price === 0, categoryId, published
    ]);

    res.status(201).json({
      message: 'Curso creado exitosamente',
      course_id: result.insertId,
      success: true
    });

  } catch (error: any) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message,
      sql: error.sql,
      code: error.code
    });
  }
}