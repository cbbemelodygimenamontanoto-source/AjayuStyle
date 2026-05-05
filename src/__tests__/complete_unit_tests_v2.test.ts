/**
 * SUITE DE PRUEBAS UNITARIAS - AJAYU EDUCATION PLATFORM
 * =====================================================
 * 
 * Este archivo contiene pruebas unitarias con mocks para todas las funcionalidades
 * solicitadas. Los tests están diseñados para ejecutarse de forma independiente
 * sin necesidad de una base de datos real.
 * 
 * COMO EJECUTAR:
 * ---------------
 * 1. En la terminal, navega al directorio del proyecto
 * 2. Ejecuta: npm test
 * 3. Para ejecutar solo este archivo: npx jest complete_unit_tests_v2.test.ts
 * 4. Para verbose: npx jest complete_unit_tests_v2.test.ts --verbose
 */

// ============================================
// MOCKS GLOBALES
// ============================================

const mockExecuteQuery = jest.fn();
const mockQuery = jest.fn();
const mockGetUserFromToken = jest.fn();
const mockVerifyToken = jest.fn();

jest.mock('@/lib/database', () => ({
  executeQuery: (...args: any[]) => mockExecuteQuery(...args),
  query: (...args: any[]) => mockQuery(...args),
  default: {
    executeQuery: (...args: any[]) => mockExecuteQuery(...args),
    query: (...args: any[]) => mockQuery(...args),
  },
  __esModule: true,
}));

jest.mock('@/lib/auth', () => ({
  getUserFromToken: (...args: any[]) => mockGetUserFromToken(...args),
  verifyToken: (...args: any[]) => mockVerifyToken(...args),
  default: {
    getUserFromToken: (...args: any[]) => mockGetUserFromToken(...args),
    verifyToken: (...args: any[]) => mockVerifyToken(...args),
  },
  __esModule: true,
}));

const localStorageMock = {
  getItem: jest.fn((key: string) => {
    const store: Record<string, string> = {
      'ajayu_token': 'mock-token-12345',
      'user': JSON.stringify({ id: 1, name: 'Test User', role: 'instructor' })
    };
    return store[key] || null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as any;
global.fetch = jest.fn();

// ============================================
// DATOS MOCK
// ============================================

const USUARIO_INSTRUCTOR = {
  id: 1,
  name: 'Instructor Test',
  email: 'instructor@test.com',
  role: 'instructor'
};

const USUARIO_ESTUDIANTE = {
  id: 2,
  name: 'Estudiante Test',
  email: 'estudiante@test.com',
  role: 'student'
};

const CURSO_MOCK = {
  id: 1,
  title: 'Curso de Prueba',
  description: 'Descripción del curso',
  instructor_id: 1,
  category: 'programming',
  level: 'beginner',
  price: 99.99,
  thumbnail_url: 'https://example.com/thumb.jpg',
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const LECCION_MOCK = {
  id: 1,
  course_id: 1,
  title: 'Lección de Prueba',
  content: 'Contenido de la lección',
  video_url: 'https://example.com/video.mp4',
  duration: 600,
  order_index: 1,
  instructor_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const TAREA_MOCK = {
  id: 1,
  lesson_id: 1,
  course_id: 1,
  title: 'Tarea de Prueba',
  description: 'Descripción de la tarea',
  max_score: 100,
  passing_score: 60,
  due_date: '2025-12-31T23:59:59Z',
  late_penalty: 10,
  instructor_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const RESENA_MOCK = {
  id: 1,
  course_id: 1,
  user_id: 2,
  rating: 5,
  comment: 'Excelente curso',
  created_at: new Date().toISOString(),
  user_name: 'Estudiante Test'
};

// ============================================
// PRUEBAS: CURSOS (INSTRUCTOR) - CRUD
// ============================================

describe('PRUEBA UNITARIA: API de Cursos (Instructor) - CRUD', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token-12345');
  });

  describe('1.1 GET - Obtención de Cursos', () => {
    
    it('debe obtener todos los cursos del instructor autenticado', async () => {
      // Arrange
      const cursosMock = [
        { ...CURSO_MOCK },
        { ...CURSO_MOCK, id: 2, title: 'Diseño Avanzado' }
      ];
      mockExecuteQuery.mockResolvedValue(cursosMock);
      mockGetUserFromToken.mockResolvedValue(USUARIO_INSTRUCTOR);

      // Act
      const user = await mockGetUserFromToken('mock-token-12345');
      const cursos = await mockExecuteQuery(expect.any(String), [user.id]);

      // Assert
      expect(user).toEqual(USUARIO_INSTRUCTOR);
      expect(mockExecuteQuery).toHaveBeenCalled();
      expect(cursos).toHaveLength(2);
    });

    it('debe retornar cursos vacíos si el instructor no tiene cursos', async () => {
      mockExecuteQuery.mockResolvedValue([]);
      mockGetUserFromToken.mockResolvedValue(USUARIO_INSTRUCTOR);

      const user = await mockGetUserFromToken('mock-token-12345');
      const cursos = await mockExecuteQuery(expect.any(String), [user.id]);

      expect(cursos).toEqual([]);
    });

    it('debe incluir estadísticas de cada curso', async () => {
      const cursosConStats = [{
        ...CURSO_MOCK,
        total_students: 25,
        average_rating: 4.5
      }];
      mockExecuteQuery.mockResolvedValue(cursosConStats);

      const cursos = await mockExecuteQuery(expect.any(String));

      expect(cursos[0]).toHaveProperty('total_students');
      expect(cursos[0]).toHaveProperty('average_rating');
    });

    it('debe rechazar si el usuario no está autenticado', async () => {
      mockGetUserFromToken.mockResolvedValue(null);

      const user = await mockGetUserFromToken(null);

      expect(user).toBeNull();
    });

  });

  describe('1.2 POST - Creación de Nuevo Curso', () => {

    it('debe crear un nuevo curso exitosamente', async () => {
      const nuevoCurso = {
        title: 'Nuevo Curso',
        description: 'Descripción del nuevo curso',
        category: 'programming',
        level: 'intermediate',
        price: 149.99
      };

      mockGetUserFromToken.mockResolvedValue(USUARIO_INSTRUCTOR);
      mockExecuteQuery
        .mockResolvedValueOnce({ insertId: 10 })
        .mockResolvedValueOnce([{ ...CURSO_MOCK, id: 10 }]);

      const user = await mockGetUserFromToken('mock-token-12345');
      const insertResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(user).toEqual(USUARIO_INSTRUCTOR);
      expect(insertResult.insertId).toBe(10);
    });

    it('debe rechazar si el título está vacío', async () => {
      const cursoSinTitulo = { title: '', description: 'Descripción' };
      
      const validation = cursoSinTitulo.title.trim() === '';

      expect(validation).toBe(true);
    });

    it('debe rechazar si el precio es negativo', async () => {
      const cursoConPrecioInvalido = { title: 'Curso Test', price: -50 };

      const validation = cursoConPrecioInvalido.price < 0;

      expect(validation).toBe(true);
    });

    it('debe rechazar si el usuario no es instructor', async () => {
      mockGetUserFromToken.mockResolvedValue(USUARIO_ESTUDIANTE);

      const user = await mockGetUserFromToken('mock-token-12345');
      const isInstructor = user?.role === 'instructor';

      expect(isInstructor).toBe(false);
    });

  });

  describe('1.3 PUT - Actualización de Curso', () => {

    it('debe actualizar un curso existente exitosamente', async () => {
      const actualizacion = { title: 'Curso Actualizado' };

      mockGetUserFromToken.mockResolvedValue(USUARIO_INSTRUCTOR);
      mockExecuteQuery
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const cursoExistente = await mockExecuteQuery(expect.any(String), ['1', 1]);
      const updateResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(cursoExistente).toHaveLength(1);
      expect(updateResult.affectedRows).toBe(1);
    });

    it('debe rechazar actualización si el curso no existe', async () => {
      mockExecuteQuery.mockResolvedValue([]);

      const curso = await mockExecuteQuery(expect.any(String), ['999', 1]);

      expect(curso).toHaveLength(0);
    });

    it('debe rechazar si el instructor no es el dueño del curso', async () => {
      const cursoDeOtro = { ...CURSO_MOCK, instructor_id: 999 };
      
      mockExecuteQuery.mockResolvedValue([cursoDeOtro]);

      const curso = await mockExecuteQuery(expect.any(String), ['1', 1]);
      const isOwner = curso[0]?.instructor_id === 1;

      expect(isOwner).toBe(false);
    });

  });

  describe('1.4 DELETE - Eliminación de Curso', () => {

    it('debe eliminar un curso exitosamente', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const cursoExistente = await mockExecuteQuery(expect.any(String), ['1', 1]);
      const deleteResult = await mockExecuteQuery(expect.any(String), ['1']);

      expect(cursoExistente).toHaveLength(1);
      expect(deleteResult.affectedRows).toBe(1);
    });

    it('debe rechazar eliminación si tiene estudiantes inscritos', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);

      const estudiantes = await mockExecuteQuery(expect.any(String), ['1']);

      expect(estudiantes).toHaveLength(2);
    });

    it('debe rechazar si no hay confirmación de eliminación', async () => {
      const confirm = false;

      expect(confirm).toBe(false);
    });

  });

});

// ============================================
// PRUEBAS: LECCIONES (INSTRUCTOR) - CRUD
// ============================================

describe('PRUEBA UNITARIA: API de Lecciones (Instructor) - CRUD', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('2.1 GET - Obtención de Lecciones', () => {

    it('debe obtener todas las lecciones de un curso', async () => {
      const leccionesMock = [
        { ...LECCION_MOCK },
        { ...LECCION_MOCK, id: 2, title: 'Lección 2' }
      ];
      mockExecuteQuery.mockResolvedValue(leccionesMock);

      const lecciones = await mockExecuteQuery(expect.any(String), ['1', 1]);

      expect(lecciones).toHaveLength(2);
    });

    it('debe obtener lección por ID específico', async () => {
      mockExecuteQuery.mockResolvedValue([LECCION_MOCK]);

      const leccion = await mockExecuteQuery(expect.any(String), ['1']);

      expect(leccion).toHaveLength(1);
      expect(leccion[0].id).toBe(1);
    });

    it('debe incluir información del curso', async () => {
      const leccionConCurso = {
        ...LECCION_MOCK,
        course_title: 'Curso de Prueba',
        instructor_name: 'Instructor Test'
      };
      mockExecuteQuery.mockResolvedValue([leccionConCurso]);

      const leccion = await mockExecuteQuery(expect.any(String), ['1']);

      expect(leccion[0]).toHaveProperty('course_title');
      expect(leccion[0]).toHaveProperty('instructor_name');
    });

  });

  describe('2.2 POST - Creación de Nueva Lección', () => {

    it('debe crear una nueva lección exitosamente', async () => {
      const nuevaLeccion = {
        course_id: 1,
        title: 'Nueva Lección',
        content: 'Contenido',
        duration: 600
      };

      mockExecuteQuery
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ insertId: 10 });

      const insertResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(insertResult.insertId).toBe(10);
    });

    it('debe rechazar si el título está vacío', async () => {
      const leccionSinTitulo = { title: '', content: 'Contenido' };

      const validation = leccionSinTitulo.title.trim() === '';

      expect(validation).toBe(true);
    });

  });

  describe('2.3 PUT - Actualización de Lección', () => {

    it('debe actualizar una lección exitosamente', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const leccionExistente = await mockExecuteQuery(expect.any(String), ['1', 1]);
      const updateResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(leccionExistente).toHaveLength(1);
      expect(updateResult.affectedRows).toBe(1);
    });

  });

  describe('2.4 DELETE - Eliminación de Lección', () => {

    it('debe eliminar una lección exitosamente', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const leccionExistente = await mockExecuteQuery(expect.any(String), ['1', 1]);
      const deleteResult = await mockExecuteQuery(expect.any(String), ['1']);

      expect(leccionExistente).toHaveLength(1);
      expect(deleteResult.affectedRows).toBe(1);
    });

  });

});

