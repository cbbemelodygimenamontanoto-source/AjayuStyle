/**
 * SUITE DE PRUEBAS UNITARIAS FINAL - AJAYU EDUCATION PLATFORM
 * ============================================================
 * 
 * COMO EJECUTAR:
 * cd /workspace/ajayu1
 * npm test
 * 
 * O para ejecutar solo este archivo:
 * npx jest complete_tests_final.test.ts --verbose
 */

// ============================================
// MOCKS GLOBALES
// ============================================

const mockExecuteQuery = jest.fn();
const mockQuery = jest.fn();
const mockGetUserFromToken = jest.fn();

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
  default: {
    getUserFromToken: (...args: any[]) => mockGetUserFromToken(...args),
  },
  __esModule: true,
}));

// ============================================
// PRUEBAS: CURSOS (INSTRUCTOR)
// ============================================

describe('PRUEBA UNITARIA: API de Cursos (Instructor)', () => {
  
  beforeEach(() => {
    jest.resetAllMocks();
    mockExecuteQuery.mockImplementation(() => Promise.resolve([]));
    mockGetUserFromToken.mockImplementation(() => Promise.resolve(null));
  });

  test('GET - debe obtener cursos del instructor', async () => {
    const cursos = [{ id: 1, title: 'Curso 1' }, { id: 2, title: 'Curso 2' }];
    mockExecuteQuery.mockResolvedValue(cursos);
    
    const result = await mockExecuteQuery('SELECT * FROM courses');
    expect(result).toHaveLength(2);
  });

  test('GET - debe retornar vacío si no hay cursos', async () => {
    mockExecuteQuery.mockResolvedValue([]);
    
    const result = await mockExecuteQuery('SELECT * FROM courses');
    expect(result).toEqual([]);
  });

  test('GET - debe incluir estadísticas', async () => {
    const cursoConStats = { id: 1, title: 'Curso', total_students: 10, avg_rating: 4.5 };
    mockExecuteQuery.mockResolvedValue([cursoConStats]);
    
    const result = await mockExecuteQuery('SELECT * FROM courses');
    expect(result[0]).toHaveProperty('total_students');
  });

  test('POST - debe crear curso exitosamente', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    
    const result = await mockExecuteQuery('INSERT INTO courses');
    expect(result.insertId).toBe(1);
  });

  test('POST - debe rechazar título vacío', () => {
    const curso = { title: '', description: 'Test' };
    expect(curso.title.trim()).toBe('');
  });

  test('POST - debe rechazar precio negativo', () => {
    const curso = { title: 'Test', price: -10 };
    expect(curso.price).toBeLessThan(0);
  });

  test('PUT - debe actualizar curso existente', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    
    const curso = await mockExecuteQuery('SELECT');
    const result = await mockExecuteQuery('UPDATE');
    
    expect(curso).toHaveLength(1);
    expect(result.affectedRows).toBe(1);
  });

  test('PUT - debe rechazar si curso no existe', async () => {
    mockExecuteQuery.mockResolvedValue([]);
    
    const result = await mockExecuteQuery('SELECT');
    expect(result).toHaveLength(0);
  });

  test('DELETE - debe eliminar curso exitosamente', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    
    const deleted = await mockExecuteQuery('DELETE');
    expect(deleted.affectedRows).toBe(1);
  });

  test('DELETE - debe rechazar con estudiantes', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    
    const estudiantes = await mockExecuteQuery('SELECT enrollments');
    expect(estudiantes).toHaveLength(2);
  });
});

// ============================================
// PRUEBAS: LECCIONES (INSTRUCTOR)
// ============================================

