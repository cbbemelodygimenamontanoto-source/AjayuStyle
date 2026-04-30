import type { NextApiRequest, NextApiResponse } from 'next';
import { getInstructorCompleteStats } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verificar autenticación
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    // Verificar que el usuario es instructor o admin
    // Aquí deberías verificar el rol del usuario

    const { instructor_id } = req.query;
    
    if (!instructor_id || isNaN(Number(instructor_id))) {
      return res.status(400).json({ message: 'ID de instructor inválido' });
    }

    if (req.method === 'GET') {
      const stats = await getInstructorCompleteStats(String(instructor_id));

      return res.status(200).json({
        message: 'Estadísticas obtenidas exitosamente',
        instructor_id: instructor_id,
        statistics: stats
      });
    }

    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API de estadísticas completas:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}