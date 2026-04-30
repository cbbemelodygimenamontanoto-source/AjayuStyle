const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/submit', async (req, res) => {
  try {
    const {
      assignment_id,
      student_id,
      file_path,
      file_name,
      file_type,
      submission_text,
      submitted_at
    } = req.body;

    const [enrollment] = await db.execute(
      `SELECT e.id FROM enrollments_new e
       JOIN assignments_new a ON e.course_id = a.course_id
       WHERE e.user_id = ? AND a.id = ? AND e.status IN ('enrolled', 'active')`,
      [student_id, assignment_id]
    );

    if (enrollment.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No estás inscrito en este curso'
      });
    }

    const [assignment] = await db.execute(
      'SELECT * FROM assignments_new WHERE id = ?',
      [assignment_id]
    );

    if (assignment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    const [existingSubmission] = await db.execute(
      'SELECT id FROM submissions_new WHERE assignment_id = ? AND student_id = ?',
      [assignment_id, student_id]
    );

    if (existingSubmission.length > 0) {
      const [result] = await db.execute(
        `UPDATE submissions_new 
         SET file_path = ?, file_name = ?, file_type = ?, submission_text = ?, 
             submitted_at = ?, status = 'submitted', updated_at = NOW()
         WHERE assignment_id = ? AND student_id = ?`,
        [
          file_path,
          file_name,
          file_type,
          submission_text,
          submitted_at,
          assignment_id,
          student_id
        ]
      );

      res.json({
        success: true,
        message: 'Entrega actualizada exitosamente',
        submission_id: existingSubmission[0].id
      });
    } else {
      const [result] = await db.execute(
        `INSERT INTO submissions_new 
         (assignment_id, student_id, file_path, file_name, file_type, 
          submission_text, submitted_at, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', NOW())`,
        [
          assignment_id,
          student_id,
          file_path,
          file_name,
          file_type,
          submission_text,
          submitted_at
        ]
      );

      res.json({
        success: true,
        message: 'Tarea entregada exitosamente',
        submission_id: result.insertId
      });
    }
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al entregar la tarea',
      error: error.message
    });
  }
});

router.get('/assignment/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const [submissions] = await db.execute(
      `SELECT s.*, u.name as student_name, u.email as student_email,
              a.title as assignment_title, a.max_points
       FROM submissions_new s
       JOIN users u ON s.student_id = u.id
       JOIN assignments_new a ON s.assignment_id = a.id
       WHERE s.assignment_id = ?
       ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las entregas',
      error: error.message
    });
  }
});

router.get('/student/:studentId/assignment/:assignmentId', async (req, res) => {
  try {
    const { studentId, assignmentId } = req.params;

    const [submissions] = await db.execute(
      `SELECT s.*, a.title as assignment_title, a.max_points, a.due_date
       FROM submissions_new s
       JOIN assignments_new a ON s.assignment_id = a.id
       WHERE s.student_id = ? AND s.assignment_id = ?`,
      [studentId, assignmentId]
    );

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching student submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la entrega',
      error: error.message
    });
  }
});

router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const [submissions] = await db.execute(
      `SELECT s.*, a.title as assignment_title, a.max_points, a.due_date,
              c.title as course_title, c.code as course_code,
              g.score, g.feedback, g.graded_at
       FROM submissions_new s
       JOIN assignments_new a ON s.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       LEFT JOIN grades_new g ON s.id = g.submission_id
       WHERE s.student_id = ?
       ORDER BY s.submitted_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching student submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las entregas del estudiante',
      error: error.message
    });
  }
});

router.put('/:id/mark-late', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `UPDATE submissions_new 
       SET status = 'late', updated_at = NOW()
       WHERE id = ? AND status = 'submitted'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission no encontrada o ya fue actualizada'
      });
    }

    res.json({
      success: true,
      message: 'Submission marcada como tardía'
    });
  } catch (error) {
    console.error('Error marking submission as late:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar como tardía',
      error: error.message
    });
  }
});

module.exports = router;