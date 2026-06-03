import 'server-only';
import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery, executeQuerySingle } from '@/lib/database';
import { getAllReports, getReportsStats, resolveReport } from '@/lib/social_database';
import jwt from 'jsonwebtoken';

// ============================================================================
// AUTH
// ============================================================================

async function getUserFromRequest(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024'
    ) as { userId: number; email: string };
    return await executeQuerySingle(
      'SELECT id, name, email, username FROM users WHERE id = ?',
      [decoded.userId]
    );
  } catch {
    return null;
  }
}

// ============================================================================
// STATS
// ============================================================================

async function getAdminStats() {
  try {
    const [userCount, instructorCount, courseCount, postCount, reportCount] = await Promise.all([
      executeQuery('SELECT COUNT(*) as count FROM users'),
      executeQuery(`SELECT COUNT(*) as count FROM user_role_assignments ura 
                    JOIN user_roles ur ON ura.role_id = ur.id WHERE ur.name = 'instructor'`),
      executeQuery('SELECT COUNT(*) as count FROM courses'),
      executeQuery('SELECT COUNT(*) as count FROM social_posts'),
      executeQuery('SELECT COUNT(*) as count FROM content_reports WHERE status = "pending"'),
    ]);
    return {
      total_users: userCount[0]?.count || 0,
      total_instructors: instructorCount[0]?.count || 0,
      total_students: (userCount[0]?.count || 0) - (instructorCount[0]?.count || 0),
      total_courses: courseCount[0]?.count || 0,
      total_posts: postCount[0]?.count || 0,
      pending_reports: reportCount[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return { total_users: 0, total_instructors: 0, total_students: 0, total_courses: 0, total_posts: 0, pending_reports: 0 };
  }
}

// ============================================================================
// USERS
// ============================================================================

async function getAllUsers() {
  // FIX: removed u.is_verified (column does not exist in users table)
  const usersData = await executeQuery(`
    SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.username,
      u.avatar,
      u.status,
      u.created_at,
      ur.id as role_id, 
      ur.name as role_name, 
      ur.description as role_description
    FROM users u 
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
    LEFT JOIN user_roles ur ON ura.role_id = ur.id
    ORDER BY u.created_at DESC
  `);

  const usersMap = new Map<number, any>();
  usersData.forEach((user: any) => {
    if (!usersMap.has(user.id)) {
      usersMap.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        created_at: user.created_at,
        roles: [],
      });
    }
    if (user.role_id) {
      usersMap.get(user.id).roles.push({
        id: user.role_id,
        name: user.role_name,
        description: user.role_description,
      });
    }
  });

  return Array.from(usersMap.values());
}

async function createUser(userData: any) {
  const { name, email, username, password, role } = userData;
  const passwordHash = `hashed_${password}_${Date.now()}`;

  // FIX: 'role' column does not exist in users table — roles are managed via user_role_assignments
  const result = await executeQuery(
    `INSERT INTO users (name, email, username, password_hash, social_activated) 
     VALUES (?, ?, ?, ?, false)`,
    [name, email, username, passwordHash]
  );

  // Assign role in user_roles table as well
  if (role) {
    const roleResult = await executeQuerySingle(`SELECT id FROM user_roles WHERE name = ?`, [role]);
    if (roleResult && result.insertId) {
      await executeQuery(
        `INSERT INTO user_role_assignments (user_id, role_id) VALUES (?, ?)`,
        [result.insertId, roleResult.id]
      );
    }
  }

  return { id: result.insertId, name, email, username };
}

