import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  createAssignment, 
  getAssignmentsByCourse, 
  getAssignmentById, 
  updateAssignment, 
  deleteAssignment,
  canUserManageCourse
} from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

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
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    // Verificar permisos - solo instructor o admin pueden gestionar tareas
    const canManage = await canUserManageCourse(user.id, String(courseId));
    if (!canManage) {
      return res.status(403).json({ message: 'No tienes permisos para gestionar tareas de este curso' });
    }

    if (req.method === 'GET') {
      // Obtener tareas del curso
      const assignments = await getAssignmentsByCourse(String(courseId));
      return res.status(200).json(assignments);
    }

    if (req.method === 'POST') {
      // Crear nueva tarea
      const {
        lesson_id,
        title,
        description,
        file_types_allowed,
        max_file_size_mb,
        due_date,
        points_possible
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({ message: 'Título y descripción son requeridos' });
      }

      // Convertir array de tipos de archivo a string separado por comas
      const fileTypesString = Array.isArray(file_types_allowed) 
        ? file_types_allowed.join(',')
        : (file_types_allowed || 'pdf,docx,txt');

      const assignment = await createAssignment({
        course_id: String(courseId),
        lesson_id: lesson_id || null,
        title,
        description,
        file_types_allowed: fileTypesString,
        max_file_size_mb: max_file_size_mb || 10,
        due_date: due_date ? new Date(due_date) : null,
        points_possible: points_possible || 100
      });

      return res.status(201).json({
        message: 'Tarea creada exitosamente',
        assignment
      });
    }

    return res.status(405).json({ message: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en API de tareas:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}