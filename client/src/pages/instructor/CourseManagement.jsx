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
  Button,
  Grid,
  Chip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Create as CreateIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import AssignmentsManager from '../components/AssignmentsManager';
import SubmissionsManager from '../components/SubmissionsManager';
import StudentGrades from '../components/StudentGrades';
import axios from 'axios';

const CourseManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInstructorCourses();
  }, [user.id]);

  const fetchInstructorCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/courses/instructor/${user.id}`);
      if (response.data.success) {
        setCourses(response.data.courses);
        if (response.data.courses.length > 0) {
          setSelectedCourse(response.data.courses[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Reset assignment selection when changing tabs
    setSelectedAssignment(null);
  };

  const handleAssignmentSelect = (assignmentId) => {
    setSelectedAssignment(assignmentId);
  };

  const getTabContent = () => {
    if (!selectedCourse) {
      return (
        <Alert severity="info">
          Selecciona un curso para gestionar las asignaciones
        </Alert>
      );
    }

    switch (activeTab) {
      case 0:
        return <AssignmentsManager courseId={selectedCourse.id} />;
      case 1:
        return selectedAssignment ? (
          <SubmissionsManager assignmentId={selectedAssignment} />
        ) : (
          <Alert severity="info">
            Selecciona una asignación para ver las entregas
          </Alert>
        );
      case 2:
        return <StudentGrades />;
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Análisis de Rendimiento - {selectedCourse.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Próximamente: gráficos y estadísticas avanzadas de rendimiento
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Cargando cursos...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Gestión de Cursos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra asignaciones, calificaciones y el progreso de tus estudiantes
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Course Selector */}
      {courses.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Seleccionar Curso
            </Typography>
            <Grid container spacing={2}>
              {courses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <Card
                    variant={selectedCourse?.id === course.id ? "elevation" : "outlined"}
                    sx={{
                      cursor: 'pointer',
                      border: selectedCourse?.id === course.id ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                      '&:hover': {
                        borderColor: '#4CAF50',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }
                    }}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <AssignmentIcon color="primary" />
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {course.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {course.code}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CreateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes cursos creados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crea tu primer curso para comenzar a gestionar asignaciones y estudiantes
            </Typography>
            <Button variant="contained" href="/instructor/courses/create">
              Crear Curso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab
                icon={<AssignmentIcon />}
                label="Asignaciones"
                iconPosition="start"
              />
              <Tab
                icon={<PeopleIcon />}
                label="Entregas"
                iconPosition="start"
                disabled={!selectedAssignment}
              />
              <Tab
                icon={<AnalyticsIcon />}
                label="Calificaciones"
                iconPosition="start"
              />
              <Tab
                icon={<AnalyticsIcon />}
                label="Análisis"
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box>
            {getTabContent()}
          </Box>
        </>
      )}
    </Container>
  );
};

export default CourseManagement;