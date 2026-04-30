import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
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
  Button,
  Chip,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Grid,
  Avatar,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Grade as GradeIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SubmissionsManager = ({ assignmentId }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [grading, setGrading] = useState(false);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Grading state
  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: '',
    graded_at: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchAssignment();
    fetchSubmissions();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      const response = await axios.get(`/api/assignments/${assignmentId}`);
      if (response.data.success) {
        setAssignment(response.data.assignment);
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/submissions/assignment/${assignmentId}`);
      if (response.data.success) {
        setSubmissions(response.data.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Error al cargar las entregas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewDialog = (submission) => {
    setSelectedSubmission(submission);
    setOpenDialog(true);
    // Cargar calificación si existe
    if (submission.score !== null && submission.score !== undefined) {
      setGradeData({
        score: submission.score,
        feedback: submission.feedback || '',
        graded_at: submission.graded_at ? 
          new Date(submission.graded_at).toISOString().slice(0, 16) : 
          new Date().toISOString().slice(0, 16)
      });
    } else {
      setGradeData({
        score: 0,
        feedback: '',
        graded_at: new Date().toISOString().slice(0, 16)
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSubmission(null);
    setGradeData({
      score: 0,
      feedback: '',
      graded_at: new Date().toISOString().slice(0, 16)
    });
  };

  const handleMenuClick = (event, submission) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubmission(submission);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubmission(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGradeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitGrade = async () => {
    try {
      setGrading(true);
      setError('');
      setSuccess('');

      if (gradeData.score < 0 || gradeData.score > assignment.max_points) {
        setError(`La calificación debe estar entre 0 y ${assignment.max_points} puntos`);
        setGrading(false);
        return;
      }

      if (!gradeData.feedback.trim()) {
        setError('El feedback es obligatorio');
        setGrading(false);
        return;
      }

      const response = await axios.post('/api/grades/grade', {
        submission_id: selectedSubmission.id,
        instructor_id: user.id,
        score: parseFloat(gradeData.score),
        feedback: gradeData.feedback,
        graded_at: gradeData.graded_at
      });

      if (response.data.success) {
        setSuccess('Calificación guardada exitosamente');
        fetchSubmissions();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      setError(error.response?.data?.message || 'Error al calificar la entrega');
    } finally {
      setGrading(false);
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

  const isLateSubmission = (submittedAt, dueDate) => {
    if (!submittedAt || !dueDate) return false;
    return new Date(submittedAt) > new Date(dueDate);
  };

  const getStatusChip = (submission) => {
    if (submission.score !== null && submission.score !== undefined) {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Calificada"
          color="success"
          size="small"
        />
      );
    }
    
    if (isLateSubmission(submission.submitted_at, assignment.due_date)) {
      return (
        <Chip
          icon={<WarningIcon />}
          label="Tardía"
          color="error"
          size="small"
        />
      );
    }
    
    return (
      <Chip
        icon={<ScheduleIcon />}
        label="Pendiente"
        color="warning"
        size="small"
      />
    );
  };

  const getGradeColor = (score, maxPoints) => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const getGradeColorStyle = (score, maxPoints) => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 71) return { color: '#4CAF50', fontWeight: 'bold' };
    return { color: '#f44336', fontWeight: 'bold' };
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
          Entregas de: {assignment?.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {submissions.length} entregas recibidas • Máximo {assignment?.max_points} puntos
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

      {/* Submissions Table */}
      <Card>
        <CardContent>
          {submissions.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No hay entregas recibidas aún
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Estudiante</strong></TableCell>
                    <TableCell><strong>Archivo</strong></TableCell>
                    <TableCell><strong>Entregado</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Calificación</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: '#4CAF50' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {submission.student_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {submission.student_email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {submission.file_name ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {submission.file_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {submission.file_type?.toUpperCase() || 'Sin tipo'}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Solo texto
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {formatDate(submission.submitted_at)}
                          </Typography>
                          {isLateSubmission(submission.submitted_at, assignment.due_date) && (
                            <Chip
                              label="Tardía"
                              color="error"
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(submission)}
                      </TableCell>
                      <TableCell align="center">
                        {submission.score !== null && submission.score !== undefined ? (
                          <Chip
                            label={`${submission.score}/${assignment.max_points}`}
                            color={getGradeColor(submission.score, assignment.max_points)}
                            sx={getGradeColorStyle(submission.score, assignment.max_points)}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sin calificar
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, submission)}
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
        <MenuItem onClick={() => {
          handleOpenViewDialog(selectedSubmission);
          handleMenuClose();
        }}>
          <ViewIcon sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleOpenViewDialog(selectedSubmission);
            handleMenuClose();
          }}
          disabled={selectedSubmission?.score !== null && selectedSubmission?.score !== undefined}
        >
          <GradeIcon sx={{ mr: 1 }} />
          {selectedSubmission?.score !== null && selectedSubmission?.score !== undefined 
            ? 'Calificación' 
            : 'Calificar'
          }
        </MenuItem>
        {selectedSubmission?.file_path && (
          <MenuItem>
            <DownloadIcon sx={{ mr: 1 }} />
            Descargar Archivo
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de vista y calificación */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: '#4CAF50' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedSubmission?.student_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedSubmission?.student_email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Información de la entrega */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Detalles de la Entrega
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Entregado:</strong> {formatDate(selectedSubmission.submitted_at)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>Estado:</strong> {getStatusChip(selectedSubmission)}
                      </Typography>
                    </Grid>
                    
                    {selectedSubmission.file_name && (
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Archivo:</strong> {selectedSubmission.file_name}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {selectedSubmission.submission_text && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Texto de la entrega:
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'white', border: '1px solid #e0e0e0' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {selectedSubmission.submission_text}
                        </Typography>
                      </Paper>
                    </>
                  )}
                </Paper>
              </Grid>

              {/* Calificación */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Calificación
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Puntuación"
                        name="score"
                        type="number"
                        value={gradeData.score}
                        onChange={handleInputChange}
                        inputProps={{ 
                          min: 0, 
                          max: assignment?.max_points || 100,
                          step: 0.5
                        }}
                        helperText={`Máximo: ${assignment?.max_points} puntos`}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Fecha de Calificación"
                        name="graded_at"
                        type="datetime-local"
                        value={gradeData.graded_at}
                        onChange={handleInputChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Feedback / Comentarios"
                        name="feedback"
                        value={gradeData.feedback}
                        onChange={handleInputChange}
                        multiline
                        rows={4}
                        required
                        helperText="Proporciona feedback constructivo al estudiante"
                      />
                    </Grid>

                    {gradeData.score > 0 && (
                      <Grid item xs={12}>
                        <Alert 
                          severity={gradeData.score >= assignment?.max_points * 0.71 ? "success" : "warning"}
                        >
                          <Typography variant="body2">
                            <strong>Estado:</strong> {gradeData.score >= assignment?.max_points * 0.71 
                              ? "APROBADO - Cumple con el 71% mínimo requerido" 
                              : "REPROBADO - No alcanza el 71% mínimo requerido"
                            }
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cerrar
          </Button>
          <Button 
            onClick={handleSubmitGrade}
            variant="contained"
            disabled={grading || (selectedSubmission?.score !== null && selectedSubmission?.score !== undefined)}
            startIcon={grading ? <LinearProgress size={20} /> : <GradeIcon />}
            sx={{ bgcolor: '#4CAF50' }}
          >
            {grading ? 'Guardando...' : 'Guardar Calificación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubmissionsManager;