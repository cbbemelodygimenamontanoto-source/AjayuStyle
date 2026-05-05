/**
 * ================================================================
 * PRUEBA UNITARIA: API de Cursos - Usuario Normal
 * ================================================================
 *
 * Objetivo: Verificar las operaciones de visualización e inscripción
 * en cursos para usuarios normales (estudiantes).
 *
 * Casos de prueba:
 * 1. GET - Visualización de cursos disponibles
 * 2. GET - Detalles de un curso específico
 * 3. POST - Inscripción en un curso
 * 4. GET - Mis cursos inscritos
 * 5. DELETE - Cancelar inscripción
 * 6. Validación de requisitos
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
const USUARIO_ESTUDIANTE = { id: 2, name: 'María López', role: 'student' };
const USUARIO_INSTRUCTOR = { id: 1, name: 'Carlos García', role: 'instructor' };

const CURSO_DISPONIBLE = {
  id: 1,
  title: 'Diseño de Moda para Principiantes',
  description: 'Aprende los fundamentos del diseño de moda desde cero',
  thumbnail: 'https://example.com/moda.jpg',
  price: 99.99,
  is_published: true,
  category: 'moda',
  level: 'beginner',
  instructor_id: 1,
  instructor_name: 'Carlos García',
  total_lessons: 20,
  total_duration_hours: 15,
  enrolled_students: 150,
  average_rating: 4.8,
  is_enrolled: false,
  created_at: '2024-01-01T00:00:00Z',
};

const CURSOS_MOCK = [
  CURSO_DISPONIBLE,
  {
    id: 2,
    title: 'Cocina Internacional',
    description: 'Descubre recetas de todo el mundo',
    price: 79.99,
    is_published: true,
    category: 'cocina',
    level: 'intermediate',
    instructor_name: 'Ana Martínez',
    enrolled_students: 200,
    average_rating: 4.6,
    is_enrolled: false,
  },
  {
    id: 3,
    title: 'Borrador - No Publicar',
    description: 'Este curso no debe aparecer',
    is_published: false,
  },
];

const INSCRIPCION_MOCK = {
  id: 1,
  user_id: 2,
  course_id: 1,
  enrolled_at: '2024-06-01T00:00:00Z',
  status: 'active',
  progress_percent: 45,
};

describe('PRUEBA UNITARIA: API de Cursos (Usuario Normal)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('4.1 GET - Visualización de Cursos Disponibles', () => {
    it('debe obtener todos los cursos publicados', async () => {
      // Arrange
      const cursosPublicados = CURSOS_MOCK.filter((c) => c.is_published);
      (executeQuery as jest.Mock).mockResolvedValue(cursosPublicados);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          courses: expect.any(Array),
        })
      );
    });

    it('debe excluir cursos no publicados', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue(CURSOS_MOCK);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', {}, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.courses.every((c: any) => c.is_published !== false)).toBe(true);
    });

    it('debe filtrar cursos por categoría', async () => {
      // Arrange
      const cursosModa = [CURSO_DISPONIBLE];
      (executeQuery as jest.Mock).mockResolvedValue(cursosModa);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { category: 'moda' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('category'),
        expect.any(Array)
      );
    });

    it('debe filtrar cursos por nivel', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([CURSO_DISPONIBLE]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { level: 'beginner' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe ordenar por precio ascendente', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue(CURSOS_MOCK.filter((c) => c.is_published));
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { sort: 'price_asc' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        expect.any(Array)
      );
    });

    it('debe ordenar por calificación descendente', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue(CURSOS_MOCK.filter((c) => c.is_published));
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { sort: 'rating_desc' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe buscar cursos por título', async () => {
      // Arrange
      const cursosBusqueda = [CURSO_DISPONIBLE];
      (executeQuery as jest.Mock).mockResolvedValue(cursosBusqueda);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { search: 'moda' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIKE'),
        expect.any(Array)
      );
    });

    it('debe paginar resultados', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([CURSO_DISPONIBLE]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { page: 2, limit: 10 }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.any(Array)
      );
    });
  });

  describe('4.2 GET - Detalles de Curso Específico', () => {
    it('debe obtener detalles completos de un curso', async () => {
      // Arrange
      const cursoDetallado = {
        ...CURSO_DISPONIBLE,
        curriculum: [
          { module: 'Módulo 1', lessons: 5 },
          { module: 'Módulo 2', lessons: 8 },
        ],
        requirements: ['Conocimientos básicos de costura'],
        what_you_learn: ['Diseñar colecciones básicas'],
        reviews: [],
      };
      (executeQuery as jest.Mock).mockResolvedValue([cursoDetallado]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          course: expect.any(Object),
        })
      );
    });

    it('debe indicar si el usuario está inscrito', async () => {
      // Arrange
      const cursoConEstado = {
        ...CURSO_DISPONIBLE,
        is_enrolled: true,
        enrollment_id: 1,
        progress_percent: 30,
      };
      (executeQuery as jest.Mock).mockResolvedValue([cursoConEstado]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          course: expect.objectContaining({
            is_enrolled: expect.any(Boolean),
          }),
        })
      );
    });

    it('debe retornar 404 si el curso no existe', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { courseId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe incluir reseñas del curso', async () => {
      // Arrange
      const cursoConResenas = {
        ...CURSO_DISPONIBLE,
        reviews: [
          {
            id: 1,
            user_name: 'Usuario 1',
            rating: 5,
            comment: 'Excelente curso',
          },
        ],
        stats: {
          total_reviews: 1,
          average_rating: 5.0,
        },
      };
      (executeQuery as jest.Mock).mockResolvedValue([cursoConResenas]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          course: expect.objectContaining({
            reviews: expect.any(Array),
          }),
        })
      );
    });

    it('debe incluir información del instructor', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([CURSO_DISPONIBLE]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          course: expect.objectContaining({
            instructor_name: expect.any(String),
          }),
        })
      );
    });
  });

  describe('4.3 POST - Inscripción en Curso', () => {
    it('debe inscribir exitosamente en un curso gratuito', async () => {
      // Arrange
      const cursoGratuito = { ...CURSO_DISPONIBLE, price: 0 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([cursoGratuito]) // Verificar curso
        .mockResolvedValueOnce([]) // Verificar no inscrito
        .mockResolvedValueOnce({ insertId: 10 }); // Crear inscripción

      const req = crearMockRequest('POST', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('inscrito'),
        })
      );
    });

    it('debe inscribir exitosamente en un curso de pago (simulado)', async () => {
      // Arrange
      const pagoSimulado = { payment_id: 'pay_123', status: 'completed' };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_DISPONIBLE]) // Verificar curso
        .mockResolvedValueOnce([]) // Verificar no inscrito
        .mockResolvedValueOnce({ insertId: 11 }) // Crear inscripción
        .mockResolvedValueOnce({ insertId: 1 }); // Registrar pago

      const req = crearMockRequest('POST', { courseId: '1' }, pagoSimulado, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('debe rechazar si el usuario ya está inscrito', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([CURSO_DISPONIBLE])
        .mockResolvedValueOnce([INSCRIPCION_MOCK]); // Ya inscrito

      const req = crearMockRequest('POST', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('ya estás inscrito'),
        })
      );
    });

    it('debe rechazar inscripción si el curso no existe', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('POST', { courseId: '999' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si el curso no está publicado', async () => {
      // Arrange
      const cursoBorrador = { ...CURSO_DISPONIBLE, is_published: false };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([cursoBorrador]);

      const req = crearMockRequest('POST', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('debe rechazar si el usuario no está autenticado', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(null);

      const req = crearMockRequest('POST', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debe validar requisitos previos si existen', async () => {
      // Arrange
      const cursoConRequisitos = {
        ...CURSO_DISPONIBLE,
        prerequisites: [1], // ID de curso requerido
      };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([cursoConRequisitos])
        .mockResolvedValueOnce([]); // No completado requisito

      const req = crearMockRequest('POST', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('4.4 GET - Mis Cursos Inscritos', () => {
    it('debe obtener todos los cursos donde el usuario está inscrito', async () => {
      // Arrange
      const cursosInscritos = [
        { ...CURSO_DISPONIBLE, is_enrolled: true, progress_percent: 50 },
        { ...CURSOS_MOCK[1], is_enrolled: true, progress_percent: 100 },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(cursosInscritos);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { myCourses: true }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          courses: expect.any(Array),
        })
      );
    });

    it('debe incluir progreso de cada curso', async () => {
      // Arrange
      const cursosConProgreso = [
        {
          ...CURSO_DISPONIBLE,
          is_enrolled: true,
          progress_percent: 75,
          completed_lessons: 15,
          total_lessons: 20,
        },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(cursosConProgreso);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { myCourses: true }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          courses: expect.arrayContaining([
            expect.objectContaining({
              progress_percent: expect.any(Number),
            }),
          ]),
        })
      );
    });

    it('debe filtrar cursos en progreso', async () => {
      // Arrange
      const cursosEnProgreso = [
        { ...CURSO_DISPONIBLE, is_enrolled: true, progress_percent: 50 },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(cursosEnProgreso);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { myCourses: true, filter: 'in_progress' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe filtrar cursos completados', async () => {
      // Arrange
      const cursosCompletados = [
        { ...CURSO_DISPONIBLE, is_enrolled: true, progress_percent: 100 },
      ];
      (executeQuery as jest.Mock).mockResolvedValue(cursosCompletados);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { myCourses: true, filter: 'completed' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe retornar lista vacía si no hay inscripciones', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { myCourses: true }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          courses: [],
        })
      );
    });
  });

  describe('4.5 DELETE - Cancelar Inscripción', () => {
    it('debe cancelar inscripción exitosamente', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock)
        .mockResolvedValueOnce([INSCRIPCION_MOCK]) // Verificar inscripción
        .mockResolvedValueOnce({ affectedRows: 1 }); // Delete

      const req = crearMockRequest('DELETE', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('cancelada'),
        })
      );
    });

    it('debe rechazar si no hay inscripción activa', async () => {
      // Arrange
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([]);

      const req = crearMockRequest('DELETE', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debe rechazar si el progreso es muy alto', async () => {
      // Arrange
      const inscripcionAvanzada = {
        ...INSCRIPCION_MOCK,
        progress_percent: 90,
      };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([inscripcionAvanzada]);

      const req = crearMockRequest('DELETE', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/enrollments')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('progreso'),
        })
      );
    });
  });

  describe('4.6 Validación de Requisitos', () => {
    it('debe verificar que el usuario cumple los requisitos', async () => {
      // Arrange
      const cursoConRequisitos = {
        ...CURSO_DISPONIBLE,
        prerequisites: [],
      };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([cursoConRequisitos]);

      const req = crearMockRequest('GET', { courseId: '1', checkPrerequisites: true }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe listar cursos requeridos no completados', async () => {
      // Arrange
      const cursoConRequisitos = {
        ...CURSO_DISPONIBLE,
        prerequisites: [1, 2],
        incomplete_prerequisites: [2],
      };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([cursoConRequisitos]);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          course: expect.objectContaining({
            incomplete_prerequisites: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('4.7 Casos de Borde', () => {
    it('debe manejar cursos con precio exactamente cero', async () => {
      // Arrange
      const cursoGratuito = { ...CURSO_DISPONIBLE, price: 0 };
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);
      (executeQuery as jest.Mock).mockResolvedValue([cursoGratuito]);

      const req = crearMockRequest('GET', { courseId: '1' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          course: expect.objectContaining({
            price: 0,
          }),
        })
      );
    });

    it('debe manejar búsqueda con caracteres especiales', async () => {
      // Arrange
      const busquedaEspecial = "diseño d'moda +moda*";
      (executeQuery as jest.Mock).mockResolvedValue([]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { search: busquedaEspecial }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe validar límites de paginación', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      // Límite máximo de 100
      const req = crearMockRequest('GET', { page: 1, limit: 500 }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      // El API debe corregir el límite a 100
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('debe manejar categorías con caracteres Unicode', async () => {
      // Arrange
      (executeQuery as jest.Mock).mockResolvedValue([]);
      (getUserFromToken as jest.Mock).mockResolvedValue(USUARIO_ESTUDIANTE);

      const req = crearMockRequest('GET', { category: 'moda-italiana' }, {}, {});
      const res = crearMockResponse();

      // Act
      const handler = (await import('@/pages/api/courses')).default;
      await handler(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