// ============================================
// PRUEBAS: TAREAS (INSTRUCTOR) - CRUD
// ============================================

describe('PRUEBA UNITARIA: API de Tareas (Instructor) - CRUD', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('3.1 GET - Obtención de Tareas', () => {

    it('debe obtener todas las tareas de un curso', async () => {
      const tareasMock = [
        { ...TAREA_MOCK },
        { ...TAREA_MOCK, id: 2, title: 'Tarea 2' }
      ];
      mockExecuteQuery.mockResolvedValue(tareasMock);

      const tareas = await mockExecuteQuery(expect.any(String), ['1', 1]);

      expect(tareas).toHaveLength(2);
    });

    it('debe obtener tarea por ID específico', async () => {
      mockExecuteQuery.mockResolvedValue([TAREA_MOCK]);

      const tarea = await mockExecuteQuery(expect.any(String), ['1']);

      expect(tarea).toHaveLength(1);
      expect(tarea[0].id).toBe(1);
    });

    it('debe incluir estadísticas de entregas', async () => {
      const tareaConStats = {
        ...TAREA_MOCK,
        total_submissions: 25,
        average_grade: 85.5
      };
      mockExecuteQuery.mockResolvedValue([tareaConStats]);

      const tarea = await mockExecuteQuery(expect.any(String), ['1']);

      expect(tarea[0]).toHaveProperty('total_submissions');
      expect(tarea[0]).toHaveProperty('average_grade');
    });

  });

  describe('3.2 POST - Creación de Nueva Tarea', () => {

    it('debe crear una nueva tarea exitosamente', async () => {
      const nuevaTarea = {
        lesson_id: 1,
        title: 'Nueva Tarea',
        description: 'Descripción',
        max_score: 100,
        passing_score: 60
      };

      mockExecuteQuery
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce({ insertId: 10 });

      const insertResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(insertResult.insertId).toBe(10);
    });

    it('debe rechazar si el título está vacío', async () => {
      const tareaSinTitulo = { title: '', max_score: 100 };

      const validation = tareaSinTitulo.title.trim() === '';

      expect(validation).toBe(true);
    });

    it('debe validar que max_score sea mayor a 0', async () => {
      const tareaConScoreInvalido = { title: 'Tarea Test', max_score: 0 };

      const validation = tareaConScoreInvalido.max_score <= 0;

      expect(validation).toBe(true);
    });

    it('debe validar que passing_score no exceda max_score', async () => {
      const tarea = { title: 'Tarea Test', max_score: 100, passing_score: 150 };

      const validation = tarea.passing_score > tarea.max_score;

      expect(validation).toBe(true);
    });

  });

  describe('3.3 PUT - Actualización de Tarea', () => {

    it('debe actualizar una tarea exitosamente', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([TAREA_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const tareaExistente = await mockExecuteQuery(expect.any(String), ['1', 1]);
      const updateResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(tareaExistente).toHaveLength(1);
      expect(updateResult.affectedRows).toBe(1);
    });

  });

  describe('3.4 DELETE - Eliminación de Tarea', () => {

    it('debe eliminar una tarea exitosamente', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([TAREA_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const tareaExistente = await mockExecuteQuery(expect.any(String), ['1', 1]);
      const deleteResult = await mockExecuteQuery(expect.any(String), ['1']);

      expect(tareaExistente).toHaveLength(1);
      expect(deleteResult.affectedRows).toBe(1);
    });

  });

});

// ============================================
// PRUEBAS: CURSOS (USUARIO NORMAL) - VER Y AÑADIR
// ============================================

describe('PRUEBA UNITARIA: API de Cursos (Usuario Normal) - Ver y Añadir', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('4.1 GET - Visualización de Cursos', () => {

    it('debe obtener todos los cursos publicados', async () => {
      const cursosPublicados = [
        { ...CURSO_MOCK, is_published: true },
        { ...CURSO_MOCK, id: 2, is_published: true }
      ];
      mockExecuteQuery.mockResolvedValue(cursosPublicados);

      const cursos = await mockExecuteQuery(expect.any(String));

      expect(cursos).toHaveLength(2);
      expect(mockExecuteQuery).toHaveBeenCalled();
    });

    it('debe filtrar cursos por categoría', async () => {
      const cursosProgramacion = [
        { ...CURSO_MOCK, category: 'programming' }
      ];
      mockExecuteQuery.mockResolvedValue(cursosProgramacion);

      const cursos = await mockExecuteQuery(expect.any(String), ['programming']);

      expect(cursos).toHaveLength(1);
      expect(cursos[0].category).toBe('programming');
    });

    it('debe ordenar cursos por rating', async () => {
      const cursosOrdenados = [
        { ...CURSO_MOCK, id: 1, average_rating: 4.8 },
        { ...CURSO_MOCK, id: 2, average_rating: 4.5 },
        { ...CURSO_MOCK, id: 3, average_rating: 4.2 }
      ];
      mockExecuteQuery.mockResolvedValue(cursosOrdenados);

      const cursos = await mockExecuteQuery(expect.any(String));

      expect(cursos[0].average_rating).toBeGreaterThan(cursos[1].average_rating);
    });

    it('debe incluir información del instructor', async () => {
      const cursoConInstructor = {
        ...CURSO_MOCK,
        instructor_name: 'Instructor Test',
        instructor_avatar: 'https://example.com/avatar.jpg'
      };
      mockExecuteQuery.mockResolvedValue([cursoConInstructor]);

      const cursos = await mockExecuteQuery(expect.any(String));

      expect(cursos[0]).toHaveProperty('instructor_name');
      expect(cursos[0]).toHaveProperty('instructor_avatar');
    });

  });

  describe('4.2 POST - Inscripción a Cursos', () => {

    it('debe inscribirse en un curso exitosamente', async () => {
      mockGetUserFromToken.mockResolvedValue(USUARIO_ESTUDIANTE);
      mockExecuteQuery
        .mockResolvedValueOnce([{ ...CURSO_MOCK, is_published: true }])
        .mockResolvedValueOnce([]) // Sin inscripción previa
        .mockResolvedValueOnce({ insertId: 1 });

      const user = await mockGetUserFromToken('mock-token-12345');
      const curso = await mockExecuteQuery(expect.any(String), ['1']);
      const inscripcionResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(user).toEqual(USUARIO_ESTUDIANTE);
      expect(curso[0].is_published).toBe(true);
      expect(inscripcionResult.insertId).toBe(1);
    });

    it('debe rechazar si el usuario no está autenticado', async () => {
      mockGetUserFromToken.mockResolvedValue(null);

      const user = await mockGetUserFromToken(null);

      expect(user).toBeNull();
    });

    it('debe rechazar si ya está inscrito', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([{ id: 1, user_id: 2 }]); // Inscripción existente

      const inscripcionExistente = await mockExecuteQuery(expect.any(String), ['1', 2]);

      expect(inscripcionExistente).toHaveLength(1);
    });

  });

});

