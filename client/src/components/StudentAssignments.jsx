import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  Upload as UploadIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const StudentAssignments = ({ courseId }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Submission state
  const [submissionData, setSubmissionData] = useState({
    file: null,
    file_name: '',
    submission_text: '',
    submitted_at: new Date().toISOString().slice(0, 16)
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

  const handleOpenDialog = (assignment) => {
    setSelectedAssignment(assignment);
    // Cargar submission existente si existe
    fetchSubmission(assignment.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAssignment(null);
    setSubmissionData({
      file: null,
      file_name: '',
      submission_text: '',
      submitted_at: new Date().toISOString().slice(0, 16)
    });
  };

  const fetchSubmission = async (assignmentId) => {
    try {
      const response = await axios.get(`/api/submissions/student/${user.id}/assignment/${assignmentId}`);
      if (response.data.success && response.data.submissions.length > 0) {
        const submission = response.data.submissions[0];
        setSubmissionData({
          file: null, // No podemos cargar el archivo de nuevo
          file_name: submission.file_name || '',
          submission_text: submission.submission_text || '',
          submitted_at: submission.submitted_at || new Date().toISOString().slice(0, 16)
        });
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Verificar tipo de archivo
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (selectedAssignment.allowed_file_types.includes(fileExtension)) {
        setSubmissionData(prev => ({
          ...prev,
          file: file,
          file_name: file.name
        }));
        setError('');
      } else {
        setError(`Tipo de archivo no permitido. Tipos permitidos: ${selectedAssignment.allowed_file_types.join(', ').toUpperCase()}`);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSubmissionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setSuccess('');
      setUploading(true);

      if (!submissionData.file && !submissionData.submission_text.trim()) {
        setError('Debes subir un archivo o escribir un texto de entrega');
        setUploading(false);
        return;
      }

      let file_path = '';
      let file_type = '';

      // Simular subida de archivo (en producción usar AWS S3 o similar)
      if (submissionData.file) {
        // Aquí iría la lógica real de subida de archivos
        file_path = `/uploads/${submissionData.file.name}`;
        file_type = submissionData.file.name.split('.').pop().toLowerCase();
      }

      const response = await axios.post('/api/submissions/submit', {
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        file_path,
        file_name: submissionData.file_name,
        file_type,
        submission_text: submissionData.submission_text,
        submitted_at: submissionData.submitted_at
      });

      if (response.data.success) {
        setSuccess('Tarea entregada exitosamente');
        fetchAssignments();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setError(error.response?.data?.message || 'Error al entregar la tarea');
    } finally {
      setUploading(false);
    }
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

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getAssignmentStatus = (assignment) => {
    // Esta lógica se completaría con datos reales de submissions
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    
    if (dueDate < now) {
      return { status: 'overdue', color: 'error', icon: <WarningIcon /> };
    }
    
    // Verificar si ya fue entregado
    // En una implementación real, esto vendría de la API
    return { status: 'pending', color: 'warning', icon: <ScheduleIcon /> };
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Mis Tareas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Entrega tus tareas y revisa tu progreso académico
        </Typography>
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

      {/* Assignments Grid */}
      {assignments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No hay tareas disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Las tareas de este curso aparecerán aquí
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {assignments.map((assignment) => {
            const statusInfo = getAssignmentStatus(assignment);
            const daysRemaining = getDaysRemaining(assignment.due_date);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={assignment.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderLeft: `4px solid`,
                    borderLeftColor: `${statusInfo.color}.main`,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                >
                  <CardHeader
                    avatar={
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                        color={statusInfo.color}
                        size="small"
                      />
                    }
                    title={
                      <Typography variant="h6" noWrap>
                        {assignment.title}
                      </Typography>
                    }
                    subheader={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {assignment.max_points} puntos
                        </Typography>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {assignment.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Fecha límite:</strong> {formatDate(assignment.due_date)}
                        </Typography>
                      </Box>
                      
                      {daysRemaining !== null && (
                        <Chip
                          label={
                            daysRemaining > 0 
                              ? `${daysRemaining} días restantes`
                              : daysRemaining === 0
                                ? 'Vence hoy'
                                : 'Vencida'
                          }
                          color={daysRemaining > 0 ? 'success' : daysRemaining === 0 ? 'warning' : 'error'}
                          size="small"
                          sx={{ ml: 4 }}
                        />
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Tipos de archivo:</strong>
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {assignment.allowed_file_types.map((type) => (
                          <Chip
                            key={type}
                            label={type.toUpperCase()}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<UploadIcon />}
                      onClick={() => handleOpenDialog(assignment)}
                      sx={{ 
                        bgcolor: statusInfo.status === 'overdue' ? 'error.main' : '#4CAF50',
                        '&:hover': {
                          bgcolor: statusInfo.status === 'overdue' ? 'error.dark' : '#45a049'
                        }
                      }}
                    >
                      {statusInfo.status === 'overdue' ? 'Entregar (Tardía)' : 'Entregar Tarea'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog de entrega */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentIcon />
            Entregar: {selectedAssignment?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Información de la tarea */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Información de la Tarea
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedAssignment.description}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon fontSize="small" />
                      <Typography variant="body2">
                        <strong>Fecha límite:</strong> {formatDate(selectedAssignment.due_date)}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${selectedAssignment.max_points} puntos`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  {selectedAssignment.instructions && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Instrucciones:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedAssignment.instructions}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Grid>

              {/* Subida de archivo */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subir Archivo"
                  type="file"
                  onChange={handleFileChange}
                  inputProps={{
                    accept: selectedAssignment?.allowed_file_types.map(type => `.${type}`).join(',')
                  }}
                  InputLabelProps={{ shrink: true }}
                  helperText={`Tipos permitidos: ${selectedAssignment?.allowed_file_types.join(', ').toUpperCase()}`}
                />
              </Grid>

              {/* Texto de entrega */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Texto de Entrega (Opcional)"
                  name="submission_text"
                  value={submissionData.submission_text}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  helperText="Puedes agregar comentarios adicionales sobre tu entrega"
                />
              </Grid>

              {/* Nombre del archivo */}
              {submissionData.file_name && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Box display="flex" alignItems="center" gap={1}>
                      <DescriptionIcon />
                      <Typography variant="body2">
                        Archivo seleccionado: <strong>{submissionData.file_name}</strong>
                      </Typography>
                    </Box>
                  </Alert>
                </Grid>
              )}

              {/* Fecha de entrega */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha y Hora de Entrega"
                  name="submitted_at"
                  type="datetime-local"
                  value={submissionData.submitted_at}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <LinearProgress size={20} /> : <UploadIcon />}
            sx={{ bgcolor: '#4CAF50' }}
          >
            {uploading ? 'Entregando...' : 'Entregar Tarea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;