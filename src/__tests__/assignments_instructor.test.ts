/**
 * ================================================================
 * PRUEBA UNITARIA: API de Tareas - CRUD por Instructor
 * ================================================================
 *
 * Objetivo: Verificar todas las operaciones CRUD de tareas
 * realizadas por instructores para sus cursos.
 *
 * Casos de prueba:
 * 1. GET - Obtención de tareas de un curso
 * 2. POST - Creación de nueva tarea
 * 3. PUT - Actualización de tarea existente
 * 4. DELETE - Eliminación de tarea
 * 5. Gestión de entregas de estudiantes
 * 6. Sistema de calificación
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
  title: 'Lección de Tarea',
};

const TAREA_MOCK = {
  id: 1,
  lesson_id: 1,
  course_id: 1,
  title: 'Proyecto Final de Diseño',
  description: 'Crea un diseño de colección completo',
  instructions: 'Debes incluir sketches,选了 de tela y descripción del concepto',
  max_score: 100,
  passing_score: 70,
  due_date: '2024-12-31T23:59:59Z',
  allow_late_submission: true,
  late_penalty_percent: 10,
  created_at: '2024-01-01T00:00:00Z',
};

const ENTREGA_MOCK = {
  id: 1,
  assignment_id: 1,
  student_id: 2,
  submission_text: 'Mi proyecto completo',
  submission_url: null,
  submitted_at: '2024-12-30T10:00:00Z',
  status: 'submitted',
  grade: null,
  feedback: null,
};

describe('PRUEBA UNITARIA: API de Tareas (Instructor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('3.1 GET - Obtención de Tareas', () => {
    it('debe obtener todas las tareas de un curso', async () => {
      // Arrange
      const tareasMock = [
        TAREA_MOCK,
        { ...TAREA_MOCK, id: 2, title: 'Ejercicio de Color' },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(tareasMock);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          assignments: expect.any(Array),
        })
      );
    });

    it('debe obtener tarea por ID específico', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([TAREA_MOCK]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { assignmentId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          assignment: expect.any(Object),
        })
      );
    });

    it('debe incluir estadísticas de entregas', async () => {
      // Arrange
      const tareasConStats = [
        {
          ...TAREA_MOCK,
          total_submissions: 25,
          graded_submissions: 20,
          average_score: 85.5,
        },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(tareasConStats);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          assignments: expect.arrayContaining([
            expect.objectContaining({
              total_submissions: expect.any(Number),
            }),
          ]),
        })
      );
    });

    it('debe obtener tareas con fecha de entrega próxima', async () => {
      // Arrange
      const tareasProximas = [
        {
          ...TAREA_MOCK,
          due_date: '2024-12-15T23:59:59Z',
          days_until_due: 5,
        },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(tareasProximas);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { courseId: '1', filter: 'upcoming' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe retornar 404 si no hay tareas', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { courseId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('3.2 POST - Creación de Nueva Tarea', () => {
    it('debe crear una nueva tarea exitosamente', async () => {
      // Arrange
      const nuevaTarea = {
        lesson_id: 1,
        course_id: 1,
        title: 'Nuevo Proyecto',
        description: 'Descripción del proyecto',
        instructions: 'Sigue las instrucciones detalladas',
        max_score: 100,
        passing_score: 70,
        due_date: '2024-12-31T23:59:59Z',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK]) // Verificar curso
        .mockResolvedValueOnce([LECCION_MOCK]) // Verificar lección
        .mockResolvedValueOnce({ insertId: 10 }) // Insert
        .mockResolvedValueOnce([{ ...TAREA_MOCK, id: 10 }]); // Select

      const req = crearMockRequest('POST', {}, nuevaTarea, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('creada'),
          assignment: expect.any(Object),
        })
      );
    });

    it('debe rechazar si el título está vacío', async () => {
      // Arrange
      const tareaSinTitulo = {
        lesson_id: 1,
        course_id: 1,
        title: '',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('POST', {}, tareaSinTitulo, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe validar que max_score sea mayor a 0', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([LECCION_MOCK]);

      const req = crearMockRequest(
        'POST',
        {},
        { lesson_id: 1, course_id: 1, title: 'Test', max_score: 0 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe validar que passing_score no exceda max_score', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([LECCION_MOCK]);

      const req = crearMockRequest(
        'POST',
        {},
        { lesson_id: 1, course_id: 1, title: 'Test', max_score: 100, passing_score: 150 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar si la fecha de entrega es en el pasado', async () => {
      // Arrange
      const fechaPasada = '2020-01-01T00:00:00Z';
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([LECCION_MOCK]);

      const req = crearMockRequest(
        'POST',
        {},
        { lesson_id: 1, course_id: 1, title: 'Test', due_date: fechaPasada },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar si el instructor no es dueño del curso', async () => {
      // Arrange
      const cursoDeOtro = { ...CURSO_MOCK, instructor_id: 999 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([cursoDeOtro]);

      const req = crearMockRequest(
        'POST',
        {},
        { lesson_id: 1, course_id: 1, title: 'Test' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debe permitir crear tarea sin fecha de entrega', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce({ insertId: 5 })
        .mockResolvedValueOnce([{ ...TAREA_MOCK, id: 5, due_date: null }]);

      const req = crearMockRequest(
        'POST',
        {},
        { lesson_id: 1, course_id: 1, title: 'Tarea sin fecha' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe configurar penalización por entrega tardía', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce({ insertId: 3 })
        .mockResolvedValueOnce([{ ...TAREA_MOCK, id: 3, late_penalty_percent: 20 }]);

      const req = crearMockRequest(
        'POST',
        {},
        {
          lesson_id: 1,
          course_id: 1,
          title: 'Test',
          allow_late_submission: true,
          late_penalty_percent: 20,
        },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('3.3 PUT - Actualización de Tarea', () => {
    it('debe actualizar una tarea exitosamente', async () => {
      // Arrange
      const tareaActualizada = {
        title: 'Título Actualizado',
        description: 'Nueva descripción',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK]) // Verificar existencia
        .mockResolvedValueOnce({ affectedRows: 1 }); // Update

      const req = crearMockRequest('PUT', { assignmentId: '1' }, tareaActualizada, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('actualizada'),
        })
      );
    });

    it('debe permitir extender fecha de entrega', async () => {
      // Arrange
      const nuevaFecha = '2025-01-15T23:59:59Z';
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = crearMockRequest('PUT', { assignmentId: '1' }, { due_date: nuevaFecha }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe rechazar actualización si la tarea no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('PUT', { assignmentId: '999' }, { title: 'Test' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si ya hay entregas calificadas', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK])
        .mockResolvedValueOnce([{ id: 1, grade: 85 }]); // Entregas calificadas

      const req = crearMockRequest(
        'PUT',
        { assignmentId: '1' },
        { max_score: 50 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar cambio de max_score si hay entregas', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK])
        .mockResolvedValueOnce([{ id: 1 }]); // Hay entregas

      const req = crearMockRequest(
        'PUT',
        { assignmentId: '1' },
        { max_score: 200 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('3.4 DELETE - Eliminación de Tarea', () => {
    it('debe eliminar una tarea exitosamente', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK]) // Verificar existencia
        .mockResolvedValueOnce({ affectedRows: 1 }); // Delete

      const req = crearMockRequest('DELETE', { assignmentId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('eliminada'),
        })
      );
    });

    it('debe rechazar eliminación si hay entregas', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK])
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]); // Entregas encontradas

      const req = crearMockRequest('DELETE', { assignmentId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('entregas'),
        })
      );
    });

    it('debe rechazar eliminación si la tarea no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('DELETE', { assignmentId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('3.5 Gestión de Entregas', () => {
    it('debe obtener lista de entregas de una tarea', async () => {
      // Arrange
      const entregasMock = [
        ENTREGA_MOCK,
        { ...ENTREGA_MOCK, id: 2, student_id: 3 },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(entregasMock);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { assignmentId: '1', action: 'submissions' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          submissions: expect.any(Array),
        })
      );
    });

    it('debe calificar una entrega exitosamente', async () => {
      // Arrange
      const calificacion = {
        grade: 85,
        feedback: 'Buen trabajo, pero mejora los sketches',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK]) // Verificar tarea
        .mockResolvedValueOnce([ENTREGA_MOCK]) // Verificar entrega
        .mockResolvedValueOnce({ affectedRows: 1 }); // Update

      const req = crearMockRequest(
        'PUT',
        { assignmentId: '1', submissionId: '1' },
        calificacion,
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('calificada'),
        })
      );
    });

    it('debe rechazar calificación mayor a max_score', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK])
        .mockResolvedValueOnce([ENTREGA_MOCK]);

      const req = crearMockRequest(
        'PUT',
        { assignmentId: '1', submissionId: '1' },
        { grade: 150 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar calificación negativa', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([TAREA_MOCK])
        .mockResolvedValueOnce([ENTREGA_MOCK]);

      const req = crearMockRequest(
        'PUT',
        { assignmentId: '1', submissionId: '1' },
        { grade: -10 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe calcular penalización por entrega tardía', async () => {
      // Arrange
      const entregaTardia = {
        ...ENTREGA_MOCK,
        submitted_at: '2025-01-05T10:00:00Z', // Después del due_date
      };
      const tareaConPenalizacion = {
        ...TAREA_MOCK,
        allow_late_submission: true,
        late_penalty_percent: 10,
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([tareaConPenalizacion])
        .mockResolvedValueOnce([entregaTardia])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = crearMockRequest(
        'PUT',
        { assignmentId: '1', submissionId: '1' },
        { grade: 100 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('3.6 Estadísticas y Reportes', () => {
    it('debe calcular estadísticas de la tarea', async () => {
      // Arrange
      const statsMock = {
        total_submissions: 25,
        graded_submissions: 20,
        average_score: 85.5,
        highest_score: 100,
        lowest_score: 55,
        submission_rate: 80,
      };
      (executeQuery as jest.Mock).mockResolvedValue([statsMock]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest('GET', { assignmentId: '1', action: 'stats' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: expect.any(Object),
        })
      );
    });

    it('debe obtener distribución de calificaciones', async () => {
      // Arrange
      const distribucionMock = [
        { range: '90-100', count: 10 },
        { range: '80-89', count: 8 },
        { range: '70-79', count: 5 },
        { range: '60-69', count: 2 },
        { range: '0-59', count: 0 },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(distribucionMock);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);

      const req = crearMockRequest(
        'GET',
        { assignmentId: '1', action: 'gradeDistribution' },
        {},
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('3.7 Casos de Borde', () => {
    it('debe manejar tarea sin instrucciones', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_INSTRUCTOR);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([LECCION_MOCK])
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([{ ...TAREA_MOCK, instructions: null }]);

      const req = crearMockRequest(
        'POST',
        {},
        { lesson_id: 1, course_id: 1, title: 'Tarea Simple' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe validar URL de entrega si se proporciona', async () => {
      // Arrange
      const urlsInvalidas = [
        'not-a-url',
        'ftp://files.com/doc.pdf',
        'javascript:alert(1)',
      ];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      for (const url of urlsInvalidas) {
        jest.clearAllMocks();

        const req = crearMockRequest(
          'POST',
          { action: 'submit' },
          { assignment_id: 1, submission_url: url },
          {}
        );
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/assignments')).default;
        await handler(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });

    it('debe rechazar entrega fuera de fecha sin allow_late', async () => {
      // Arrange
      const tareaSinLate = {
        ...TAREA_MOCK,
        allow_late_submission: false,
        due_date: '2020-01-01T00:00:00Z',
      };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([tareaSinLate])
        .mockResolvedValueOnce([{ id: 1 }]); // Inscripción

      const req = crearMockRequest(
        'POST',
        { action: 'submit' },
        { assignment_id: 1 },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/assignments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
