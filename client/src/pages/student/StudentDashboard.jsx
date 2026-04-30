import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  Grid,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import StudentAssignments from '../components/StudentAssignments';
import StudentGrades from '../components/StudentGrades';
import axios from 'axios';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentEnrollments();
  }, [user.id]);

  const fetchStudentEnrollments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/enrollments/student/${user.id}`);
      if (response.data.success) {
        setEnrollments(response.data.enrollments);
        if (response.data.enrollments.length > 0) {
          setSelectedCourse(response.data.enrollments[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setError('Error al cargar tus cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const getQuickStats = () => {
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const activeCourses = enrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').length;
    
    return { totalCourses, completedCourses, activeCourses };
  };

  const stats = getQuickStats();

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Cargando dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Mi Dashboard Estudiantil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona tus cursos, tareas y monitorea tu progreso académico
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#4CAF50' }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalCourses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cursos Inscritos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#2196F3' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.activeCourses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cursos Activos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#FF9800' }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.completedCourses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cursos Completados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No estás inscrito en ningún curso
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Explora los cursos disponibles e inscríbete para comenzar tu aprendizaje
            </Typography>
            <Button variant="contained" href="/courses">
              Explorar Cursos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Course Selector */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mis Cursos
              </Typography>
              <Grid container spacing={2}>
                {enrollments.map((enrollment) => (
                  <Grid item xs={12} sm={6} md={4} key={enrollment.id}>
                    <Card
                      variant={selectedCourse?.id === enrollment.course_id ? "elevation" : "outlined"}
                      sx={{
                        cursor: 'pointer',
                        border: selectedCourse?.id === enrollment.course_id ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                        '&:hover': {
                          borderColor: '#4CAF50',
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s'
                        }
                      }}
                      onClick={() => setSelectedCourse(enrollment)}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          {getStatusIcon(enrollment.status)}
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {enrollment.course_title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {enrollment.course_code}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Chip
                            label={enrollment.status.toUpperCase()}
                            color={getStatusColor(enrollment.status)}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(enrollment.enrolled_at)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Instructor: {enrollment.instructor_name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab
                icon={<AssignmentIcon />}
                label="Mis Tareas"
                iconPosition="start"
              />
              <Tab
                icon={<GradeIcon />}
                label="Mis Calificaciones"
                iconPosition="start"
              />
              <Tab
                icon={<TrendingUpIcon />}
                label="Progreso"
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box>
            {activeTab === 0 && (
              selectedCourse ? (
                <StudentAssignments courseId={selectedCourse.course_id} />
              ) : (
                <Alert severity="info">
                  Selecciona un curso para ver tus tareas
                </Alert>
              )
            )}
            
            {activeTab === 1 && (
              <StudentGrades studentId={user.id} />
            )}
            
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Mi Progreso Académico
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aquí verás gráficos detallados de tu rendimiento y progreso a lo largo del tiempo.
                  Próximamente disponible.
                </Typography>
              </Box>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default StudentDashboard;