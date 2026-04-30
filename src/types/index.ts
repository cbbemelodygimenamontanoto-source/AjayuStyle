// ========================================
// TIPOS BASE DE LA BASE DE DATOS - PLATAFORMA EDUCATIVA COMPLETA
// ========================================

export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  last_name: string;
  password_hash: string;
  role: 'normal' | 'instructor' | 'moderador' | 'administrador';
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  social_activated: boolean;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  // Nuevos campos para la plataforma educativa
  is_verified: boolean;
  verification_date?: Date;
  teaching_experience?: string;
  specialties?: string[];
  hourly_rate?: number;
}

export interface UserRole {
  id: number;
  name: 'normal' | 'instructor' | 'moderador' | 'administrador';
  display_name: string;
  description?: string;
  permissions?: Record<string, any>;
  created_at: Date;
}

export interface UserRoleAssignment {
  id: number;
  user_id: number;
  role_id: number;
  assigned_at: Date;
  assigned_by?: number;
  expires_at?: Date;
}

export interface UserWithRoles extends User {
  roles?: UserRole[];
}

// ========================================
// CATEGORÍAS Y ETIQUETAS
// ========================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  children?: Category[];
  courses_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  usage_count: number;
  created_at: Date;
}

// ========================================
// CURSOS - SISTEMA COMPLETO
// ========================================

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  thumbnail?: string;
  trailer_video_url?: string;
  price: number;
  original_price?: number;
  is_free: boolean;
  instructor_id: number;
  category_id: number;
  difficulty_level: 'principiante' | 'intermedio' | 'avanzado';
  estimated_hours: number;
  language: string;
  requirements?: string[];
  what_you_learn?: string[];
  tags?: string[];
  status: 'borrador' | 'revision' | 'publicado' | 'archivado' | 'suspendido';
  is_featured: boolean;
  is_published: boolean;
  published_at?: Date;
  enrollment_count: number;
  rating_average: number;
  rating_count: number;
  completion_rate?: number;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  instructor?: User;
  category?: Category;
  modules?: CourseModule[];
  tags_rel?: Tag[];
  _count?: {
    enrollments: number;
    reviews: number;
    lessons: number;
  };
}

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  course?: Course;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  slug: string;
  content?: string;
  video_url?: string;
  video_duration?: number; // en segundos
  document_content?: string;
  order_index: number;
  lesson_type: 'video' | 'document' | 'quiz' | 'assignment' | 'live';
  estimated_minutes: number;
  is_free: boolean;
  is_preview: boolean;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  module?: CourseModule;
  resources?: LessonResource[];
  assignment?: Assignment;
  progress?: LessonProgress[];
}

export interface LessonResource {
  id: number;
  lesson_id: number;
  title: string;
  file_url: string;
  file_type: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'archive';
  file_size: number;
  download_count: number;
  created_at: Date;
  // Relaciones
  lesson?: Lesson;
}

// ========================================
// INSCRIPCIONES Y PROGRESO
// ========================================

export interface CourseEnrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: Date;
  status: 'activo' | 'completado' | 'pausado' | 'cancelado' | 'suspendido';
  progress_percentage: number;
  started_at?: Date;
  completed_at?: Date;
  last_accessed_at?: Date;
  certificate_issued?: boolean;
  // Relaciones
  user?: User;
  course?: Course;
  progress?: LessonProgress[];
}

export interface LessonProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  is_completed: boolean;
  time_watched?: number; // en segundos
  last_position?: number; // para videos
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  user?: User;
  lesson?: Lesson;
}

// ========================================
// SISTEMA DE TAREAS Y CALIFICACIONES
// ========================================

export interface Assignment {
  id: number;
  lesson_id: number;
  title: string;
  description?: string;
  instructions: string;
  max_score: number;
  submission_type: 'text' | 'file' | 'url' | 'quiz';
  due_date?: Date;
  allow_late_submission: boolean;
  attempts_allowed: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  lesson?: Lesson;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  student_id: number;
  content?: string;
  file_url?: string;
  external_url?: string;
  submission_data?: Record<string, any>;
  submitted_at: Date;
  score?: number;
  feedback?: string;
  graded_at?: Date;
  grader_id?: number;
  attempt_number: number;
  status: 'enviado' | 'calificado' | 'revision_requerida' | 'rechazado';
  // Relaciones
  assignment?: Assignment;
  student?: User;
  grader?: User;
}

export interface Grade {
  id: number;
  student_id: number;
  course_id?: number;
  lesson_id?: number;
  assignment_id?: number;
  score: number;
  max_score: number;
  percentage: number;
  letter_grade?: string;
  feedback?: string;
  graded_by?: number;
  graded_at: Date;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  student?: User;
  course?: Course;
  lesson?: Lesson;
  assignment?: Assignment;
  grader?: User;
}

