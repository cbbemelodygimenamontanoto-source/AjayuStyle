const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/enroll', async (req, res) => {
  try {
    const {
      course_id,
      student_id,
      enrolled_at
    } = req.body;

    const [course] = await db.execute(
      'SELECT id FROM courses WHERE id = ?',
      [course_id]
    );

    if (course.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }

    const [existingEnrollment] = await db.execute(
      'SELECT id FROM enrollments WHERE course_id = ? AND user_id = ?',
      [course_id, student_id]
    );

    if (existingEnrollment.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya estás inscrito en este curso'
      });
    }

    const [result] = await db.execute(
      `INSERT INTO enrollments 
       (course_id, student_id, enrolled_at, status, progress_percentage) 
       VALUES (?, ?, ?, 'active', 0)`,
      [course_id, student_id, enrolled_at]
    );

    res.json({
      success: true,
      message: 'Inscripción exitosa',
      enrollment_id: result.insertId
    });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inscribirse en el curso',
      error: error.message
    });
  }
});

router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const [enrollments] = await db.execute(
      `SELECT e.*, c.title as course_title, c.code as course_code,
              c.description as course_description, c.instructor_id,
              u.name as instructor_name, u.email as instructor_email
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON c.instructor_id = u.id
       WHERE e.student_id = ?
       ORDER BY e.enrolled_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      enrollments
    });
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los cursos inscritos',
      error: error.message
    });
  }
});

router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const [enrollments] = await db.execute(
      `SELECT e.*, u.name as student_name, u.email as student_email,
              u.id as student_id
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC`,
      [courseId]
    );

    res.json({
      success: true,
      enrollments
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiantes del curso',
      error: error.message
    });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'completed', 'dropped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de inscripción no válido. Use: active, completed, o dropped'
      });
    }

    const [result] = await db.execute(
      'UPDATE enrollments SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado de inscripción actualizado'
    });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [submissions] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.id
       JOIN enrollments e ON a.course_id = e.course_id
       WHERE e.id = ?`,
      [id]
    );

    if (submissions[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desinscribirte porque tienes entregas asociadas a este curso'
      });
    }

    const [result] = await db.execute('DELETE FROM enrollments WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Desinscripción exitosa'
    });
  } catch (error) {
    console.error('Error unenrolling student:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desinscribirse del curso',
      error: error.message
    });
  }
});

router.get('/student/:studentId/course/:courseId/progress', async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const [progress] = await db.execute(
      `SELECT 
         COUNT(DISTINCT a.id) as total_assignments,
         COUNT(g.id) as completed_assignments,
         SUM(g.score) as total_points_earned,
         SUM(a.max_points) as total_possible_points,
         ROUND(
           (SUM(g.score) / SUM(a.max_points)) * 100, 2
         ) as overall_percentage,
         COUNT(CASE WHEN g.score >= a.max_points * 0.71 THEN 1 END) as passing_assignments,
         CASE 
           WHEN SUM(a.max_points) > 0 AND (SUM(g.score) / SUM(a.max_points)) * 100 >= 71 
           THEN 'passed'
           ELSE 'not_passed'
         END as course_status
       FROM assignments a
       LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
       LEFT JOIN grades g ON s.id = g.submission_id
       WHERE a.course_id = ?`,
      [studentId, courseId]
    );

    res.json({
      success: true,
      progress: progress[0]
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el progreso',
      error: error.message
    });
  }
});

router.get('/course/:courseId/stats', async (req, res) => {
  try {
    const { courseId } = req.params;

    const [stats] = await db.execute(
      `SELECT 
         COUNT(*) as total_enrolled,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
         COUNT(CASE WHEN status = 'dropped' THEN 1 END) as dropped_count
       FROM enrollments 
       WHERE course_id = ?`,
      [courseId]
    );

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Error fetching enrollment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

module.exports = router;