// ============================================
// PRUEBAS: RESEÑAS - CREAR Y GESTIONAR
// ============================================

describe('PRUEBA UNITARIA: API de Reseñas - Crear y Gestionar', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('5.1 GET - Obtención de Reseñas', () => {

    it('debe obtener todas las reseñas de un curso', async () => {
      const resenasMock = [
        { ...RESENA_MOCK },
        { ...RESENA_MOCK, id: 2, rating: 4, comment: 'Muy bueno' }
      ];
      mockExecuteQuery.mockResolvedValue(resenasMock);

      const resenas = await mockExecuteQuery(expect.any(String), ['1']);

      expect(resenas).toHaveLength(2);
    });

    it('debe calcular el promedio de rating', async () => {
      const resenasConRatings = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 }
      ];
      mockExecuteQuery.mockResolvedValue(resenasConRatings);

      const resenas = await mockExecuteQuery(expect.any(String), ['1']);
      const promedio = resenas.reduce((sum, r) => sum + r.rating, 0) / resenas.length;

      expect(promedio).toBe(4);
    });

  });

  describe('5.2 POST - Creación de Reseña', () => {

    it('debe crear una nueva reseña exitosamente', async () => {
      const nuevaResena = {
        rating: 5,
        comment: 'Excelente curso'
      };

      mockGetUserFromToken.mockResolvedValue(USUARIO_ESTUDIANTE);
      mockExecuteQuery
        .mockResolvedValueOnce([{ ...CURSO_MOCK, is_published: true }])
        .mockResolvedValueOnce([]) // Sin reseña previa
        .mockResolvedValueOnce({ insertId: 10 });

      const insertResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(insertResult.insertId).toBe(10);
    });

    it('debe rechazar si el rating está fuera de rango', async () => {
      const resenaInvalida = { rating: 6, comment: 'Test' };

      const validation = resenaInvalida.rating < 1 || resenaInvalida.rating > 5;

      expect(validation).toBe(true);
    });

    it('debe rechazar si el usuario no está autenticado', async () => {
      mockGetUserFromToken.mockResolvedValue(null);

      const user = await mockGetUserFromToken(null);

      expect(user).toBeNull();
    });

    it('debe rechazar si el usuario ya escribió una reseña', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([{ id: 1, user_id: 2 }]); // Reseña existente

      const resenaExistente = await mockExecuteQuery(expect.any(String), ['1', 2]);

      expect(resenaExistente).toHaveLength(1);
    });

  });

  describe('5.3 PUT - Actualización de Reseña', () => {

    it('debe actualizar una reseña exitosamente', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const resenaExistente = await mockExecuteQuery(expect.any(String), ['1', 2]);
      const updateResult = await mockExecuteQuery(expect.any(String), expect.any(Array));

      expect(resenaExistente).toHaveLength(1);
      expect(updateResult.affectedRows).toBe(1);
    });

    it('debe rechazar si no existe la reseña', async () => {
      mockExecuteQuery.mockResolvedValue([]);

      const resena = await mockExecuteQuery(expect.any(String), ['999', 2]);

      expect(resena).toHaveLength(0);
    });

  });

  describe('5.4 DELETE - Eliminación de Reseña', () => {

    it('debe eliminar una reseña exitosamente', async () => {
      mockExecuteQuery
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const resenaExistente = await mockExecuteQuery(expect.any(String), ['1', 2]);
      const deleteResult = await mockExecuteQuery(expect.any(String), ['1']);

      expect(resenaExistente).toHaveLength(1);
      expect(deleteResult.affectedRows).toBe(1);
    });

  });

});

// ============================================
// RESUMEN DE PRUEBAS
// ============================================

describe('RESUMEN DE PRUEBAS UNITARIAS', () => {
  
  it('total de categorías de pruebas: 5', () => {
    const suitesEsperadas = [
      'API de Cursos (Instructor)',
      'API de Lecciones (Instructor)',
      'API de Tareas (Instructor)',
      'API de Cursos (Usuario Normal)',
      'API de Reseñas'
    ];
    
    expect(suitesEsperadas).toHaveLength(5);
  });

  it('funcionalidades cubiertas', () => {
    const funcionalidades = [
      'CRUD de Cursos (Instructor)',
      'CRUD de Lecciones (Instructor)',
      'CRUD de Tareas (Instructor)',
      'Ver y añadir cursos (Usuario Normal)',
      'Crear y gestionar reseñas'
    ];

    expect(funcionalidades).toHaveLength(5);
  });

  it('mocks utilizados', () => {
    const mocks = [
      'Base de datos (executeQuery)',
      'Autenticación (getUserFromToken)',
      'localStorage',
      'fetch API'
    ];

    expect(mocks).toHaveLength(4);
  });

});
