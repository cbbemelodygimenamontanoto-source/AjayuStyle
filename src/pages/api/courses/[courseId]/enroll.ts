import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  enrollStudent, 
  getEnrolledStudents, 
  updateStudentProgress,
  getCourseById 
} from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { courseId } = req.query;
  
  if (!courseId || isNaN(Number(courseId))) {
    return res.status(400).json({ message: 'ID de curso inválido' });
  }

  try {
    // Verificar autenticación
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    if (req.method === 'GET') {
      // Obtener estudiantes inscritos en el curso
      const enrolledStudents = await getEnrolledStudents(String(courseId));
      
      return res.status(200).json({
        course_id: String(courseId),
        enrolled_students: enrolledStudents,
        total_enrolled: enrolledStudents.length
      });
    }

    if (req.method === 'POST') {
      // Inscribir estudiante en el curso
      const { student_id } = req.body;

      if (!student_id) {
        return res.status(400).json({ message: 'ID de estudiante es requerido' });
      }

      // Verificar que el curso existe
      const course = await getCourseById(String(courseId));
      if (!course) {
        return res.status(404).json({ message: 'Curso no encontrado' });
      }

      const enrollment = await enrollStudent(String(courseId), student_id);

      return res.status(201).json({
        message: 'Estudiante inscrito exitosamente',
        enrollment
      });
    }

    if (req.method === 'PUT') {
      // Actualizar progreso del estudiante
      const { 
        enrollment_id, 
        student_id, 
        progress_percentage 
      } = req.body;

      if (!enrollment_id || progress_percentage === undefined) {
        return res.status(400).json({ 
          message: 'ID de inscripción y porcentaje de progreso son requeridos' 
        });
      }

      if (progress_percentage < 0 || progress_percentage > 100) {
        return res.status(400).json({ 
          message: 'El porcentaje de progreso debe estar entre 0 y 100' 
        });
      }

      const updatedEnrollment = await updateStudentProgress(
        enrollment_id, 
        progress_percentage
      );

      return res.status(200).json({
        message: 'Progreso actualizado exitosamente',
        enrollment: updatedEnrollment
      });
    }

    if (req.method === 'DELETE') {
      // Desinscribir estudiante del curso
      const { student_id } = req.query;

      if (!student_id) {
        return res.status(400).json({ message: 'ID de estudiante es requerido' });
      }

      // Para desinscribir, necesitamos crear una función unenrollStudent
      // Por ahora retornamos un mensaje temporal
      return res.status(501).json({ 
        message: 'Desinscripción de estudiantes aún no implementada' 
      });
    }

    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API de inscripciones:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}