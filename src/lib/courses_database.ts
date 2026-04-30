import { executeQuery, executeQuerySingle } from './database';

// ========================================
// INTERFACES PARA CURSOS
// ========================================

export interface Course {
  id: number;
  title: string;
  description: string;
  level: 'principiante' | 'intermedio' | 'avanzado';
  thumbnail?: string;
  instructor_id: number;
  instructor_name?: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
  lesson_count?: number;
  price?: number;
  duration_hours?: number;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string;
  video_url?: string;
  order_number: number;
  is_mandatory: boolean;
  duration_minutes?: number;
  created_at: Date;
  updated_at: Date;
}

export interface LessonMaterial {
  id: number;
  lesson_id: number;
  type: 'pdf' | 'image' | 'document' | 'video' | 'link';
  file_url: string;
  title: string;
  description?: string;
  created_at: Date;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: Date;
  progress_percentage: number;
  completed_at?: Date;
  status: 'active' | 'completed' | 'dropped';
}

export interface LessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  completed: boolean;
  completed_at?: Date;
  time_spent_minutes?: number;
}

export interface Assignment {
  id: number;
  lesson_id: number;
  title: string;
  description: string;
  due_date?: Date;
  max_points: number;
  created_at: Date;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  file_url?: string;
  text_submission?: string;
  submitted_at: Date;
  grade?: number;
  feedback?: string;
  graded_at?: Date;
  graded_by?: number;
}

export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  issued_at: Date;
  certificate_url?: string;
  verification_code: string;
}

// ========================================
// FUNCIONES PARA CURSOS
// ========================================

