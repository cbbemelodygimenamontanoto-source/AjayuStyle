import mysql from 'mysql2/promise';
import { User, UserWithRoles, UserRole } from '@/types';

// Configuración de conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '0000',
  database: process.env.DB_NAME || 'ajayu_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexiones
export const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
export async function testConnection(): Promise<boolean> {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    console.log('✅ Conexión a la base de datos exitosa');
    return true;
  } catch (error: any) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    console.warn('🔧 Solución sugerida:');
    console.warn('   1. Verifica que MySQL esté instalado: sudo apt install mysql-server');
    console.warn('   2. Inicia el servicio: sudo systemctl start mysql');
    console.warn('   3. Verifica el estado: sudo systemctl status mysql');
    console.warn('   4. Revisa las credenciales en las variables de entorno');
    return false;
  }
}

// Función para ejecutar consultas
export async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  // Usar pool.query en lugar de pool.execute para mayor flexibilidad con tipos de datos
  const [rows] = await pool.query(sql, params);
  return rows as any[];
}

// Función para ejecutar una sola consulta
export async function executeQuerySingle(sql: string, params: any[] = []): Promise<any> {
  const rows = await executeQuery(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Función para transacciones
export async function executeTransaction(queries: { sql: string; params: any[] }[]): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    for (const query of queries) {
      await connection.execute(query.sql, query.params);
    }
    
    await connection.commit();
    console.log('✅ Transacción completada exitosamente');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error en transacción:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Interfaz para User (simple, con role directamente)
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'normal' | 'instructor' | 'moderador' | 'administrador';
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  social_activated: boolean;
  avatar?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

// Interfaz para Course
export interface Course {
  id: string;
  instructor_id: string;
  category_id?: string;
  title: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  price: number;
  duration_hours: number;
  image_url?: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
  // Campos opcionales para compatibilidad con interfaces legacy
  slug?: string;
  language?: string;
  requirements?: string[];
  what_you_learn?: string[];
  tags?: string[];
  thumbnail_url?: string;
  status?: 'draft' | 'published' | 'archived' | 'deleted';
  duration_minutes?: number; // Solo para compatibilidad, usar duration_hours
}

// Interfaz para Lesson
export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
  created_at: Date;
  updated_at: Date;
}

// =====================================
// FUNCIONES DE USUARIOS (SIMPLES)
// =====================================

// Crear usuario
export async function createUser(userData: {
  email: string;
  username: string;
  password_hash: string;
  name: string;
  role?: 'normal' | 'instructor' | 'moderador' | 'administrador';
  social_activated?: boolean;
  avatar?: string;
  bio?: string;
}): Promise<User> {
  const sql = `
    INSERT INTO users (
      email, username, password_hash, name, role, social_activated, avatar, bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    userData.email,
    userData.username,
    userData.password_hash,
    userData.name,
    userData.role || 'normal',
    userData.social_activated || false,
    userData.avatar || null,
    userData.bio || null
  ];
  
  await executeQuery(sql, params);
  
  // Obtener el usuario recién creado
  const newUser = await getUserByEmail(userData.email);
  return newUser!;
}

// Obtener usuario por email
export async function getUserByEmail(email: string): Promise<User | null> {
  const sql = `
    SELECT * FROM users WHERE email = ?
  `;
  
  return await executeQuerySingle(sql, [email]);
}

// Obtener usuario por email con roles
export async function getUserWithRoles(email: string): Promise<UserWithRoles | null> {
  const sql = `
    SELECT 
      u.*,
      ur.id as role_id,
      ur.name as role_name,
      ur.description as role_description,
      ur.permissions as role_permissions
    FROM users u
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
    LEFT JOIN user_roles ur ON ura.role_id = ur.id
    WHERE u.email = ?
    LIMIT 1
  `;
  
  const user = await executeQuerySingle(sql, [email]);
  return cleanUser(user);
}

// Función específica para login que mantiene el password_hash
export async function getUserForLogin(email: string): Promise<any | null> {
  const sql = `
    SELECT 
      u.*,
      ur.id as role_id,
      ur.name as role_name,
      ur.description as role_description,
      ur.permissions as role_permissions
    FROM users u
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
    LEFT JOIN user_roles ur ON ura.role_id = ur.id
    WHERE u.email = ?
    LIMIT 1
  `;
  
  return await executeQuerySingle(sql, [email]);
}

// Obtener usuario por username
export async function getUserByUsername(username: string): Promise<User | null> {
  const sql = `
    SELECT * FROM users WHERE username = ?
  `;
  
  return await executeQuerySingle(sql, [username]);
}

// Obtener usuario por ID
export async function getUserById(id: string): Promise<UserWithRoles | null> {
  const sql = `
    SELECT 
      u.*,
      ur.id as role_id,
      ur.name as role_name,
      ur.description as role_description,
      ur.permissions as role_permissions
    FROM users u
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
    LEFT JOIN user_roles ur ON ura.role_id = ur.id
    WHERE u.id = ?
    LIMIT 1
  `;
  
  const user = await executeQuerySingle(sql, [id]);
  return cleanUser(user);
}

// Obtener todos los usuarios
export async function getAllUsers(): Promise<User[]> {
  const sql = `
    SELECT * FROM users ORDER BY created_at DESC
  `;
  
  return await executeQuery(sql);
}

// Actualizar usuario
export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  const updateFields: string[] = [];
  const params: any[] = [];
  
  // Construir dinámicamente los campos a actualizar
  Object.keys(userData).forEach(key => {
    if (key !== 'id' && userData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      params.push(userData[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No hay campos para actualizar');
  }
  
  params.push(id); // Agregar ID al final para el WHERE
  
  const sql = `
    UPDATE users 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = ?
  `;
  
  await executeQuery(sql, params);
  
  // Obtener el usuario actualizado
  const updatedUser = await getUserById(id);
  return updatedUser!;
}

// Eliminar usuario (soft delete)
export async function deleteUser(id: string): Promise<boolean> {
  const sql = `
    UPDATE users 
    SET status = 'deleted', updated_at = NOW()
    WHERE id = ?
  `;
  
  const result = await executeQuery(sql, [id]);
  return result.affectedRows > 0;
}

// Verificar si existe email
export async function emailExists(email: string): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as count FROM users WHERE email = ?
  `;
  
  const result = await executeQuerySingle(sql, [email]) as { count: number };
  return result.count > 0;
}

// Verificar si existe username
export async function usernameExists(username: string): Promise<boolean> {
  const sql = `
    SELECT COUNT(*) as count FROM users WHERE username = ?
  `;
  
  const result = await executeQuerySingle(sql, [username]) as { count: number };
  return result.count > 0;
}

// Cambiar password
export async function changePassword(userId: string, newPasswordHash: string): Promise<boolean> {
  const sql = `
    UPDATE users 
    SET password_hash = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  const result = await executeQuery(sql, [newPasswordHash, userId]);
  return result.affectedRows > 0;
}

// Actualizar último login
export async function updateLastLogin(userId: string): Promise<void> {
  const sql = `
    UPDATE users 
    SET last_login = NOW()
    WHERE id = ?
  `;
  
  await executeQuery(sql, [userId]);
}

// Verificar email
export async function verifyEmail(userId: string): Promise<boolean> {
  const sql = `
    UPDATE users 
    SET email_verified = true, email_verification_token = NULL, updated_at = NOW()
    WHERE id = ?
  `;
  
  const result = await executeQuery(sql, [userId]);
  return result.affectedRows > 0;
}

// Cambiar estado del usuario
export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> {
  const sql = `
    UPDATE users 
    SET status = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  const result = await executeQuery(sql, [status, userId]);
  return result.affectedRows > 0;
}

// =====================================
// FUNCIONES DE CURSOS
// =====================================

// Crear curso
// Función para crear curso (compatible con la estructura real de la DB)
export async function createCourse(
  title: string,
  description: string,
  instructor_id: string,
  price: number,
  level: 'beginner' | 'intermediate' | 'advanced',
  duration_hours: number,
  imageUrl?: string
): Promise<Course> {
  // Mapeo de niveles (disponible en todo el scope)
  const levelMap: { [key: string]: string } = {
    'beginner': 'Principiante',
    'intermediate': 'Intermedio', 
    'advanced': 'Avanzado'
  };
  
  try {
    const sql = `
      INSERT INTO courses (
        instructor_id, title, description, level, price, 
        duration_hours, image_url, published, category_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, 'General')
    `;
    
    const params = [
      parseInt(instructor_id), // Convertir a INT para la DB
      title,
      description,
      levelMap[level] || 'Principiante',
      price,
      duration_hours, // Usar duration_hours (no duration_minutes)
      imageUrl || null
    ];
    
    await executeQuery(sql, params);
    
    // Obtener el curso recién creado por título e instructor
    const newCourse = await getCourseByTitleAndInstructor(title, instructor_id);
    
    if (newCourse) {
      return newCourse;
    } else {
      throw new Error('No se pudo obtener el curso creado');
    }
  } catch (error) {
    console.error('Error creando curso en DB:', error.message);
    throw error;
  }
}

// Función auxiliar para obtener curso por título e instructor
export async function getCourseByTitleAndInstructor(title: string, instructor_id: string): Promise<Course | null> {
  try {
    const sql = `
      SELECT * FROM courses 
      WHERE title = ? AND instructor_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    return await executeQuerySingle(sql, [title, parseInt(instructor_id)]);
  } catch (error) {
    console.warn('Error obteniendo curso por título:', error);
    return null;
  }
}

// Obtener curso por ID
export async function getCourseById(id: string): Promise<Course | null> {
  const sql = `
    SELECT * FROM courses WHERE id = ?
  `;
  
  return await executeQuerySingle(sql, [id]);
}

// Obtener curso por slug
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const sql = `
      SELECT * FROM courses WHERE slug = ?
    `;
    
    return await executeQuerySingle(sql, [slug]);
  } catch (error) {
    return null;
  }
}

// Obtener todos los cursos
export async function getAllCourses(): Promise<Course[]> {
  const sql = `
    SELECT * FROM courses WHERE published = TRUE ORDER BY created_at DESC
  `;
  
  return await executeQuery(sql);
}

// Obtener cursos por instructor
export async function getCoursesByInstructor(instructorId: string): Promise<Course[]> {
  const sql = `
    SELECT * FROM courses WHERE instructor_id = ? ORDER BY created_at DESC
  `;
  
  return await executeQuery(sql, [instructorId]);
}

// Actualizar curso
export async function updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
  const updateFields: string[] = [];
  const params: any[] = [];
  
  // Construir dinámicamente los campos a actualizar
  Object.keys(courseData).forEach(key => {
    if (key !== 'id' && courseData[key] !== undefined) {
      if (key === 'requirements' || key === 'what_you_learn' || key === 'tags') {
        updateFields.push(`${key} = ?`);
        params.push(JSON.stringify(courseData[key] || []));
      } else {
        updateFields.push(`${key} = ?`);
        params.push(courseData[key]);
      }
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No hay campos para actualizar');
  }
  
  params.push(id);
  
  const sql = `
    UPDATE courses 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = ?
  `;
  
  await executeQuery(sql, params);
  
  const updatedCourse = await getCourseById(id);
  return updatedCourse!;
}

// Eliminar curso (soft delete)
export async function deleteCourse(id: string): Promise<boolean> {
  const sql = `
    UPDATE courses 
    SET status = 'deleted', updated_at = NOW()
    WHERE id = ?
  `;
  
  const result = await executeQuery(sql, [id]);
  return result.affectedRows > 0;
}

// =====================================
// FUNCIONES DE LECCIONES
// =====================================

// Crear lección
export async function createLesson(lessonData: {
  course_id: string;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
}): Promise<Lesson> {
  const sql = `
    INSERT INTO lessons (
      course_id, title, description, content, video_url,
      duration_minutes, order_index, is_preview
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    lessonData.course_id,
    lessonData.title,
    lessonData.description,
    lessonData.content,
    lessonData.video_url || null,
    lessonData.duration_minutes,
    lessonData.order_index,
    lessonData.is_preview
  ];
  
  await executeQuery(sql, params);
  
  // Obtener la lección recién creada
  const newLesson = await getLessonById(lessonData.course_id, lessonData.order_index);
  return newLesson!;
}

// Obtener lección por curso e índice
export async function getLessonById(courseId: string, orderIndex: number): Promise<Lesson | null> {
  const sql = `
    SELECT * FROM lessons WHERE course_id = ? AND order_index = ?
  `;
  
  return await executeQuerySingle(sql, [courseId, orderIndex]);
}

// Obtener lecciones por curso
export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const sql = `
    SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC
  `;
  
  return await executeQuery(sql, [courseId]);
}

// Actualizar lección
export async function updateLesson(courseId: string, orderIndex: number, lessonData: Partial<Lesson>): Promise<Lesson> {
  const updateFields: string[] = [];
  const params: any[] = [];
  
  Object.keys(lessonData).forEach(key => {
    if (key !== 'course_id' && key !== 'order_index' && lessonData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      params.push(lessonData[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No hay campos para actualizar');
  }
  
  params.push(courseId, orderIndex);
  
  const sql = `
    UPDATE lessons 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE course_id = ? AND order_index = ?
  `;
  
  await executeQuery(sql, params);
  
  const updatedLesson = await getLessonById(courseId, orderIndex);
  return updatedLesson!;
}

// Eliminar lección
export async function deleteLesson(courseId: string, orderIndex: number): Promise<boolean> {
  const sql = `
    DELETE FROM lessons WHERE course_id = ? AND order_index = ?
  `;
  
  const result = await executeQuery(sql, [courseId, orderIndex]);
  return result.affectedRows > 0;
}

// =====================================
// FUNCIONES DE PERMISOS Y ESTADÍSTICAS
// =====================================

// Verificar si el usuario puede gestionar un curso
export async function canUserManageCourse(userId: string, courseId: string): Promise<boolean> {
  try {
    const sql = `
      SELECT 1 FROM courses 
      WHERE id = ? AND instructor_id = ?
    `;
    
    const result = await executeQuerySingle(sql, [courseId, parseInt(userId)]);
    return result !== null;
  } catch (error) {
    console.error('Error verificando permisos de curso:', error.message);
    throw error;
  }
}

// Obtener estadísticas de cursos del instructor
export async function getInstructorCourseStats(instructorId: string): Promise<any[]> {
  try {
    const sql = `
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.description,
        c.price,
        c.published,
        c.created_at,
        COUNT(l.id) as lessons_count
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      WHERE c.instructor_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    return await executeQuery(sql, [parseInt(instructorId)]);
  } catch (error) {
    console.error('Error obteniendo estadísticas de cursos:', error.message);
    throw error;
  }
}

// Obtener estadísticas generales del instructor
export async function getInstructorOverallStats(instructorId: string): Promise<any> {
  try {
    const sql = `
      SELECT 
        COUNT(c.id) as total_courses,
        COUNT(CASE WHEN c.published = TRUE THEN 1 END) as published_courses,
        COUNT(CASE WHEN c.published = FALSE THEN 1 END) as draft_courses,
        COUNT(l.id) as total_lessons,
        AVG(CASE WHEN c.published = TRUE THEN c.price END) as avg_price
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      WHERE c.instructor_id = ?
    `;
    
    const result = await executeQuerySingle(sql, [instructorId]);
    return result || {
      total_courses: 0,
      published_courses: 0,
      draft_courses: 0,
      total_lessons: 0,
      avg_price: 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas generales:', error.message);
    throw error;
  }
}

// Actualizar rol de usuario (para administradores)
export async function updateUserRole(userId: string, newRole: 'normal' | 'instructor' | 'moderador' | 'administrador'): Promise<boolean> {
  try {
    // Primero eliminar todas las asignaciones de rol existentes
    await executeQuery(
      'DELETE FROM user_role_assignments WHERE user_id = ?',
      [parseInt(userId)]
    );
    
    // Obtener el ID del nuevo rol
    const roleResult = await executeQuerySingle(
      'SELECT id FROM user_roles WHERE name = ?',
      [newRole]
    );
    
    if (!roleResult) {
      console.error('Rol no encontrado:', newRole);
      return false;
    }
    
    // Asignar el nuevo rol
    await executeQuery(
      'INSERT INTO user_role_assignments (user_id, role_id, assigned_at) VALUES (?, ?, NOW())',
      [parseInt(userId), roleResult.id]
    );
    
    return true;
  } catch (error) {
    console.error('Error actualizando rol de usuario:', error);
    return false;
  }
}

// ===========================================
// MÓDULO COMPLETO DE CURSOS - NUEVAS FUNCIONES
// ===========================================

// Tipos para las nuevas entidades
export interface Assignment {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  description: string;
  file_types_allowed: string; // Comma separated: "pdf,docx,txt"
  max_file_size_mb: number;
  due_date?: Date;
  points_possible: number;
  created_at: Date;
  updated_at: Date;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_name: string;
  file_path: string;
  submitted_at: Date;
  status: 'submitted' | 'graded' | 'late';
}

export interface Grade {
  id: string;
  submission_id: string;
  instructor_id: string;
  score: number;
  max_score: number;
  feedback: string;
  graded_at: Date;
  status: 'approved' | 'rejected' | 'needs_revision';
}

export interface Review {
  id: string;
  course_id: string;
  student_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: Date;
  updated_at: Date;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_at: Date;
  progress_percentage: number;
  completed_at?: Date;
  status: 'active' | 'completed' | 'dropped';
}

// ===========================================
// GESTIÓN DE TAREAS (ASSIGNMENTS)
// ===========================================

// Crear nueva tarea
export async function createAssignment(assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment> {
  try {
    const sql = `
      INSERT INTO assignments (
        course_id, lesson_id, title, description, 
        file_types_allowed, max_file_size_mb, due_date, points_possible
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(sql, [
      assignmentData.course_id,
      assignmentData.lesson_id || null,
      assignmentData.title,
      assignmentData.description,
      assignmentData.file_types_allowed,
      assignmentData.max_file_size_mb,
      assignmentData.due_date || null,
      assignmentData.points_possible
    ]);
    
    const [rows] = await pool.query('SELECT * FROM assignments WHERE id = LAST_INSERT_ID()');
    return rows[0] as Assignment;
  } catch (error) {
    console.error('Error creando tarea:', error);
    throw error;
  }
}

// Obtener tareas de un curso
export async function getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
  try {
    const sql = `
      SELECT a.*, l.title as lesson_title 
      FROM assignments a
      LEFT JOIN lessons l ON a.lesson_id = l.id
      WHERE a.course_id = ?
      ORDER BY a.created_at DESC
    `;
    
    return await executeQuery(sql, [courseId]);
  } catch (error) {
    console.error('Error obteniendo tareas del curso:', error);
    throw error;
  }
}

// Obtener tarea por ID
export async function getAssignmentById(assignmentId: string): Promise<Assignment | null> {
  try {
    const sql = `
      SELECT a.*, l.title as lesson_title 
      FROM assignments a
      LEFT JOIN lessons l ON a.lesson_id = l.id
      WHERE a.id = ?
    `;
    
    const result = await executeQuerySingle(sql, [assignmentId]);
    return result as Assignment | null;
  } catch (error) {
    console.error('Error obteniendo tarea por ID:', error);
    throw error;
  }
}

// Actualizar tarea
export async function updateAssignment(assignmentId: string, assignmentData: Partial<Assignment>): Promise<Assignment> {
  try {
    const fields = Object.keys(assignmentData);
    const values = Object.values(assignmentData);
    
    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE assignments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await executeQuery(sql, [...values, assignmentId]);
    
    return await getAssignmentById(assignmentId) as Assignment;
  } catch (error) {
    console.error('Error actualizando tarea:', error);
    throw error;
  }
}

// Eliminar tarea
export async function deleteAssignment(assignmentId: string): Promise<boolean> {
  try {
    const sql = 'DELETE FROM assignments WHERE id = ?';
    await executeQuery(sql, [assignmentId]);
    return true;
  } catch (error) {
    console.error('Error eliminando tarea:', error);
    return false;
  }
}

// ===========================================
// GESTIÓN DE ENTREGAS (SUBMISSIONS)
// ===========================================

// Crear entrega de tarea
export async function createSubmission(submissionData: Omit<Submission, 'id' | 'submitted_at' | 'status'>): Promise<Submission> {
  try {
    const sql = `
      INSERT INTO submissions (
        assignment_id, student_id, file_name, file_path
      ) VALUES (?, ?, ?, ?)
    `;
    
    const result = await executeQuery(sql, [
      submissionData.assignment_id,
      submissionData.student_id,
      submissionData.file_name,
      submissionData.file_path
    ]);
    
    const [rows] = await pool.query('SELECT * FROM submissions WHERE id = LAST_INSERT_ID()');
    return rows[0] as Submission;
  } catch (error) {
    console.error('Error creando entrega:', error);
    throw error;
  }
}

// Obtener entregas de una tarea
export async function getSubmissionsByAssignment(assignmentId: string): Promise<any[]> {
  try {
    const sql = `
      SELECT s.*, u.name as student_name, u.email as student_email,
             g.score, g.feedback, g.status as grade_status
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      LEFT JOIN grades g ON s.id = g.submission_id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `;
    
    return await executeQuery(sql, [assignmentId]);
  } catch (error) {
    console.error('Error obteniendo entregas:', error);
    throw error;
  }
}

// Obtener entregas de un estudiante
export async function getSubmissionsByStudent(studentId: string, courseId?: string): Promise<any[]> {
  try {
    let sql = `
      SELECT s.*, a.title as assignment_title, a.points_possible as max_points,
             g.score, g.feedback, g.status as grade_status,
             c.title as course_title
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN grades g ON s.id = g.submission_id
      WHERE s.student_id = ?
    `;
    
    const params = [studentId];
    if (courseId) {
      sql += ' AND a.course_id = ?';
      params.push(courseId);
    }
    
    sql += ' ORDER BY s.submitted_at DESC';
    
    return await executeQuery(sql, params);
  } catch (error) {
    console.error('Error obteniendo entregas del estudiante:', error);
    throw error;
  }
}

// ===========================================
// SISTEMA DE CALIFICACIONES (GRADES)
// ===========================================

// Crear o actualizar calificación
export async function gradeSubmission(gradeData: Omit<Grade, 'id' | 'graded_at'>): Promise<Grade> {
  try {
    // Verificar si ya existe una calificación
    const existingGrade = await executeQuerySingle(
      'SELECT * FROM grades WHERE submission_id = ?',
      [gradeData.submission_id]
    );
    
    let result;
    if (existingGrade) {
      // Actualizar calificación existente
      const sql = `
        UPDATE grades 
        SET score = ?, max_score = ?, feedback = ?, 
            instructor_id = ?, status = ?, graded_at = CURRENT_TIMESTAMP
        WHERE submission_id = ?
      `;
      
      await executeQuery(sql, [
        gradeData.score,
        gradeData.max_score,
        gradeData.feedback,
        gradeData.instructor_id,
        gradeData.status,
        gradeData.submission_id
      ]);
    } else {
      // Crear nueva calificación
      const sql = `
        INSERT INTO grades (
          submission_id, instructor_id, score, max_score, feedback, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      await executeQuery(sql, [
        gradeData.submission_id,
        gradeData.instructor_id,
        gradeData.score,
        gradeData.max_score,
        gradeData.feedback,
        gradeData.status
      ]);
    }
    
    const [rows] = await pool.query('SELECT * FROM grades WHERE submission_id = ?', [gradeData.submission_id]);
    return rows[0] as Grade;
  } catch (error) {
    console.error('Error calificando entrega:', error);
    throw error;
  }
}

// Obtener calificaciones de un estudiante en un curso
export async function getStudentGradesInCourse(studentId: string, courseId: string): Promise<any[]> {
  try {
    const sql = `
      SELECT a.title as assignment_title, g.score, g.max_score, g.feedback, 
             g.status, g.graded_at,
             ROUND((g.score / g.max_score * 100), 2) as percentage
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN grades g ON s.id = g.submission_id
      WHERE s.student_id = ? AND a.course_id = ?
      ORDER BY g.graded_at DESC
    `;
    
    return await executeQuery(sql, [studentId, courseId]);
  } catch (error) {
    console.error('Error obteniendo calificaciones:', error);
    throw error;
  }
}

// Calcular promedio de calificaciones de un estudiante
export async function calculateStudentAverage(studentId: string, courseId: string): Promise<any> {
  try {
    const sql = `
      SELECT 
        COUNT(g.id) as total_assignments,
        AVG(g.score / g.max_score * 100) as average_percentage,
        SUM(g.score) as total_score_earned,
        SUM(g.max_score) as total_possible_score,
        COUNT(CASE WHEN g.score / g.max_score * 100 >= 71 THEN 1 END) as passed_assignments,
        COUNT(CASE WHEN g.score / g.max_score * 100 < 71 THEN 1 END) as failed_assignments
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN grades g ON s.id = g.submission_id
      WHERE s.student_id = ? AND a.course_id = ?
    `;
    
    const result = await executeQuerySingle(sql, [studentId, courseId]);
    
    return {
      ...result,
      average_percentage: Math.round(result.average_percentage * 100) / 100,
      final_status: result.average_percentage >= 71 ? 'approved' : 'reproved'
    };
  } catch (error) {
    console.error('Error calculando promedio:', error);
    throw error;
  }
}

// ===========================================
// SISTEMA DE RESEÑAS (REVIEWS)
// ===========================================

// Crear reseña de curso (con validación de inscripción)
export async function createReview(reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review> {
  try {
    // Validar que el estudiante esté inscrito en el curso
    const enrollmentCheck = await executeQuerySingle(
      'SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?',
      [reviewData.student_id, reviewData.course_id]
    );
    
    if (!enrollmentCheck) {
      throw new Error('El estudiante debe estar inscrito en el curso para dejar una reseña');
    }
    
    // Validar que la calificación esté entre 1 y 5
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('La calificación debe estar entre 1 y 5');
    }
    
    const sql = `
      INSERT INTO reviews (
        course_id, student_id, rating, comment
      ) VALUES (?, ?, ?, ?)
    `;
    
    await executeQuery(sql, [
      reviewData.course_id,
      reviewData.student_id,
      reviewData.rating,
      reviewData.comment
    ]);
    
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = LAST_INSERT_ID()');
    return rows[0] as Review;
  } catch (error) {
    console.error('Error creando reseña:', error);
    throw error;
  }
}

// Obtener reseñas válidas de un curso (solo de estudiantes inscritos)
export async function getReviewsByCourse(courseId: string): Promise<any[]> {
  try {
    // Si no existe la columna course_id en reviews, retornamos array vacío
    const sql = `
      SELECT r.*, u.name as student_name, u.avatar as student_avatar
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      WHERE r.course_id = ?
      ORDER BY r.created_at DESC
    `;
    
    const results = await executeQuery(sql, [courseId]);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    // Retornar array vacío en caso de error para evitar crash de la API
    return [];
  }
}

// Calcular rating promedio de un curso
export async function getCourseAverageRating(courseId: string): Promise<any> {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews
      WHERE course_id = ?
    `;
    
    const results = await executeQuery(sql, [courseId]);
    const result = Array.isArray(results) && results.length > 0 ? results[0] : {
      total_reviews: 0,
      average_rating: 0,
      five_stars: 0,
      four_stars: 0,
      three_stars: 0,
      two_stars: 0,
      one_star: 0
    };
    
    return {
      ...result,
      average_rating: result.average_rating ? Math.round(result.average_rating * 100) / 100 : 0
    };
  } catch (error) {
    console.error('Error calculando rating promedio:', error);
    // Retornar valores por defecto en caso de error
    return {
      total_reviews: 0,
      average_rating: 0,
      five_stars: 0,
      four_stars: 0,
      three_stars: 0,
      two_stars: 0,
      one_star: 0
    };
  }
}

// ===========================================
// GESTIÓN DE INSCRIPCIONES (ENROLLMENTS)
// ===========================================

// Inscribir estudiante en curso
export async function enrollStudent(courseId: string, studentId: string): Promise<Enrollment> {
  try {
    // Verificar si ya está inscrito
    const existingEnrollment = await executeQuerySingle(
      'SELECT * FROM enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );
    
    if (existingEnrollment) {
      throw new Error('El estudiante ya está inscrito en este curso');
    }
    
    const sql = `
      INSERT INTO enrollments (course_id, student_id)
      VALUES (?, ?)
    `;
    
    await executeQuery(sql, [courseId, studentId]);
    
    const [rows] = await pool.query('SELECT * FROM enrollments WHERE id = LAST_INSERT_ID()');
    return rows[0] as Enrollment;
  } catch (error) {
    console.error('Error inscribiendo estudiante:', error);
    throw error;
  }
}

// Obtener estudiantes inscritos en un curso
export async function getEnrolledStudents(courseId: string): Promise<any[]> {
  try {
    const sql = `
      SELECT e.*, u.name, u.email, u.avatar,
             COUNT(DISTINCT s.id) as completed_assignments,
             COUNT(DISTINCT a.id) as total_assignments
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN assignments a ON a.course_id = e.course_id
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = e.student_id
      WHERE e.course_id = ?
      GROUP BY e.id, u.id
      ORDER BY e.enrolled_at DESC
    `;
    
    return await executeQuery(sql, [courseId]);
  } catch (error) {
    console.error('Error obteniendo estudiantes inscritos:', error);
    throw error;
  }
}

// Actualizar progreso de estudiante
export async function updateStudentProgress(enrollmentId: string, progressPercentage: number): Promise<Enrollment> {
  try {
    const sql = `
      UPDATE enrollments 
      SET progress_percentage = ?,
          status = CASE 
            WHEN ? >= 100 THEN 'completed'
            ELSE 'active'
          END,
          completed_at = CASE 
            WHEN ? >= 100 THEN CURRENT_TIMESTAMP
            ELSE completed_at
          END
      WHERE id = ?
    `;
    
    await executeQuery(sql, [progressPercentage, progressPercentage, progressPercentage, enrollmentId]);
    
    const [rows] = await pool.query('SELECT * FROM enrollments WHERE id = ?', [enrollmentId]);
    return rows[0] as Enrollment;
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    throw error;
  }
}

// ===========================================
// ESTADÍSTICAS COMPLETAS
// ===========================================

// Estadísticas completas del instructor
export async function getInstructorCompleteStats(instructorId: string): Promise<any> {
  try {
    const [courseStats, enrollmentStats, gradeStats, reviewStats] = await Promise.all([
      // Estadísticas de cursos
      executeQuery(`
        SELECT 
          c.id, c.title, c.published,
          COUNT(DISTINCT e.id) as total_students,
          COUNT(DISTINCT a.id) as total_assignments,
          COUNT(DISTINCT s.id) as total_submissions,
          AVG(g.score / g.max_score * 100) as average_grade
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        LEFT JOIN assignments a ON c.id = a.course_id
        LEFT JOIN submissions s ON a.id = s.assignment_id
        LEFT JOIN grades g ON s.id = g.submission_id
        WHERE c.instructor_id = ?
        GROUP BY c.id
      `, [instructorId]),
      
      // Estadísticas de inscripciones
      executeQuery(`
        SELECT 
          DATE_FORMAT(e.enrolled_at, '%Y-%m') as month,
          COUNT(*) as enrollments
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE c.instructor_id = ? AND e.enrolled_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(e.enrolled_at, '%Y-%m')
        ORDER BY month
      `, [instructorId]),
      
      // Estadísticas de calificaciones
      executeQuery(`
        SELECT 
          COUNT(*) as total_graded,
          AVG(score / max_score * 100) as overall_average,
          COUNT(CASE WHEN score / max_score * 100 >= 71 THEN 1 END) as passed,
          COUNT(CASE WHEN score / max_score * 100 < 71 THEN 1 END) as failed
        FROM grades g
        JOIN submissions s ON g.submission_id = s.id
        JOIN assignments a ON s.assignment_id = a.id
        JOIN courses c ON a.course_id = c.id
        WHERE c.instructor_id = ?
      `, [instructorId]),
      
      // Estadísticas de reseñas
      executeQuery(`
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews
        FROM reviews r
        JOIN courses c ON r.course_id = c.id
        WHERE c.instructor_id = ?
      `, [instructorId])
    ]);
    
    return {
      courses: courseStats,
      enrollments: enrollmentStats,
      grades: gradeStats[0] || {},
      reviews: reviewStats[0] || {}
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas completas:', error);
    throw error;
  }
}

// ===========================================
// UTILIDADES
// ===========================================

// Limpiar usuario removiendo contraseña y propiedades temporales
export function cleanUser(user: any): UserWithRoles {
  if (!user) return user;
  
  const { 
    password_hash, 
    role_id, 
    role_name, 
    role_description, 
    role_permissions, 
    ...cleanUser 
  } = user;
  
  // Asegurar que roles esté presente y sea un array
  if (!cleanUser.roles) {
    if (role_id && role_name) {
      cleanUser.roles = [{
        id: role_id,
        name: role_name as 'normal' | 'instructor' | 'moderador' | 'administrador',
        display_name: role_name,
        description: role_description,
        permissions: role_permissions,
        created_at: new Date()
      }];
    } else {
      // Usuario sin rol asignado, asignar 'normal' por defecto
      cleanUser.roles = [{
        id: 1, // ID del rol 'normal'
        name: 'normal' as const,
        display_name: 'normal',
        description: 'Usuario estudiante normal',
        permissions: null,
        created_at: new Date()
      }];
    }
  }
  
  return cleanUser as UserWithRoles;
}

// Verificar tipos de archivo permitidos
export function isFileTypeAllowed(fileName: string, allowedTypes: string[]): boolean {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(fileExtension || '');
}

// Formatear tamaño de archivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validar calificación (>=71 aprobado, <71 reprobado)
export function validateGrade(score: number, maxScore: number): { status: 'approved' | 'reproved', percentage: number } {
  const percentage = (score / maxScore) * 100;
  return {
    status: percentage >= 71 ? 'approved' : 'reproved',
    percentage: Math.round(percentage * 100) / 100
  };
}

// Cerrar pool al finalizar aplicación
export async function closeConnection(): Promise<void> {
  await pool.end();
}