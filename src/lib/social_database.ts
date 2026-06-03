import 'server-only';
import { pool, executeQuery, executeQuerySingle } from './database';

// ============================================================================
// TIPOS DE DATOS PARA LA COMUNIDAD
// ============================================================================

export interface SocialProfile {
  id: number;
  user_id: number;
  username: string;
  bio: string;
  avatar: string | null;
  cover_image: string | null;
  country: string;
  region: string;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  contact_email: string | null;
  map_location: string | null;
  profile_visibility: 'public' | 'private' | 'followers';
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: number;
  profile_id: number;
  content: string;
  image_url: string | null;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface PostLike {
  id: number;
  post_id: number;
  profile_id: number;
  created_at: Date;
}

export interface PostShare {
  id: number;
  post_id: number;
  profile_id: number;
  platform: string;
  created_at: Date;
}

export interface Report {
  id: number;
  reporter_profile_id: number;
  reported_profile_id: number;
  post_id: number | null;
  review_id: number | null;
  report_type: 'post' | 'review' | 'profile';
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by: number | null;
  review_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProfileReview {
  id: number;
  reviewer_profile_id: number;
  reviewed_profile_id: number;
  rating: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: number;
  profile_id: number;
  type: 'like' | 'share' | 'follow' | 'review' | 'comment' | 'mention';
  actor_profile_id: number;
  reference_type: string | null;
  reference_id: number | null;
  is_read: boolean;
  created_at: Date;
}

// ============================================================================
// FUNCIONES DE PERFILES SOCIALES
// ============================================================================

// Crear perfil social para un usuario (si no existe)
export async function createSocialProfile(userId: number, username: string, userName: string = ''): Promise<SocialProfile> {
  try {
    // Verificar si ya existe
    const existing = await executeQuerySingle(
      'SELECT * FROM social_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (existing) {
      return existing;
    }

    // Crear nuevo perfil
    const sql = `
      INSERT INTO social_profiles (user_id, username, bio, profile_visibility, country)
      VALUES (?, ?, ?, 'public', '')
    `;
    
    await executeQuery(sql, [userId, username, `Bienvenido a la comunidad de Ajayu!`]);
    
    const profile = await executeQuerySingle(
      'SELECT * FROM social_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    return profile;
  } catch (error: any) {
    console.error('Error creando perfil social:', error.message);
    throw error;
  }
}

// Obtener perfil social por user_id (crea uno si no existe)
export async function getSocialProfileByUserId(userId: number): Promise<SocialProfile | null> {
  try {
    const sql = 'SELECT * FROM social_profiles WHERE user_id = ?';
    const profile = await executeQuerySingle(sql, [userId]);
    
    if (!profile) {
      // Crear perfil automáticamente si no existe
      try {
        const userData = await executeQuerySingle('SELECT name, username FROM users WHERE id = ?', [userId]);
        const username = userData?.username || `user_${userId}`;
        const name = userData?.name || 'Usuario';
        
        return await createSocialProfile(userId, username, name);
      } catch (createError) {
        console.error('Error creando perfil automático:', createError);
        return null;
      }
    }
    
    return profile;
  } catch (error: any) {
    console.error('Error obteniendo perfil social:', error.message);
    return null;
  }
}

// Obtener perfil social por profile_id
export async function getSocialProfileById(profileId: number): Promise<SocialProfile | null> {
  const sql = 'SELECT * FROM social_profiles WHERE id = ?';
  return await executeQuerySingle(sql, [profileId]);
}

// Obtener perfil social por username
export async function getSocialProfileByUsername(username: string): Promise<SocialProfile | null> {
  const sql = 'SELECT * FROM social_profiles WHERE username = ?';
  return await executeQuerySingle(sql, [username]);
}

// Actualizar perfil social
export async function updateSocialProfile(profileId: number, data: Partial<SocialProfile>): Promise<SocialProfile> {
  const allowedFields = [
    'bio', 'avatar', 'cover_image', 'country', 'region',
    'website', 'instagram', 'twitter', 'linkedin', 'contact_email', 'map_location', 'profile_visibility'
  ];
  
  const updateFields: string[] = [];
  const params: any[] = [];
  
  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key) && data[key as keyof SocialProfile] !== undefined) {
      updateFields.push(`${key} = ?`);
      params.push(data[key as keyof SocialProfile]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No hay campos válidos para actualizar');
  }
  
  params.push(profileId);
  
  const sql = `UPDATE social_profiles SET ${updateFields.join(', ')} WHERE id = ?`;
  await executeQuery(sql, params);
  
  return await getSocialProfileById(profileId) as SocialProfile;
}

// ============================================================================
// FUNCIONES DE POSTS
// ============================================================================

// Crear post (crea perfil si no existe)
export async function createPost(profileId: number, content: string, imageUrl: string | null = null): Promise<Post> {
  try {
    // Verificar que el perfil exista
    let profile = await getSocialProfileById(profileId);
    if (!profile) {
      throw new Error('El perfil social no existe. Debes crear un perfil primero.');
    }

    const sql = `
      INSERT INTO social_posts (profile_id, content, image_url)
      VALUES (?, ?, ?)
    `;
    
    await executeQuery(sql, [profileId, content, imageUrl]);
    
    // Actualizar contador de posts
    await executeQuery(
      'UPDATE social_profiles SET posts_count = posts_count + 1 WHERE id = ?',
      [profileId]
    );
    
    const post = await executeQuerySingle(
      'SELECT * FROM social_posts WHERE profile_id = ? ORDER BY created_at DESC LIMIT 1',
      [profileId]
    );
    
    return post;
  } catch (error: any) {
    console.error('Error creando post:', error.message);
    throw error;
  }
}

// Obtener post por ID
export async function getPostById(postId: number): Promise<Post | null> {
  const sql = 'SELECT * FROM social_posts WHERE id = ?';
  return await executeQuerySingle(sql, [postId]);
}

// Obtener posts del feed (posts de perfiles que sigue el usuario)
export async function getFeedPosts(profileId: number, limit: number = 20, offset: number = 0): Promise<any[]> {
  // Asegurar que limit y offset sean integers para MySQL
  const safeLimit = parseInt(String(limit), 10) || 20;
  const safeOffset = parseInt(String(offset), 10) || 0;
  
  // Usar u.avatar en lugar de profile.avatar para evitar error de columna faltante
  const sql = `
    SELECT 
      sp.id as post_id,
      sp.content,
      sp.image_url,
      sp.likes_count,
      sp.shares_count,
      sp.comments_count,
      sp.created_at,
      profile.id as author_profile_id,
      profile.user_id as author_user_id,
      profile.username as author_username,
      COALESCE(u.name, profile.username) as author_name,
      COALESCE(u.avatar, profile.avatar, '') as author_avatar,
      COALESCE(profile.country, '') as country,
      COALESCE(profile.region, '') as region,
      EXISTS(SELECT 1 FROM social_likes WHERE post_id = sp.id AND profile_id = ?) as is_liked,
      EXISTS(SELECT 1 FROM social_follows WHERE follower_profile_id = ? AND following_profile_id = profile.id) as is_following
    FROM social_posts sp
    INNER JOIN social_profiles profile ON sp.profile_id = profile.id
    LEFT JOIN users u ON profile.user_id = u.id
    WHERE profile.profile_visibility = 'public'
       OR profile.id = ?
       OR EXISTS(SELECT 1 FROM social_follows WHERE follower_profile_id = ? AND following_profile_id = profile.id)
    ORDER BY sp.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  return await executeQuery(sql, [profileId, profileId, profileId, profileId, safeLimit, safeOffset]);
}

// Obtener posts de un perfil
export async function getProfilePosts(profileId: number, limit: number = 20): Promise<Post[]> {
  const sql = `
    SELECT * FROM social_posts 
    WHERE profile_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  
  return await executeQuery(sql, [profileId, limit]);
}

// Actualizar post
export async function updatePost(postId: number, content: string, imageUrl: string | null): Promise<Post> {
  const sql = `
    UPDATE social_posts 
    SET content = ?, image_url = ?, updated_at = NOW() 
    WHERE id = ?
  `;
  
  await executeQuery(sql, [content, imageUrl, postId]);
  return await getPostById(postId) as Post;
}

// Eliminar post
export async function deletePost(postId: number): Promise<boolean> {
  const post = await getPostById(postId);
  if (!post) return false;
  
  const sql = 'DELETE FROM social_posts WHERE id = ?';
  await executeQuery(sql, [postId]);
  
  // Actualizar contador
  await executeQuery(
    'UPDATE social_profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = ?',
    [post.profile_id]
  );
  
  return true;
}

// ============================================================================
// FUNCIONES DE LIKES
// ============================================================================

// Dar like a un post
export async function likePost(postId: number, profileId: number): Promise<boolean> {
  try {
    // Verificar si ya dio like
    const existing = await executeQuerySingle(
      'SELECT * FROM social_likes WHERE post_id = ? AND profile_id = ?',
      [postId, profileId]
    );
    
    if (existing) {
      return false; // Ya dio like
    }
    
    // Insertar like
    await executeQuery(
      'INSERT INTO social_likes (post_id, profile_id) VALUES (?, ?)',
      [postId, profileId]
    );
    
    // Actualizar contador
    await executeQuery(
      'UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = ?',
      [postId]
    );
    
    return true;
  } catch (error: any) {
    console.error('Error dando like:', error.message);
    return false;
  }
}

// Quitar like de un post
export async function unlikePost(postId: number, profileId: number): Promise<boolean> {
  try {
    const result = await executeQuery(
      'DELETE FROM social_likes WHERE post_id = ? AND profile_id = ?',
      [postId, profileId]
    );
    
    if (result.affectedRows > 0) {
      await executeQuery(
        'UPDATE social_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?',
        [postId]
      );
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Error quitando like:', error.message);
    return false;
  }
}

// ============================================================================
// FUNCIONES DE SEGUIMIENTO
// ============================================================================

// Seguir a un usuario
export async function followProfile(followerProfileId: number, followingProfileId: number): Promise<boolean> {
  try {
    // Verificar que no se esté siguiendo a sí mismo
    if (followerProfileId === followingProfileId) {
      return false;
    }
    
    // Verificar si ya sigue
    const existing = await executeQuerySingle(
      'SELECT * FROM social_follows WHERE follower_profile_id = ? AND following_profile_id = ?',
      [followerProfileId, followingProfileId]
    );
    
    if (existing) {
      return false;
    }
    
    await executeQuery(
      'INSERT INTO social_follows (follower_profile_id, following_profile_id) VALUES (?, ?)',
      [followerProfileId, followingProfileId]
    );
    
    // Actualizar contadores
    await executeQuery(
      'UPDATE social_profiles SET following_count = following_count + 1 WHERE id = ?',
      [followerProfileId]
    );
    await executeQuery(
      'UPDATE social_profiles SET followers_count = followers_count + 1 WHERE id = ?',
      [followingProfileId]
    );
    
    return true;
  } catch (error: any) {
    console.error('Error siguiendo usuario:', error.message);
    return false;
  }
}

// Dejar de seguir a un usuario
export async function unfollowProfile(followerProfileId: number, followingProfileId: number): Promise<boolean> {
  try {
    const result = await executeQuery(
      'DELETE FROM social_follows WHERE follower_profile_id = ? AND following_profile_id = ?',
      [followerProfileId, followingProfileId]
    );
    
    if (result.affectedRows > 0) {
      await executeQuery(
        'UPDATE social_profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = ?',
        [followerProfileId]
      );
      await executeQuery(
        'UPDATE social_profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = ?',
        [followingProfileId]
      );
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Error dejando de seguir:', error.message);
    return false;
  }
}

// Verificar si sigue a un usuario
export async function isFollowing(followerProfileId: number, followingProfileId: number): Promise<boolean> {
  const result = await executeQuerySingle(
    'SELECT * FROM social_follows WHERE follower_profile_id = ? AND following_profile_id = ?',
    [followerProfileId, followingProfileId]
  );
  
  return result !== null;
}

// ============================================================================
// FUNCIONES DE REPORTES
// ============================================================================

// Crear reporte
export async function createReport(
  reporterProfileId: number,
  reportType: 'post' | 'review' | 'profile',
  targetId: number,
  reason: string,
  description: string
): Promise<Report> {
  // Primero verificar que existan los perfiles
  const reportedProfile = await executeQuerySingle(
    'SELECT id FROM social_profiles WHERE id = ? OR user_id = ?',
    [targetId, targetId]
  );
  
  if (!reportedProfile) {
    throw new Error('El perfil reportado no existe');
  }
  
  const sql = `
    INSERT INTO content_reports (
      reporter_profile_id, report_type, target_id, reason, description, reported_profile_id
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  await executeQuery(sql, [reporterProfileId, reportType, targetId, reason, description, reportedProfile.id]);
  
  const report = await executeQuerySingle(
    'SELECT * FROM content_reports ORDER BY created_at DESC LIMIT 1'
  );
  
  return report;
}

// Obtener reportes pendientes
export async function getPendingReports(limit: number = 50): Promise<any[]> {
  const sql = `
    SELECT 
      cr.*,
      reporter.username as reporter_username,
      COALESCE(u_reporter.name, reporter.username) as reporter_name,
      reported.username as reported_username,
      COALESCE(u_reported.name, reported.username) as reported_name,
      sp_post.content as post_content,
      pr.comment as review_content,
      pr.rating as review_rating
    FROM content_reports cr
    INNER JOIN social_profiles reporter ON cr.reporter_profile_id = reporter.id
    LEFT JOIN users u_reporter ON reporter.user_id = u_reporter.id
    INNER JOIN social_profiles reported ON cr.reported_profile_id = reported.id
    LEFT JOIN users u_reported ON reported.user_id = u_reported.id
    LEFT JOIN social_posts sp_post ON cr.post_id = sp_post.id
    LEFT JOIN profile_reviews pr ON cr.review_id = pr.id
    WHERE cr.status = 'pending'
    ORDER BY cr.created_at DESC
    LIMIT ?
  `;
  
  return await executeQuery(sql, [limit]);
}

// Obtener todos los reportes
export async function getAllReports(status?: string): Promise<any[]> {
  // FIX: removed JOINs on cr.post_id and cr.review_id (those columns don't exist in content_reports)
  // FIX: removed INNER JOINs on social_profiles to avoid losing reports without profiles
  let sql = `
    SELECT 
      cr.*
    FROM content_reports cr
  `;
  
  const params: any[] = [];
  
  if (status) {
    sql += ' WHERE cr.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY cr.created_at DESC';
  
  return await executeQuery(sql, params);
}

// Resolver reporte
export async function resolveReport(
  reportId: number,
  reviewerProfileId: number,
  status: 'resolved' | 'dismissed',
  notes: string
): Promise<boolean> {
  const sql = `
    UPDATE content_reports 
    SET status = ?, reviewed_by = ?, review_notes = ?, updated_at = NOW()
    WHERE id = ?
  `;
  
  const result = await executeQuery(sql, [status, reviewerProfileId, notes, reportId]);
  return result.affectedRows > 0;
}

// ============================================================================
// FUNCIONES DE RESEÑAS DE PERFIL
// ============================================================================

// Crear reseña de perfil
export async function createProfileReview(
  reviewerProfileId: number,
  reviewedProfileId: number,
  rating: number,
  comment: string
): Promise<ProfileReview> {
  try {
    // Verificar que no sea una auto-reseña
    if (reviewerProfileId === reviewedProfileId) {
      throw new Error('No puedes reseñarte a ti mismo');
    }
    
    // Verificar rating válido
    if (rating < 1 || rating > 5) {
      throw new Error('El rating debe ser entre 1 y 5');
    }
    
    // Verificar si ya existe una reseña
    const existing = await executeQuerySingle(
      'SELECT * FROM profile_reviews WHERE reviewer_profile_id = ? AND reviewed_profile_id = ?',
      [reviewerProfileId, reviewedProfileId]
    );
    
    if (existing) {
      throw new Error('Ya has dejado una reseña a este usuario');
    }
    
    const sql = `
      INSERT INTO profile_reviews (reviewer_profile_id, reviewed_profile_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;
    
    await executeQuery(sql, [reviewerProfileId, reviewedProfileId, rating, comment]);
    
    const review = await executeQuerySingle(
      'SELECT * FROM profile_reviews ORDER BY created_at DESC LIMIT 1'
    );
    
    return review;
  } catch (error: any) {
    console.error('Error creando reseña:', error.message);
    throw error;
  }
}

// Obtener reseñas de un perfil
export async function getProfileReviews(profileId: number): Promise<any[]> {
  const sql = `
    SELECT 
      pr.*,
      reviewer.username as reviewer_username,
      COALESCE(u.name, reviewer.username) as reviewer_name,
      COALESCE(u.avatar, reviewer.avatar) as reviewer_avatar
    FROM profile_reviews pr
    INNER JOIN social_profiles reviewer ON pr.reviewer_profile_id = reviewer.id
    LEFT JOIN users u ON reviewer.user_id = u.id
    WHERE pr.reviewed_profile_id = ?
    ORDER BY pr.created_at DESC
  `;
  
  return await executeQuery(sql, [profileId]);
}

// Obtener promedio de rating de un perfil
export async function getProfileAverageRating(profileId: number): Promise<{ average: number; total: number }> {
  const sql = `
    SELECT 
      COUNT(*) as total,
      COALESCE(AVG(rating), 0) as average
    FROM profile_reviews
    WHERE reviewed_profile_id = ?
  `;
  
  const result = await executeQuerySingle(sql, [profileId]);
  return {
    average: Math.round(result.average * 10) / 10,
    total: result.total
  };
}

// Eliminar reseña
export async function deleteProfileReview(reviewId: number, profileId: number, isAdmin: boolean): Promise<boolean> {
  const review = await executeQuerySingle('SELECT * FROM profile_reviews WHERE id = ?', [reviewId]);
  
  if (!review) return false;
  
  // Verificar permisos
  if (review.reviewer_profile_id !== profileId && !isAdmin) {
    return false;
  }
  
  await executeQuery('DELETE FROM profile_reviews WHERE id = ?', [reviewId]);
  return true;
}

// ============================================================================
// FUNCIONES DE ESTADÍSTICAS
// ============================================================================

// Obtener estadísticas de reportes
export async function getReportsStats(): Promise<any> {
  // FIX: removed report_type column (doesn't exist). Only use status column.
  const result = await executeQuerySingle(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
      COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed
    FROM content_reports
  `);
  return result || { total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 };
}


export async function searchProfiles(query: string, currentProfileId: number = 0, limit: number = 20): Promise<any[]> {
  const sql = `
    SELECT 
      profile.*,
      COALESCE(u.name, profile.username) as name,
      COALESCE(u.avatar, profile.avatar) as avatar,
      EXISTS(SELECT 1 FROM social_follows WHERE follower_profile_id = ? AND following_profile_id = profile.id) as is_following
    FROM social_profiles profile
    LEFT JOIN users u ON profile.user_id = u.id
    WHERE profile.username LIKE ? 
       OR profile.bio LIKE ?
       OR u.name LIKE ?
    ORDER BY profile.followers_count DESC
    LIMIT ?
  `;
  
  const searchTerm = `%${query}%`;
  return await executeQuery(sql, [currentProfileId, searchTerm, searchTerm, searchTerm, limit]);
}

// ============================================================================
// UTILIDADES
// ============================================================================

// Verificar si existe una tabla
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await executeQuerySingle(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
      [tableName]
    );
    return result.count > 0;
  } catch {
    return false;
  }
}

// Crear tablas de la comunidad si no existen
export async function ensureCommunityTables(): Promise<void> {
  try {
    // Tabla de perfiles sociales
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS social_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE,
        bio TEXT,
        avatar VARCHAR(500),
        cover_image VARCHAR(500),
        country VARCHAR(100) DEFAULT '',
        region VARCHAR(100) DEFAULT '',
        website VARCHAR(500),
        instagram VARCHAR(100),
        twitter VARCHAR(100),
        linkedin VARCHAR(100),
        contact_email VARCHAR(255),
        map_location TEXT,
        profile_visibility ENUM('public', 'private', 'followers') DEFAULT 'public',
        followers_count INT DEFAULT 0,
        following_count INT DEFAULT 0,
        posts_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_username (username),
        INDEX idx_visibility (profile_visibility)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de posts
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profile_id INT NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(500),
        likes_count INT DEFAULT 0,
        shares_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
        INDEX idx_profile (profile_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de likes
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS social_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        profile_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (post_id, profile_id),
        FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
        INDEX idx_post (post_id),
        INDEX idx_profile (profile_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de follows
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS social_follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_profile_id INT NOT NULL,
        following_profile_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_profile_id, following_profile_id),
        FOREIGN KEY (follower_profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (following_profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
        INDEX idx_follower (follower_profile_id),
        INDEX idx_following (following_profile_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de reportes
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS content_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reporter_profile_id INT NOT NULL,
        reported_profile_id INT NOT NULL,
        post_id INT,
        review_id INT,
        report_type ENUM('post', 'review', 'profile') NOT NULL,
        target_id INT DEFAULT 0,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
        reviewed_by INT,
        review_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_type (report_type),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tabla de reseñas de perfil (si no existe)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS profile_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reviewer_profile_id INT NOT NULL,
        reviewed_profile_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_review (reviewer_profile_id, reviewed_profile_id),
        FOREIGN KEY (reviewer_profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_profile_id) REFERENCES social_profiles(id) ON DELETE CASCADE,
        INDEX idx_reviewed (reviewed_profile_id),
        INDEX idx_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tablas de la comunidad creadas/verificadas exitosamente');
  } catch (error: any) {
    console.error('Error creando tablas de la comunidad:', error.message);
    // No lanzar error para permitir que la app funcione con fallback a datos mock
    console.warn('⚠️ Usando datos mock como fallback');
  }
}