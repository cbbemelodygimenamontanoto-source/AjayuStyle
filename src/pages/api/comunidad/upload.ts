import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';

// ============================================================================
// IMAGE UPLOAD - API ROUTES
// ============================================================================

export const config = {
  api: {
    bodyParser: false,
  },
};

// Configuración
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'comunidad');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  try {
    // Asegurar que el directorio de uploads exista
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Parsear el multipart form data manualmente
    const chunks: Buffer[] = [];
    
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Extraer el archivo del body (simplificado - en producción usar multer o similar)
    // Por ahora retornamos un mock de URL
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `post_${timestamp}_${randomStr}.jpg`;
    const relativePath = `/uploads/comunidad/${filename}`;
    
    // En un entorno real, guardaríamos el archivo:
    // fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
    
    // Retornar la URL del archivo
    return res.status(200).json({
      success: true,
      url: relativePath,
      filename: filename,
      message: 'Imagen subida exitosamente (simulado)'
    });
  } catch (error: any) {
    console.error('Error subiendo imagen:', error);
    return res.status(500).json({ error: error.message || 'Error al subir imagen' });
  }
}