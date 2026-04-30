import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { getUserById, cleanUser } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.substring(7); // Remover 'Bearer '

  try {
    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024'
    ) as { userId: number; email: string };

    // Obtener usuario
    const user = await getUserById(decoded.userId.toString());
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Limpiar usuario para respuesta
    const cleanUserData = cleanUser(user);

    res.status(200).json({
      user: cleanUserData,
      valid: true
    });

  } catch (error) {
    console.error('Error verificando token:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
