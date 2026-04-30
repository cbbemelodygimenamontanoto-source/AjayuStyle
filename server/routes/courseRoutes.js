const assignments = require('./routes/assignments');
const submissions = require('./routes/submissions');
const grades = require('./routes/grades');
const enrollments = require('./routes/enrollments');

function registerCourseRoutes(app) {
  app.use('/api/assignments', assignments);
  
  app.use('/api/submissions', submissions);
  
  app.use('/api/grades', grades);
  
  app.use('/api/enrollments', enrollments);
  
  console.log(' Rutas del módulo de cursos registradas');
}

module.exports = { registerCourseRoutes };