// Obtener todos los cursos publicados
export const getPublishedCourses = async (): Promise<Course[]> => {
  return await executeQuery(
    `SELECT c.*, u.name as instructor_name,
      COUNT(DISTINCT l.id) as lesson_count,
      AVG(ce.progress_percentage) as avg_progress
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     LEFT JOIN lessons l ON c.id = l.course_id
     LEFT JOIN course_enrollments ce ON c.id = ce.course_id
     WHERE c.published = TRUE
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  );
};

// Obtener curso por ID
export const getCourseById = async (id: number): Promise<Course | null> => {
  return await executeQuerySingle<Course>(
    `SELECT c.*, u.name as instructor_name
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     WHERE c.id = ? AND c.published = TRUE`,
    [id]
  );
};

// Crear nuevo curso
export const createCourse = async (
  title: string,
  description: string,
  level: 'principiante' | 'intermedio' | 'avanzado',
  instructor_id: number,
  thumbnail?: string,
  price?: number,
  duration_hours?: number
): Promise<Course | null> => {
  return await executeQuerySingle<Course>(
    `INSERT INTO courses (title, description, level, instructor_id, thumbnail, price, duration_hours, published, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NOW(), NOW()) 
     RETURNING *`,
    [title, description, level, instructor_id, thumbnail, price, duration_hours]
  );
};

// Actualizar curso
export const updateCourse = async (
  id: number,
  updates: Partial<Pick<Course, 'title' | 'description' | 'level' | 'thumbnail' | 'published' | 'price' | 'duration_hours'>>
): Promise<Course | null> => {
  const setClause = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
  const values = Object.values(updates);
  values.push(id);

  return await executeQuerySingle<Course>(
    `UPDATE courses SET ${setClause}, updated_at = NOW() WHERE id = ? RETURNING *`,
    values
  );
};

// ========================================
// FUNCIONES PARA LECCIONES
// ========================================

// Obtener lecciones de un curso
export const getCourseLessons = async (courseId: number): Promise<Lesson[]> => {
  return await executeQuery(
    `SELECT * FROM lessons 
     WHERE course_id = ? 
     ORDER BY order_number ASC`,
    [courseId]
  );
};

// Obtener lección por ID
export const getLessonById = async (id: number): Promise<Lesson | null> => {
  return await executeQuerySingle<Lesson>(
    'SELECT * FROM lessons WHERE id = ?',
    [id]
  );
};

// Crear nueva lección
export const createLesson = async (
  course_id: number,
  title: string,
  content: string,
  order_number: number,
  is_mandatory: boolean = true,
  video_url?: string,
  duration_minutes?: number
): Promise<Lesson | null> => {
  return await executeQuerySingle<Lesson>(
    `INSERT INTO lessons (course_id, title, content, order_number, is_mandatory, video_url, duration_minutes, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) 
     RETURNING *`,
    [course_id, title, content, order_number, is_mandatory, video_url, duration_minutes]
  );
};

// ========================================
// FUNCIONES PARA MATERIALES DE LECCIÓN
// ========================================

// Obtener materiales de una lección
export const getLessonMaterials = async (lessonId: number): Promise<LessonMaterial[]> => {
  return await executeQuery(
    'SELECT * FROM lesson_materials WHERE lesson_id = ? ORDER BY created_at ASC',
    [lessonId]
  );
};

// Crear material de lección
export const createLessonMaterial = async (
  lesson_id: number,
  type: 'pdf' | 'image' | 'document' | 'video' | 'link',
  file_url: string,
  title: string,
  description?: string
): Promise<LessonMaterial | null> => {
  return await executeQuerySingle<LessonMaterial>(
    `INSERT INTO lesson_materials (lesson_id, type, file_url, title, description, created_at) 
     VALUES (?, ?, ?, ?, ?, NOW()) 
     RETURNING *`,
    [lesson_id, type, file_url, title, description]
  );
};

// ========================================
// FUNCIONES PARA INSCRIPCIONES
// ========================================

// Inscribirse a un curso
export const enrollInCourse = async (user_id: number, course_id: number): Promise<Enrollment | null> => {
  // Verificar si ya está inscrito
  const existingEnrollment = await executeQuerySingle<Enrollment>(
    'SELECT * FROM course_enrollments WHERE user_id = ? AND course_id = ?',
    [user_id, course_id]
  );

  if (existingEnrollment) {
    return existingEnrollment;
  }

  return await executeQuerySingle<Enrollment>(
    `INSERT INTO course_enrollments (user_id, course_id, enrolled_at, progress_percentage, status) 
     VALUES (?, ?, NOW(), 0, 'active') 
     RETURNING *`,
    [user_id, course_id]
  );
};

// Obtener cursos de un usuario
export const getUserCourses = async (userId: number): Promise<Course[]> => {
  return await executeQuery(
    `SELECT c.*, ce.status, ce.progress_percentage, ce.enrolled_at, ce.completed_at,
      COUNT(DISTINCT l.id) as lesson_count,
      COUNT(DISTINCT CASE WHEN lp.completed THEN lp.lesson_id END) as completed_lessons
     FROM courses c
     JOIN course_enrollments ce ON c.id = ce.course_id
     LEFT JOIN lessons l ON c.id = l.course_id
     LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
     WHERE ce.user_id = ?
     GROUP BY c.id, ce.id
     ORDER BY ce.enrolled_at DESC`,
    [userId, userId]
  );
};

// Obtener inscripción de usuario a curso
export const getUserEnrollment = async (userId: number, courseId: number): Promise<Enrollment | null> => {
  return await executeQuerySingle<Enrollment>(
    'SELECT * FROM course_enrollments WHERE user_id = ? AND course_id = ?',
    [userId, courseId]
  );
};

// Actualizar progreso del curso
export const updateCourseProgress = async (userId: number, courseId: number): Promise<void> => {
  await executeQuery(
    `UPDATE course_enrollments 
     SET progress_percentage = (
       SELECT ROUND(
         COUNT(CASE WHEN lp.completed THEN 1 END) * 100.0 / NULLIF(COUNT(l.id), 0), 
         2
       )
       FROM lessons l
       LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
       WHERE l.course_id = ?
     )
     WHERE user_id = ? AND course_id = ?`,
    [userId, courseId, userId, courseId]
  );

  // Marcar curso como completado si el progreso es 100%
  await executeQuery(
    `UPDATE course_enrollments 
     SET status = 'completed', completed_at = NOW() 
     WHERE user_id = ? AND course_id = ? AND progress_percentage = 100`,
    [userId, courseId]
  );
};

// ========================================
// FUNCIONES PARA PROGRESO DE LECCIONES
// ========================================

// Marcar lección como completada
export const markLessonComplete = async (userId: number, lessonId: number): Promise<void> => {
  await executeQuery(
    `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at) 
     VALUES (?, ?, TRUE, NOW()) 
     ON DUPLICATE KEY UPDATE completed = TRUE, completed_at = NOW()`,
    [userId, lessonId]
  );

  // Actualizar progreso del curso
  const lesson = await getLessonById(lessonId);
  if (lesson) {
    await updateCourseProgress(userId, lesson.course_id);
  }
};

// Obtener progreso de lecciones de un usuario
export const getUserLessonProgress = async (userId: number, courseId: number): Promise<LessonProgress[]> => {
  return await executeQuery<LessonProgress>(
    `SELECT lp.* FROM lesson_progress lp
     JOIN lessons l ON lp.lesson_id = l.id
     WHERE lp.user_id = ? AND l.course_id = ?`,
    [userId, courseId]
  );
};

// Verificar si una lección está desbloqueada
export const isLessonUnlocked = async (userId: number, lessonId: number): Promise<boolean> => {
  const lesson = await getLessonById(lessonId);
  if (!lesson || lesson.order_number === 1) return true;

  // Verificar que todas las lecciones anteriores estén completadas
  const previousLessons = await executeQuery(
    'SELECT id FROM lessons WHERE course_id = ? AND order_number < ?',
    [lesson.course_id, lesson.order_number]
  );

  if (previousLessons.length === 0) return true;

  const lessonIds = previousLessons.map(l => l.id);
  const completedCount = await executeQuery(
    `SELECT COUNT(*) as count FROM lesson_progress 
     WHERE user_id = ? AND lesson_id IN (${lessonIds.map(() => '?').join(',')}) AND completed = TRUE`,
    [userId, ...lessonIds]
  );

  return completedCount[0]?.count === previousLessons.length;
};

// ========================================
// FUNCIONES PARA TAREAS
// ========================================

// Obtener tareas de una lección
export const getLessonAssignments = async (lessonId: number): Promise<Assignment[]> => {
  return await executeQuery(
    'SELECT * FROM assignments WHERE lesson_id = ? ORDER BY created_at ASC',
    [lessonId]
  );
};

// Crear tarea
export const createAssignment = async (
  lesson_id: number,
  title: string,
  description: string,
  due_date?: Date,
  max_points: number = 100
): Promise<Assignment | null> => {
  return await executeQuerySingle<Assignment>(
    `INSERT INTO assignments (lesson_id, title, description, due_date, max_points, created_at) 
     VALUES (?, ?, ?, ?, ?, NOW()) 
     RETURNING *`,
    [lesson_id, title, description, due_date, max_points]
  );
};

// Enviar tarea
export const submitAssignment = async (
  assignmentId: number,
  userId: number,
  file_url?: string,
  text_submission?: string
): Promise<AssignmentSubmission | null> => {
  return await executeQuerySingle<AssignmentSubmission>(
    `INSERT INTO assignment_submissions (assignment_id, user_id, file_url, text_submission, submitted_at) 
     VALUES (?, ?, ?, ?, NOW()) 
     RETURNING *`,
    [assignmentId, userId, file_url, text_submission]
  );
};

// Obtener envíos de tarea
export const getAssignmentSubmissions = async (assignmentId: number): Promise<AssignmentSubmission[]> => {
  return await executeQuery(
    `SELECT s.*, u.name as student_name 
     FROM assignment_submissions s
     JOIN users u ON s.user_id = u.id
     WHERE s.assignment_id = ?
     ORDER BY s.submitted_at DESC`,
    [assignmentId]
  );
};

// Calificar envío
export const gradeSubmission = async (
  submissionId: number,
  grade: number,
  feedback: string,
  gradedBy: number
): Promise<AssignmentSubmission | null> => {
  return await executeQuerySingle<AssignmentSubmission>(
    `UPDATE assignment_submissions 
     SET grade = ?, feedback = ?, graded_at = NOW(), graded_by = ?
     WHERE id = ?
     RETURNING *`,
    [grade, feedback, gradedBy, submissionId]
  );
};

// ========================================
// FUNCIONES PARA CERTIFICADOS
// ========================================

// Generar certificado
export const generateCertificate = async (userId: number, courseId: number): Promise<Certificate | null> => {
  const verification_code = `CERT-${userId}-${courseId}-${Date.now()}`;
  
  return await executeQuerySingle<Certificate>(
    `INSERT INTO certificates (user_id, course_id, issued_at, verification_code) 
     VALUES (?, ?, NOW(), ?) 
     RETURNING *`,
    [userId, courseId, verification_code]
  );
};

// Obtener certificado de usuario para curso
export const getUserCertificate = async (userId: number, courseId: number): Promise<Certificate | null> => {
  return await executeQuerySingle<Certificate>(
    'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
    [userId, courseId]
  );
};

// Obtener todos los certificados de un usuario
export const getUserCertificates = async (userId: number): Promise<Certificate[]> => {
  return await executeQuery(
    `SELECT c.*, co.title as course_title, u.name as student_name
     FROM certificates c
     JOIN courses co ON c.course_id = co.id
     JOIN users u ON c.user_id = u.id
     WHERE c.user_id = ?
     ORDER BY c.issued_at DESC`,
    [userId]
  );
};

export default {
  getPublishedCourses,
  getCourseById,
  createCourse,
  updateCourse,
  getCourseLessons,
  getLessonById,
  createLesson,
  getLessonMaterials,
  createLessonMaterial,
  enrollInCourse,
  getUserCourses,
  getUserEnrollment,
  updateCourseProgress,
  markLessonComplete,
  getUserLessonProgress,
  isLessonUnlocked,
  getLessonAssignments,
  createAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  generateCertificate,
  getUserCertificate,
  getUserCertificates,
};