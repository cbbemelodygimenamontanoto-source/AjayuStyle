// Datos mock temporales para pruebas
export const mockCourses = [
  {
    id: 7,
    title: 'Introducción a JavaScript',
    description: 'Aprende los fundamentos de JavaScript desde cero. Perfecto para principiantes que quieren empezar en el desarrollo web.',
    category: 'Desarrollo Web',
    level: 'principiante',
    price: 49.99,
    published: true,
    thumbnail: '/images/js-course.jpg',
    duration_minutes: 480,
    instructor_id: 1,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    lessons: [
      {
        id: 1,
        title: 'Introducción a JavaScript',
        content: 'Bienvenido al mundo de JavaScript. En esta lección aprenderás qué es JavaScript y para qué se utiliza.',
        lesson_type: 'video',
        order_index: 1,
        estimated_minutes: 15,
        resources: JSON.stringify(['Guía de instalación', 'Ejercicios básicos']),
        course_id: 7
      },
      {
        id: 2,
        title: 'Variables y Tipos de Datos',
        content: 'Aprende sobre variables, constantes y los diferentes tipos de datos en JavaScript.',
        lesson_type: 'video',
        order_index: 2,
        estimated_minutes: 20,
        resources: JSON.stringify(['Cheat sheet de variables', 'Ejercicios prácticos']),
        course_id: 7
      },
      {
        id: 3,
        title: 'Funciones Básicas',
        content: 'Cómo crear y usar funciones en JavaScript.',
        lesson_type: 'video',
        order_index: 3,
        estimated_minutes: 25,
        resources: JSON.stringify(['Plantillas de funciones', 'Proyectos guiados']),
        course_id: 7
      },
      {
        id: 4,
        title: 'Estructuras de Control',
        content: 'Condicionales y bucles en JavaScript.',
        lesson_type: 'video',
        order_index: 4,
        estimated_minutes: 30,
        resources: JSON.stringify(['Ejemplos de código', 'Ejercicios guiados']),
        course_id: 7
      },
      {
        id: 5,
        title: 'Arrays y Objetos',
        content: 'Manejo de arrays y objetos en JavaScript.',
        lesson_type: 'video',
        order_index: 5,
        estimated_minutes: 35,
        resources: JSON.stringify(['Documentación', 'Proyecto práctico']),
        course_id: 7
      }
    ],
    average_rating: 4.8,
    total_reviews: 25,
    total_students: 156,
    lesson_count: 5,
    features: [
      '5 lecciones de video',
      'Material descargable',
      'Certificado de finalización',
      'Acceso a comunidad de estudiantes',
      'Soporte del instructor'
    ]
  },
  {
    id: 8,
    title: 'React Avanzado',
    description: 'Domina React con hooks, context, y patrones avanzados. Construye aplicaciones web modernas y escalables.',
    category: 'Desarrollo Web',
    level: 'avanzado',
    price: 89.99,
    published: true,
    thumbnail: '/images/react-course.jpg',
    duration_minutes: 720,
    instructor_id: 1,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    lessons: [
      {
        id: 6,
        title: 'React Hooks Fundamentals',
        content: 'Introducción a los hooks de React: useState, useEffect, useContext.',
        lesson_type: 'video',
        order_index: 1,
        estimated_minutes: 30,
        resources: JSON.stringify(['Documentación oficial', 'Ejemplos prácticos']),
        course_id: 8
      },
      {
        id: 7,
        title: 'Context API y State Management',
        content: 'Manejo avanzado de estado con Context API.',
        lesson_type: 'video',
        order_index: 2,
        estimated_minutes: 35,
        resources: JSON.stringify(['Patrones de state management', 'Proyecto completo']),
        course_id: 8
      }
    ],
    average_rating: 4.9,
    total_reviews: 42,
    total_students: 89,
    lesson_count: 2,
    features: [
      '2 lecciones de video',
      'Material descargable',
      'Certificado de finalización',
      'Acceso a comunidad de estudiantes',
      'Soporte del instructor'
    ]
  },
  {
    id: 9,
    title: 'Diseño UX/UI para Principiantes',
    description: 'Crea interfaces atractivas y funcionales. Aprende los principios fundamentales del diseño digital.',
    category: 'Diseño',
    level: 'principiante',
    price: 39.99,
    published: true,
    thumbnail: '/images/ux-course.jpg',
    duration_minutes: 360,
    instructor_id: 1,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z',
    lessons: [
      {
        id: 8,
        title: 'Principios del Diseño UX',
        content: 'Fundamentos del diseño de experiencia de usuario.',
        lesson_type: 'video',
        order_index: 1,
        estimated_minutes: 20,
        resources: JSON.stringify(['Checklist UX', 'Casos de estudio']),
        course_id: 9
      },
      {
        id: 9,
        title: 'Diseño de Interfaces',
        content: 'Creación de interfaces atractivas y funcionales.',
        lesson_type: 'video',
        order_index: 2,
        estimated_minutes: 25,
        resources: JSON.stringify(['Guía de colores', 'Tipografía']),
        course_id: 9
      }
    ],
    average_rating: 4.7,
    total_reviews: 18,
    total_students: 73,
    lesson_count: 2,
    features: [
      '2 lecciones de video',
      'Material descargable',
      'Certificado de finalización',
      'Acceso a comunidad de estudiantes',
      'Soporte del instructor'
    ]
  }
];

export const mockUsers = [
  {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan@example.com',
    avatar: '/images/avatar1.jpg',
    roles: [{ id: 2, name: 'instructor' }]
  },
  {
    id: 2,
    name: 'María González',
    email: 'maria@example.com',
    avatar: '/images/avatar2.jpg',
    roles: [{ id: 1, name: 'student' }]
  },
  {
    id: 3,
    name: 'Carlos Rodríguez',
    email: 'carlos@example.com',
    avatar: '/images/avatar3.jpg',
    roles: [{ id: 1, name: 'student' }]
  },
  {
    id: 4,
    name: 'Ana López',
    email: 'ana@example.com',
    avatar: '/images/avatar4.jpg',
    roles: [{ id: 3, name: 'moderator' }]
  },
  {
    id: 5,
    name: 'Roberto Admin',
    email: 'admin@ajayu.com',
    avatar: '/images/avatar5.jpg',
    roles: [{ id: 4, name: 'administrador' }]
  }
];

export const mockEnrollments = [
  { user_id: 2, course_id: 7, enrolled_at: '2024-01-20T10:00:00Z' },
  { user_id: 2, course_id: 9, enrolled_at: '2024-01-22T10:00:00Z' },
  { user_id: 3, course_id: 7, enrolled_at: '2024-01-21T10:00:00Z' },
  { user_id: 3, course_id: 8, enrolled_at: '2024-01-23T10:00:00Z' }
];

export const mockSubmissions = [
  {
    id: 1,
    user_id: 2,
    lesson_id: 2,
    assignment_title: 'Ejercicio de Variables',
    content: 'Aquí está mi ejercicio de variables en JavaScript...',
    submitted_at: '2024-01-25T10:00:00Z',
    status: 'pending'
  },
  {
    id: 2,
    user_id: 3,
    lesson_id: 1,
    assignment_title: 'Introducción a JavaScript',
    content: 'Mi primer script de JavaScript...',
    submitted_at: '2024-01-24T10:00:00Z',
    status: 'graded',
    grade: 85,
    feedback: 'Excelente trabajo, solo mejora la sintaxis en algunos lugares.'
  }
];

export const mockActivityLogs = [
  {
    id: 1,
    user_id: 2,
    activity_type: 'lesson_completed',
    description: 'Completó la lección "Variables y Tipos de Datos"',
    created_at: '2024-01-25T15:30:00Z'
  },
  {
    id: 2,
    user_id: 3,
    activity_type: 'assignment_submitted',
    description: 'Envió tarea para la lección "Introducción a JavaScript"',
    created_at: '2024-01-24T14:20:00Z'
  }
];