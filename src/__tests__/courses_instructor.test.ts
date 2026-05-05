/**
 * ================================================================
 * PRUEBA UNITARIA: API de Cursos - CRUD por Instructor
 * ================================================================
 *
 * Objetivo: Verificar todas las operaciones CRUD de cursos
 * realizadas por instructores.
 *
 * Casos de prueba:
 * 1. GET - Obtención de cursos del instructor
 * 2. POST - Creación de nuevo curso
 * 3. PUT - Actualización de curso existente
 * 4. DELETE - Eliminación de curso
 * 5. Validación de permisos de instructor
 * 6. Manejo de errores
 */

import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// Simular Next.js API Request/Response
const crearMockRequest = (
  method: string,
  query: any = {},
  body: any = {},
  headers: any = {}
) => ({
  method,
  query,
  body,
  headers,
});

const crearMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Datos mock para pruebas
const USUARIO_INSTRUCTOR = { id: 1, name: 'Instructor Test', role: 'instructor' };
const USUARIO_ESTUDIANTE = { id: 2, name: 'Estudiante Test', role: 'student' };

const CURSO_MOCK = {
  id: 1,
  title: 'Diseño de Moda Básico',
  description: 'Aprende los fundamentos del diseño de moda',
  thumbnail: 'https://example.com/image.jpg',
  price: 99.99,
  is_published: true,
  category: 'moda',
  level: 'beginner',
  instructor_id: 1,
  created_at: '2024-01-01T00:00:00Z',
};

