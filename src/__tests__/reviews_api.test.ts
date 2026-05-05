/**
 * ================================================================
 * PRUEBA UNITARIA 2: API de Reviews - Tests de Endpoints
 * ================================================================
 * 
 * Objetivo: Verificar el correcto funcionamiento de los endpoints
 * de la API de reseñas.
 * 
 * Casos de prueba:
 * 1. GET - Obtención de reseñas de un curso
 * 2. POST - Creación de nueva reseña
 * 3. PUT - Actualización de reseña existente
 * 4. Validación de parámetros de entrada
 * 5. Manejo de errores de autenticación
 * 6. Verificación de inscripción del usuario
 */

// Mock de las dependencias
jest.mock('@/lib/database', () => ({
  executeQuery: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getUserFromToken: jest.fn(),
}));

import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// Simular Next.js API Request/Response
const mockRequest = (method: string, query: any = {}, body: any = {}, headers: any = {}) => ({
  method,
  query,
  body,
  headers,
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('PRUEBA UNITARIA 2: API de Reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('2.1 GET - Obtención de Reseñas', () => {
    it('debe obtener reseñas exitosamente con courseId válido', async () => {
      // Arrange
      const mockReviews = [
        {
          id: 1,
          rating: 5,
          comment: 'Excelente curso',
          created_at: '2024-12-10T10:00:00Z',
          user_name: 'Ana García',
          user_avatar: null,
          helpful_votes: 10,
          unhelpful_votes: 0,
        },
      ];

      const mockStats = {
        total_reviews: 1,
        average_rating: 5.0,
        five_star: 1,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
      };

      (executeQuery as jest.Mock)
        .mockResolvedValueOnce(mockReviews)
        .mockResolvedValueOnce([mockStats]);

      const req = mockRequest('GET', { courseId: '1' });
      const res = mockResponse();

      // Act - Importar y ejecutar el handler
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reviews: mockReviews,
          stats: mockStats,
        })
      );
    });

    it('debe retornar error 400 si no se proporciona courseId', async () => {
      // Arrange
      const req = mockRequest('GET', { courseId: '' });
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'ID del curso requerido',
        })
      );
    });

    it('debe manejar errores de base de datos gracefully', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = mockRequest('GET', { courseId: '1' });
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error interno del servidor',
        })
      );
    });
  });

  describe('2.2 POST - Creación de Reseña', () => {
    it('debe crear una nueva reseña exitosamente', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Ana García' };
      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);

      const mockEnrollment = [{ id: 1, course_id: 1, user_id: 1 }];
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce(mockEnrollment) // Check enrollment
        .mockResolvedValueOnce([]) // Check existing review
        .mockResolvedValueOnce({ insertId: 10 }); // Insert review

      const req = mockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, comment: 'Excelente curso' }
      );
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Reseña creada exitosamente',
          review_id: 10,
        })
      );
    });

    it('debe rechazar creación si el usuario no está autenticado', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(null);

      const req = mockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, comment: 'Test' }
      );
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No autorizado',
        })
      );
    });

    it('debe rechazar si el usuario no está inscrito en el curso', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Ana García' };
      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);
      (executeQuery as jest.Mock).mockResolvedValue([]); // No enrollment

      const req = mockRequest(
        'POST',
        { courseId: '1' },
        { rating: 5, comment: 'Excelente' }
      );
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Solo puedes reseñar cursos en los que estés inscrito',
        })
      );
    });

    it('debe rechazar si el usuario ya tiene una reseña existente', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Ana García' };
      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);

      const mockEnrollment = [{ id: 1, course_id: 1, user_id: 1 }];
      const existingReview = [{ id: 5, course_id: 1, user_id: 1 }];

      (executeQuery as jest.Mock)
        .mockResolvedValueOnce(mockEnrollment)
        .mockResolvedValueOnce(existingReview);

      const req = mockRequest(
        'POST',
        { courseId: '1' },
        { rating: 4, comment: 'Nueva opinión' }
      );
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Ya has dejado una reseña para este curso',
        })
      );
    });
  });

  describe('2.3 Validación de Entrada', () => {
    it('debe validar que la calificación esté entre 1 y 5', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Ana García' };
      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);

      const mockEnrollment = [{ id: 1 }];
      (executeQuery as jest.Mock).mockResolvedValue(mockEnrollment);

      const req = mockRequest(
        'POST',
        { courseId: '1' },
        { rating: 6, comment: 'Test' }
      );
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'La calificación debe estar entre 1 y 5',
        })
      );
    });

    it('debe rechazar calificación menor a 1', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Ana García' };
      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest(
        'POST',
        { courseId: '1' },
        { rating: 0, comment: 'Test' }
      );
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('2.4 PUT - Actualización de Reseña', () => {
    it('debe actualizar una reseña existente exitosamente', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Ana García' };
      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);

      const existingReview = [{ id: 5, rating: 3 }];
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce(existingReview)
        .mockResolvedValueOnce({ affectedRows: 1 });

      const req = mockRequest(
        'PUT',
        { courseId: '1' },
        { rating: 5, comment: 'Actualizada' }
      );
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Reseña actualizada exitosamente',
        })
      );
    });

    it('debe retornar 404 al actualizar si no existe la reseña', async () => {
      // Arrange
      const mockUser = { id: 1, name: 'Ana García' };
      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = mockRequest(
        'PUT',
        { courseId: '1' },
        { rating: 5, comment: 'Test' }
      );
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No se encontró reseña para actualizar',
        })
      );
    });
  });

  describe('2.5 Métodos No Permitidos', () => {
    it('debe retornar 405 para métodos HTTP no implementados', async () => {
      // Arrange
      const req = mockRequest('DELETE', { courseId: '1' });
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Método no permitido',
        })
      );
    });

    it('debe retornar 405 para método PATCH', async () => {
      // Arrange
      const req = mockRequest('PATCH', { courseId: '1' }, {});
      const res = mockResponse();

      // Act
      const handler = (await import('@/pages/api/courses/[courseId]/reviews')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(405);
    });
  });
});
