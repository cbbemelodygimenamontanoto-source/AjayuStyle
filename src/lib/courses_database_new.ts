// ========================================
// FUNCIONES PARA CURSOS CON MYSQL
// ========================================

import { executeQuery, executeQuerySingle } from './database';

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number;
  instructor_name?: string;
  level: 'principiante' | 'intermedio' | 'avanzado';
  duration_hours: number;
  price: number;
  thumbnail?: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
  lesson_count?: number;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  lesson_type: 'video' | 'document' | 'text' | 'quiz' | 'assignment' | 'live';
  video_url?: string;
  content?: string;
  estimated_minutes: number;
  order_index: number;
  is_preview: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped' | 'suspended';
  progress_percentage: number;
  enrolled_at: Date;
  completed_at?: Date;
  updated_at: Date;
  course_title?: string;
  course_description?: string;
  course_thumbnail?: string;
  level?: string;
  duration_hours?: number;
  price?: number;
  lesson_count?: number;
  total_lessons?: number;
  completed_lessons?: number;
}

export interface CourseReview {
  id: number;
  course_id: number;
  user_id: number;
  rating: number;
  review_text?: string;
  created_at: Date;
  updated_at: Date;
  user_name?: string;
}

// ========================================
// FUNCIONES DE CURSOS
// ========================================

// Obtener todos los cursos publicados
export const getPublishedCourses = async (): Promise<Course[]> => {
  try {
    const courses = await executeQuery<Course>(
      `SELECT c.*, u.name as instructor_name,
        COUNT(DISTINCT l.id) as lesson_count
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       LEFT JOIN lessons l ON c.id = l.course_id
       WHERE c.published = TRUE
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    return courses;
  } catch (error) {
    console.error('Error obteniendo cursos publicados:', error);
    return [];
  }
};

// Obtener curso por ID con lecciones y detalles
export const getCourseById = async (courseId: number, instructorId?: number): Promise<Course | null> => {
  try {
    const course = await executeQuerySingle<Course & { instructor_name: string }>(
      `SELECT c.*, u.name as instructor_name
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ? AND c.published = TRUE`,
      [courseId]
    );
    return course;
  } catch (error) {
    console.error('Error obteniendo curso por ID:', error);
    return null;
  }
};

// Obtener lecciones de un curso
export const getCourseLessons = async (courseId: number): Promise<Lesson[]> => {
  try {
    const lessons = await executeQuery<Lesson>(
      `SELECT id, course_id, title, description, content, video_url, 
              lesson_type, estimated_minutes, order_index, is_preview, created_at, updated_at 
       FROM lessons WHERE course_id = ? ORDER BY order_index ASC`,
      [courseId]
    );
    return lessons;
  } catch (error) {
    console.error('Error obteniendo lecciones del curso:', error);
    return [];
  }
};

// Obtener cursos por nivel
export const getCoursesByLevel = async (level: string): Promise<Course[]> => {
  try {
    const courses = await executeQuery<Course>(
      `SELECT c.*, u.name as instructor_name,
        COUNT(DISTINCT l.id) as lesson_count
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       LEFT JOIN lessons l ON c.id = l.course_id
       WHERE c.published = TRUE AND c.level = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [level]
    );
    return courses;
  } catch (error) {
    console.error('Error obteniendo cursos por nivel:', error);
    return [];
  }
};

// ========================================
// FUNCIONES DE INSCRIPCIÓN
// ========================================

// Inscribir usuario en curso
export const enrollUserInCourse = async (userId: number, courseId: number): Promise<boolean> => {
  try {
    // Verificar si ya está inscrito
    const existingEnrollment = await executeQuerySingle<Enrollment>(
      'SELECT * FROM course_enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    if (existingEnrollment) {
      console.log('Usuario ya inscrito en este curso');
      return false;
    }
    
    // Crear nueva inscripción
    await executeQuery(
      'INSERT INTO course_enrollments (user_id, course_id, status, progress_percentage) VALUES (?, ?, "enrolled", 0)',
      [userId, courseId]
    );
    
    console.log('✅ Usuario inscrito exitosamente al curso');
    return true;
  } catch (error) {
    console.error('Error inscribiendo usuario en curso:', error);
    return false;
  }
};

// Obtener inscripciones de un usuario
export const getUserEnrollments = async (userId: number): Promise<Enrollment[]> => {
  try {
    const course_enrollments = await executeQuery<Enrollment>(
      `SELECT 
        ce.*, 
        c.title as course_title, 
        c.description as course_description,
        c.level, 
        c.duration_hours, 
        c.price,
        c.thumbnail as course_thumbnail,
        COUNT(DISTINCT l.id) as total_lessons,
        CASE 
          WHEN COUNT(DISTINCT l.id) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT l.id) * 100.0 / COUNT(DISTINCT l.id)), 2)
        END as progress_percentage,
        'enrolled' as status
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       LEFT JOIN lessons l ON c.id = l.course_id
       WHERE ce.user_id = ?
       GROUP BY ce.id
       ORDER BY ce.enrolled_at DESC`,
      [userId]
    );
    return course_enrollments;
  } catch (error) {
    console.error('Error obteniendo inscripciones del usuario:', error);
    return [];
  }
};

// Verificar si usuario está inscrito en curso
export const isUserEnrolled = async (userId: number, courseId: number): Promise<boolean> => {
  try {
    const enrollment = await executeQuerySingle<Enrollment>(
      'SELECT * FROM course_enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    return !!enrollment;
  } catch (error) {
    console.error('Error verificando inscripción:', error);
    return false;
  }
};

// Obtener lecciones de un curso
export const getLessonsByCourse = async (courseId: number): Promise<Lesson[]> => {
  try {
    const lessons = await executeQuery<Lesson>(
      `SELECT id, course_id, title, description, content, video_url, 
              lesson_type, estimated_minutes, order_index, is_preview, created_at, updated_at 
       FROM lessons WHERE course_id = ? ORDER BY order_index ASC`,
      [courseId]
    );
    return lessons;
  } catch (error) {
    console.error('Error obteniendo lecciones del curso:', error);
    return [];
  }
};

export default {
  getPublishedCourses,
  getCourseById,
  getCourseLessons,
  getCoursesByLevel,
  enrollUserInCourse,
  getUserEnrollments,
  isUserEnrolled,
};