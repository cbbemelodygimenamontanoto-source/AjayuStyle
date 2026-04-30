import type { NextApiRequest, NextApiResponse } from 'next';
import { getInstructorCourseStats, getInstructorOverallStats } from '@/lib/database';
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
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Use GET para obtener estadísticas.' 
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

    // Verificar que el usuario tenga permisos de instructor o administrador
    const allowedRoles = ['instructor', 'administrador'];
    const userRoles = user.roles?.map(role => role.name) || [];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permisos para ver estas estadísticas' 
      });
    }

    // Obtener parámetros de query
    const { type = 'all' } = req.query;

    if (type === 'course' || type === 'all') {
      // Obtener estadísticas por curso
      const courseStats = await getInstructorCourseStats(user.id.toString());
      
      if (type === 'course') {
        return res.status(200).json({
          success: true,
          courseStats
        });
      }
    }

    if (type === 'overall' || type === 'all') {
      // Obtener estadísticas generales
      const overallStats = await getInstructorOverallStats(user.id.toString());
      
      if (type === 'overall') {
        return res.status(200).json({
          success: true,
          overallStats
        });
      }
    }

    // Si type es 'all', obtener ambas estadísticas
    const [courseStats, overallStats] = await Promise.all([
      getInstructorCourseStats(user.id.toString()),
      getInstructorOverallStats(user.id.toString())
    ]);

    // Retornar ambas estadísticas
    return res.status(200).json({
      success: true,
      courseStats: courseStats || [],
      overallStats
    });

  } catch (error: any) {
    console.error('Error en API instructor stats:', error);
    
    // Manejar errores específicos de MySQL2
    if (error.message && error.message.includes('Net.connect is not a function')) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de base de datos. Contacte al administrador.',
        technical: error.message
      });
    }

    // Otros errores
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener estadísticas',
      technical: error.message
    });
  }
}