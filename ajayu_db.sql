-- ================================================================
-- 🚀 BASE DE DATOS AJAYU - VERSIÓN COMPLETA Y NUEVA
-- DROP DATABASE + CREATE DATABASE LIMPIO
-- CON TODAS LAS FUNCIONALIDADES: ADMIN, INSTRUCTOR, MODERADOR, USER
-- ================================================================

-- Configurar charset
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ================================================================
-- 1. ELIMINAR Y CREAR BASE DE DATOS DESDE CERO
-- ================================================================
DROP DATABASE IF EXISTS ajayu_db;
CREATE DATABASE ajayu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ajayu_db;

-- ================================================================
-- 2. TABLA DE USUARIOS (BASE DEL SISTEMA)
-- ================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(500) NULL DEFAULT NULL,
    bio TEXT NULL,
    phone VARCHAR(20) NULL,
    username VARCHAR(50) UNIQUE NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    social_activated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status ENUM('active', 'inactive', 'suspended', 'pending_verification') DEFAULT 'active',
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- ================================================================
-- 3. SISTEMA DE ROLES COMPLETO
-- ================================================================
CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('normal', 'instructor', 'moderador', 'administrador') NOT NULL UNIQUE,
    description TEXT,
    permissions JSON,
    can_create_courses BOOLEAN DEFAULT FALSE,
    can_moderate_content BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_access_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- ================================================================
-- 4. ASIGNACIONES DE ROLES
-- ================================================================
CREATE TABLE user_role_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NULL,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_role (user_id, role_id),
    INDEX idx_user_role (user_id, role_id),
    INDEX idx_expires (expires_at)
);

-- ================================================================
-- 5. CATEGORÍAS DE CURSOS
-- ================================================================
CREATE TABLE course_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(100) NULL,
    color VARCHAR(7) NULL DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active),
    INDEX idx_sort (sort_order)
);

-- ================================================================
-- 6. CURSOS PRINCIPALES (CON TODAS LAS FUNCIONALIDADES)
-- ================================================================
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    thumbnail VARCHAR(500) NULL,
    preview_video VARCHAR(500) NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_free BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    instructor_id INT NOT NULL,
    category_id INT NULL,
    level ENUM('principiante', 'intermedio', 'avanzado') DEFAULT 'principiante',
    language VARCHAR(10) DEFAULT 'es',
    duration_hours INT DEFAULT 10,
    duration_minutes INT DEFAULT 0,
    total_lessons INT DEFAULT 0,
    requirements TEXT NULL,
    what_you_learn TEXT NULL,
    target_audience TEXT NULL,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    views_count INT DEFAULT 0,
    enrollments_count INT DEFAULT 0,
    ratings_average DECIMAL(3,2) DEFAULT 0.00,
    ratings_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_instructor (instructor_id),
    INDEX idx_category (category_id),
    INDEX idx_published (published),
    INDEX idx_level (level),
    INDEX idx_featured (is_featured),
    INDEX idx_approval (approval_status),
    INDEX idx_views (views_count),
    INDEX idx_ratings (ratings_average),
    FULLTEXT idx_title_description (title, description)
);

-- ================================================================
-- 7. LECCIONES COMPLETAS CON VIDEOS Y RECURSOS
-- ================================================================
CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    content TEXT NULL,
    video_url VARCHAR(500) NULL,
    video_duration_seconds INT NULL DEFAULT 0,
    document_content LONGTEXT NULL,
    document_url VARCHAR(500) NULL,
    presentation_url VARCHAR(500) NULL,
    resources JSON NULL,
    order_index INT NOT NULL,
    lesson_type ENUM('video', 'document', 'text', 'quiz', 'assignment', 'live') DEFAULT 'video',
    estimated_minutes INT DEFAULT 0,
    required BOOLEAN DEFAULT TRUE,
    is_preview BOOLEAN DEFAULT FALSE,
    downloadable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_order (course_id, order_index),
    INDEX idx_type (lesson_type),
    INDEX idx_required (required),
    INDEX idx_preview (is_preview)
);

-- ================================================================
-- 8. INSCRIPCIONES COMPLETAS
-- ================================================================
CREATE TABLE course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'in_progress', 'completed', 'dropped', 'suspended') DEFAULT 'enrolled',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    last_accessed_at TIMESTAMP NULL,
    time_spent_minutes INT DEFAULT 0,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url VARCHAR(500) NULL,
    payment_amount DECIMAL(10,2) NULL,
    payment_status ENUM('pending', 'completed', 'refunded', 'failed') DEFAULT 'completed',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_course_status (course_id, status),
    INDEX idx_progress (progress_percentage),
    INDEX idx_completed (completed_at)
);

-- ================================================================
-- 9. PROGRESO DETALLADO POR LECCIÓN
-- ================================================================
CREATE TABLE lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    time_spent_seconds INT DEFAULT 0,
    video_progress_seconds INT DEFAULT 0,
    video_duration_seconds INT DEFAULT 0,
    status ENUM('not_started', 'in_progress', 'completed', 'skipped') DEFAULT 'not_started',
    notes TEXT NULL,
    quiz_score INT NULL,
    quiz_attempts INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (user_id, lesson_id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_lesson_status (lesson_id, status),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_completed (completed_at)
);

-- ================================================================
-- 10. TAREAS Y ASIGNACIONES AVANZADAS
-- ================================================================
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NULL,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions LONGTEXT NULL,
    assignment_type ENUM('essay', 'project', 'quiz', 'practical', 'peer_review') DEFAULT 'project',
    file_types_allowed VARCHAR(100) DEFAULT 'pdf,doc,docx,txt,jpg,png,mp4',
    max_file_size_mb INT DEFAULT 50,
    max_files_per_submission INT DEFAULT 5,
    due_date TIMESTAMP NULL,
    points_possible INT DEFAULT 100,
    passing_score INT DEFAULT 60,
    allow_resubmission BOOLEAN DEFAULT FALSE,
    max_attempts INT DEFAULT 1,
    peer_review_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_lesson (lesson_id),
    INDEX idx_due_date (due_date),
    INDEX idx_points (points_possible),
    INDEX idx_type (assignment_type)
);

-- ================================================================
-- 11. ENTREGAS DE TAREAS COMPLETAS
-- ================================================================
CREATE TABLE assignment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    user_id INT NOT NULL,
    submission_text LONGTEXT NULL,
    file_urls JSON NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempt_number INT DEFAULT 1,
    status ENUM('draft', 'submitted', 'late', 'graded', 'returned', 'resubmitted') DEFAULT 'submitted',
    score DECIMAL(5,2) NULL,
    percentage DECIMAL(5,2) NULL,
    passed BOOLEAN DEFAULT FALSE,
    feedback TEXT NULL,
    graded_by INT NULL,
    graded_at TIMESTAMP NULL,
    resubmission_allowed BOOLEAN DEFAULT FALSE,
    resubmission_deadline TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_submission (assignment_id, enrollment_id, attempt_number),
    INDEX idx_assignment (assignment_id),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_score (score),
    INDEX idx_submitted (submitted_at)
);

-- ================================================================
-- 12. CALIFICACIONES DETALLADAS
-- ================================================================
CREATE TABLE assignment_grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    grader_id INT NOT NULL,
    total_score DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    rubric_scores JSON NULL,
    detailed_feedback TEXT NULL,
    overall_feedback TEXT NULL,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (grader_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_submission (submission_id),
    INDEX idx_grader (grader_id),
    INDEX idx_passed (passed),
    INDEX idx_percentage (percentage)
);

-- ================================================================
-- 13. CERTIFICADOS AUTOMÁTICOS
-- ================================================================
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    certificate_code VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    certificate_url VARCHAR(500) NULL,
    template ENUM('default', 'premium', 'completion', 'excellence') DEFAULT 'default',
    verification_hash VARCHAR(255) NOT NULL,
    template_data JSON NULL,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_code (certificate_code),
    INDEX idx_issued (issued_at),
    INDEX idx_template (template)
);

-- ================================================================
-- 14. RESEÑAS CON ESTRELLAS
-- ================================================================
CREATE TABLE course_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    enrollment_id INT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NULL,
    pros TEXT NULL,
    cons TEXT NULL,
    would_recommend BOOLEAN DEFAULT TRUE,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    reported_count INT DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected', 'flagged') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE SET NULL,
    UNIQUE KEY unique_review (course_id, user_id),
    INDEX idx_course (course_id),
    INDEX idx_user (user_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status),
    INDEX idx_helpful (helpful_count)
);

-- ================================================================
-- 15. INSTRUCTORES (PERFILES EXTENDIDOS)
-- ================================================================
CREATE TABLE instructor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    bio TEXT NULL,
    profile_image VARCHAR(500) NULL,
    cover_image VARCHAR(500) NULL,
    qualifications TEXT NULL,
    experience_years INT DEFAULT 0,
    specialties TEXT NULL,
    teaching_style TEXT NULL,
    languages JSON NULL,
    website_url VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL,
    youtube_url VARCHAR(255) NULL,
    instagram_url VARCHAR(255) NULL,
    verified BOOLEAN DEFAULT FALSE,
    verification_documents JSON NULL,
    total_students INT DEFAULT 0,
    total_courses INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    earnings_total DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_verified (verified),
    INDEX idx_rating (average_rating),
    INDEX idx_students (total_students)
);

-- ================================================================
-- 16. ACTIVIDAD COMPLETA DE ESTUDIANTES
-- ================================================================
CREATE TABLE student_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NULL,
    lesson_id INT NULL,
    assignment_id INT NULL,
    activity_type ENUM(
        'login', 'logout', 'course_view', 'lesson_start', 'lesson_complete', 
        'video_play', 'video_complete', 'assignment_view', 'assignment_submit',
        'quiz_start', 'quiz_complete', 'certificate_earn', 'review_submit',
        'profile_update', 'enrollment', 'unenrollment'
    ) NOT NULL,
    description TEXT NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_course (course_id),
    INDEX idx_activity (activity_type),
    INDEX idx_created (created_at)
);

-- ================================================================
-- 17. SISTEMA DE DENUNCIAS (PARA MODERADORES)
-- ================================================================
CREATE TABLE content_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    content_type ENUM('course', 'lesson', 'assignment', 'submission', 'review', 'comment', 'user') NOT NULL,
    content_id INT NOT NULL,
    reason ENUM('spam', 'inappropriate_content', 'copyright_violation', 'fake_information', 'harassment', 'other') NOT NULL,
    description TEXT NOT NULL,
    evidence_urls JSON NULL,
    status ENUM('pending', 'under_review', 'resolved', 'dismissed', 'escalated') DEFAULT 'pending',
    assigned_to INT NULL,
    resolution TEXT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_content (content_type, content_id),
    INDEX idx_reporter (reporter_id),
    INDEX idx_status (status),
    INDEX idx_assigned (assigned_to)
);

-- ================================================================
-- 18. NOTIFICACIONES DEL SISTEMA
-- ================================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('course_enrolled', 'lesson_completed', 'assignment_due', 'grade_received', 'certificate_earned', 'review_received', 'course_approved', 'system_message') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_read (is_read),
    INDEX idx_priority (priority),
    INDEX idx_created (created_at)
);

-- ================================================================
-- 19. CONFIGURACIONES DEL SISTEMA
-- ================================================================
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (key_name),
    INDEX idx_public (is_public)
);

-- ================================================================
-- 20. ESTADÍSTICAS Y ANALYTICS
-- ================================================================
CREATE TABLE analytics_daily (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_daily_metric (date, metric_name),
    INDEX idx_date (date),
    INDEX idx_metric (metric_name)
);

-- ================================================================
-- 21. MÓDULO SOCIAL (OPCIONAL)
-- ================================================================
CREATE TABLE social_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    bio TEXT NULL,
    profile_image_url VARCHAR(500) NULL,
    cover_image_url VARCHAR(500) NULL,
    website_url VARCHAR(255) NULL,
    instagram_url VARCHAR(255) NULL,
    twitter_url VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    profile_visibility ENUM('public', 'private') DEFAULT 'public',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_username (username),
    INDEX idx_followers (followers_count),
    INDEX idx_visibility (profile_visibility)
);

-- ================================================================
-- 22. POSTS SOCIALES
-- ================================================================
CREATE TABLE social_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    content LONGTEXT NULL,
    image_url VARCHAR(500) NULL,
    video_url VARCHAR(500) NULL,
    media_attachments JSON NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    post_type ENUM('text', 'image', 'video', 'mixed', 'course_share') DEFAULT 'text',
    is_pinned BOOLEAN DEFAULT FALSE,
    visibility ENUM('public', 'followers', 'private') DEFAULT 'public',
    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',
    FOREIGN KEY (profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_created (profile_id, created_at),
    INDEX idx_post_type (post_type),
    INDEX idx_visibility (visibility),
    INDEX idx_status (status)
);

-- ================================================================
-- 23. INTERACCIONES SOCIALES
-- ================================================================
CREATE TABLE social_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    profile_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, profile_id),
    INDEX idx_post (post_id),
    INDEX idx_profile (profile_id)
);

CREATE TABLE social_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    profile_id INT NOT NULL,
    parent_comment_id INT NULL,
    content LONGTEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',
    FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES social_comments(id) ON DELETE CASCADE,
    INDEX idx_post_created (post_id, created_at),
    INDEX idx_profile (profile_id),
    INDEX idx_parent (parent_comment_id)
);

-- ================================================================
-- INSERTAR DATOS INICIALES
-- ================================================================

-- Roles del sistema
INSERT INTO user_roles (name, description, permissions, can_create_courses, can_moderate_content, can_manage_users, can_access_admin) VALUES 
('normal', 'Estudiante - Puede tomar cursos y usar funcionalidades básicas', '{"courses": "enroll", "social": "basic", "profile": "edit"}', FALSE, FALSE, FALSE, FALSE),
('instructor', 'Instructor - Puede crear y gestionar cursos', '{"courses": "create", "courses": "manage", "assignments": "grade", "students": "view"}', TRUE, FALSE, FALSE, FALSE),
('moderador', 'Moderador - Puede moderar contenido y usuarios', '{"content": "moderate", "reports": "handle", "users": "suspend"}', FALSE, TRUE, FALSE, FALSE),
('administrador', 'Administrador - Acceso completo al sistema', '{"all": "access", "users": "manage", "system": "configure", "analytics": "view"}', TRUE, TRUE, TRUE, TRUE);

-- Tus usuarios reales con contraseñas
INSERT INTO users (email, password_hash, name, email_verified, social_activated, avatar, username, status) VALUES 
('usuario.normal@gmail.com', '$2b$12$0QEaJjbSbSNqNFUznJcZOup00rvxXzQhXQm5FcptSErvb3qLMNUfO', 'Ana García López', TRUE, FALSE, 'ana_avatar.jpg', 'ana_garcia', 'active'),
('instructor.master@gmail.com', '$2b$12$wT.OMzdaJe8hNO70WpwK6.3HIOJt9KzWPhOV0msF8e.e/60WB9R.2', 'Carlos Pérez Rodríguez', TRUE, TRUE, 'carlos_instructor.jpg', 'carlos_instructor', 'active'),
('moderador.content@gmail.com', '$2b$12$CYNBFNI2f4085mJQ.TDpBulSIdijhPM6xKsRptidQlZHdvqfd4rbq', 'Laura Martínez Silva', TRUE, TRUE, 'laura_moderador.jpg', 'laura_moderador', 'active'),
('admin.sistema@gmail.com', '$2b$12$stAbNfSTOZrAN5W4xKK2OuKB7tC6vC62TOj4Nc5bdJImqQdVcv6Ai', 'Miguel Torres Vargas', TRUE, TRUE, 'miguel_admin.jpg', 'miguel_admin', 'active'),
('social.user@gmail.com', '$2b$12$B.0U8CRYMv3seAK.mgFnmutIUNFXMttao3xihZDkFFeNBH1TG8t8y', 'Sofia Ramírez Cruz', TRUE, TRUE, 'sofia_social.jpg', 'sofia_social', 'active');

UPDATE users 
SET password_hash = '$2b$12$pJBAH3tO/6ZTh/iasaFntu6foy6G79NDTTb6GrSyRgsnO/pK1ZUO2'
WHERE email = 'usuario.normal@gmail.com';

-- Carlos Pérez: instructor123  
UPDATE users 
SET password_hash = '$2b$12$XfUOFAJQtvyRJhwJgxJzquJr3yFJ.3ZUqTAvN7q8Ptaq9HmXr0.pK'
WHERE email = 'instructor.master@gmail.com';

-- Laura Martínez: moderador123
UPDATE users 
SET password_hash = '$2b$12$y5sYOUgnthQkX77hPpabVupdqJ37Hfw6gHjq0YcrgMFyKMePwu9xO'
WHERE email = 'moderador.content@gmail.com';

-- Miguel Torres: admin123
UPDATE users 
SET password_hash = '$2b$12$fidO7Ia1SCsojau.htmw4OPfi9pW7CfbbdC5UyTJ0YsWXgK2kz88i'
WHERE email = 'admin.sistema@gmail.com';

-- Sofia Ramírez: social123
UPDATE users 
SET password_hash = '$2b$12$CaDUDsLIoYRHkZSUOHKnSujX.2Xyrh97XBydiLrSKWfyZ0DQISZky'
WHERE email = 'social.user@gmail.com';

-- Asignar roles
INSERT INTO user_role_assignments (user_id, role_id, assigned_by) VALUES 
((SELECT id FROM users WHERE email = 'usuario.normal@gmail.com'), (SELECT id FROM user_roles WHERE name = 'normal'), NULL),
((SELECT id FROM users WHERE email = 'instructor.master@gmail.com'), (SELECT id FROM user_roles WHERE name = 'instructor'), NULL),
((SELECT id FROM users WHERE email = 'moderador.content@gmail.com'), (SELECT id FROM user_roles WHERE name = 'moderador'), NULL),
((SELECT id FROM users WHERE email = 'admin.sistema@gmail.com'), (SELECT id FROM user_roles WHERE name = 'administrador'), NULL),
((SELECT id FROM users WHERE email = 'social.user@gmail.com'), (SELECT id FROM user_roles WHERE name = 'normal'), NULL);

-- Categorías de cursos
INSERT INTO course_categories (name, description, slug, icon, color) VALUES
('Fundamentos', 'Cursos básicos de diseño de moda', 'fundamentos', '🎨', '#8B5CF6'),
('Técnica', 'Cursos de patronaje y construcción', 'tecnica', '✂️', '#EF4444'),
('Digital', 'Cursos de herramientas digitales', 'digital', '💻', '#3B82F6'),
('Negocios', 'Cursos de marketing y gestión', 'negocios', '💼', '#10B981'),
('Sostenibilidad', 'Cursos de moda sostenible', 'sostenibilidad', '🌱', '#059669'),
('Programación', 'Cursos de desarrollo de software', 'programacion', '⚡', '#F59E0B'),
('Diseño', 'Cursos de diseño gráfico y web', 'diseno', '🎯', '#EC4899'),
('Marketing', 'Cursos de marketing digital', 'marketing', '📢', '#6366F1'),
('Idiomas', 'Cursos de idiomas', 'idiomas', '🌍', '#8B5CF6'),
('Tecnología', 'Cursos de tecnologías emergentes', 'tecnologia', '🚀', '#06B6D4');

-- Configuraciones del sistema
INSERT INTO system_settings (key_name, value, type, description, is_public) VALUES
('site_name', 'Ajayu - Plataforma Educativa', 'string', 'Nombre del sitio web', TRUE),
('site_description', 'Plataforma educativa para diseño de moda y más', 'string', 'Descripción del sitio', TRUE),
('allow_user_registration', 'true', 'boolean', 'Permitir registro de usuarios', FALSE),
('require_email_verification', 'true', 'boolean', 'Requerir verificación de email', FALSE),
('max_file_upload_size', '50', 'number', 'Tamaño máximo de archivo en MB', FALSE),
('certificate_template', 'default', 'string', 'Plantilla de certificado por defecto', FALSE),
('default_course_language', 'es', 'string', 'Idioma por defecto de cursos', TRUE);

-- ================================================================
-- VISTAS PARA DASHBOARDS
-- ================================================================

DROP VIEW IF EXISTS student_dashboard;
DROP VIEW IF EXISTS instructor_dashboard; 
DROP VIEW IF EXISTS admin_stats;

CREATE VIEW student_dashboard AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.avatar,
    u.email,
    ur.name as role_name,
    COUNT(DISTINCT ce.id) as total_courses_enrolled,
    COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.id END) as completed_courses,
    COUNT(DISTINCT CASE WHEN ce.status = 'in_progress' THEN ce.id END) as in_progress_courses,
    ROUND(AVG(ce.progress_percentage), 1) as average_progress,
    COALESCE(SUM(ce.time_spent_minutes), 0) as total_time_minutes,
    COUNT(DISTINCT CASE WHEN ce.completed_at IS NOT NULL THEN ce.id END) as certificates_earned,
    MAX(ce.last_accessed_at) as last_activity,
    MAX(ce.enrolled_at) as first_enrollment_date
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN user_roles ur ON ura.role_id = ur.id
LEFT JOIN course_enrollments ce ON u.id = ce.user_id
WHERE ur.name = 'normal' OR ur.name = 'estudiante'
GROUP BY u.id, u.name, u.avatar, u.email, ur.name;

-- Vista para dashboard de instructor (CORREGIDA)
CREATE VIEW instructor_dashboard AS
SELECT 
    u.id as instructor_id,
    u.name as instructor_name,
    u.avatar,
    u.email,
    ip.total_courses,
    ip.total_students,
    ip.average_rating,
    COUNT(DISTINCT ce.id) as active_enrollments,
    ROUND(AVG(ce.progress_percentage), 1) as average_student_progress,
    COUNT(DISTINCT CASE WHEN ce.completed_at IS NOT NULL THEN ce.id END) as course_completions,
    COALESCE(SUM(ce.payment_amount), 0) as total_earnings_from_enrollments,
    COUNT(DISTINCT c.id) as published_courses,
    COUNT(DISTINCT CASE WHEN c.published = FALSE THEN c.id END) as draft_courses
FROM users u
LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
LEFT JOIN user_roles ur ON ura.role_id = ur.id
LEFT JOIN courses c ON u.id = c.instructor_id
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
WHERE ur.name = 'instructor'
GROUP BY u.id, u.name, u.avatar, u.email, ip.total_courses, ip.total_students, ip.average_rating;

-- Vista para estadísticas generales de Admin (CORREGIDA)
CREATE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
    (SELECT COUNT(*) FROM user_role_assignments ura 
     JOIN user_roles ur ON ura.role_id = ur.id 
     WHERE ur.name = 'administrador') as admin_users,
    (SELECT COUNT(*) FROM user_role_assignments ura 
     JOIN user_roles ur ON ura.role_id = ur.id 
     WHERE ur.name = 'instructor') as instructor_users,
    (SELECT COUNT(*) FROM user_role_assignments ura 
     JOIN user_roles ur ON ura.role_id = ur.id 
     WHERE ur.name = 'moderador') as moderator_users,
    (SELECT COUNT(*) FROM user_role_assignments ura 
     JOIN user_roles ur ON ura.role_id = ur.id 
     WHERE ur.name IN ('normal', 'estudiante')) as student_users,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM courses WHERE published = TRUE) as published_courses,
    (SELECT COUNT(*) FROM courses WHERE published = FALSE) as draft_courses,
    (SELECT COUNT(*) FROM courses WHERE approval_status = 'pending') as pending_courses,
    (SELECT COUNT(*) FROM courses WHERE approval_status = 'approved') as approved_courses,
    (SELECT COUNT(*) FROM courses WHERE approval_status = 'rejected') as rejected_courses,
    (SELECT COUNT(*) FROM lessons) as total_lessons,
    (SELECT COUNT(*) FROM course_enrollments) as total_enrollments,
    (SELECT COUNT(*) FROM course_enrollments WHERE status = 'completed') as completed_enrollments,
    (SELECT COUNT(*) FROM course_enrollments WHERE status = 'in_progress') as in_progress_enrollments,
    (SELECT COUNT(*) FROM course_enrollments WHERE status = 'cancelled') as cancelled_enrollments,
    (SELECT COUNT(*) FROM certificates) as certificates_issued,
    (SELECT COUNT(*) FROM content_reports WHERE status = 'pending') as pending_reports,
    (SELECT COUNT(*) FROM content_reports WHERE status = 'resolved') as resolved_reports,
    (SELECT COUNT(*) FROM content_reports WHERE status = 'dismissed') as dismissed_reports,
    (SELECT ROUND(AVG(rating), 2) FROM course_reviews WHERE status = 'approved') as average_rating,
    (SELECT COUNT(*) FROM course_reviews WHERE status = 'approved') as total_reviews,
    (SELECT COUNT(*) FROM assignments) as total_assignments,
    (SELECT COUNT(*) FROM assignment_submissions) as total_submissions,
    (SELECT COUNT(*) FROM assignment_submissions WHERE status = 'submitted') as submitted_assignments,
    (SELECT COUNT(*) FROM assignment_submissions WHERE status = 'graded') as graded_assignments,
    (SELECT COALESCE(SUM(payment_amount), 0) FROM course_enrollments WHERE payment_status = 'completed') as total_revenue,
    (SELECT COUNT(*) FROM notifications WHERE is_read = FALSE) as unread_notifications;

-- ================================================================
-- FUNCIONES AUXILIARES CORREGIDAS
-- ================================================================

-- Función para obtener dashboard de estudiante específico
DELIMITER //
CREATE FUNCTION get_student_dashboard(user_id INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result JSON;
    
    SELECT JSON_OBJECT(
        'user_id', u.id,
        'user_name', u.name,
        'avatar', u.avatar,
        'email', u.email,
        'role', ur.name,
        'total_courses_enrolled', COUNT(DISTINCT ce.id),
        'completed_courses', COUNT(DISTINCT CASE WHEN ce.status = 'completed' THEN ce.id END),
        'in_progress_courses', COUNT(DISTINCT CASE WHEN ce.status = 'in_progress' THEN ce.id END),
        'average_progress', ROUND(AVG(ce.progress_percentage), 1),
        'total_time_minutes', COALESCE(SUM(ce.time_spent_minutes), 0),
        'certificates_earned', COUNT(DISTINCT CASE WHEN ce.completed_at IS NOT NULL THEN ce.id END),
        'last_activity', MAX(ce.last_accessed_at),
        'first_enrollment_date', MAX(ce.enrolled_at)
    ) INTO result
    FROM users u
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
    LEFT JOIN user_roles ur ON ura.role_id = ur.id
    LEFT JOIN course_enrollments ce ON u.id = ce.user_id
    WHERE u.id = user_id AND (ur.name = 'normal' OR ur.name = 'estudiante')
    GROUP BY u.id, u.name, u.avatar, u.email, ur.name;
    
    RETURN result;
END //
DELIMITER ;

-- Función para obtener dashboard de instructor específico
DELIMITER //
CREATE FUNCTION get_instructor_dashboard(user_id INT)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result JSON;
    
    SELECT JSON_OBJECT(
        'instructor_id', u.id,
        'instructor_name', u.name,
        'avatar', u.avatar,
        'email', u.email,
        'total_courses', COALESCE(ip.total_courses, 0),
        'total_students', COALESCE(ip.total_students, 0),
        'average_rating', COALESCE(ip.average_rating, 0),
        'active_enrollments', COUNT(DISTINCT ce.id),
        'average_student_progress', ROUND(AVG(ce.progress_percentage), 1),
        'course_completions', COUNT(DISTINCT CASE WHEN ce.completed_at IS NOT NULL THEN ce.id END),
        'total_earnings_from_enrollments', COALESCE(SUM(ce.payment_amount), 0),
        'published_courses', COUNT(DISTINCT c.id),
        'draft_courses', COUNT(DISTINCT CASE WHEN c.published = FALSE THEN c.id END)
    ) INTO result
    FROM users u
    LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
    LEFT JOIN user_roles ur ON ura.role_id = ur.id
    LEFT JOIN courses c ON u.id = c.instructor_id
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id
    WHERE u.id = user_id AND ur.name = 'instructor'
    GROUP BY u.id, u.name, u.avatar, u.email, ip.total_courses, ip.total_students, ip.average_rating;
    
    RETURN result;
END //
DELIMITER ;
-- ================================================================
-- TRIGGERS PARA MANTENER CONTADORES ACTUALIZADOS
-- ================================================================
DELIMITER //

-- Trigger para actualizar contador de estudiantes del instructor
CREATE TRIGGER update_instructor_students_count
AFTER INSERT ON course_enrollments
FOR EACH ROW
BEGIN
    UPDATE instructor_profiles 
    SET total_students = (
        SELECT COUNT(DISTINCT ce.user_id) 
        FROM course_enrollments ce 
        JOIN courses c ON ce.course_id = c.id 
        WHERE c.instructor_id = NEW.course_id
    )
    WHERE user_id = (SELECT instructor_id FROM courses WHERE id = NEW.course_id);
END //


-- ================================================================
-- DATOS DE EJEMPLO (CURSOS Y LECCIONES)
-- ================================================================

-- Cursos de ejemplo
INSERT INTO courses (title, slug, description, instructor_id, category_id, level, duration_hours, price, is_free, published, approval_status) VALUES
('Fundamentos del Diseño de Moda', 'fundamentos-diseno-moda', 'Aprende los principios básicos del diseño de moda, desde el desarrollo de conceptos hasta la creación de bocetos. Ideal para principiantes que quieren incursionar en el mundo de la moda.', (SELECT id FROM users WHERE email = 'instructor.master@gmail.com'), (SELECT id FROM course_categories WHERE slug = 'fundamentos'), 'principiante', 40, 199.99, FALSE, TRUE, 'approved'),
('Patronaje y Construcción de Prendas', 'patronaje-construccion-prendas', 'Domina la técnica del patronaje y la construcción de prendas. Aprenderás a crear patrones, tomar medidas y ensamblar piezas profesionales.', (SELECT id FROM users WHERE email = 'instructor.master@gmail.com'), (SELECT id FROM course_categories WHERE slug = 'tecnica'), 'intermedio', 60, 299.99, FALSE, TRUE, 'approved'),
('JavaScript desde Cero', 'javascript-desde-cero', 'Aprende JavaScript desde lo más básico hasta conceptos avanzados. Perfecto para principiantes en programación.', (SELECT id FROM users WHERE email = 'instructor.master@gmail.com'), (SELECT id FROM course_categories WHERE slug = 'programacion'), 'principiante', 30, 149.99, FALSE, TRUE, 'approved'),
('React y Redux Profesional', 'react-redux-profesional', 'Desarrollo web moderno con React y Redux. Crea aplicaciones profesionales con las mejores prácticas.', (SELECT id FROM users WHERE email = 'instructor.master@gmail.com'), (SELECT id FROM course_categories WHERE slug = 'programacion'), 'intermedio', 40, 249.99, FALSE, TRUE, 'approved'),
('Marketing Digital Estratégico', 'marketing-digital-estrategico', 'Estrategias de marketing digital para PyMEs. Aprende a promocionar tu negocio online.', (SELECT id FROM users WHERE email = 'instructor.master@gmail.com'), (SELECT id FROM course_categories WHERE slug = 'marketing'), 'intermedio', 25, 129.99, FALSE, TRUE, 'approved');

-- Lecciones de ejemplo
INSERT INTO lessons (course_id, title, description, content, video_url, order_index, lesson_type, estimated_minutes, required, is_preview) VALUES
(1, 'Introducción al Diseño de Moda', 'El diseño de moda es una forma de arte que combina creatividad, técnica y comprensión del mercado.', 'En este primer módulo exploraremos los elementos básicos del diseño de moda...', '/videos/intro-diseno-moda.mp4', 1, 'video', 45, TRUE, TRUE),
(1, 'Elementos del Diseño', 'Los elementos fundamentales del diseño incluyen la línea, la forma, el color, la textura y el espacio.', 'Cada elemento contribuye a crear una composición visual efectiva...', NULL, 2, 'text', 50, TRUE, FALSE),
(1, 'Desarrollo de Bocetos', 'Aprenderás técnicas específicas para bocetar figuras de moda, expresar movimiento y presentar tus ideas.', 'Técnicas profesionales de bocetado para diseño de moda...', '/videos/desarrollo-bocetos.mp4', 3, 'video', 60, TRUE, FALSE),
(2, 'Anatomía de la Prenda', 'Todo diseño debe considerar cómo se construye. Comprender las partes de una prenda es fundamental.', 'Partes principales de una prenda y su función...', NULL, 1, 'text', 45, TRUE, TRUE),
(3, 'Introducción a JavaScript', 'Qué es JavaScript y por qué es importante en el desarrollo web moderno.', 'Historia y conceptos básicos de JavaScript...', '/videos/js-intro.mp4', 1, 'video', 15, TRUE, TRUE),
(3, 'Variables y Tipos de Datos', 'Cómo declarar variables y trabajar con diferentes tipos de datos en JavaScript.', 'Declaración de variables, tipos primitivos y objetos...', '/videos/js-variables.mp4', 2, 'video', 20, TRUE, FALSE);

-- Asignaciones de ejemplo
INSERT INTO assignments (course_id, lesson_id, title, description, assignment_type, due_date, points_possible) VALUES
(1, NULL, 'Proyecto: Diseño de Silueta', 'Diseña una silueta original inspirada en elementos bolivianos. Incluye bocetos y justificación conceptual.', 'project', DATE_ADD(NOW(), INTERVAL 14 DAY), 100),
(1, 3, 'Ejercicio: Bocetos de Moda', 'Crea 5 bocetos diferentes usando las técnicas aprendidas en la lección.', 'practical', DATE_ADD(NOW(), INTERVAL 7 DAY), 50),
(3, NULL, 'Calculadora Interactiva', 'Desarrolla una calculadora básica usando HTML, CSS y JavaScript.', 'project', DATE_ADD(NOW(), INTERVAL 21 DAY), 150);

-- Inscripciones de ejemplo
INSERT INTO course_enrollments (user_id, course_id, status, progress_percentage) VALUES
((SELECT id FROM users WHERE email = 'usuario.normal@gmail.com'), 1, 'in_progress', 75),
((SELECT id FROM users WHERE email = 'usuario.normal@gmail.com'), 3, 'in_progress', 50),
((SELECT id FROM users WHERE email = 'social.user@gmail.com'), 1, 'completed', 100),
((SELECT id FROM users WHERE email = 'social.user@gmail.com'), 5, 'enrolled', 0);

-- Progreso de lecciones de ejemplo
INSERT INTO lesson_progress (user_id, lesson_id, enrollment_id, status, completed_at, time_spent_seconds) VALUES
((SELECT id FROM users WHERE email = 'usuario.normal@gmail.com'), (SELECT id FROM lessons WHERE course_id = 1 AND order_index = 1), (SELECT id FROM course_enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'usuario.normal@gmail.com') AND course_id = 1), 'completed', NOW(), 2700),
((SELECT id FROM users WHERE email = 'usuario.normal@gmail.com'), (SELECT id FROM lessons WHERE course_id = 1 AND order_index = 2), (SELECT id FROM course_enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'usuario.normal@gmail.com') AND course_id = 1), 'completed', NOW(), 3000),
((SELECT id FROM users WHERE email = 'social.user@gmail.com'), (SELECT id FROM lessons WHERE course_id = 1 AND order_index = 1), (SELECT id FROM course_enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'social.user@gmail.com') AND course_id = 1), 'completed', NOW(), 2700),
((SELECT id FROM users WHERE email = 'social.user@gmail.com'), (SELECT id FROM lessons WHERE course_id = 1 AND order_index = 2), (SELECT id FROM course_enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'social.user@gmail.com') AND course_id = 1), 'completed', NOW(), 3000),
((SELECT id FROM users WHERE email = 'social.user@gmail.com'), (SELECT id FROM lessons WHERE course_id = 1 AND order_index = 3), (SELECT id FROM course_enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'social.user@gmail.com') AND course_id = 1), 'completed', NOW(), 3600);

-- Reseñas de ejemplo
INSERT INTO course_reviews (course_id, user_id, enrollment_id, rating, review_text, would_recommend, verified_purchase) VALUES
(1, (SELECT id FROM users WHERE email = 'usuario.normal@gmail.com'), (SELECT id FROM course_enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'usuario.normal@gmail.com') AND course_id = 1), 5, 'Excelente curso para principiantes. Muy bien estructurado y con ejemplos prácticos.', TRUE, TRUE),
(1, (SELECT id FROM users WHERE email = 'social.user@gmail.com'), (SELECT id FROM course_enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'social.user@gmail.com') AND course_id = 1), 4, 'Buen contenido, aunque me gustaría ver más ejercicios prácticos.', TRUE, TRUE),
(3, (SELECT id FROM users WHERE email = 'usuario.normal@gmail.com'), (SELECT id FROM course_enrollments WHERE user_id = (SELECT id FROM users WHERE email = 'usuario.normal@gmail.com') AND course_id = 3), 5, 'Perfecto para aprender JavaScript desde cero. Los ejemplos son muy claros.', TRUE, TRUE);

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================
SELECT 
  '🚀 BASE DE DATOS AJAYU COMPLETA Y NUEVA CREADA!' as resultado,
  (SELECT COUNT(*) FROM users) as total_usuarios,
  (SELECT COUNT(*) FROM courses) as total_cursos,
  (SELECT COUNT(*) FROM lessons) as total_lecciones,
  (SELECT COUNT(*) FROM course_enrollments) as total_inscripciones,
  (SELECT COUNT(*) FROM user_roles) as roles_creados,
  (SELECT COUNT(*) FROM assignments) as total_asignaciones,
  (SELECT COUNT(*) FROM certificates) as certificados_emitidos;

