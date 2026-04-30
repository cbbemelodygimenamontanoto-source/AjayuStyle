import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import { getDbConnection } from '@/lib/database';

interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { courseId } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const connection = await getDbConnection();

    // Verificar que el usuario esté inscrito en el curso
    const [enrollmentRows] = await connection.execute(
      'SELECT id FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [user.id, courseId]
    );

    if (enrollmentRows.length === 0) {
      await connection.end();
      return res.status(403).json({ message: 'No estás inscrito en este curso' });
    }

    // Obtener assignments del curso con submissions del estudiante
    const [assignments] = await connection.execute(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.instructions,
        a.due_date,
        a.max_score,
        a.course_id,
        a.created_at,
        s.id as submission_id,
        s.file_url,
        s.text_submission,
        s.submitted_at,
        s.score,
        s.feedback,
        s.status as submission_status
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE a.course_id = ?
      ORDER BY a.created_at DESC
    `, [user.id, courseId]);

    // Procesar las assignments
    const processedAssignments = assignments.map((assignment: any) => ({
      ...assignment,
      submission: assignment.submission_id ? {
        id: assignment.submission_id,
        assignment_id: assignment.id,
        student_id: user.id,
        file_url: assignment.file_url,
        text_submission: assignment.text_submission,
        submitted_at: assignment.submitted_at,
        score: assignment.score,
        feedback: assignment.feedback,
        status: assignment.submission_status
      } : null
    }));

    await connection.end();

    res.status(200).json({
      assignments: processedAssignments
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}