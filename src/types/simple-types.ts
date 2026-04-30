// ========================================
// TIPOS SIMPLES PARA SISTEMA SIMPLE
// ========================================

// Usuario simple con rol directamente en la columna
export interface SimpleUser {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'moderator' | 'instructor' | 'user';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  profile_image?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  email_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
}

// Curso simple
export interface SimpleCourse {
  id: string;
  instructor_id: string;
  category_id?: string;
  title: string;
  slug: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived' | 'deleted';
  price: number;
  duration_minutes: number;
  language: string;
  requirements?: string[];
  what_you_learn?: string[];
  tags?: string[];
  thumbnail_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Lección simple
export interface SimpleLesson {
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

// Credenciales de login simples
export interface SimpleLoginCredentials {
  email: string;
  password: string;
}

// Datos de registro simples
export interface SimpleRegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

// Respuesta de autenticación
export interface SimpleAuthResponse {
  success: boolean;
  user: SimpleUser;
  token: string;
  message?: string;
}

// Contexto de autenticación simple
export interface SimpleAuthContextType {
  user: SimpleUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: SimpleRegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  getPrimaryRole: () => string | null;
}

// Respuesta de API simple
export interface SimpleApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Categoría simple
export interface SimpleCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}

// Matrícula simple
export interface SimpleEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'dropped';
  progress_percentage: number;
  last_accessed?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Progreso de lección simple
export interface SimpleLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at?: Date;
  time_spent_minutes: number;
  created_at: Date;
  updated_at: Date;
}