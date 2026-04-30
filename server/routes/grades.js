const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/grade', async (req, res) => {
  try {
    const {
      submission_id,
      instructor_id,
      score,
      feedback,
      graded_at
    } = req.body;

    const [submission] = await db.execute(
      'SELECT * FROM submissions_new WHERE id = ?',
      [submission_id]
    );

    if (submission.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada'
      });
    }

    const [existingGrade] = await db.execute(
      'SELECT id FROM grades_new WHERE submission_id = ?',
      [submission_id]
    );

    if (existingGrade.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Esta entrega ya fue calificada'
      });
    }

    const [assignment] = await db.execute(
      'SELECT max_points FROM assignments_new WHERE id = ?',
      [submission[0].assignment_id]
    );

    if (score < 0 || score > assignment[0].max_points) {
      return res.status(400).json({
        success: false,
        message: `La calificación debe estar entre 0 y ${assignment[0].max_points} puntos`
      });
    }

    const [result] = await db.execute(
      `INSERT INTO grades_new 
       (submission_id, instructor_id, score, feedback, graded_at, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [submission_id, instructor_id, score, feedback, graded_at]
    );

    await db.execute(
      'UPDATE submissions_new SET status = ?, updated_at = NOW() WHERE id = ?',
      ['graded', submission_id]
    );

    res.json({
      success: true,
      message: 'Calificación guardada exitosamente',
      grade_id: result.insertId
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calificar la entrega',
      error: error.message
    });
  }
});

router.get('/submission/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;

    const [grades] = await db.execute(
      `SELECT g.*, u.name as instructor_name, 
              a.title as assignment_title, a.max_points,
              s.file_name, s.submitted_at
       FROM grades_new g
       JOIN users u ON g.instructor_id = u.id
       JOIN submissions_new s ON g.submission_id = s.id
       JOIN assignments_new a ON s.assignment_id = a.id
       WHERE g.submission_id = ?`,
      [submissionId]
    );

    if (grades.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    res.json({
      success: true,
      grade: grades[0]
    });
  } catch (error) {
    console.error('Error fetching grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la calificación',
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback, graded_at } = req.body;

    const [grade] = await db.execute(
      'SELECT * FROM grades_new WHERE id = ?',
      [id]
    );

    if (grade.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    const [submission] = await db.execute(
      `SELECT a.max_points FROM submissions_new s
       JOIN assignments_new a ON s.assignment_id = a.id
       WHERE s.id = ?`,
      [grade[0].submission_id]
    );

    if (score < 0 || score > submission[0].max_points) {
      return res.status(400).json({
        success: false,
        message: `La calificación debe estar entre 0 y ${submission[0].max_points} puntos`
      });
    }

    const [result] = await db.execute(
      `UPDATE grades_new 
       SET score = ?, feedback = ?, graded_at = ?, updated_at = NOW()
       WHERE id = ?`,
      [score, feedback, graded_at, id]
    );

    res.json({
      success: true,
      message: 'Calificación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la calificación',
      error: error.message
    });
  }
});

router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const [grades] = await db.execute(
      `SELECT g.*, a.title as assignment_title, a.max_points, a.due_date,
              c.title as course_title, c.code as course_code,
              u.name as instructor_name, s.file_name, s.submitted_at
       FROM grades_new g
       JOIN submissions_new s ON g.submission_id = s.id
       JOIN assignments_new a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       JOIN users u ON g.instructor_id = u.id
       WHERE s.student_id = ?
       ORDER BY g.graded_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      grades
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las calificaciones del estudiante',
      error: error.message
    });
  }
});

router.get('/course/:courseId/stats', async (req, res) => {
  try {
    const { courseId } = req.params;

    const [stats] = await db.execute(
      `SELECT 
         COUNT(g.id) as total_graded,
         AVG(g.score) as average_score,
         MAX(g.score) as highest_score,
         MIN(g.score) as lowest_score,
         COUNT(CASE WHEN g.score >= a.max_points * 0.9 THEN 1 END) as excellent_grades,
         COUNT(CASE WHEN g.score >= a.max_points * 0.7 AND g.score < a.max_points * 0.9 THEN 1 END) as good_grades,
         COUNT(CASE WHEN g.score < a.max_points * 0.7 THEN 1 END) as poor_grades
       FROM grades_new g
       JOIN submissions_new s ON g.submission_id = s.id
       JOIN assignments_new a ON s.assignment_id = a.id
       WHERE a.course_id = ?`,
      [courseId]
    );

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Error fetching course grade stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del curso',
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
       FROM assignments_new a
       LEFT JOIN submissions_new s ON a.id = s.assignment_id AND s.student_id = ?
       LEFT JOIN grades_new g ON s.id = g.submission_id
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
      message: 'Error al obtener el progreso del estudiante',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [grade] = await db.execute(
      'SELECT submission_id FROM grades_new WHERE id = ?',
      [id]
    );

    if (grade.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calificación no encontrada'
      });
    }

    const [result] = await db.execute('DELETE FROM grades_new WHERE id = ?', [id]);

    await db.execute(
      'UPDATE submissions_new SET status = ?, updated_at = NOW() WHERE id = ?',
      ['submitted', grade[0].submission_id]
    );

    res.json({
      success: true,
      message: 'Calificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la calificación',
      error: error.message
    });
  }
});

module.exports = router;