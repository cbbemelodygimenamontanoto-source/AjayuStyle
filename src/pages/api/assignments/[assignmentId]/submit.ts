import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromToken } from '@/lib/auth';
import { getDbConnection } from '@/lib/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

// Configuración de multer para subida de archivos
const uploadDir = path.join(process.cwd(), 'uploads', 'assignments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, DOC, DOCX, TXT, ZIP, RAR'));
    }
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { assignmentId } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const connection = await getDbConnection();

    // Verificar que el assignment existe y el usuario está inscrito
    const [assignmentRows] = await connection.execute(
      'SELECT a.id, a.course_id FROM assignments a JOIN course_enrollments ce ON a.course_id = ce.course_id WHERE a.id = ? AND ce.student_id = ?',
      [assignmentId, user.id]
    );

    if (assignmentRows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Assignment no encontrado o no tienes acceso' });
    }

    let fileUrl = null;
    let textSubmission = null;

    // Manejar subida de archivo
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(req.file);
        }
      });
    }).then((file) => {
      if (file) {
        fileUrl = `/uploads/assignments/${file.filename}`;
      }
    }).catch((error) => {
      console.error('File upload error:', error);
    });

    // Si hay archivo subido, no procesar JSON
    if (!fileUrl && req.headers['content-type']?.includes('application/json')) {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
          data += chunk;
        });
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      
      textSubmission = body.text_submission;
    }

    // Verificar si ya existe una submission
    const [existingSubmissions] = await connection.execute(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, user.id]
    );

    if (existingSubmissions.length > 0) {
      // Actualizar submission existente
      await connection.execute(
        'UPDATE assignment_submissions SET file_url = ?, text_submission = ?, submitted_at = NOW(), status = "submitted" WHERE assignment_id = ? AND student_id = ?',
        [fileUrl, textSubmission, assignmentId, user.id]
      );
    } else {
      // Crear nueva submission
      await connection.execute(
        'INSERT INTO assignment_submissions (assignment_id, student_id, file_url, text_submission, status) VALUES (?, ?, ?, ?, "submitted")',
        [assignmentId, user.id, fileUrl, textSubmission]
      );
    }

    await connection.end();

    res.status(200).json({ 
      message: 'Assignment enviado exitosamente',
      file_url: fileUrl
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
}