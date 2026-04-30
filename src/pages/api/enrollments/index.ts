import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserEnrollments } from '@/lib/courses_database_new';
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
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Método no permitido. Use GET para obtener inscripciones.' 
    });
  }

  try {
    // Verificar autenticación
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no autenticado' 
      });
    }

    // Obtener inscripciones de la base de datos
    const enrollments = await getUserEnrollments(user.id);

    res.status(200).json({
      success: true,
      enrollments
    });

  } catch (error: any) {
    console.error('Error obteniendo inscripciones:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}