async function updateUser(userId: number, userData: any) {
  // FIX: removed is_verified from allowedFields (column does not exist)
  const allowedFields = ['name', 'email', 'username', 'status'];
  const updates: string[] = [];
  const params: any[] = [];

  Object.keys(userData).forEach(key => {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      params.push(userData[key]);
    }
  });

  if (updates.length > 0) {
    params.push(userId);
    await executeQuery(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  // Update role via user_role_assignments
  if (userData.role) {
    await executeQuery(`DELETE FROM user_role_assignments WHERE user_id = ?`, [userId]);
    const roleResult = await executeQuerySingle(`SELECT id FROM user_roles WHERE name = ?`, [userData.role]);
    if (roleResult) {
      await executeQuery(
        `INSERT INTO user_role_assignments (user_id, role_id) VALUES (?, ?)`,
        [userId, roleResult.id]
      );
    }
  }

  return { success: true };
}

async function deleteUser(userId: number) {
  await executeQuery(`UPDATE users SET status = 'deleted' WHERE id = ?`, [userId]);
  return { success: true };
}

// ============================================================================
// POSTS
// ============================================================================

async function getAllPosts(limit: number = 50) {
  return await executeQuery(`
    SELECT 
      sp.id as post_id,
      sp.content,
      sp.image_url,
      sp.likes_count,
      sp.shares_count,
      sp.created_at,
      profile.username as author_username,
      COALESCE(u.name, profile.username) as author_name,
      COALESCE(u.avatar, profile.avatar) as author_avatar
    FROM social_posts sp
    INNER JOIN social_profiles profile ON sp.profile_id = profile.id
    LEFT JOIN users u ON profile.user_id = u.id
    ORDER BY sp.created_at DESC
    LIMIT ?
  `, [limit]);
}

async function deletePost(postId: number) {
  await executeQuery('DELETE FROM social_posts WHERE id = ?', [postId]);
  return { success: true };
}

// ============================================================================
// COURSES
// ============================================================================

async function getAllCourses() {
  // FIX: changed enrollments → course_enrollments (correct table name)
  return await executeQuery(`
    SELECT 
      c.*,
      u.name as instructor_name,
      u.email as instructor_email,
      (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as enrollment_count,
      (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
    FROM courses c
    LEFT JOIN users u ON c.instructor_id = u.id
    ORDER BY c.created_at DESC
  `);
}

async function getCourseDetails(courseId: number) {
  const course = await executeQuerySingle(
    `SELECT c.*, u.name as instructor_name 
     FROM courses c 
     LEFT JOIN users u ON c.instructor_id = u.id 
     WHERE c.id = ?`,
    [courseId]
  );
  if (!course) return null;

  const lessons = await executeQuery(
    'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index',
    [courseId]
  );
  const assignments = await executeQuery(
    'SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at',
    [courseId]
  );
  return { ...course, lessons, assignments };
}

async function deleteCourse(courseId: number) {
  await executeQuery('UPDATE courses SET status = "deleted" WHERE id = ?', [courseId]);
  return { success: true };
}

async function hideCourse(courseId: number) {
  await executeQuery('UPDATE courses SET published = false WHERE id = ?', [courseId]);
  return { success: true };
}

// ============================================================================
// LESSONS
// ============================================================================

async function updateLesson(lessonId: number, lessonData: any) {
  // FIX: removed duration_minutes from allowedFields (column does not exist in lessons table)
  const allowedFields = ['title', 'description', 'content', 'video_url', 'order_index', 'is_preview'];
  const updates: string[] = [];
  const params: any[] = [];

  Object.keys(lessonData).forEach(key => {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      params.push(lessonData[key]);
    }
  });

  if (updates.length === 0) return null;
  params.push(lessonId);
  await executeQuery(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`, params);
  return { success: true };
}

async function deleteLesson(lessonId: number) {
  await executeQuery('DELETE FROM lessons WHERE id = ?', [lessonId]);
  return { success: true };
}

// ============================================================================
// ASSIGNMENTS
// ============================================================================

async function updateAssignment(assignmentId: number, assignmentData: any) {
  const allowedFields = ['title', 'description', 'due_date', 'points_possible'];
  const updates: string[] = [];
  const params: any[] = [];

  Object.keys(assignmentData).forEach(key => {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      params.push(assignmentData[key]);
    }
  });

  if (updates.length === 0) return null;
  params.push(assignmentId);
  await executeQuery(`UPDATE assignments SET ${updates.join(', ')} WHERE id = ?`, params);
  return { success: true };
}

async function deleteAssignment(assignmentId: number) {
  await executeQuery('DELETE FROM assignments WHERE id = ?', [assignmentId]);
  return { success: true };
}

// ============================================================================
// ALERTS
// ============================================================================

async function createAlert(alertData: any) {
  const { user_id, title, message, type } = alertData;
  await executeQuery(
    `INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, NOW())`,
    [user_id, title, message, type || 'system']
  );
  return { success: true };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  const userRole = await executeQuerySingle(
    `SELECT ur.name FROM user_roles ur 
     JOIN user_role_assignments ura ON ur.id = ura.role_id 
     WHERE ura.user_id = ?`,
    [user.id]
  );

  if (!userRole || userRole.name !== 'administrador') {
    return res.status(403).json({ success: false, message: 'Sin permisos de administrador' });
  }

  const { action } = req.query;

  try {
    if (req.method === 'GET') {
      switch (action) {
        case 'stats':
          return res.status(200).json({ success: true, stats: await getAdminStats() });

        case 'users':
          return res.status(200).json({ success: true, users: await getAllUsers() });

        case 'posts':
          return res.status(200).json({ success: true, posts: await getAllPosts() });

        case 'courses':
          return res.status(200).json({ success: true, courses: await getAllCourses() });

        case 'course': {
          const courseId = parseInt(req.query.courseId as string);
          return res.status(200).json({ success: true, course: await getCourseDetails(courseId) });
        }

        case 'reports': {
          // FIX: getAllReports no longer joins on cr.post_id or cr.review_id (those columns don't exist)
          const reports = await getAllReports();
          const reportStats = await getReportsStats();
          return res.status(200).json({ success: true, reports, reportStats });
        }

        default:
          return res.status(400).json({ success: false, message: 'Acción no válida' });
      }
    }

    if (req.method === 'POST') {
      const { operation, ...data } = req.body;

      switch (operation) {
        case 'create_user':
          return res.status(201).json({ success: true, user: await createUser(data) });

        case 'update_user':
          await updateUser(data.userId, data);
          return res.status(200).json({ success: true, message: 'Usuario actualizado' });

        case 'delete_user':
          await deleteUser(data.userId);
          return res.status(200).json({ success: true, message: 'Usuario eliminado' });

        case 'delete_post':
          await deletePost(data.postId);
          return res.status(200).json({ success: true, message: 'Post eliminado' });

        case 'delete_course':
          await deleteCourse(data.courseId);
          return res.status(200).json({ success: true, message: 'Curso eliminado' });

        case 'hide_course':
          await hideCourse(data.courseId);
          return res.status(200).json({ success: true, message: 'Curso ocultado' });

        case 'update_lesson':
          await updateLesson(data.lessonId, data);
          return res.status(200).json({ success: true, message: 'Lección actualizada' });

        case 'delete_lesson':
          await deleteLesson(data.lessonId);
          return res.status(200).json({ success: true, message: 'Lección eliminada' });

        case 'update_assignment':
          await updateAssignment(data.assignmentId, data);
          return res.status(200).json({ success: true, message: 'Tarea actualizada' });

        case 'delete_assignment':
          await deleteAssignment(data.assignmentId);
          return res.status(200).json({ success: true, message: 'Tarea eliminada' });

        case 'resolve_report':
          await resolveReport(data.reportId, data.reviewerProfileId || 0, data.status, data.notes || '');
          return res.status(200).json({ success: true, message: 'Reporte actualizado' });

        case 'create_alert':
          await createAlert(data);
          return res.status(201).json({ success: true, message: 'Alerta enviada' });

        default:
          return res.status(400).json({ success: false, message: 'Operación no válida' });
      }
    }

    return res.status(405).json({ success: false, message: 'Método no permitido' });

  } catch (error: any) {
    console.error('Error en admin API:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
}