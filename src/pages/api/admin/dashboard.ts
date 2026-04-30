import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery, executeQuerySingle, updateUserRole, getUserById } from '@/lib/database';
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

    // Obtener usuario con roles usando la función dedicada
    const user = await getUserById(decoded.userId.toString());
    
    return user;
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir métodos GET y POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Método no permitido. Use GET para obtener datos o POST para actualizar roles.' 
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

    // Verificar que el usuario sea administrador
    if (!user.roles?.some(role => role.name === 'administrador')) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tiene permisos de administrador' 
      });
    }

    if (req.method === 'GET') {
      // Obtener usuarios con sus roles usando nombres correctos de tabla
      const usersData = await executeQuery<any>(
        `SELECT u.id, u.name, u.email, u.created_at,
                (SELECT MAX(last_accessed_at) FROM course_enrollments ce WHERE ce.user_id = u.id) as last_login,
                ur.id as role_id, ur.name as role_name, ur.description as role_description, ur.permissions as role_permissions
         FROM users u 
         LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
         LEFT JOIN user_roles ur ON ura.role_id = ur.id
         ORDER BY u.created_at DESC`
      );
      
      // Transformar datos para agrupar roles por usuario
      const usersMap = new Map<number, any>();
      
      usersData.forEach((user: any) => {
        if (!usersMap.has(user.id)) {
          usersMap.set(user.id, {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
            last_login: user.last_login,
            roles: []
          });
        }
        
        if (user.role_id) {
          usersMap.get(user.id).roles.push({
            id: user.role_id,
            name: user.role_name,
            description: user.role_description,
            permissions: user.role_permissions
          });
        }
      });
      
      const users = Array.from(usersMap.values());
      
      // Obtener estadísticas generales usando nombres correctos
      const [userCount, instructorCount, courseCount] = await Promise.all([
        executeQuery('SELECT COUNT(*) as count FROM users'),
        executeQuery('SELECT COUNT(*) as count FROM user_role_assignments ura JOIN user_roles ur ON ura.role_id = ur.id WHERE ur.name = "instructor"'),
        executeQuery('SELECT COUNT(*) as count FROM courses')
      ]);
      
      const stats = {
        total_users: userCount[0]?.count || 0,
        total_instructors: instructorCount[0]?.count || 0,
        total_students: (userCount[0]?.count || 0) - (instructorCount[0]?.count || 0),
        total_courses: courseCount[0]?.count || 0,
        total_revenue: 0 // Se puede calcular después si es necesario
      };

      return res.status(200).json({
        success: true,
        users,
        stats
      });
    }

    if (req.method === 'POST') {
      // Actualizar rol de usuario
      const { userId, newRole } = req.body;
      
      if (!userId || !newRole) {
        return res.status(400).json({
          success: false,
          message: 'userId y newRole son requeridos'
        });
      }

      const allowedRoles = ['normal', 'instructor', 'moderador', 'administrador'];
      if (!allowedRoles.includes(newRole)) {
        return res.status(400).json({
          success: false,
          message: 'Rol no válido'
        });
      }

      const updated = await updateUserRole(userId.toString(), newRole);
      
      if (updated) {
        return res.status(200).json({
          success: true,
          message: 'Rol actualizado exitosamente'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Error actualizando el rol'
        });
      }
    }

  } catch (error: any) {
    console.error('Error en API admin dashboard:', error);
    
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
      message: 'Error interno del servidor',
      technical: error.message
    });
  }
}