const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/create', async (req, res) => {
  try {
    const {
      course_id,
      title,
      description,
      max_points,
      due_date,
      allowed_file_types,
      instructions
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO assignments_new 
       (course_id, title, description, max_points, due_date, allowed_file_types, instructions, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        course_id,
        title,
        description,
        max_points,
        due_date,
        JSON.stringify(allowed_file_types),
        instructions
      ]
    );

    res.json({
      success: true,
      message: 'Asignación creada exitosamente',
      assignment_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la asignación',
      error: error.message
    });
  }
});

router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const [assignments] = await db.execute(
      `SELECT a.*, c.title as course_title, c.code as course_code
       FROM assignments_new a
       JOIN courses c ON a.course_id = c.id
       WHERE a.course_id = ?
       ORDER BY a.due_date ASC`,
      [courseId]
    );

    const assignmentsWithParsedTypes = assignments.map(assignment => ({
      ...assignment,
      allowed_file_types: JSON.parse(assignment.allowed_file_types || '[]')
    }));

    res.json({
      success: true,
      assignments: assignmentsWithParsedTypes
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las asignaciones',
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [assignments] = await db.execute(
      `SELECT a.*, c.title as course_title, c.code as course_code
       FROM assignments_new a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = ?`,
      [id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    const assignment = assignments[0];
    assignment.allowed_file_types = JSON.parse(assignment.allowed_file_types || '[]');

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la asignación',
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      max_points,
      due_date,
      allowed_file_types,
      instructions
    } = req.body;

    const [result] = await db.execute(
      `UPDATE assignments_new 
       SET title = ?, description = ?, max_points = ?, due_date = ?, 
           allowed_file_types = ?, instructions = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title,
        description,
        max_points,
        due_date,
        JSON.stringify(allowed_file_types),
        instructions,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Asignación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la asignación',
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [submissions] = await db.execute(
      'SELECT COUNT(*) as count FROM submissions_new WHERE assignment_id = ?',
      [id]
    );

    if (submissions[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la asignación porque tiene entregas asociadas'
      });
    }

    const [result] = await db.execute('DELETE FROM assignments_new WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la asignación',
      error: error.message
    });
  }
});

module.exports = router;