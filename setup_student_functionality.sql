
CREATE TABLE IF NOT EXISTS course_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  user_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  completed_at TIMESTAMP NULL,
  INDEX idx_course_user (course_id, user_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_types_allowed VARCHAR(255) DEFAULT 'pdf,docx,txt',
  max_file_size_mb INT DEFAULT 10,
  due_date TIMESTAMP NULL,
  points_possible INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_course (course_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('submitted', 'graded', 'late') DEFAULT 'submitted',
  INDEX idx_assignment (assignment_id),
  INDEX idx_student (student_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_submission (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  instructor_id INT NOT NULL,
  score DECIMAL(8,2) NOT NULL,
  max_score DECIMAL(8,2) NOT NULL,
  feedback TEXT,
  graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('approved', 'rejected', 'needs_revision') DEFAULT 'approved',
  INDEX idx_submission (submission_id),
  INDEX idx_instructor (instructor_id),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  student_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_course (course_id),
  INDEX idx_student (student_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (course_id, student_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  lesson_id INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  video_progress_seconds INT DEFAULT 0,
  video_total_seconds INT DEFAULT 0,
  watch_percentage DECIMAL(5,2) DEFAULT 0,
  last_watched_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_course (user_id, course_id),
  INDEX idx_lesson (lesson_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_progress (user_id, lesson_id)
);


INSERT IGNORE INTO courses (id, title, description, price, published, instructor_id, level, duration_hours) 
VALUES 
(8, 'Introducción a JavaScript', 'Aprende los fundamentos de JavaScript desde cero', 0, TRUE, 1, 'Principiante', 40),
(9, 'Desarrollo Web con React', 'Construye aplicaciones modernas con React', 99, TRUE, 1, 'Intermedio', 60),
(10, 'Bases de Datos MySQL', 'Domina MySQL y el diseño de bases de datos', 49, TRUE, 1, 'Intermedio', 35);

INSERT IGNORE INTO lessons (id, course_id, title, description, content, duration_minutes, order_index, is_preview) VALUES
(1, 8, 'Introducción a JavaScript', '¿Qué es JavaScript y para qué sirve?', 'Contenido de la lección...', 15, 1, TRUE),
(2, 8, 'Variables y Tipos de Datos', 'Aprende sobre variables y tipos de datos', 'Contenido de la lección...', 20, 2, FALSE),
(3, 8, 'Funciones Básicas', 'Crea tus primeras funciones', 'Contenido de la lección...', 25, 3, FALSE),
(4, 9, 'Introducción a React', 'Conceptos básicos de React', 'Contenido de la lección...', 30, 1, TRUE),
(5, 9, 'Componentes y Props', 'Aprende sobre componentes', 'Contenido de la lección...', 35, 2, FALSE),
(6, 10, 'Introducción a MySQL', 'Fundamentos de bases de datos', 'Contenido de la lección...', 25, 1, TRUE),
(7, 10, 'Consultas SQL Básicas', 'Aprende SELECT, INSERT, UPDATE', 'Contenido de la lección...', 30, 2, FALSE);

INSERT IGNORE INTO assignments (id, course_id, title, description, points_possible) VALUES
(1, 8, 'Primer Programa JavaScript', 'Crea tu primer programa en JavaScript que calcule la suma de dos números', 100),
(2, 8, 'Variables y Funciones', 'Implementa un programa que use variables y funciones', 100),
(3, 9, 'Mi Primer Componente', 'Crea un componente React simple', 150),
(4, 10, 'Diseño de Base de Datos', 'Diseña una base de datos para una tienda online', 200);

SELECT 'Tablas y datos de ejemplo creados exitosamente' as resultado;