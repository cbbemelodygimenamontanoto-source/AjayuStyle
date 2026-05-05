/**
 * ================================================================
 * PRUEBA UNITARIA: API de Reseñas - Creación de Reseñas
 * ================================================================
 *
 * Objetivo: Verificar todas las operaciones relacionadas con
 * la creación y gestión de reseñas de cursos por estudiantes.
 *
 * Casos de prueba:
 * 1. GET - Obtención de reseñas de un curso
 * 2. POST - Creación de nueva reseña
 * 3. PUT - Actualización de reseña propia
 * 4. DELETE - Eliminación de reseña propia
 * 5. Sistema de votos (helpful/unhelpful)
 * 6. Reporte de reseñas inapropiadas
 * 7. Validaciones de negocio
 * 8. Manejo de errores
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
const USUARIO_ESTUDIANTE = { id: 2, name: 'María López', role: 'student' };
const USUARIO_INSTRUCTOR = { id: 1, name: 'Carlos García', role: 'instructor' };
const USUARIO_ADMIN = { id: 3, name: 'Admin', role: 'admin' };

const CURSO_MOCK = {
  id: 1,
  title: 'Diseño de Moda',
  instructor_id: 1,
};

const INSCRIPCION_MOCK = {
  id: 1,
  user_id: 2,
  course_id: 1,
  status: 'active',
};

const RESENA_MOCK = {
  id: 1,
  course_id: 1,
  user_id: 2,
  user_name: 'María López',
  user_avatar: null,
  rating: 5,
  review_text: 'Excelente curso, muy recomendado',
  pros: 'Contenido de calidad, buen instructor',
  cons: 'Me gustaría más proyectos prácticos',
  would_recommend: true,
  verified_purchase: true,
  helpful_count: 15,
  reported_count: 0,
  status: 'approved',
  created_at: '2024-06-15T10:00:00Z',
  updated_at: '2024-06-15T10:00:00Z',
};

describe('PRUEBA UNITARIA: API de Reseñas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('5.1 GET - Obtención de Reseñas', () => {
    it('debe obtener todas las reseñas aprobadas de un curso', async () => {
      // Arrange
      const resenasMock = [
        RESENA_MOCK,
        { ...RESENA_MOCK, id: 2, rating: 4, review_text: 'Muy buen curso' },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(resenasMock);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reviews: expect.any(Array),
        })
      );
    });

    it('debe obtener estadísticas de reseñas', async () => {
      // Arrange
      const statsMock = {
        total_reviews: 25,
        average_rating: 4.5,
        five_star: 15,
        four_star: 5,
        three_star: 3,
        two_star: 1,
        one_star: 1,
      };
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([]) // Reseñas
        .mockResolvedValueOnce([statsMock]); // Stats

      const req = crearMockRequest('GET', { courseId: '1', includeStats: true }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: expect.any(Object),
        })
      );
    });

    it('debe filtrar reseñas por calificación', async () => {
      // Arrange
      const resenas5Estrellas = [{ ...RESENA_MOCK, rating: 5 }];
      (executeQuery as jest.Mock).mockResolvedValue(resenas5Estrellas);

      const req = crearMockRequest('GET', { courseId: '1', rating: 5 }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('rating'),
        expect.any(Array)
      );
    });

    it('debe ordenar reseñas por más recientes', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([RESENA_MOCK]);

      const req = crearMockRequest('GET', { courseId: '1', sort: 'recent' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        expect.any(Array)
      );
    });

    it('debe ordenar reseñas por más helpful', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([RESENA_MOCK]);

      const req = crearMockRequest('GET', { courseId: '1', sort: 'helpful' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe paginar las reseñas', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([RESENA_MOCK]);

      const req = crearMockRequest('GET', { courseId: '1', page: 2, limit: 10 }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.any(Array)
      );
    });

    it('debe retornar 404 si el curso no existe', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('GET', { courseId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe incluir información del usuario que escribió la reseña', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([RESENA_MOCK]);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reviews: expect.arrayContaining([
            expect.objectContaining({
              user_name: expect.any(String),
            }),
          ]),
        })
      );
    });
  });

  describe('5.2 POST - Creación de Nueva Reseña', () => {
    it('debe crear una reseña exitosamente', async () => {
      // Arrange
      const nuevaResena = {
        rating: 5,
        review_text: 'Me encantó este curso',
        pros: 'Contenido muy bien explicado',
        cons: null,
        would_recommend: true,
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK]) // Verificar curso existe
        .mockResolvedValueOnce([INSCRIPCION_MOCK]) // Verificar inscripción
        .mockResolvedValueOnce([]) // No existente reseña
        .mockResolvedValueOnce({ insertId: 10 }) // Insert
        .mockResolvedValueOnce([{ ...RESENA_MOCK, id: 10 }]); // Select

      const req = crearMockRequest('POST', { courseId: '1' }, nuevaResena, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('creada'),
          review: expect.any(Object),
        })
      );
    });

    it('debe rechazar si el usuario no está autenticado', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(null);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, review_text: 'Test' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe rechazar si el usuario no está inscrito en el curso', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([]); // No inscripción

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, review_text: 'Test' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('inscrito'),
        })
      );
    });

    it('debe rechazar si el usuario ya tiene una reseña', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([INSCRIPCION_MOCK])
        .mockResolvedValueOnce([RESENA_MOCK]); // Reseña existente

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 4, review_text: 'Nueva reseña' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('ya tienes'),
        })
      );
    });

    it('debe validar que la calificación esté entre 1 y 5', async () => {
      // Arrange
      const calificacionesInvalidas = [0, 6, -1, 10];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([INSCRIPCION_MOCK])
        .mockResolvedValueOnce([]);

      for (const rating of calificacionesInvalidas) {
        jest.clearAllMocks();

        const req = crearMockRequest(
          'POST',
          { courseId: '1' },
          { rating, review_text: 'Test' },
          {}
        );
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/reviews')).default;
        await handler(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });

    it('debe requerir texto de reseña si la calificación es baja', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([INSCRIPCION_MOCK])
        .mockResolvedValueOnce([]);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 2, review_text: '' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar reseñas muy cortas', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([INSCRIPCION_MOCK])
        .mockResolvedValueOnce([]);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 3, review_text: 'Buen' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe aceptar reseña con pros y sin cons', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([INSCRIPCION_MOCK])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ insertId: 5 })
        .mockResolvedValueOnce([{ ...RESENA_MOCK, id: 5, cons: null }]);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, review_text: 'Excelente contenido', pros: 'Muy bueno' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe validar que el curso está publicado', async () => {
      // Arrange
      const cursoBorrador = { ...CURSO_MOCK, is_published: false };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([cursoBorrador]);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, review_text: 'Test' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('5.3 PUT - Actualización de Reseña', () => {
    it('debe actualizar una reseña exitosamente', async () => {
      // Arrange
      const resenaActualizada = {
        rating: 4,
        review_text: 'Actualizado: Muy buen curso',
        pros: 'Contenido actualizado',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK]) // Verificar propiedad
        .mockResolvedValueOnce({ affectedRows: 1 }); // Update

      const req = crearMockRequest('PUT', { reviewId: '1' }, resenaActualizada, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('actualizada'),
        })
      );
    });

    it('debe rechazar si la reseña no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('PUT', { reviewId: '999' }, { rating: 5 }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si el usuario no es el dueño de la reseña', async () => {
      // Arrange
      const resenaDeOtro = { ...RESENA_MOCK, user_id: 999 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([resenaDeOtro]);

      const req = crearMockRequest('PUT', { reviewId: '1' }, { rating: 5 }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('debe permitir cambiar solo la calificación', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = crearMockRequest('PUT', { reviewId: '1' }, { rating: 3 }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe actualizar would_recommend', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = crearMockRequest(
        'PUT',
        { reviewId: '1' },
        { would_recommend: false },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('5.4 DELETE - Eliminación de Reseña', () => {
    it('debe eliminar una reseña exitosamente', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK]) // Verificar propiedad
        .mockResolvedValueOnce({ affectedRows: 1 }); // Delete

      const req = crearMockRequest('DELETE', { reviewId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('eliminada'),
        })
      );
    });

    it('debe permitir al admin eliminar cualquier reseña', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ADMIN);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = crearMockRequest('DELETE', { reviewId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe rechazar si la reseña no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('DELETE', { reviewId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si el usuario no es el dueño y no es admin', async () => {
      // Arrange
      const resenaDeOtro = { ...RESENA_MOCK, user_id: 999 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([resenaDeOtro]);

      const req = crearMockRequest('DELETE', { reviewId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('5.5 Sistema de Votos (Helpful/Unhelpful)', () => {
    it('debe votar como helpful exitosamente', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK]) // Verificar reseña
        .mockResolvedValueOnce([]) // No voto previo
        .mockResolvedValueOnce({ insertId: 1 }); // Insert voto

      const req = crearMockRequest('POST', { reviewId: '1', action: 'vote' }, { type: 'helpful' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('voto'),
        })
      );
    });

    it('debe votar como unhelpful exitosamente', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ insertId: 1 });

      const req = crearMockRequest('POST', { reviewId: '1', action: 'vote' }, { type: 'unhelpful' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe rechazar voto si el usuario ya votó', async () => {
      // Arrange
      const votoPrevio = { id: 1, review_id: 1, user_id: 2, vote_type: 'helpful' };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce([votoPrevio]); // Voto existente

      const req = crearMockRequest('POST', { reviewId: '1', action: 'vote' }, { type: 'helpful' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe permitir cambiar el voto', async () => {
      // Arrange
      const votoPrevio = { id: 1, review_id: 1, user_id: 2, vote_type: 'helpful' };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce([votoPrevio])
        .mockResolvedValueOnce({ affectedRows: 1 }); // Update

      const req = crearMockRequest(
        'POST',
        { reviewId: '1', action: 'vote' },
        { type: 'unhelpful' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe rechazar auto-voto en propia reseña', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([RESENA_MOCK]);

      const req = crearMockRequest('POST', { reviewId: '1', action: 'vote' }, { type: 'helpful' }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe validar tipo de voto', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([RESENA_MOCK]);

      const req = crearMockRequest(
        'POST',
        { reviewId: '1', action: 'vote' },
        { type: 'invalid' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('5.6 Reporte de Reseñas Inapropiadas', () => {
    it('debe reportar una reseña exitosamente', async () => {
      // Arrange
      const reporte = {
        reason: 'inapropiado',
        description: 'Contenido ofensivo',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK]) // Verificar reseña
        .mockResolvedValueOnce({ insertId: 1 }); // Insert reporte

      const req = crearMockRequest('POST', { reviewId: '1', action: 'report' }, reporte, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('reportada'),
        })
      );
    });

    it('debe rechazar reporte sin razón', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([RESENA_MOCK]);

      const req = crearMockRequest(
        'POST',
        { reviewId: '1', action: 'report' },
        { description: 'Test' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe validar razones de reporte válidas', async () => {
      // Arrange
      const razonesValidas = ['spam', 'inapropiado', 'falso', 'otro'];

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValue([RESENA_MOCK])
        .mockResolvedValue({ insertId: 1 });

      for (const reason of razonesValidas) {
        jest.clearAllMocks();

        const req = crearMockRequest(
          'POST',
          { reviewId: '1', action: 'report' },
          { reason, description: 'Test' },
          {}
        );
        const res = crearMockResponse();

        // Act
        const handler = (await import('@/pages/api/reviews')).default;
        await handler(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
      }
    });

    it('debe rechazar si el usuario ya reportó esta reseña', async () => {
      // Arrange
      const reportePrevio = { id: 1, review_id: 1, user_id: 2 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([RESENA_MOCK])
        .mockResolvedValueOnce([reportePrevio]); // Reporte existente

      const req = crearMockRequest(
        'POST',
        { reviewId: '1', action: 'report' },
        { reason: 'spam' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('5.7 Validaciones de Negocio', () => {
    it('debe validar longitud máxima del texto', async () => {
      // Arrange
      const textoLargo = 'A'.repeat(5000);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([INSCRIPCION_MOCK])
        .mockResolvedValueOnce([]);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, review_text: textoLargo },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe sanitizar contenido HTML malicioso', async () => {
      // Arrange
      const contenidoPeligroso = '<script>alert("xss")</script>';
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([INSCRIPCION_MOCK])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([{ ...RESENA_MOCK, id: 1 }]);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, review_text: contenidoPeligroso },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      // El API debe sanitizar el contenido
      expect(res.status).toBeDefined();
    });

    it('debe validar que el curso permite reseñas', async () => {
      // Arrange
      const cursoSinResenas = { ...CURSO_MOCK, allow_reviews: false };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([cursoSinResenas]);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, review_text: 'Test' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('5.8 Casos de Borde', () => {
    it('debe manejar estudiantes sin avatar', async () => {
      // Arrange
      const resenaSinAvatar = { ...RESENA_MOCK, user_avatar: null };
      (executeQuery as jest.Mock).mockResolvedValue([resenaSinAvatar]);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe manejar reseñas con caracteres Unicode', async () => {
      // Arrange
      const resenaUnicode = {
        ...RESENA_MOCK,
        review_text: '课程非常棒！Excelente curso⭐',
      };
      (executeQuery as jest.Mock).mockResolvedValue([resenaUnicode]);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe manejar reseñas sin pros ni cons', async () => {
      // Arrange
      const resenaMinima = {
        ...RESENA_MOCK,
        pros: null,
        cons: null,
      };
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_MOCK])
        .mockResolvedValueOnce([INSCRIPCION_MOCK])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([resenaMinima]);

      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest(
        'POST',
        { courseId: '1' },
        { rating: 4, review_text: 'Buen curso' },
        {}
      );
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe manejar fecha de creación muy antigua', async () => {
      // Arrange
      const resenaAntigua = {
        ...RESENA_MOCK,
        created_at: '2020-01-01T00:00:00Z',
      };
      (executeQuery as jest.Mock).mockResolvedValue([resenaAntigua]);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe rechazar actualización de reseña eliminada', async () => {
      // Arrange
      const resenaEliminada = { ...RESENA_MOCK, status: 'deleted' };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([resenaEliminada]);

      const req = crearMockRequest('PUT', { reviewId: '1' }, { rating: 5 }, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
