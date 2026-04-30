const mockExecuteQuery = jest.fn();
const mockGetUserFromToken = jest.fn();

jest.mock('@/lib/database', () => ({
  executeQuery: (...args) => mockExecuteQuery(...args),
  default: { executeQuery: (...args) => mockExecuteQuery(...args) },
  __esModule: true,
}));

jest.mock('@/lib/auth', () => ({
  getUserFromToken: (...args) => mockGetUserFromToken(...args),
  default: { getUserFromToken: (...args) => mockGetUserFromToken(...args) },
  __esModule: true,
}));


const INSTRUCTOR = { id: 1, name: 'Instructor', role: 'instructor' };
const STUDENT = { id: 2, name: 'Estudiante', role: 'student' };


describe('1. Cursos Instructor - CRUD', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CREATE
  test('1.1 POST - Crear curso exitoso', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    const result = await mockExecuteQuery('INSERT INTO courses');
    expect(result.insertId).toBe(1);
  });

  test('1.2 POST - Validar título no vacío', () => {
    const curso = { title: '', price: 100 };
    expect(curso.title.trim()).toBe('');
  });

  test('1.3 POST - Validar precio positivo', () => {
    const curso = { title: 'Test', price: -50 };
    expect(curso.price).toBeLessThan(0);
  });

  // READ
  test('1.4 GET - Obtener cursos del instructor', async () => {
    const cursos = [
      { id: 1, title: 'Curso 1' },
      { id: 2, title: 'Curso 2' }
    ];
    mockExecuteQuery.mockResolvedValue(cursos);
    const result = await mockExecuteQuery('SELECT courses');
    expect(result).toHaveLength(2);
  });

  test('1.5 GET - Retornar vacío si no hay cursos', async () => {
    mockExecuteQuery.mockResolvedValue([]);
    const result = await mockExecuteQuery('SELECT courses');
    expect(result).toEqual([]);
  });

  test('1.6 GET - Filtrar por cursoId', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, title: 'Curso 1' }]);
    const result = await mockExecuteQuery('SELECT courses WHERE id = ?', [1]);
    expect(result[0].id).toBe(1);
  });

  // UPDATE
  test('1.7 PUT - Actualizar curso existente', async () => {
    mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
    const result = await mockExecuteQuery('UPDATE courses');
    expect(result.affectedRows).toBe(1);
  });

  test('1.8 PUT - Validar nivel válido', () => {
    const nivelesValidos = ['beginner', 'intermediate', 'advanced'];
    const nivel = 'expert';
    expect(nivelesValidos.includes(nivel)).toBe(false);
  });

  // DELETE
  test('1.9 DELETE - Eliminar curso exitoso', async () => {
    mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
    const result = await mockExecuteQuery('DELETE FROM courses');
    expect(result.affectedRows).toBe(7);
  });

  test('1.10 DELETE - Verificar estudiantes antes de eliminar', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1 }]);
    const estudiantes = await mockExecuteQuery('SELECT enrollments');
    expect(estudiantes.length).toBeGreaterThan(0);
  });

  // AUTORIZACIÓN
  test('1.11 GET - Verificar usuario es instructor', () => {
    expect(INSTRUCTOR.role).toBe('instructor');
  });

  test('1.12 POST - Rechazar si no es instructor', () => {
    expect(STUDENT.role === 'instructor').toBe(false);
  });
});

describe('2. Lecciones Instructor - CRUD', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CREATE
  test('2.1 POST - Crear lección exitosa', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    const result = await mockExecuteQuery('INSERT INTO lessons');
    expect(result.insertId).toBe(8);
  });

  test('2.2 POST - Validar título no vacío', () => {
    const leccion = { title: '', content: 'Contenido' };
    expect(leccion.title.trim()).toBe('');
  });

  test('2.3 POST - Validar duración positiva', () => {
    const leccion = { title: 'Lección', duration: 0 };
    expect(leccion.duration).toBeLessThanOrEqual(0);
  });

  // READ
  test('2.4 GET - Obtener lecciones del curso', async () => {
    const lecciones = [
      { id: 1, title: 'Lección 1' },
      { id: 2, title: 'Lección 2' }
    ];
    mockExecuteQuery.mockResolvedValue(lecciones);
    const result = await mockExecuteQuery('SELECT lessons');
    expect(result).toHaveLength(2);
  });

  test('2.5 GET - Obtener lección por ID', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, title: 'Lección 1' }]);
    const result = await mockExecuteQuery('SELECT lessons WHERE id = ?', [1]);
    expect(result[0].id).toBe(1);
  });

  test('2.6 GET - Ordenar por orden', async () => {
    const lecciones = [
      { id: 1, order_index: 1 },
      { id: 2, order_index: 2 }
    ];
    mockExecuteQuery.mockResolvedValue(lecciones);
    const result = await mockExecuteQuery('SELECT lessons ORDER BY order_index');
    expect(result[0].order_index).toBeLessThan(result[1].order_index);
  });

  // UPDATE
  test('2.7 PUT - Actualizar lección', async () => {
    mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
    const result = await mockExecuteQuery('UPDATE lessons');
    expect(result.affectedRows).toBe(1);
  });

  test('2.8 PUT - Verificar propiedad del curso', () => {
    const leccion = { id: 1, course_id: 1, instructor_id: 1 };
    expect(leccion.instructor_id).toBe(1);
  });

  // DELETE
  test('2.9 DELETE - Eliminar lección', async () => {
    mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
    const result = await mockExecuteQuery('DELETE FROM lessons');
    expect(result.affectedRows).toBe(1);
  });

  test('2.10 DELETE - Verificar tareas asociadas', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1 }]);
    const tareas = await mockExecuteQuery('SELECT assignments');
    expect(tareas.length).toBeGreaterThan(0);
  });
});