// ========================================
// SISTEMA DE RESEÑAS Y CALIFICACIONES
// ========================================

export interface CourseReview {
  id: number;
  user_id: number;
  course_id: number;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  pros?: string[];
  cons?: string[];
  is_verified_purchase: boolean;
  is_featured: boolean;
  helpful_count: number;
  reported_count: number;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  user?: User;
  course?: Course;
}

// ========================================
// CERTIFICADOS
// ========================================

export interface Certificate {
  id: number;
  user_id: number;
  course_id: number;
  certificate_code: string;
  certificate_url?: string;
  issued_at: Date;
  completion_date: Date;
  score?: number;
  is_valid: boolean;
  verification_url?: string;
  // Relaciones
  user?: User;
  course?: Course;
}

// ========================================
// SISTEMA DE PAGOS
// ========================================

export interface Payment {
  id: number;
  user_id: number;
  course_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider: string;
  transaction_id: string;
  provider_transaction_id?: string;
  status: 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'cancelado' | 'reembolsado';
  payment_data?: Record<string, any>;
  refunded_at?: Date;
  refund_amount?: number;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  user?: User;
  course?: Course;
}

// ========================================
// SISTEMA DE DENUNCIAS Y MODERACIÓN
// ========================================

export interface Report {
  id: number;
  reporter_id: number;
  reported_user_id?: number;
  reported_content_id?: number;
  reported_content_type?: 'user' | 'course' | 'lesson' | 'review' | 'assignment' | 'comment';
  reason: string;
  description?: string;
  evidence_urls?: string[];
  status: 'pendiente' | 'en_revista' | 'resuelto' | 'descartado' | 'sancionado';
  reviewed_by?: number;
  reviewed_at?: Date;
  resolution_notes?: string;
  action_taken?: string;
  created_at: Date;
  updated_at: Date;
  // Relaciones
  reporter?: User;
  reported_user?: User;
  reviewer?: User;
}

// ========================================
// ACTIVIDAD Y LOGS
// ========================================

export interface ActivityLog {
  id: number;
  user_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  // Relaciones
  user?: User;
}

// ========================================
// SISTEMA DE IA
// ========================================

export interface AIRequest {
  id: number;
  user_id: number;
  request_type: 'pattern_design' | 'size_calculation' | 'design_assistance' | 'fabric_analysis' | 'course_recommendation';
  user_input: string;
  ai_response?: string;
  input_image_url?: string;
  output_image_url?: string;
  input_parameters?: Record<string, any>;
  ai_model_used?: string;
  created_at: Date;
  status: 'procesando' | 'completado' | 'fallido';
  error_message?: string;
  processing_time_seconds?: number;
  tokens_used?: number;
  cost?: number;
}

// ========================================
// SISTEMA SOCIAL
// ========================================

export interface SocialProfile {
  id: number;
  user_id: number;
  username: string;
  bio?: string;
  profile_image_url?: string;
  cover_image_url?: string;
  website_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  other_links?: Record<string, any>;
  google_verified: boolean;
  google_verification_data?: Record<string, any>;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: Date;
  updated_at: Date;
  profile_visibility: 'public' | 'private';
}

export interface SocialPost {
  id: number;
  profile_id: number;
  content?: string;
  image_url?: string;
  video_url?: string;
  media_attachments?: Record<string, any>;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: Date;
  updated_at: Date;
  post_type: 'text' | 'image' | 'video' | 'mixed';
  is_pinned: boolean;
  visibility: 'public' | 'followers' | 'private';
}

export interface SocialComment {
  id: number;
  post_id: number;
  user_id: number;
  parent_comment_id?: number;
  content: string;
  likes_count: number;
  replies_count: number;
  created_at: Date;
  updated_at: Date;
}

// ========================================
// AVATARES
// ========================================

