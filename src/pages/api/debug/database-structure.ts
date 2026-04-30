import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '@/lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Solo GET permitido' });
  }

  try {
    const debug = {
      timestamp: new Date().toISOString(),
      tables: {},
      sampleData: {}
    };

    // Verificar todas las tablas que necesitamos
    const tablesToCheck = [
      'users', 'courses', 'lessons', 'assignments', 
      'user_roles', 'user_role_assignments'
    ];

    for (const table of tablesToCheck) {
      try {
        // Verificar si la tabla existe
        await executeQuery(`SELECT 1 FROM ${table} LIMIT 1`);
        
        // Obtener estructura de la tabla
        const structure = await executeQuery(`DESCRIBE ${table}`);
        debug.tables[table] = structure;
        
        // Obtener muestra de datos
        const sample = await executeQuery(`SELECT * FROM ${table} LIMIT 2`);
        debug.sampleData[table] = sample;
        
      } catch (error: any) {
        debug.tables[table] = { error: error.message };
      }
    }

    // Verificar usuarios con cursos
    try {
      const instructors = await executeQuery(`
        SELECT DISTINCT u.id, u.name, u.email, c.instructor_id, c.title as course_title
        FROM users u
        JOIN courses c ON u.id = c.instructor_id
        WHERE c.instructor_id IS NOT NULL
        LIMIT 5
      `);
      debug.instructors = instructors;
    } catch (error: any) {
      debug.instructors = { error: error.message };
    }

    res.status(200).json(debug);

  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}