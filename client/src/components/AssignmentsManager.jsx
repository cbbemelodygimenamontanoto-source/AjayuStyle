import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AssignmentsManager = ({ courseId }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    max_points: 100,
    due_date: '',
    allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
    instructions: ''
  });

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/assignments/course/${courseId}`);
      if (response.data.success) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (assignment = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        title: assignment.title,
        description: assignment.description,
        max_points: assignment.max_points,
        due_date: assignment.due_date?.split('T')[0] || '',
        allowed_file_types: assignment.allowed_file_types || [],
        instructions: assignment.instructions || ''
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        title: '',
        description: '',
        max_points: 100,
        due_date: '',
        allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
        instructions: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      max_points: 100,
      due_date: '',
      allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
      instructions: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileTypesChange = (type) => {
    const currentTypes = formData.allowed_file_types;
    let newTypes;
    
    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }
    
    setFormData(prev => ({
      ...prev,
      allowed_file_types: newTypes
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setSuccess('');

      if (editingAssignment) {
        // Actualizar asignación existente
        const response = await axios.put(`/api/assignments/${editingAssignment.id}`, formData);
        if (response.data.success) {
          setSuccess('Asignación actualizada exitosamente');
          fetchAssignments();
          handleCloseDialog();
        }
      } else {
        // Crear nueva asignación
        const response = await axios.post('/api/assignments/create', {
          ...formData,
          course_id: courseId
        });
        if (response.data.success) {
          setSuccess('Asignación creada exitosamente');
          fetchAssignments();
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      setError(error.response?.data?.message || 'Error al guardar la asignación');
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta asignación?')) {
      try {
        setError('');
        const response = await axios.delete(`/api/assignments/${assignmentId}`);
        if (response.data.success) {
          setSuccess('Asignación eliminada exitosamente');
          fetchAssignments();
        }
      } catch (error) {
        console.error('Error deleting assignment:', error);
        setError(error.response?.data?.message || 'Error al eliminar la asignación');
      }
    }
  };

  const handleMenuClick = (event, assignment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssignment(null);
  };

  const handleViewSubmissions = () => {
    // Navegar a submissions del assignment
    window.location.href = `/instructor/assignments/${selectedAssignment.id}/submissions`;
    handleMenuClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeColor = (type) => {
    const colors = {
      'pdf': 'error',
      'doc': 'primary',
      'docx': 'primary',
      'txt': 'secondary',
      'jpg': 'success',
      'png': 'success'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando asignaciones...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Gestión de Asignaciones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#4CAF50' }}
        >
          Nueva Asignación
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Assignments Table */}
      <Card>
        <CardContent>
          {assignments.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No hay asignaciones creadas aún
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Título</strong></TableCell>
                    <TableCell><strong>Puntos Máx.</strong></TableCell>
                    <TableCell><strong>Fecha Límite</strong></TableCell>
                    <TableCell><strong>Tipos de Archivo</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {assignment.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {assignment.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={assignment.max_points} 
                          color="primary" 
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(assignment.due_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {assignment.allowed_file_types.map((type) => (
                            <Chip
                              key={type}
                              label={type.toUpperCase()}
                              color={getFileTypeColor(type)}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Activa"
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, assignment)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Menu de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewSubmissions}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Entregas
        </MenuItem>
        <MenuItem onClick={() => {
          handleOpenDialog(selectedAssignment);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleDelete(selectedAssignment.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Dialog de creación/edición */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAssignment ? 'Editar Asignación' : 'Nueva Asignación'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título de la Asignación"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Puntuación Máxima"
                name="max_points"
                type="number"
                value={formData.max_points}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha Límite"
                name="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Tipos de Archivo Permitidos
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'].map((type) => (
                  <Chip
                    key={type}
                    label={type.toUpperCase()}
                    clickable
                    color={formData.allowed_file_types.includes(type) ? 'primary' : 'default'}
                    variant={formData.allowed_file_types.includes(type) ? 'filled' : 'outlined'}
                    onClick={() => handleFileTypesChange(type)}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instrucciones Adicionales"
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{ bgcolor: '#4CAF50' }}
          >
            {editingAssignment ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignmentsManager;