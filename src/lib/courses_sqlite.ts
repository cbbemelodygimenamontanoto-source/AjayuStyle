import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const dbPath = './courses.db';

// Crear conexión a SQLite
const db = new sqlite3.Database(dbPath);

// Promisificar métodos de SQLite
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Interfaces
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

// Inicializar base de datos
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Inicializando base de datos SQLite...');
    
    // Crear tablas
    await run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        level TEXT CHECK(level IN ('principiante', 'intermedio', 'avanzado')) NOT NULL,
        thumbnail TEXT,
        instructor_id INTEGER NOT NULL,
        price REAL DEFAULT 0.00,
        duration_hours INTEGER,
        published INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        progress_percentage REAL DEFAULT 0.00,
        completed_at DATETIME,
        status TEXT CHECK(status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
        UNIQUE(user_id, course_id)
      )
    `);

    // Insertar datos de prueba si no existen
    const courseCount = await get('SELECT COUNT(*) as count FROM courses');
    
    if (courseCount.count === 0) {
      console.log('🔄 Insertando datos de prueba...');
      
      // Insertar usuario instructor de prueba
      await run(
        'INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
        [1, 'Ana García', 'ana@ajayu.com', 'password_hash_placeholder']
      );

      // Insertar cursos de ejemplo
      const courses = [
        ['Fundamentos del Diseño de Moda', 'Aprende los conceptos básicos del diseño de moda, historia, tendencias y técnicas fundamentales para crear tus primeras colecciones.', 'principiante', 299.99, 40],
        ['Patronaje Avanzado y Costura Profesional', 'Domina las técnicas avanzadas de patronaje y costura profesional. Aprende a crear patrones complejos y terminaciones de alta calidad.', 'intermedio', 499.99, 60],
        ['Diseño Digital para Moda', 'Aprende a usar software especializado para diseñar colecciones digitales, crear visualizaciones y presentaciones profesionales.', 'intermedio', 399.99, 45],
        ['Gestión de Marca de Moda', 'Desarrolla una marca de moda exitosa desde cero. Marketing, producción, distribución y estrategias comerciales.', 'avanzado', 699.99, 80],
        ['Sostenibilidad en la Moda', 'Explora la moda sostenible y ética. Aprende a crear colecciones responsables con el medio ambiente.', 'intermedio', 349.99, 35]
      ];

      for (const [title, description, level, price, duration] of courses) {
        await run(
          'INSERT INTO courses (title, description, level, instructor_id, price, duration_hours, published) VALUES (?, ?, ?, ?, ?, ?, 1)',
          [title, description, level, 1, price, duration]
        );
      }

      console.log('✅ Datos de prueba insertados');
    }

    console.log('✅ Base de datos SQLite inicializada');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
};

// Funciones para cursos
export const getPublishedCourses = async (): Promise<Course[]> => {
  try {
    const courses = await all(`
      SELECT c.*, u.name as instructor_name,
        COUNT(l.id) as lesson_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN lessons l ON c.id = l.course_id
      WHERE c.published = 1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    return courses.map(course => ({
      ...course,
      published: Boolean(course.published),
      level: course.level as 'principiante' | 'intermedio' | 'avanzado'
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const getCourseById = async (id: number): Promise<Course | null> => {
  try {
    const course = await get(`
      SELECT c.*, u.name as instructor_name
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = ? AND c.published = 1
    `, [id]);

    if (course) {
      return {
        ...course,
        published: Boolean(course.published),
        level: course.level as 'principiante' | 'intermedio' | 'avanzado'
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

export const enrollInCourse = async (user_id: number, course_id: number) => {
  try {
    // Verificar si ya está inscrito
    const existing = await get(
      'SELECT * FROM course_enrollments WHERE user_id = ? AND course_id = ?',
      [user_id, course_id]
    );

    if (existing) {
      return existing;
    }

    // Inscribirse
    const result = await run(
      'INSERT INTO course_enrollments (user_id, course_id, enrolled_at, progress_percentage, status) VALUES (?, ?, datetime("now"), 0, "active")',
      [user_id, course_id]
    );

    return {
      id: result.lastID,
      user_id,
      course_id,
      enrolled_at: new Date(),
      progress_percentage: 0,
      status: 'active'
    };
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

// Función para cerrar la base de datos
export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default {
  initializeDatabase,
  getPublishedCourses,
  getCourseById,
  enrollInCourse,
  closeDatabase,
};