export interface Avatar {
  id: number;
  name: string;
  description?: string;
  thumbnail_url?: string;
  type: 'preset' | 'custom';
  default_features?: Record<string, any>;
  price: number;
  is_premium: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface UserAvatar {
  id: number;
  user_id: number;
  avatar_id: number;
  custom_features?: Record<string, any>;
  custom_name?: string;
  created_at: Date;
  last_used?: Date;
  usage_count: number;
}

// ========================================
// TIPOS PARA DASHBOARDS
// ========================================

export interface AdminDashboardStats {
  total_users: number;
  total_instructors: number;
  total_students: number;
  total_courses: number;
  total_enrollments: number;
  total_revenue: number;
  completion_rate: number;
  average_rating: number;
  pending_approvals: number;
  recent_registrations: number;
  course_completion_rate: number;
}

export interface InstructorDashboardStats {
  total_courses: number;
  published_courses: number;
  total_students: number;
  total_revenue: number;
  average_rating: number;
  completion_rate: number;
  pending_assignments: number;
  monthly_earnings: Array<{
    month: string;
    revenue: number;
    students: number;
  }>;
  course_performance: Array<{
    course_id: number;
    title: string;
    students: number;
    revenue: number;
    rating: number;
    completion_rate: number;
  }>;
}

export interface StudentDashboardStats {
  enrolled_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_study_hours: number;
  certificates_earned: number;
  average_grade: number;
  current_streak: number;
  favorite_categories: Array<{
    category: string;
    course_count: number;
  }>;
  recent_activity: Array<{
    type: string;
    description: string;
    date: Date;
  }>;
}

// ========================================
// TIPOS PARA FORMULARIOS
// ========================================

export interface CourseFormData {
  title: string;
  description: string;
  short_description: string;
  category_id: number;
  price: number;
  original_price?: number;
  difficulty_level: 'principiante' | 'intermedio' | 'avanzado';
  estimated_hours: number;
  language: string;
  requirements?: string[];
  what_you_learn?: string[];
  tags?: string[];
  thumbnail?: File;
  trailer_video_url?: string;
}

export interface LessonFormData {
  title: string;
  content?: string;
  video_url?: string;
  document_content?: string;
  lesson_type: 'video' | 'document' | 'quiz' | 'assignment' | 'live';
  estimated_minutes: number;
  is_free: boolean;
  is_preview: boolean;
  order_index: number;
}

export interface AssignmentFormData {
  title: string;
  description?: string;
  instructions: string;
  max_score: number;
  submission_type: 'text' | 'file' | 'url' | 'quiz';
  due_date?: Date;
  allow_late_submission: boolean;
  attempts_allowed: number;
}

export interface UserProfileFormData {
  name: string;
  last_name: string;
  email: string;
  username: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  avatar?: File;
  teaching_experience?: string;
  specialties?: string[];
  hourly_rate?: number;
}

// ========================================
// TIPOS PARA BÚSQUEDA Y FILTROS
// ========================================

export interface CourseFilters {
  category?: string;
  difficulty_level?: string;
  price?: 'free' | 'paid' | 'all';
  rating?: number;
  duration?: 'short' | 'medium' | 'long';
  language?: string;
  instructor?: string;
  sort_by?: 'newest' | 'popular' | 'rating' | 'price' | 'duration';
  tags?: string[];
}

export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  filters?: CourseFilters;
}

// ========================================
// TIPOS PARA UPLOADS
// ========================================

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  result?: UploadResult;
}

// ========================================
// TIPOS PARA API
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ========================================
// TIPOS PARA COMPONENTES UI
// ========================================

export interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  features: string[];
  isOptional?: boolean;
}

// ========================================
// TIPOS PARA AUTENTICACIÓN
// ========================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthSession {
  user: User;
  roles: UserRole[];
  social_profile?: SocialProfile;
}

// ========================================
// TIPOS PARA CONTEXTOS
// ========================================

export interface AuthContextType {
  user: User | null;
  roles: UserRole[];
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isInstructor: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isStudent: boolean;
}

export interface CourseContextType {
  courses: Course[];
  enrollments: CourseEnrollment[];
  loading: boolean;
  getCourse: (id: number) => Promise<Course | null>;
  enrollInCourse: (courseId: number) => Promise updateProgress: (<boolean>;
 lessonId: number, progress: number) => Promise<boolean>;
  searchCourses: (params: SearchParams) => Promise<PaginatedResponse<Course>>;
}

// ========================================
// CONSTANTES
// ========================================

export const USER_ROLES = {
  NORMAL: 'normal',
  INSTRUCTOR: 'instructor',
  MODERADOR: 'moderador',
  ADMIN: 'administrador'
} as const;

export const COURSE_LEVELS = {
  BEGINNER: 'principiante',
  INTERMEDIATE: 'intermedio',
  ADVANCED: 'avanzado'
} as const;

export const COURSE_STATUS = {
  DRAFT: 'borrador',
  REVIEW: 'revision',
  PUBLISHED: 'publicado',
  ARCHIVED: 'archivado',
  SUSPENDED: 'suspendido'
} as const;

export const ENROLLMENT_STATUS = {
  ACTIVE: 'activo',
  COMPLETED: 'completado',
  PAUSED: 'pausado',
  CANCELLED: 'cancelado',
  SUSPENDED: 'suspendido'
} as const;

export const LESSON_TYPES = {
  VIDEO: 'video',
  DOCUMENT: 'document',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  LIVE: 'live'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pendiente',
  PROCESSING: 'procesando',
  COMPLETED: 'completado',
  FAILED: 'fallido',
  CANCELLED: 'cancelado',
  REFUNDED: 'reembolsado'
} as const;

export const REPORT_STATUS = {
  PENDING: 'pendiente',
  IN_REVIEW: 'en_revista',
  RESOLVED: 'resuelto',
  DISMISSED: 'descartado',
  SANCTIONED: 'sancionado'
} as const;