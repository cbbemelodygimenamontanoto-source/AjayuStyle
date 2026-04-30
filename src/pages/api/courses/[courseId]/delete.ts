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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use DELETE para eliminar el curso.' 
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

    // Verificar permisos (solo instructor o admin pueden eliminar)
    const canManage = await canUserManageCourse(user.id.toString(), Number(courseId));
    if (!canManage) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permisos para eliminar este curso' 
      });
    }

    // Verificar que el curso existe antes de eliminar
    const courseCheck = await executeQuery(
      'SELECT id, title FROM courses WHERE id = ?',
      [courseId]
    );

    if (courseCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Curso no encontrado' 
      });
    }

    const courseTitle = courseCheck[0].title;

    // Iniciar transacción para eliminar datos relacionados
    await executeQuery('START TRANSACTION');

    try {
      // Eliminar datos relacionados en orden correcto (por claves foráneas)

      // 1. Eliminar progreso de lecciones
      await executeQuery(`
        DELETE lp FROM lesson_progress lp
        INNER JOIN lessons l ON lp.lesson_id = l.id
        WHERE l.course_id = ?
      `, [courseId]);

      // 2. Eliminar calificaciones de tareas
      await executeQuery(`
        DELETE ag FROM assignment_grades ag
        INNER JOIN assignment_submissions s ON ag.submission_id = s.id
        INNER JOIN assignments a ON s.assignment_id = a.id
        WHERE a.course_id = ?
      `, [courseId]);

      // 3. Eliminar envíos de tareas
      await executeQuery(`
        DELETE s FROM assignment_submissions s
        INNER JOIN assignments a ON s.assignment_id = a.id
        WHERE a.course_id = ?
      `, [courseId]);

      // 4. Eliminar tareas
      await executeQuery('DELETE FROM assignments WHERE course_id = ?', [courseId]);

      // 5. Eliminar reseñas
      await executeQuery('DELETE FROM course_reviews WHERE course_id = ?', [courseId]);

      // 6. Eliminar inscripciones
      await executeQuery('DELETE FROM course_enrollments WHERE course_id = ?', [courseId]);

      // 7. Eliminar lecciones
      await executeQuery('DELETE FROM lessons WHERE course_id = ?', [courseId]);

      // 8. Finalmente eliminar el curso
      const result = await executeQuery('DELETE FROM courses WHERE id = ?', [courseId]);

      // Confirmar transacción
      await executeQuery('COMMIT');

      if (result.affectedRows === 0) {
        await executeQuery('ROLLBACK');
        return res.status(404).json({ 
          success: false,
          message: 'Curso no encontrado' 
        });
      }

      res.status(200).json({
        success: true,
        message: `Curso "${courseTitle}" eliminado exitosamente`
      });

    } catch (deleteError) {
      // Revertir cambios en caso de error
      await executeQuery('ROLLBACK');
      throw deleteError;
    }

  } catch (error: any) {
    console.error('Error eliminando curso:', error);
    
    // Asegurar que se haga rollback en caso de error
    try {
      await executeQuery('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error en rollback:', rollbackError);
    }
    
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