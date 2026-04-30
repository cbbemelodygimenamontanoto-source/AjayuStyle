// Datos mock para probar funcionalidades de estudiante
export const mockStudentData = {
  // Usuario estudiante
  student: {
    id: '1',
    email: 'estudiante@ajayu.com',
    username: 'estudiante1',
    name: 'Juan Pérez Estudiante',
    role: 'normal',
    status: 'active',
    avatar: '/images/avatars/student1.jpg',
    bio: 'Estudiante passionate por el aprendizaje',
    created_at: new Date('2024-01-15'),
    updated_at: new Date()
  },

  // Cursos disponibles
  courses: [
    {
      id: 35,
      title: 'Desarrollo Web Moderno con React',
      description: 'Aprende a crear aplicaciones web modernas usando React, Next.js y las últimas tecnologías del ecosistema JavaScript.',
      level: 'intermedio',
      price: 99.99,
      duration_hours: 45,
      image_url: '/images/courses/react-desarrollo.jpg',
      published: true,
      category_name: 'Programación Web',
      instructor_id: 8,
      instructor_name: 'Carlos Mendoza',
      created_at: new Date('2024-01-05'),
      ratings_average: 4.9,
      total_students: 250,
      lesson_count: 20,
      average_rating: 4.9,
      total_reviews: 78,
      lesson_count: 20,
      features: [
        'React y Hooks avanzados',
        'Next.js y Server-Side Rendering',
        'TypeScript para React',
        'Estado global con Redux/Zustand',
        'Testing con Jest y React Testing Library',
        'Deploy y optimización'
      ]
    },
    {
      id: 1,
      title: 'Fundamentos de Diseño de Moda',
      description: 'Aprende los principios fundamentales del diseño de moda, desde el sketching hasta la creación de prendas únicas.',
      level: 'principiante',
      price: 0,
      duration_hours: 25,
      image_url: '/images/courses/moda-fundamentos.jpg',
      published: true,
      category_name: 'Diseño de Moda',
      instructor_id: 2,
      instructor_name: 'María González',
      created_at: new Date('2024-01-01'),
      ratings_average: 4.8,
      total_students: 150,
      lesson_count: 12,
      average_rating: 4.8,
      total_reviews: 45,
      lesson_count: 12,
      features: [
        'Conceptos básicos de diseño',
        'Historia de la moda',
        'Técnicas de sketching',
        'Materiales y herramientas',
        'Proyectos prácticos'
      ]
    },
    {
      id: 2,
      title: 'Diseño Digital para Moda',
      description: 'Crea diseños de moda usando software profesional. Aprende Adobe Illustrator y Photoshop aplicadas al mundo de la moda.',
      level: 'intermedio',
      price: 149.99,
      duration_hours: 40,
      image_url: '/images/courses/diseño-digital.jpg',
      published: true,
      category_name: 'Diseño de Moda',
      instructor_id: 3,
      instructor_name: 'Carlos Mendoza',
      created_at: new Date('2024-01-10'),
      ratings_average: 4.9,
      total_students: 200,
      lesson_count: 16,
      average_rating: 4.9,
      total_reviews: 67,
      lesson_count: 16,
      features: [
        'Adobe Illustrator para moda',
        'Photoshop avanzado',
        'Paletas de colores',
        'Texturas y patrones',
        'Portafolio profesional'
      ]
    },
    {
      id: 7,
      title: 'Introducción a JavaScript',
      description: 'Aprende los fundamentos de JavaScript desde cero. Perfecto para principiantes que quieren empezar en el desarrollo web.',
      level: 'principiante',
      price: 0,
      duration_hours: 30,
      image_url: '/images/courses/javascript.jpg',
      published: true,
      category_name: 'Programación',
      instructor_id: 4,
      instructor_name: 'Ana Rodríguez',
      created_at: new Date('2024-01-15'),
      ratings_average: 4.7,
      total_students: 300,
      lesson_count: 15,
      average_rating: 4.7,
      total_reviews: 89,
      lesson_count: 15,
      features: [
        'Sintaxis básica',
        'Variables y funciones',
        'DOM manipulation',
        'Eventos',
        'Proyecto final'
      ]
    },
    {
      id: 9,
      title: 'Diseño UX/UI para Principiantes',
      description: 'Crea interfaces atractivas y funcionales. Aprende los principios fundamentales del diseño digital.',
      level: 'principiante',
      price: 0,
      duration_hours: 20,
      image_url: '/images/courses/ux-course.jpg',
      published: true,
      category_name: 'Diseño UX/UI',
      instructor_id: 5,
      instructor_name: 'Luis Fernández',
      created_at: new Date('2024-01-20'),
      ratings_average: 4.6,
      total_students: 180,
      lesson_count: 10,
      average_rating: 4.6,
      total_reviews: 52,
      lesson_count: 10,
      features: [
        'Principios de UX/UI',
        'Wireframes',
        'Prototipado',
        'Testing de usabilidad',
        'Portfolio'
      ]
    },
    {
      id: 10,
      title: 'Patronaje y Costura Avanzada',
      description: 'Domina las técnicas avanzadas de patronaje y costura. Aprende a crear patrones complejos y técnicas de confección profesional.',
      level: 'avanzado',
      price: 199.99,
      duration_hours: 50,
      image_url: '/images/courses/patronaje.jpg',
      published: true,
      category_name: 'Costura y Patronaje',
      instructor_id: 6,
      instructor_name: 'Elena Vargas',
      created_at: new Date('2024-02-01'),
      ratings_average: 4.9,
      total_students: 95,
      lesson_count: 20,
      average_rating: 4.9,
      total_reviews: 28,
      lesson_count: 20,
      features: [
        'Patronaje de garments complejos',
        'Técnicas de acabado',
        'Uso de máquinas industriales',
        'Ajustes y modificaciones',
        'Proyecto de colección'
      ]
    }
  ],

  // Inscripciones del estudiante
  enrollments: [
    {
      id: 5,
      course_id: 35,
      student_id: 1,
      enrolled_at: new Date('2024-02-15'),
      progress_percentage: 50,
      status: 'active',
      course_title: 'Desarrollo Web Moderno con React',
      course_image: '/images/courses/react-desarrollo.jpg',
      instructor_name: 'Carlos Mendoza',
      lesson_count: 20,
      completed_lessons: 10,
      description: 'Aprende a crear aplicaciones web modernas usando React y Next.js',
      level: 'intermedio'
    },
    {
      id: 1,
      course_id: 1,
      student_id: 1,
      enrolled_at: new Date('2024-01-20'),
      progress_percentage: 75,
      status: 'active',
      course_title: 'Fundamentos de Diseño de Moda',
      course_image: '/images/courses/moda-fundamentos.jpg',
      instructor_name: 'María González',
      lesson_count: 12,
      completed_lessons: 9,
      description: 'Aprende los principios fundamentales del diseño de moda',
      level: 'principiante'
    },
    {
      id: 2,
      course_id: 7,
      student_id: 1,
      enrolled_at: new Date('2024-01-25'),
      progress_percentage: 60,
      status: 'active',
      course_title: 'Introducción a JavaScript',
      course_image: '/images/courses/javascript.jpg',
      instructor_name: 'Ana Rodríguez',
      lesson_count: 15,
      completed_lessons: 9,
      description: 'Aprende los fundamentos de JavaScript desde cero',
      level: 'principiante'
    },
    {
      id: 3,
      course_id: 9,
      student_id: 1,
      enrolled_at: new Date('2024-02-01'),
      progress_percentage: 25,
      status: 'active',
      course_title: 'Diseño UX/UI para Principiantes',
      course_image: '/images/courses/ux-course.jpg',
      instructor_name: 'Luis Fernández',
      lesson_count: 10,
      completed_lessons: 2,
      description: 'Crea interfaces atractivas y funcionales',
      level: 'principiante'
    },
    {
      id: 4,
      course_id: 10,
      student_id: 1,
      enrolled_at: new Date('2024-02-10'),
      progress_percentage: 100,
      status: 'completed',
      course_title: 'Patronaje y Costura Avanzada',
      course_image: '/images/courses/patronaje.jpg',
      instructor_name: 'Elena Vargas',
      lesson_count: 20,
      completed_lessons: 20,
      description: 'Domina las técnicas avanzadas de patronaje y costura',
      level: 'avanzado'
    }
  ],

  // Lecciones por curso
  lessons: {
    '35': [
      {
        id: 101,
        course_id: 35,
        title: 'Introducción a React y JSX',
        description: 'Fundamentos de React, componentes y sintaxis JSX',
        content: 'Contenido de la lección...',
        duration_minutes: 45,
        order_index: 1,
        is_preview: true,
        completed: true,
        content_type: 'video'
      },
      {
        id: 102,
        course_id: 35,
        title: 'Hooks en React - useState y useEffect',
        description: 'Aprende a usar los hooks más importantes de React',
        content: 'Contenido de la lección...',
        duration_minutes: 50,
        order_index: 2,
        is_preview: false,
        completed: true,
        content_type: 'video'
      },
      {
        id: 103,
        course_id: 35,
        title: 'Componentes y Props',
        description: 'Creando componentes reutilizables y pasando datos',
        content: 'Contenido de la lección...',
        duration_minutes: 40,
        order_index: 3,
        is_preview: false,
        completed: false,
        content_type: 'video'
      },
      {
        id: 104,
        course_id: 35,
        title: 'Estado Global con Context API',
        description: 'Gestión de estado global en aplicaciones React',
        content: 'Contenido de la lección...',
        duration_minutes: 55,
        order_index: 4,
        is_preview: false,
        completed: false,
        content_type: 'video'
      }
    ],
    '1': [
      {
        id: 1,
        course_id: 1,
        title: 'Historia del Diseño de Moda',
        description: 'Un recorrido por la evolución de la moda a través del tiempo',
        content: 'Contenido de la lección...',
        duration_minutes: 30,
        order_index: 1,
        is_preview: true,
        completed: true,
        content_type: 'video'
      },
      {
        id: 2,
        course_id: 1,
        title: 'Principios del Diseño',
        description: 'Línea, forma, color y textura en el diseño',
        content: 'Contenido de la lección...',
        duration_minutes: 45,
        order_index: 2,
        is_preview: false,
        completed: true,
        content_type: 'video'
      },
      {
        id: 3,
        course_id: 1,
        title: 'Herramientas del Diseñador',
        description: 'Conociendo los instrumentos básicos',
        content: 'Contenido de la lección...',
        duration_minutes: 35,
        order_index: 3,
        is_preview: false,
        completed: true,
        content_type: 'video'
      }
    ],
    '7': [
      {
        id: 4,
        course_id: 7,
        title: 'Introducción a JavaScript',
        description: 'Conceptos básicos y configuración del entorno',
        content: 'Contenido de la lección...',
        duration_minutes: 40,
        order_index: 1,
        is_preview: true,
        completed: true,
        content_type: 'video'
      },
      {
        id: 5,
        course_id: 7,
        title: 'Variables y Tipos de Datos',
        description: 'Declaración de variables y tipos primitivos',
        content: 'Contenido de la lección...',
        duration_minutes: 50,
        order_index: 2,
        is_preview: false,
        completed: true,
        content_type: 'video'
      }
    ],
    '9': [
      {
        id: 6,
        course_id: 9,
        title: 'Fundamentos de UX/UI',
        description: 'Principios básicos del diseño de interfaces',
        content: 'Contenido de la lección...',
        duration_minutes: 35,
        order_index: 1,
        is_preview: true,
        completed: true,
        content_type: 'video'
      }
    ],
    '10': [
      {
        id: 7,
        course_id: 10,
        title: 'Introducción al Patronaje',
        description: 'Conceptos básicos y herramientas necesarias',
        content: 'Contenido de la lección...',
        duration_minutes: 45,
        order_index: 1,
        is_preview: true,
        completed: true,
        content_type: 'video'
      }
    ]
  },

  // Progreso del estudiante
  progress: [
    {
      course_id: '1',
      lesson_id: '1',
      student_id: '1',
      completed_at: new Date('2024-01-21'),
      time_spent_minutes: 35
    },
    {
      course_id: '1',
      lesson_id: '2',
      student_id: '1',
      completed_at: new Date('2024-01-25'),
      time_spent_minutes: 50
    }
  ],

  // Tareas
  assignments: [
    {
      id: '1',
      course_id: '1',
      title: 'Calculadora Básica',
      description: 'Crear una calculadora con operaciones básicas',
      file_types_allowed: 'js,html,css',
      max_file_size_mb: 5,
      due_date: new Date('2024-02-15'),
      points_possible: 100,
      created_at: new Date('2024-01-22'),
      lesson_title: 'Funciones'
    },
    {
      id: '2',
      course_id: '1',
      title: 'Validación de Formularios',
      description: 'Implementar validación completa de formularios',
      file_types_allowed: 'js,html,css',
      max_file_size_mb: 5,
      due_date: new Date('2024-02-28'),
      points_possible: 150,
      created_at: new Date('2024-01-25'),
      lesson_title: 'DOM y Eventos'
    }
  ],

  // Entregas del estudiante
  submissions: [
    {
      id: '1',
      assignment_id: '1',
      student_id: '1',
      file_name: 'calculadora.zip',
      file_path: '/uploads/submissions/calculadora.zip',
      submitted_at: new Date('2024-02-10'),
      status: 'submitted',
      assignment_title: 'Calculadora Básica',
      score: 85,
      max_score: 100,
      feedback: 'Excelente trabajo, solo algunos ajustes menores',
      grade_status: 'approved'
    }
  ],

  // Reseñas del estudiante
  reviews: [
    {
      id: '1',
      course_id: '1',
      student_id: '1',
      rating: 5,
      comment: 'Excelente curso, muy bien estructurado',
      created_at: new Date('2024-02-01'),
      student_name: 'Juan Pérez'
    }
  ],

  // Actividad reciente del estudiante
  activity: [
    {
      id: '1',
      student_id: '1',
      activity_type: 'lesson_completed',
      course_id: '1',
      lesson_id: '2',
      description: 'Completó la lección "Variables y Tipos de Datos"',
      created_at: new Date('2024-01-25T14:30:00')
    },
    {
      id: '2',
      student_id: '1',
      activity_type: 'assignment_submitted',
      course_id: '1',
      assignment_id: '1',
      description: 'Entregó la tarea "Calculadora Básica"',
      created_at: new Date('2024-02-10T16:45:00')
    },
    {
      id: '3',
      student_id: '1',
      activity_type: 'course_enrolled',
      course_id: '2',
      description: 'Se inscribió en "React y Next.js"',
      created_at: new Date('2024-02-01T10:15:00')
    }
  ],

  // Estadísticas del estudiante
  stats: {
    total_courses: 2,
    active_courses: 2,
    completed_courses: 0,
    total_lessons: 15,
    completed_lessons: 2,
    total_assignments: 5,
    submitted_assignments: 1,
    average_grade: 85,
    total_study_time: 145, // minutos
    enrollment_date: new Date('2024-01-20')
  }
};

// Función para simular delay de API
export const simulateApiDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));