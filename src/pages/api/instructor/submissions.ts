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

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Método no permitido' });
    }

    // Verificar que el usuario sea instructor
    const isInstructor = user.roles?.some(role => role.name === 'instructor');
    if (!isInstructor) {
      return res.status(403).json({ message: 'Solo los instructores pueden gestionar tareas' });
    }

    const { status = 'pending', courseId } = req.query;

    // Construir consulta SQL para obtener submissions reales
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
        u.email as user_email,
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

    console.log('🔍 Consultando submissions para instructor:', user.id);

    const submissions = await executeQuery(query, queryParams);

    console.log(`✅ Encontradas ${submissions.length} submissions`);

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Error en submissions management:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}