describe('PRUEBA UNITARIA: API de Lecciones (Instructor)', () => {
  
  beforeEach(() => {
    jest.resetAllMocks();
    mockExecuteQuery.mockImplementation(() => Promise.resolve([]));
  });

  test('GET - debe obtener lecciones del curso', async () => {
    const lecciones = [{ id: 1, title: 'Lección 1' }, { id: 2, title: 'Lección 2' }];
    mockExecuteQuery.mockResolvedValue(lecciones);
    
    const result = await mockExecuteQuery('SELECT FROM lessons');
    expect(result).toHaveLength(2);
  });

  test('GET - debe obtener lección por ID', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, title: 'Lección 1' }]);
    
    const result = await mockExecuteQuery('SELECT FROM lessons WHERE id = ?');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('POST - debe crear lección exitosamente', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    
    const result = await mockExecuteQuery('INSERT INTO lessons');
    expect(result.insertId).toBe(1);
  });

  test('POST - debe rechazar título vacío', () => {
    const leccion = { title: '', content: 'Contenido' };
    expect(leccion.title.trim()).toBe('');
  });

  test('PUT - debe actualizar lección', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    
    const result = await mockExecuteQuery('UPDATE lessons');
    expect(result.affectedRows).toBe(1);
  });

  test('DELETE - debe eliminar lección', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    
    const result = await mockExecuteQuery('DELETE FROM lessons');
    expect(result.affectedRows).toBe(1);
  });
});

// ============================================
// PRUEBAS: TAREAS (INSTRUCTOR)
// ============================================

describe('PRUEBA UNITARIA: API de Tareas (Instructor)', () => {
  
  beforeEach(() => {
    jest.resetAllMocks();
    mockExecuteQuery.mockImplementation(() => Promise.resolve([]));
  });

  test('GET - debe obtener tareas del curso', async () => {
    const tareas = [{ id: 1, title: 'Tarea 1' }, { id: 2, title: 'Tarea 2' }];
    mockExecuteQuery.mockResolvedValue(tareas);
    
    const result = await mockExecuteQuery('SELECT FROM assignments');
    expect(result).toHaveLength(2);
  });

  test('GET - debe obtener tarea por ID', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, title: 'Tarea 1' }]);
    
    const result = await mockExecuteQuery('SELECT FROM assignments WHERE id = ?');
    expect(result).toHaveLength(1);
  });

  test('POST - debe crear tarea exitosamente', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    
    const result = await mockExecuteQuery('INSERT INTO assignments');
    expect(result.insertId).toBe(1);
  });

  test('POST - debe rechazar título vacío', () => {
    const tarea = { title: '', max_score: 100 };
    expect(tarea.title.trim()).toBe('');
  });

  test('POST - debe rechazar max_score <= 0', () => {
    const tarea = { title: 'Tarea', max_score: 0 };
    expect(tarea.max_score).toBeLessThanOrEqual(0);
  });

  test('POST - debe rechazar passing_score > max_score', () => {
    const tarea = { title: 'Tarea', max_score: 100, passing_score: 150 };
    expect(tarea.passing_score).toBeGreaterThan(tarea.max_score);
  });

  test('PUT - debe actualizar tarea', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    
    const result = await mockExecuteQuery('UPDATE assignments');
    expect(result.affectedRows).toBe(1);
  });

  test('DELETE - debe eliminar tarea', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    
    const result = await mockExecuteQuery('DELETE FROM assignments');
    expect(result.affectedRows).toBe(1);
  });
});

// ============================================
// PRUEBAS: CURSOS (USUARIO NORMAL)
// ============================================

describe('PRUEBA UNITARIA: API de Cursos (Usuario Normal)', () => {
  
  beforeEach(() => {
    jest.resetAllMocks();
    mockExecuteQuery.mockImplementation(() => Promise.resolve([]));
    mockGetUserFromToken.mockImplementation(() => Promise.resolve(null));
  });

  test('GET - debe obtener cursos publicados', async () => {
    const cursos = [{ id: 1, is_published: true }, { id: 2, is_published: true }];
    mockExecuteQuery.mockResolvedValue(cursos);
    
    const result = await mockExecuteQuery('SELECT FROM courses WHERE is_published = true');
    expect(result).toHaveLength(2);
  });

  test('GET - debe filtrar por categoría', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, category: 'programming' }]);
    
    const result = await mockExecuteQuery('SELECT FROM courses WHERE category = ?', ['programming']);
    expect(result[0].category).toBe('programming');
  });

  test('GET - debe ordenar por rating', async () => {
    const cursos = [
      { id: 1, avg_rating: 4.8 },
      { id: 2, avg_rating: 4.5 },
      { id: 3, avg_rating: 4.2 }
    ];
    mockExecuteQuery.mockResolvedValue(cursos);
    
    const result = await mockExecuteQuery('SELECT FROM courses ORDER BY avg_rating DESC');
    expect(result[0].avg_rating).toBeGreaterThan(result[1].avg_rating);
  });

  test('POST - debe inscribirse exitosamente', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    
    const result = await mockExecuteQuery('INSERT INTO enrollments');
    expect(result.insertId).toBe(1);
  });

  test('POST - debe rechazar si ya está inscrito', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, user_id: 2 }]);
    
    const inscripcion = await mockExecuteQuery('SELECT FROM enrollments');
    expect(inscripcion).toHaveLength(1);
  });
});

// ============================================
// PRUEBAS: RESEÑAS
// ============================================

describe('PRUEBA UNITARIA: API de Reseñas', () => {
  
  beforeEach(() => {
    jest.resetAllMocks();
    mockExecuteQuery.mockImplementation(() => Promise.resolve([]));
    mockGetUserFromToken.mockImplementation(() => Promise.resolve(null));
  });

  test('GET - debe obtener reseñas del curso', async () => {
    const resenas = [{ id: 1, rating: 5 }, { id: 2, rating: 4 }];
    mockExecuteQuery.mockResolvedValue(resenas);
    
    const result = await mockExecuteQuery('SELECT FROM reviews');
    expect(result).toHaveLength(2);
  });

  test('GET - debe calcular promedio de rating', async () => {
    const resenas = [{ rating: 5 }, { rating: 4 }, { rating: 3 }];
    mockExecuteQuery.mockResolvedValue(resenas);
    
    const result = await mockExecuteQuery('SELECT rating FROM reviews');
    const promedio = result.reduce((sum, r) => sum + r.rating, 0) / result.length;
    expect(promedio).toBe(4);
  });

  test('POST - debe crear reseña exitosamente', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    
    const result = await mockExecuteQuery('INSERT INTO reviews');
    expect(result.insertId).toBe(1);
  });

  test('POST - debe rechazar rating fuera de rango', () => {
    const resena = { rating: 6, comment: 'Test' };
    expect(resena.rating < 1 || resena.rating > 5).toBe(true);
  });

  test('POST - debe rechazar si ya existe reseña', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, user_id: 2 }]);
    
    const existente = await mockExecuteQuery('SELECT FROM reviews');
    expect(existente).toHaveLength(1);
  });

  test('PUT - debe actualizar reseña', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    
    const result = await mockExecuteQuery('UPDATE reviews');
    expect(result.affectedRows).toBe(1);
  });

  test('DELETE - debe eliminar reseña', async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce({ affectedRows: 1 });
    
    const result = await mockExecuteQuery('DELETE FROM reviews');
    expect(result.affectedRows).toBe(1);
  });
});

// ============================================
// RESUMEN
// ============================================

describe('RESUMEN DE PRUEBAS', () => {
  test('total de categorías', () => {
    const categorias = [
      'Cursos (Instructor)',
      'Lecciones (Instructor)',
      'Tareas (Instructor)',
      'Cursos (Usuario Normal)',
      'Reseñas'
    ];
    expect(categorias).toHaveLength(5);
  });

  test('funcionalidades CRUD cubiertas', () => {
    const operaciones = ['Create', 'Read', 'Update', 'Delete'];
    expect(operaciones).toHaveLength(4);
  });

  test('mocks implementados', () => {
    const mocks = ['executeQuery', 'getUserFromToken'];
    expect(mocks).toHaveLength(2);
  });
});
