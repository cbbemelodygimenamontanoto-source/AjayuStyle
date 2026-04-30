import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const user = await createUser(name, email, passwordHash);

    if (!user) {
      return res.status(500).json({ message: 'Error creando usuario' });
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

    // Retornar usuario sin contraseña
    const { password_hash, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