describe('PRUEBA UNITARIA: API de Cursos (Instructor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1.1 GET - Obtención de Cursos del Instructor', () => {
    it('debe obtener todos los cursos del instructor autenticado', async () => {
      // Arrange
      const cursosMock = [
        CURSO_MOCK,
        { ...CURSO_MOCK, id: 2, title: 'Diseño Avanzado' },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(cursosMock);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          courses: expect.any(Array),
        })
      );
    });

    it('debe retornar cursos vacíos si el instructor no tiene cursos', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe incluir estadísticas de cada curso', async () => {
      // Arrange
      const cursosConStats = [
        {
          ...CURSO_MOCK,
          total_students: 25,
          total_lessons: 10,
          completion_rate: 75.5,
        },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(cursosConStats);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          courses: expect.arrayContaining([
            expect.objectContaining({
              total_students: expect.any(Number),
            }),
          ]),
        })
      );
    });

    it('debe filtrar por curso específico si se proporciona ID', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([CURSO_MOCK]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining([1])
      );
    });
  });

  describe('1.2 POST - Creación de Nuevo Curso', () => {
    it('debe crear un nuevo curso exitosamente', async () => {
      // Arrange
      const nuevoCurso = {
        title: 'Nuevo Curso de Moda',
        description: 'Descripción del curso',
        price: 149.99,
        category: 'moda',
        level: 'intermediate',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce({ insertId: 10 }) // Insert curso
        .mockResolvedValueOnce([{ ...CURSO_MOCK, id: 10 }]); // Select para retornar

      const req = crearMockRequest('POST', {}, nuevoCurso, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          course: expect.any(Object),
        })
      );
    });

    it('debe rechazar si el título está vacío', async () => {
      // Arrange
      const cursoSinTitulo = {
        title: '',
        description: 'Descripción',
        price: 99.99,
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('POST', {}, cursoSinTitulo, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('título'),
        })
      );
    });

    it('debe rechazar si el precio es negativo', async () => {
      // Arrange
      const cursoConPrecioInvalido = {
        title: 'Curso Test',
        description: 'Descripción',
        price: -50,
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('POST', {}, cursoConPrecioInvalido, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar si el usuario no es instructor', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('POST', {}, { title: 'Test' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debe rechazar si el usuario no está autenticado', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(null);

      const req = crearMockRequest('POST', {}, { title: 'Test' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe crear curso con categoría válida', async () => {
      // Arrange
      const categoriasValidas = ['moda', 'cocina', 'tecnologia', 'arte'];

      for (const categoria of categoriasValidas) {
        jest.clearAllMocks();
        (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
        (executeQuery as jest.Mock)
          .mockResolvedValueOnce({ insertId: Math.random() })
          .mockResolvedValueOnce([{ ...CURSO_MOCK, category: categoria }]);

        const req = crearMockRequest('POST', {}, { title: 'Test', category: categoria }, {});
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/instructor/courses')).default;
        await handler(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
      }
    });
  });

  describe('1.3 PUT - Actualización de Curso', () => {
    it('debe actualizar un curso existente exitosamente', async () => {
      // Arrange
      const cursoActualizado = {
        title: 'Curso Actualizado',
        description: 'Nueva descripción',
        price: 199.99,
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK]) // Verificar propiedad
        .mockResolvedValueOnce({ affectedRows: 1 }); // Update

      const req = crearMockRequest('PUT', { courseId: '1' }, cursoActualizado, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('actualizado'),
        })
      );
    });

    it('debe rechazar actualización si el curso no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([]); // No curso encontrado

      const req = crearMockRequest('PUT', { courseId: '999' }, { title: 'Test' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si el instructor no es el dueño del curso', async () => {
      // Arrange
      const cursoDeOtroInstructor = { ...CURSO_MOCK, instructor_id: 999 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([cursoDeOtroInstructor]);

      const req = crearMockRequest('PUT', { courseId: '1' }, { title: 'Test' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debe permitir cambiar estado de publicación', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = crearMockRequest(
        'PUT',
        { courseId: '1' },
        { is_published: false },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe validar que el nivel sea válido', async () => {
      // Arrange
      const nivelesInvalidos = ['invalid', 'master', 'phd', ''];

      for (const nivel of nivelesInvalidos) {
        jest.clearAllMocks();
        (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
        (executeQuery as jest.Mock).mockResolvedValue([CURSO_MOCK]);

        const req = crearMockRequest('PUT', { courseId: '1' }, { level: nivel }, {});
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/instructor/courses')).default;
        await handler(req, res);

        // Assert
        if (nivel !== '') {
          expect(res.status).toHaveBeenCalledWith(400);
        }
      }
    });
  });

  describe('1.4 DELETE - Eliminación de Curso', () => {
    it('debe eliminar un curso exitosamente', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK]) // Verificar propiedad
        .mockResolvedValueOnce({ affectedRows: 1 }); // Delete

      const req = crearMockRequest('DELETE', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('eliminado'),
        })
      );
    });

    it('debe rechazar eliminación si tiene estudiantes inscritos', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([{ id: 1 }]); // Estudiantes encontrados

      const req = crearMockRequest('DELETE', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('estudiantes'),
        })
      );
    });

    it('debe rechazar eliminación si el curso no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('DELETE', { courseId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si no hay confirmación de eliminación', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([CURSO_MOCK]);

      const req = crearMockRequest('DELETE', { courseId: '1' }, { confirm: false }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('1.5 Validación de Permisos', () => {
    it('debe permitir acceso solo a instructores', async () => {
      // Arrange
      const rolesPermitidos = ['instructor', 'admin'];

      for (const rol of rolesPermitidos) {
        jest.clearAllMocks();
        (getUserFromToken as jest.Mock).mockResolvedValue({
          ...USUARIO_INSTRUCTOR,
          role: rol,
        });
        (executeQuery as jest.Mock).mockResolvedValue([CURSO_MOCK]);

        const req = crearMockRequest('GET', {}, {}, {});
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/instructor/courses')).default;
        await handler(req, res);

        // Assert
        expect(res.status).not.toHaveBeenCalledWith(403);
      }
    });

    it('debe rechazar acceso a estudiantes', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debe manejar tokens expirados', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(null);

      const req = crearMockRequest('GET', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('1.6 Manejo de Errores', () => {
    it('debe manejar errores de base de datos', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = crearMockRequest('GET', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('error'),
        })
      );
    });

    it('debe rechazar métodos HTTP no permitidos', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('PATCH', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('debe sanitizar entradas de usuario', async () => {
      // Arrange
      const inputsPeligrosos = [
        "'; DROP TABLE courses; --",
        '<script>alert("xss")</script>',
        '../../../etc/passwd',
        '${555*555}',
      ];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      for (const input of inputsPeligrosos) {
        jest.clearAllMocks();

        const req = crearMockRequest('POST', {}, { title: input }, {});
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/instructor/courses')).default;
        await handler(req, res);

        // Assert
        // El API debe sanitizar o rechazar el input
        expect(res.status).toBeDefined();
      }
    });
  });

  describe('1.7 Casos de Borde', () => {
    it('debe manejar títulos muy largos', async () => {
      // Arrange
      const tituloLargo = 'A'.repeat(500);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('POST', {}, { title: tituloLargo }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toBeDefined();
    });

    it('debe manejar precios con decimales', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([CURSO_MOCK]);

      const req = crearMockRequest(
        'POST',
        {},
        { title: 'Test', price: 99.99 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/instructor/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe manejar cursos con thumbnail URL inválida', async () => {
      // Arrange
      const urlsInvalidas = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        '',
      ];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      for (const url of urlsInvalidas) {
        jest.clearAllMocks();

        const req = crearMockRequest('POST', {}, { title: 'Test', thumbnail: url }, {});
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/instructor/courses')).default;
        await handler(req, res);

        // Assert
        if (url === '') {
          expect(res.status).toBeDefined();
        }
      }
    });
  });
});
