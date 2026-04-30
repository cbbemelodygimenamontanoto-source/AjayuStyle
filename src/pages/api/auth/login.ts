import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserForLogin, cleanUser } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    // Buscar usuario por email con password_hash incluido
    const user = await getUserForLogin(email);
    
    console.log('Usuario encontrado:', user ? 'Sí' : 'No');
    console.log('Password hash existe:', user?.password_hash ? 'Sí' : 'No');
    
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.password_hash) {
      console.error('Password hash es undefined o null:', user);
      return res.status(401).json({ message: 'Usuario no encontrado o sin contraseña' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024',
      { expiresIn: '7d' }
    );

    // Limpiar usuario para respuesta (eliminar password_hash)
    const cleanUserData = cleanUser(user);

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: cleanUserData
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
