import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import { getUserById, executeQuerySingle, executeQuery } from './database';

// ========================================
// FUNCIONES DE AUTENTICACIÓN Y AUTORIZACIÓN
// ========================================

// Extraer token del header Authorization
export function extractTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remover 'Bearer '
}

// Verificar token JWT y obtener usuario
export async function getUserFromToken(req: NextApiRequest) {
  try {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return null;
    }
    
    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024'
    ) as { userId: number; email: string };
    
    // Obtener usuario
    const user = await executeQuerySingle(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [decoded.userId.toString()]
    );
    
    if (!user) {
      return null;
    }
    
    // Obtener todos los roles del usuario
    const roles = await executeQuery(
      `SELECT ur.name 
       FROM user_role_assignments ura 
       JOIN user_roles ur ON ura.role_id = ur.id 
       WHERE ura.user_id = ?`,
      [decoded.userId.toString()]
    );
    
    // Agregar roles al usuario
    user.roles = roles.map(role => ({ name: role.name }));
    
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

// Verificar si el usuario tiene un rol específico
export function hasRole(user: any, roleName: string): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role: any) => role.name === roleName);
}

// Verificar si el usuario tiene alguno de los roles especificados
export function hasAnyRole(user: any, roleNames: string[]): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((role: any) => roleNames.includes(role.name));
}

// Verificar permisos de administrador
export function isAdmin(user: any): boolean {
  return hasAnyRole(user, ['administrador']);
}

// Verificar permisos de instructor
export function isInstructor(user: any): boolean {
  return hasAnyRole(user, ['instructor', 'administrador']);
}

// Verificar permisos de moderador
export function isModerator(user: any): boolean {
  return hasAnyRole(user, ['moderador', 'administrador']);
}

// Verificar si es estudiante normal
export function isStudent(user: any): boolean {
  return hasRole(user, 'normal');
}

// Middleware para verificar autenticación
export async function requireAuth(req: NextApiRequest, res: any) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    res.status(401).json({ 
      success: false, 
      error: 'No autorizado - Token inválido o expirado' 
    });
    return null;
  }
  
  return user;
}

// Middleware para verificar roles específicos
export async function requireRole(req: NextApiRequest, res: any, requiredRoles: string[]) {
  const user = await requireAuth(req, res);
  
  if (!user) {
    return null; // requireAuth ya respondió con error
  }
  
  if (!hasAnyRole(user, requiredRoles)) {
    res.status(403).json({ 
      success: false, 
      error: 'Acceso denegado - Permisos insuficientes' 
    });
    return null;
  }
  
  return user;
}

// Middleware solo para administradores
export async function requireAdmin(req: NextApiRequest, res: any) {
  return requireRole(req, res, ['administrador']);
}

// Middleware solo para instructores
export async function requireInstructor(req: NextApiRequest, res: any) {
  return requireRole(req, res, ['instructor', 'administrador']);
}

// Middleware solo para moderadores
export async function requireModerator(req: NextApiRequest, res: any) {
  return requireRole(req, res, ['moderador', 'administrador']);
}

// Función para verificar token JWT (alias de getUserFromToken)
export async function verifyAuthToken(token: string) {
  try {
    console.log(`🔍 verifyAuthToken: Iniciando verificación...`);
    
    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024'
    ) as { userId: number; email: string };
    
    console.log(`🔍 verifyAuthToken: Token decodificado:`, decoded);
    
    // Obtener usuario
    const user = await executeQuerySingle(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [decoded.userId.toString()]
    );
    
    console.log(`🔍 verifyAuthToken: Usuario encontrado:`, user ? `ID: ${user.id}, Email: ${user.email}` : 'NULL');
    
    if (!user) {
      console.log(`❌ verifyAuthToken: Usuario no encontrado para ID: ${decoded.userId}`);
      return null;
    }
    
    // Obtener todos los roles del usuario
    const roles = await executeQuery(
      `SELECT ur.name 
       FROM user_role_assignments ura 
       JOIN user_roles ur ON ura.role_id = ur.id 
       WHERE ura.user_id = ?`,
      [decoded.userId.toString()]
    );
    
    console.log(`🔍 verifyAuthToken: Roles encontrados:`, roles);
    
    // Agregar roles al usuario
    user.roles = roles.map(role => ({ name: role.name }));
    
    console.log(`✅ verifyAuthToken: Verificación exitosa para usuario:`, user.email);
    
    return user;
  } catch (error) {
    console.error('❌ verifyAuthToken: Error verificando token:', error);
    return null;
  }
}

// Generar nuevo token JWT
export function generateToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024',
    { expiresIn: '7d' }
  );
}