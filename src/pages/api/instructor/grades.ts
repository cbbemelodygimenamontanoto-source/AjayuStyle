import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getUserFromToken(req);

  if (!user) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  // Verificar que el usuario sea instructor
  const isInstructor = user.roles?.some(role => role.name === 'instructor');
  if (!isInstructor) {
    return res.status(403).json({ message: 'Solo los instructores pueden calificar tareas' });
  }

  try {
    if (req.method === 'GET') {
      // Obtener submissions pendientes de calificar
      const { status = 'pending', courseId } = req.query;

      // Usar la misma consulta que el endpoint de submissions
      let query = `
        SELECT 
          asub.id,
          asub.user_id,
          asub.assignment_id,
          asub.text_submission,
          asub.file_url,
          asub.submitted_at,
          asub.grade,
          asub.feedback,
          asub.graded_at,
          u.name as user_name,
          c.title as course_title,
          c.id as course_id,
          l.title as lesson_title,
          a.title as assignment_title,
          a.max_points,
          CASE 
            WHEN asub.grade IS NOT NULL THEN 'graded'
            ELSE 'pending'
          END as status
        FROM assignment_submissions asub
        JOIN users u ON asub.user_id = u.id
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN lessons l ON a.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        WHERE c.instructor_id = ?
      `;

      const queryParams = [user.id];

      // Filtrar por estado
      if (status !== 'all') {
        if (status === 'pending') {
          query += ' AND asub.grade IS NULL';
        } else if (status === 'graded') {
          query += ' AND asub.grade IS NOT NULL';
        }
      }

      // Filtrar por curso si se especifica
      if (courseId) {
        query += ' AND c.id = ?';
        queryParams.push(parseInt(courseId as string));
      }

      query += ' ORDER BY asub.submitted_at DESC';

      console.log('🔍 Consultando grades para instructor:', user.id);

      const submissions = await executeQuery(query, queryParams);

      console.log(`✅ Encontradas ${submissions.length} submissions para calificar`);

      return res.status(200).json(submissions);
    }

    if (req.method === 'POST') {
      // Calificar una submission
      const { submissionId, grade, feedback } = req.body;

      if (!submissionId || grade === undefined) {
        return res.status(400).json({ message: 'Datos incompletos' });
      }

      // Validar calificación
      if (grade < 0 || grade > 100) {
        return res.status(400).json({ message: 'La calificación debe estar entre 0 y 100' });
      }

      console.log(`📝 Calificando submission ${submissionId} con nota ${grade}`);

      // Actualizar la submission en la base de datos
      await executeQuery(`
        UPDATE assignment_submissions 
        SET 
          grade = ?,
          feedback = ?,
          graded_at = NOW(),
          graded_by = ?
        WHERE id = ?
      `, [grade, feedback || '', user.id, submissionId]);

      console.log(`✅ Submission ${submissionId} calificada exitosamente`);

      return res.status(200).json({
        message: 'Tarea calificada exitosamente',
        success: true
      });
    }

    return res.status(405).json({ message: 'Método no permitido' });
  } catch (error) {
    console.error('Error en grades API:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}