-- ================================================================
-- TUS CREDENCIALES FINALES
-- ================================================================
SELECT 
  CONCAT(
    '🔑 TUS CREDENCIALES REALES:',
    '\n👤 Ana García: usuario.normal@gmail.com (ROL: normal)',
    '\n👨‍🏫 Carlos Pérez: instructor.master@gmail.com (ROL: instructor)', 
    '\n👮 Laura Martínez: moderador.content@gmail.com (ROL: moderador)',
    '\n👨‍💼 Miguel Torres: admin.sistema@gmail.com (ROL: administrador)',
    '\n👤 Sofia Ramírez: social.user@gmail.com (ROL: normal)',
    '\n\n✅ FUNCIONALIDADES INCLUIDAS:',
    '\n🎯 ADMIN: Dashboard, gestión completa, reportes, analytics',
    '\n👨‍🏫 INSTRUCTOR: Dashboard personal, crear/editar cursos, tareas, calificar',
    '\n👮 MODERADOR: Ver denuncias, revisar contenido, logs',
    '\n👤 ESTUDIANTE: Explorar cursos, inscribirse, ver lecciones, enviar tareas, certificados',
    '\n📁 TÉCNICO: Gestión de archivos, videos, recursos, thumbnails, progreso',
    '\n\n🚀 ¡LISTO PARA USAR!'
  ) as credenciales_y_funcionalidades;