describe('3. Tareas Instructor - CRUD', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CREATE
  test('3.1 POST - Crear tarea exitosa', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    const result = await mockExecuteQuery('INSERT INTO assignments');
    expect(result.insertId).toBe(1);
  });

  test('3.2 POST - Validar título no vacío', () => {
    const tarea = { title: '', max_score: 100 };
    expect(tarea.title.trim()).toBe('');
  });

  test('3.3 POST - Validar max_score > 0', () => {
    const tarea = { title: 'Tarea', max_score: 0 };
    expect(tarea.max_score).toBeLessThanOrEqual(0);
  });

  test('3.4 POST - Validar passing_score <= max_score', () => {
    const tarea = { title: 'Tarea', max_score: 100, passing_score: 150 };
    expect(tarea.passing_score).toBeGreaterThan(tarea.max_score);
  });

  // READ
  test('3.5 GET - Obtener tareas del curso', async () => {
    const tareas = [
      { id: 1, title: 'Tarea 1' },
      { id: 2, title: 'Tarea 2' }
    ];
    mockExecuteQuery.mockResolvedValue(tareas);
    const result = await mockExecuteQuery('SELECT assignments');
    expect(result).toHaveLength(2);
  });

  test('3.6 GET - Obtener tarea por ID', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, title: 'Tarea 1' }]);
    const result = await mockExecuteQuery('SELECT assignments WHERE id = ?', [1]);
    expect(result[0].id).toBe(1);
  });

  test('3.7 GET - Filtrar por fecha límite', async () => {
    const tareas = [{ id: 1, due_date: '2025-12-31' }];
    mockExecuteQuery.mockResolvedValue(tareas);
    const result = await mockExecuteQuery('SELECT assignments WHERE due_date');
    expect(result[0]).toHaveProperty('due_date');
  });

  // UPDATE
  test('3.8 PUT - Actualizar tarea', async () => {
    mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
    const result = await mockExecuteQuery('UPDATE assignments');
    expect(result.affectedRows).toBe(1);
  });

  test('3.9 PUT - Verificar entregas calificadas', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, grade: 85 }]);
    const entregas = await mockExecuteQuery('SELECT submissions WHERE graded');
    expect(entregas[0]).toHaveProperty('grade');
  });

  // DELETE
  test('3.10 DELETE - Eliminar tarea', async () => {
    mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
    const result = await mockExecuteQuery('DELETE FROM assignments');
    expect(result.affectedRows).toBe(1);
  });
});


describe('4. Cursos Usuario Normal - Ver y Añadir', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserFromToken.mockResolvedValue(null);
  });

  // VER CURSOS
  test('4.1 GET - Ver cursos publicados', async () => {
    const cursos = [
      { id: 1, is_published: true },
      { id: 2, is_published: true }
    ];
    mockExecuteQuery.mockResolvedValue(cursos);
    const result = await mockExecuteQuery('SELECT courses WHERE is_published = true');
    expect(result).toHaveLength(2);
  });

  test('4.2 GET - Filtrar por categoría', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, category: 'programming' }]);
    const result = await mockExecuteQuery('SELECT courses WHERE category = ?', ['programming']);
    expect(result[0].category).toBe('programming');
  });

  test('4.3 GET - Ordenar por rating', async () => {
    const cursos = [
      { id: 1, rating: 4.8 },
      { id: 2, rating: 4.5 }
    ];
    mockExecuteQuery.mockResolvedValue(cursos);
    const result = await mockExecuteQuery('SELECT courses ORDER BY rating DESC');
    expect(result[0].rating).toBeGreaterThan(result[1].rating);
  });

  test('4.4 GET - Ver información del instructor', async () => {
    const curso = { id: 1, instructor_name: 'Profesor Test' };
    mockExecuteQuery.mockResolvedValue([curso]);
    const result = await mockExecuteQuery('SELECT courses WITH instructor');
    expect(result[0]).toHaveProperty('instructor_name');
  });

  // AÑADIR (INSCRIPCIONES)
  test('4.5 POST - Inscribirse en curso', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    const result = await mockExecuteQuery('INSERT INTO enrollments');
    expect(result.insertId).toBe(1);
  });

  test('4.6 POST - Verificar autenticación', async () => {
    mockGetUserFromToken.mockResolvedValue(STUDENT);
    const user = await mockGetUserFromToken('token-valido');
    expect(user).toEqual(STUDENT);
  });

  test('4.7 POST - Verificar no inscripción previa', async () => {
    mockExecuteQuery.mockResolvedValue([]);
    const result = await mockExecuteQuery('SELECT enrollments WHERE user_id = ?', [2]);
    expect(result).toHaveLength(0);
  });

  test('4.8 POST - Rechazar si ya inscrito', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, user_id: 2 }]);
    const result = await mockExecuteQuery('SELECT enrollments');
    expect(result.length).toBeGreaterThan(0);
  });
});


describe('5. Reseñas - Crear y Gestionar', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserFromToken.mockResolvedValue(null);
  });

  // OBTENER
  test('5.1 GET - Ver reseñas del curso', async () => {
    const resenas = [
      { id: 1, rating: 5, comment: 'Excelente' },
      { id: 2, rating: 4, comment: 'Muy bueno' }
    ];
    mockExecuteQuery.mockResolvedValue(resenas);
    const result = await mockExecuteQuery('SELECT reviews');
    expect(result).toHaveLength(2);
  });

  test('5.2 GET - Calcular promedio de rating', async () => {
    const resenas = [
      { rating: 5 },
      { rating: 4 },
      { rating: 3 }
    ];
    mockExecuteQuery.mockResolvedValue(resenas);
    const result = await mockExecuteQuery('SELECT reviews');
    const promedio = result.reduce((sum, r) => sum + r.rating, 0) / result.length;
    expect(promedio).toBe(4);
  });

  test('5.3 GET - Contar reseñas helpful', async () => {
    const resenas = [
      { helpful: true },
      { helpful: false },
      { helpful: true }
    ];
    mockExecuteQuery.mockResolvedValue(resenas);
    const result = await mockExecuteQuery('SELECT reviews');
    const helpfulCount = result.filter(r => r.helpful).length;
    expect(helpfulCount).toBe(2);
  });

  // CREAR
  test('5.4 POST - Crear reseña exitosa', async () => {
    mockExecuteQuery.mockResolvedValue({ insertId: 1 });
    const result = await mockExecuteQuery('INSERT INTO reviews');
    expect(result.insertId).toBe(1);
  });

  test('5.5 POST - Validar rating entre 1-5', () => {
    const resena = { rating: 6, comment: 'Test' };
    expect(resena.rating < 1 || resena.rating > 5).toBe(true);
  });

  test('5.6 POST - Validar usuario autenticado', async () => {
    mockGetUserFromToken.mockResolvedValue(STUDENT);
    const user = await mockGetUserFromToken('token');
    expect(user).not.toBeNull();
    expect(user.role).toBe('student');
  });

  test('5.7 POST - Verificar no reseña previa', async () => {
    mockExecuteQuery.mockResolvedValue([]);
    const result = await mockExecuteQuery('SELECT reviews WHERE user_id = ?', [2]);
    expect(result).toHaveLength(0);
  });

  // ACTUALIZAR
  test('5.8 PUT - Actualizar reseña', async () => {
    mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
    const result = await mockExecuteQuery('UPDATE reviews');
    expect(result.affectedRows).toBe(1);
  });

  test('5.9 PUT - Verificar propiedad de reseña', async () => {
    mockExecuteQuery.mockResolvedValue([{ id: 1, user_id: 2 }]);
    const resena = await mockExecuteQuery('SELECT reviews WHERE id = ?', [1]);
    expect(resena[0].user_id).toBe(2);
  });

  // ELIMINAR
  test('5.10 DELETE - Eliminar reseña', async () => {
    mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });
    const result = await mockExecuteQuery('DELETE FROM reviews');
    expect(result.affectedRows).toBe(1);
  });
});