import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery, canUserManageCourse } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/lib/database';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use PUT para editar el curso.' 
    });
  }

  const { courseId } = req.query;

  if (!courseId || isNaN(Number(courseId))) {
    return res.status(400).json({ 
      success: false,
      message: 'ID de curso inválido' 
    });
  }

  try {
    // Obtener usuario autenticado
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    // Verificar permisos (solo instructor o admin pueden editar)
    const canManage = await canUserManageCourse(user.id.toString(), Number(courseId));
    if (!canManage) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permisos para editar este curso' 
      });
    }

    // Datos a actualizar
    const { 
      title, 
      description, 
      category, 
      level, 
      price, 
      language,
      published,
      thumbnail_url,
      banner_url
    } = req.body;

    // Verificar que al menos un campo esté presente
    if (!title && !description && !category && !level && !price && !language && 
        published === undefined && !thumbnail_url && !banner_url) {
      return res.status(400).json({ 
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar' 
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (level !== undefined) {
      updates.push('level = ?');
      values.push(level);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (language !== undefined) {
      updates.push('language = ?');
      values.push(language);
    }
    if (published !== undefined) {
      updates.push('published = ?');
      values.push(published);
    }
    if (thumbnail_url !== undefined) {
      updates.push('thumbnail_url = ?');
      values.push(thumbnail_url);
    }
    if (banner_url !== undefined) {
      updates.push('banner_url = ?');
      values.push(banner_url);
    }

    // Agregar fecha de actualización
    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Agregar el ID al final de los valores
    values.push(Number(courseId));

    const updateQuery = `
      UPDATE courses 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    const result = await executeQuery(updateQuery, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Curso no encontrado' 
      });
    }

    // Obtener el curso actualizado
    const updatedCourse = await executeQuery(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );

    res.status(200).json({
      success: true,
      message: 'Curso actualizado exitosamente',
      course: updatedCourse[0]
    });

  } catch (error: any) {
    console.error('Error actualizando curso:', error);
    
    // Manejar errores específicos de MySQL2
    if (error.message && error.message.includes('Net.connect is not a function')) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos. Contacte al administrador.',
        technical: error.message
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}