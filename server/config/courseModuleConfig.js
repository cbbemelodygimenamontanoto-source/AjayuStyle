

const express = require('express');
const cors = require('cors');

const assignmentsRoutes = require('./routes/assignments');
const submissionsRoutes = require('./routes/submissions');
const gradesRoutes = require('./routes/grades');
const enrollmentsRoutes = require('./routes/enrollments');

/**
 * @param {Express} app 
 * @param {Object} options 
 */
function setupCourseModule(app, options = {}) {
  const {
    corsOrigin = 'http://localhost:3000',
    apiPrefix = '/api',
    enableLogging = true
  } = options;

  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  if (enableLogging) {
    app.use((req, res, next) => {
      if (req.url.startsWith(`${apiPrefix}/assignments`) ||
          req.url.startsWith(`${apiPrefix}/submissions`) ||
          req.url.startsWith(`${apiPrefix}/grades`) ||
          req.url.startsWith(`${apiPrefix}/enrollments`)) {
        console.log(`[MÓDULO CURSOS] ${req.method} ${req.url}`);
      }
      next();
    });
  }

  app.use(`${apiPrefix}/assignments`, assignmentsRoutes);
  app.use(`${apiPrefix}/submissions`, submissionsRoutes);
  app.use(`${apiPrefix}/grades`, gradesRoutes);
  app.use(`${apiPrefix}/enrollments`, enrollmentsRoutes);

  app.get(`${apiPrefix}/courses/health`, (req, res) => {
    res.json({
      success: true,
      message: 'Módulo de Cursos - AjayuFinal',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        assignments: `${apiPrefix}/assignments`,
        submissions: `${apiPrefix}/submissions`,
        grades: `${apiPrefix}/grades`,
        enrollments: `${apiPrefix}/enrollments`
      }
    });
  });

  console.log(' Módulo de Cursos configurado exitosamente');
  console.log(`    API Prefix: ${apiPrefix}`);
  console.log(`    CORS Origin: ${corsOrigin}`);
  console.log(`    Endpoints disponibles:`);
  console.log(`      • ${apiPrefix}/assignments/*`);
  console.log(`      • ${apiPrefix}/submissions/*`);
  console.log(`      • ${apiPrefix}/grades/*`);
  console.log(`      • ${apiPrefix}/enrollments/*`);
}



async function checkDatabaseHealth() {
  try {
    const db = require('./config/database'); 
    const [result] = await db.execute('SELECT 1 as test');
    return result[0].test === 1;
  } catch (error) {
    console.error(' Error conectando a la base de datos:', error.message);
    return false;
  }
}


async function checkModuleTables(req, res, next) {
  try {
    const db = require('./config/database');
    
    const requiredTables = [
      'assignments_new',
      'submissions_new', 
      'grades_new',
      'enrollments_new'
    ];

    const [tables] = await db.execute('SHOW TABLES');
    const existingTables = tables.map(table => Object.values(table)[0]);
    
    const missingTables = requiredTables.filter(table => 
      !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'Tablas del módulo de cursos no encontradas',
        missingTables,
        instructions: 'Ejecuta: SOURCE /ruta/TU_BD_COMPLETA_MAS_MODULO_CURSOS.sql'
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando tablas:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando configuración del módulo'
    });
  }
}


app.get('/api/courses/setup-check', checkModuleTables, async (req, res) => {
  try {
    const dbHealthy = await checkDatabaseHealth();
    const tablesHealthy = true; 

    res.json({
      success: true,
      message: 'Verificación del Módulo de Cursos',
      checks: {
        database: dbHealthy ? ' Conectada' : ' Error de conexión',
        tables: tablesHealthy ? ' Configuradas' : ' Faltan tablas',
        module: ' Activo'
      },
      nextSteps: dbHealthy && tablesHealthy 
        ? 'El módulo está listo para usar'
        : 'Revisa la configuración de base de datos'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en verificación del módulo',
      error: error.message
    });
  }
});

module.exports = {
  setupCourseModule,
  checkDatabaseHealth,
  checkModuleTables
};