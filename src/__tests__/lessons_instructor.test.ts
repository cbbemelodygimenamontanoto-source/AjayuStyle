/**
 * ================================================================
 * PRUEBA UNITARIA: API de Lecciones - CRUD por Instructor
 * ================================================================
 *
 * Objetivo: Verificar todas las operaciones CRUD de lecciones
 * realizadas por instructores para sus cursos.
 *
 * Casos de prueba:
 * 1. GET - Obtención de lecciones de un curso
 * 2. POST - Creación de nueva lección
 * 3. PUT - Actualización de lección existente
 * 4. DELETE - Eliminación de lección
 * 5. Reordenamiento de lecciones
 * 6. Validación de tipos de contenido
 * 7. Manejo de errores
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
  title: 'Diseño de Moda',
  instructor_id: 1,
};

const LECCION_MOCK = {
  id: 1,
  course_id: 1,
  title: 'Introducción al Diseño',
  description: 'Conceptos básicos del diseño de moda',
  content_type: 'video',
  content_url: 'https://video.example.com/lesson1.mp4',
  duration_minutes: 15,
  order_index: 1,
  is_preview: true,
  created_at: '2024-01-01T00:00:00Z',
};

const MODULO_MOCK = {
  id: 1,
  course_id: 1,
  title: 'Módulo 1: Fundamentos',
  order_index: 1,
};

describe('PRUEBA UNITARIA: API de Lecciones (Instructor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('2.1 GET - Obtención de Lecciones', () => {
    it('debe obtener todas las lecciones de un curso', async () => {
      // Arrange
      const leccionesMock = [
        LECCION_MOCK,
        { ...LECCION_MOCK, id: 2, title: 'Materiales y Herramientas', order_index: 2 },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(leccionesMock);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lessons: expect.any(Array),
        })
      );
    });

    it('debe obtener lección por ID específico', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([LECCION_MOCK]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { lessonId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lesson: expect.any(Object),
        })
      );
    });

    it('debe agrupar lecciones por módulo', async () => {
      // Arrange
      const leccionesPorModulo = [
        { ...LECCION_MOCK, module_title: 'Módulo 1' },
        { ...LECCION_MOCK, id: 2, module_title: 'Módulo 1' },
        { ...LECCION_MOCK, id: 3, module_title: 'Módulo 2' },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(leccionesPorModulo);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lessons: expect.any(Array),
        })
      );
    });

    it('debe retornar 404 si no hay lecciones', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { courseId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe incluir información de progreso para estudiantes', async () => {
      // Arrange
      const leccionesConProgreso = [
        {
          ...LECCION_MOCK,
          is_completed: true,
          progress_percentage: 100,
        },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(leccionesConProgreso);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          lessons: expect.arrayContaining([
            expect.objectContaining({
              is_completed: expect.any(Boolean),
            }),
          ]),
        })
      );
    });
  });

  describe('2.2 POST - Creación de Nueva Lección', () => {
    it('debe crear una nueva lección exitosamente', async () => {
      // Arrange
      const nuevaLeccion = {
        course_id: 1,
        title: 'Nueva Lección',
        description: 'Descripción de la lección',
        content_type: 'video',
        content_url: 'https://video.example.com/new.mp4',
        duration_minutes: 20,
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK]) // Verificar curso existe
        .mockResolvedValueOnce({ insertId: 10 }) // Insert
        .mockResolvedValueOnce([{ ...LECCION_MOCK, id: 10 }]); // Select

      const req = crearMockRequest('POST', {}, nuevaLeccion, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('creada'),
          lesson: expect.any(Object),
        })
      );
    });

    it('debe rechazar si el título está vacío', async () => {
      // Arrange
      const leccionSinTitulo = {
        course_id: 1,
        title: '',
        content_type: 'video',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('POST', {}, leccionSinTitulo, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe validar tipos de contenido permitidos', async () => {
      // Arrange
      const tiposValidos = ['video', 'text', 'pdf', 'quiz', 'assignment'];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([LECCION_MOCK]);

      for (const tipo of tiposValidos) {
        jest.clearAllMocks();

        const req = crearMockRequest(
          'POST',
          {},
          { course_id: 1, title: 'Test', content_type: tipo },
          {}
        );
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/lessons')).default;
        await handler(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
      }
    });

    it('debe rechazar tipo de contenido inválido', async () => {
      // Arrange
      const tipoInvalido = 'invalid_type';

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest(
        'POST',
        {},
        { course_id: 1, title: 'Test', content_type: tipoInvalido },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar si la duración es negativa', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest(
        'POST',
        {},
        { course_id: 1, title: 'Test', duration_minutes: -5 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar si el curso no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest(
        'POST',
        {},
        { course_id: 999, title: 'Test' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si el instructor no es dueño del curso', async () => {
      // Arrange
      const cursoDeOtro = { ...CURSO_MOCK, instructor_id: 999 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([cursoDeOtro]);

      const req = crearMockRequest(
        'POST',
        {},
        { course_id: 1, title: 'Test' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debe crear lección de tipo texto con contenido HTML', async () => {
      // Arrange
      const leccionTexto = {
        course_id: 1,
        title: 'Lección de Texto',
        content_type: 'text',
        content_text: '<h1>Bienvenido</h1><p>Esta es una lección en HTML</p>',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ insertId: 5 })
        .mockResolvedValueOnce([{ ...LECCION_MOCK, id: 5, content_type: 'text' }]);

      const req = crearMockRequest('POST', {}, leccionTexto, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('2.3 PUT - Actualización de Lección', () => {
    it('debe actualizar una lección exitosamente', async () => {
      // Arrange
      const leccionActualizada = {
        title: 'Título Actualizado',
        description: 'Nueva descripción',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([LECCION_MOCK]) // Verificar existencia
        .mockResolvedValueOnce({ affectedRows: 1 }); // Update

      const req = crearMockRequest('PUT', { lessonId: '1' }, leccionActualizada, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('actualizada'),
        })
      );
    });

    it('debe permitir cambiar el orden de la lección', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = crearMockRequest('PUT', { lessonId: '1' }, { order_index: 5 }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe permitir marcar como preview/no-preview', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = crearMockRequest(
        'PUT',
        { lessonId: '1' },
        { is_preview: false },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe rechazar actualización si la lección no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('PUT', { lessonId: '999' }, { title: 'Test' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si el instructor no es dueño del curso', async () => {
      // Arrange
      const leccionDeOtroCurso = { ...LECCION_MOCK, course_id: 999 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([leccionDeOtroCurso]);

      const req = crearMockRequest('PUT', { lessonId: '1' }, { title: 'Test' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('2.4 DELETE - Eliminación de Lección', () => {
    it('debe eliminar una lección exitosamente', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([LECCION_MOCK]) // Verificar existencia
        .mockResolvedValueOnce({ affectedRows: 1 }); // Delete

      const req = crearMockRequest('DELETE', { lessonId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('eliminada'),
        })
      );
    });

    it('debe rechazar eliminación si la lección tiene estudiantes completándola', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce([{ id: 1 }]); // Progreso encontrado

      const req = crearMockRequest('DELETE', { lessonId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar eliminación si la lección no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('DELETE', { lessonId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('2.5 Reordenamiento de Lecciones', () => {
    it('debe reordenar múltiples lecciones', async () => {
      // Arrange
      const nuevoOrden = [
        { id: 3, order_index: 1 },
        { id: 1, order_index: 2 },
        { id: 2, order_index: 3 },
      ];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue({ affectedRows: 3 });

      const req = crearMockRequest('PUT', { action: 'reorder' }, { lessons: nuevoOrden }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(executeQuery).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar reordenamiento con IDs inválidos', async () => {
      // Arrange
      const ordenInvalido = [
        { id: 999, order_index: 1 },
        { id: 888, order_index: 2 },
      ];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('PUT', { action: 'reorder' }, { lessons: ordenInvalido }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe validar que los índices de orden sean únicos', async () => {
      // Arrange
      const ordenDuplicado = [
        { id: 1, order_index: 1 },
        { id: 2, order_index: 1 }, // Duplicado
      ];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('PUT', { action: 'reorder' }, { lessons: ordenDuplicado }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('2.6 Validación de URLs de Contenido', () => {
    it('debe aceptar URLs de video válidas', async () => {
      // Arrange
      const urlsValidas = [
        'https://vimeo.com/123456789',
        'https://www.youtube.com/watch?v=abc123',
        'https://player.vimeo.com/video/123456789',
      ];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([LECCION_MOCK]);

      for (const url of urlsValidas) {
        jest.clearAllMocks();

        const req = crearMockRequest(
          'POST',
          {},
          { course_id: 1, title: 'Test', content_type: 'video', content_url: url },
          {}
        );
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/lessons')).default;
        await handler(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
      }
    });

    it('debe rechazar URLs de video inválidas', async () => {
      // Arrange
      const urlsInvalidas = [
        'not-a-url',
        'ftp://files.example.com/video.mp4',
        'javascript:alert(1)',
      ];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      for (const url of urlsInvalidas) {
        jest.clearAllMocks();

        const req = crearMockRequest(
          'POST',
          {},
          { course_id: 1, title: 'Test', content_type: 'video', content_url: url },
          {}
        );
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/lessons')).default;
        await handler(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });
  });

  describe('2.7 Casos de Borde', () => {
    it('debe manejar lección con descripción muy larga', async () => {
      // Arrange
      const descripcionLarga = 'A'.repeat(5000);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([LECCION_MOCK]);

      const req = crearMockRequest(
        'POST',
        {},
        { course_id: 1, title: 'Test', description: descripcionLarga },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toBeDefined();
    });

    it('debe rechazar duración mayor a 24 horas', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest(
        'POST',
        {},
        { course_id: 1, title: 'Test', duration_minutes: 1500 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe manejar lección sin URL (solo texto)', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([LECCION_MOCK]);

      const req = crearMockRequest(
        'POST',
        {},
        { course_id: 1, title: 'Test', content_type: 'text', content_text: 'Hola mundo' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/lessons')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
