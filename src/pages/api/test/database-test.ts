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
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Verificar usuarios y roles
    try {
      const usersWithRoles = await executeQuery(`
        SELECT 
          u.id,
          u.email,
          u.name,
          ur.name as role_name
        FROM users u
        LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
        LEFT JOIN user_roles ur ON ura.role_id = ur.id
        LIMIT 5
      `);
      testResults.tests.users_and_roles = {
        success: true,
        data: usersWithRoles
      };
    } catch (error: any) {
      testResults.tests.users_and_roles = {
        success: false,
        error: error.message
      };
    }

    // Test 2: Verificar cursos
    try {
      const courses = await executeQuery(`
        SELECT id, title, instructor_id, published, approval_status
        FROM courses
        LIMIT 5
      `);
      testResults.tests.courses = {
        success: true,
        data: courses
      };
    } catch (error: any) {
      testResults.tests.courses = {
        success: false,
        error: error.message
      };
    }

    // Test 3: Verificar instructores
    try {
      const instructors = await executeQuery(`
        SELECT DISTINCT 
          u.id,
          u.email,
          u.name,
          c.title as course_title,
          ur.name as role_name
        FROM users u
        JOIN courses c ON u.id = c.instructor_id
        LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
        LEFT JOIN user_roles ur ON ura.role_id = ur.id
        LIMIT 5
      `);
      testResults.tests.instructors = {
        success: true,
        data: instructors
      };
    } catch (error: any) {
      testResults.tests.instructors = {
        success: false,
        error: error.message
      };
    }

    // Test 4: Verificar assignments
    try {
      const assignments = await executeQuery(`
        SELECT 
          id,
          course_id,
          lesson_id,
          title,
          points_possible,
          file_types_allowed
        FROM assignments
        LIMIT 5
      `);
      testResults.tests.assignments = {
        success: true,
        data: assignments
      };
    } catch (error: any) {
      testResults.tests.assignments = {
        success: false,
        error: error.message
      };
    }

    // Test 5: Verificar lessons
    try {
      const lessons = await executeQuery(`
        SELECT 
          id,
          course_id,
          title,
          order_index,
          lesson_type,
          estimated_minutes
        FROM lessons
        ORDER BY course_id, order_index
        LIMIT 5
      `);
      testResults.tests.lessons = {
        success: true,
        data: lessons
      };
    } catch (error: any) {
      testResults.tests.lessons = {
        success: false,
        error: error.message
      };
    }

    res.status(200).json(testResults);

  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}