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

    // Parsear el multipart form data
    const chunks: Buffer[] = [];
    
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Extraer content-type para verificar el tipo de imagen
    const contentType = req.headers['content-type'] || '';
    
    // Verificar tipo de archivo
    if (contentType.includes('multipart/form-data')) {
      // Intentar parsear el multipart
      const boundary = contentType.split('boundary=')[1];
      if (boundary) {
        const parts = buffer.toString('binary').split(`--${boundary}`);
        
        for (const part of parts) {
          if (part.includes('Content-Type:') && part.includes('image/')) {
            // Extraer el nombre del archivo
            const filenameMatch = part.match(/filename="(.+)"/);
            if (filenameMatch) {
              const originalFilename = filenameMatch[1];
              const ext = path.extname(originalFilename);
              const timestamp = Date.now();
              const randomStr = Math.random().toString(36).substring(2, 8);
              const filename = `img_${timestamp}_${randomStr}${ext}`;
              
              // Extraer los datos de la imagen (después de los headers)
              const headerEnd = part.indexOf('\r\n\r\n') + 4;
              const imageData = part.substring(headerEnd);
              
              // Convertir a buffer (quitar el último \r\n-- si existe)
              const cleanData = imageData.replace(/\r\n--$/, '');
              
              try {
                // Guardar el archivo
                const filepath = path.join(UPLOAD_DIR, filename);
                fs.writeFileSync(filepath, Buffer.from(cleanData, 'binary'));
                
                const relativePath = `/uploads/comunidad/${filename}`;
                
                return res.status(200).json({
                  success: true,
                  url: relativePath,
                  filename: filename,
                  originalName: originalFilename,
                  message: 'Imagen subida exitosamente'
                });
              } catch (writeError) {
                console.error('Error guardando archivo:', writeError);
              }
            }
          }
        }
      }
    }
    
    // Si no se pudo parsear multipart, retornar error
    return res.status(400).json({ 
      error: 'No se pudo procesar la imagen. Asegúrate de enviar un archivo de imagen válido.' 
    });
    
  } catch (error: any) {
    console.error('Error subiendo imagen:', error);
    return res.status(500).json({ error: error.message || 'Error al subir imagen' });
  }
}