import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const StudentGrades = ({ studentId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    averageGrade: 0,
    totalPoints: 0,
    earnedPoints: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, [studentId || user.id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Obtener cursos inscritos
      const enrollmentsResponse = await axios.get(`/api/enrollments/student/${studentId || user.id}`);
      if (enrollmentsResponse.data.success) {
        setEnrollments(enrollmentsResponse.data.enrollments);
        
        // Calcular estadísticas generales
        const totalCourses = enrollmentsResponse.data.enrollments.length;
        const completedCourses = enrollmentsResponse.data.enrollments.filter(
          e => e.status === 'completed'
        ).length;
        
        setOverallStats(prev => ({
          ...prev,
          totalCourses,
          completedCourses
        }));

        // Obtener progreso de cada curso
        const progressPromises = enrollmentsResponse.data.enrollments.map(async (enrollment) => {
          try {
            const progressResponse = await axios.get(
              `/api/grades/student/${studentId || user.id}/course/${enrollment.course_id}/progress`
            );
            return {
              ...enrollment,
              progress: progressResponse.data.progress
            };
          } catch (error) {
            console.error('Error fetching progress for course:', enrollment.course_id);
            return {
              ...enrollment,
              progress: null
            };
          }
        });

        const coursesWithProgress = await Promise.all(progressPromises);
        setEnrollments(coursesWithProgress);
      }

      // Obtener todas las calificaciones
      const gradesResponse = await axios.get(`/api/grades/student/${studentId || user.id}`);
      if (gradesResponse.data.success) {
        setGrades(gradesResponse.data.grades);
        
        // Calcular estadísticas de calificaciones
        const totalGrades = gradesResponse.data.grades.length;
        const averageGrade = totalGrades > 0 
          ? gradesResponse.data.grades.reduce((sum, grade) => sum + grade.score, 0) / totalGrades
          : 0;
        const totalPoints = gradesResponse.data.grades.reduce((sum, grade) => sum + grade.max_points, 0);
        const earnedPoints = gradesResponse.data.grades.reduce((sum, grade) => sum + grade.score, 0);
        
        setOverallStats(prev => ({
          ...prev,
          averageGrade: Math.round(averageGrade * 100) / 100,
          totalPoints,
          earnedPoints
        }));
      }
      
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Error al cargar los datos académicos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGradeColor = (score, maxPoints) => {
    const percentage = (score / maxPoints) * 100;
    if (percentage >= 90) return '#4CAF50'; // Verde
    if (percentage >= 80) return '#2196F3'; // Azul
    if (percentage >= 71) return '#FF9800'; // Naranja
    return '#F44336'; // Rojo
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'in_progress':
        return <ScheduleIcon color="primary" />;
      case 'dropped':
        return <WarningIcon color="error" />;
      default:
        return <SchoolIcon color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'dropped':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCourseStatusChip = (progress) => {
    if (!progress || progress.total_assignments === 0) {
      return <Chip label="Sin tareas" size="small" variant="outlined" />;
    }

    const completionRate = (progress.completed_assignments / progress.total_assignments) * 100;
    
    if (progress.course_status === 'passed') {
      return (
        <Chip
          icon={<TrophyIcon />}
          label={`APROBADO - ${Math.round(progress.overall_percentage)}%`}
          color="success"
          size="small"
        />
      );
    }

    if (completionRate < 50) {
      return (
        <Chip
          icon={<WarningIcon />}
          label="En riesgo"
          color="error"
          size="small"
        />
      );
    }

    return (
      <Chip
        label={`${Math.round(completionRate)}% completado`}
        color="warning"
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando calificaciones...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Mi Rendimiento Académico
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Revisa tu progreso y calificaciones en todos tus cursos
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#4CAF50' }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overallStats.totalCourses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cursos Inscritos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#2196F3' }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overallStats.completedCourses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cursos Completados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#FF9800' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overallStats.averageGrade.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Promedio General
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#9C27B0' }}>
                  <GradeIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overallStats.earnedPoints}/{overallStats.totalPoints}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Puntos Totales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Courses Progress */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Progreso por Curso"
          subheader="Tu estado actual en cada curso inscrito"
        />
        <CardContent>
          {enrollments.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No estás inscrito en ningún curso
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {enrollments.map((enrollment) => {
                const progress = enrollment.progress;
                const percentage = progress ? progress.overall_percentage : 0;
                
                return (
                  <Grid item xs={12} key={enrollment.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Box display="flex" alignItems="center" gap={2}>
                              {getStatusIcon(enrollment.status)}
                              <Box>
                                <Typography variant="h6" fontWeight="bold">
                                  {enrollment.course_title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {enrollment.course_code}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Instructor: {enrollment.instructor_name}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box>
                              <Typography variant="body2" gutterBottom>
                                <strong>Progreso:</strong> {progress ? `${progress.completed_assignments}/${progress.total_assignments} tareas` : 'Cargando...'}
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={percentage} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  bgcolor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: getGradeColor(percentage, 100)
                                  }
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {progress ? `${percentage.toFixed(1)}%` : '0%'} completado
                              </Typography>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                              {getCourseStatusChip(progress)}
                              <Chip
                                label={enrollment.status.toUpperCase()}
                                color={getStatusColor(enrollment.status)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Recent Grades */}
      <Card>
        <CardHeader
          title="Calificaciones Recientes"
          subheader="Tus últimas calificaciones de tareas"
        />
        <CardContent>
          {grades.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No tienes calificaciones aún
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Curso</strong></TableCell>
                    <TableCell><strong>Tarea</strong></TableCell>
                    <TableCell align="center"><strong>Calificación</strong></TableCell>
                    <TableCell align="center"><strong>Porcentaje</strong></TableCell>
                    <TableCell align="center"><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Fecha</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.slice(0, 10).map((grade) => {
                    const percentage = (grade.score / grade.max_points) * 100;
                    const letterGrade = getGradeLetter(percentage);
                    
                    return (
                      <TableRow key={grade.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {grade.course_title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {grade.course_code}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {grade.assignment_title}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${grade.score}/${grade.max_points}`}
                            sx={{ 
                              bgcolor: getGradeColor(grade.score, grade.max_points),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {percentage.toFixed(1)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {letterGrade}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={percentage >= 71 ? 'APROBADO' : 'REPROBADO'}
                            color={percentage >= 71 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {formatDate(grade.graded_at)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentGrades;