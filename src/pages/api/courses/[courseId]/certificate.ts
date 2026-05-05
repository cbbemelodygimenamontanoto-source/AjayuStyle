import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { executeQuery, executeQuerySingle } from '@/lib/database';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { courseId } = req.query;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024') as any;
    const userId = decoded.userId;

    const courseIdNum = parseInt(courseId as string);

    if (!courseIdNum) {
      return res.status(400).json({ message: 'ID del curso requerido' });
    }

    // Verificar que el usuario está inscrito en el curso
    const enrollmentQuery = `
      SELECT 
        ce.*,
        c.title as course_title,
        c.description as course_description,
        u.name as instructor_name,
        u.email as instructor_email
      FROM course_enrollments ce
      JOIN courses c ON ce.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      WHERE ce.user_id = ? AND ce.course_id = ?
    `;

    const enrollment = await executeQuerySingle(enrollmentQuery, [userId, courseIdNum]);

    if (!enrollment) {
      return res.status(403).json({ message: 'No estás inscrito en este curso' });
    }

    // Verificar que el curso está completado
    if (enrollment.status !== 'completed') {
      return res.status(400).json({ 
        message: 'El curso debe estar completado para generar el certificado',
        progress: enrollment.progress_percentage
      });
    }

    // Verificar si ya existe un certificado
    let certificateQuery = `
      SELECT * FROM certificates 
      WHERE user_id = ? AND course_id = ? AND status = 'issued'
    `;

    let certificate = await executeQuerySingle(certificateQuery, [userId, courseIdNum]);

    if (!certificate) {
      // Generar nuevo certificado
      const certificateNumber = `CERT-${courseIdNum}-${userId}-${Date.now()}`;
      const issueDate = new Date();

      const insertCertificateQuery = `
        INSERT INTO certificates (
          user_id,
          course_id,
          certificate_number,
          issued_at,
          status
        ) VALUES (?, ?, ?, ?, 'issued')
      `;

      const result = await executeQuery(insertCertificateQuery, [
        userId,
        courseIdNum,
        certificateNumber,
        issueDate
      ]);

      // Obtener el certificado recién creado
      certificateQuery = `
        SELECT * FROM certificates 
        WHERE id = ?
      `;

      certificate = await executeQuerySingle(certificateQuery, [result.insertId]);
    }

    // Generar PDF del certificado
    try {
      // Crear un elemento HTML temporal para el certificado
      const certificateHTML = `
        <div style="
          width: 800px;
          height: 600px;
          padding: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: 'Arial', sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
          <div style="border: 3px solid #00FFE2; padding: 30px; border-radius: 15px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
            <h1 style="font-size: 36px; margin-bottom: 20px; color: #00FFE2; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
              🏆 CERTIFICADO DE FINALIZACIÓN 🏆
            </h1>
            
            <div style="font-size: 18px; margin: 20px 0;">
              <p style="margin: 10px 0;">Se certifica que</p>
              <h2 style="font-size: 28px; color: #fff; margin: 15px 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
                ${enrollment.user_name || 'Estudiante'}
              </h2>
              <p style="margin: 10px 0;">ha completado exitosamente el curso</p>
              <h3 style="font-size: 24px; color: #A848F0; margin: 15px 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
                "${enrollment.course_title}"
              </h3>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 10px;">
              <p style="margin: 5px 0; font-size: 14px;">Instructor: ${enrollment.instructor_name}</p>
              <p style="margin: 5px 0; font-size: 14px;">Fecha de finalización: ${new Date(certificate.issued_at).toLocaleDateString('es-ES')}</p>
              <p style="margin: 5px 0; font-size: 14px;">Progreso completado: 100%</p>
            </div>
            
            <div style="border-top: 2px solid #00FFE2; margin-top: 30px; padding-top: 20px;">
              <p style="font-size: 16px; color: #00FFE2; margin: 5px 0;">
                Certificado #${certificate.certificate_number}
              </p>
              <p style="font-size: 12px; color: #ccc; margin: 5px 0;">
                Plataforma Educativa Ajayu
              </p>
            </div>
          </div>
        </div>
      `;

      // Crear elemento temporal y convertir a canvas
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = certificateHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });

      document.body.removeChild(tempDiv);

      // Crear PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600]
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 800, 600);

      // Generar buffer del PDF
      const pdfBuffer = pdf.output('arraybuffer');

      // Actualizar el certificado con la URL del archivo
      const certificateFileName = `certificate-${certificate.certificate_number}.pdf`;
      const certificatePath = `/uploads/certificates/${certificateFileName}`;

      // En un entorno real, aquí guardarías el PDF en el servidor
      // Por ahora, retornamos el PDF directamente

      // Actualizar la base de datos con la URL del certificado
      await executeQuery(
        'UPDATE certificates SET certificate_url = ? WHERE id = ?',
        [certificatePath, certificate.id]
      );

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certificateFileName}"`);
      res.setHeader('Content-Length', pdfBuffer.byteLength);

      // Enviar el PDF
      res.status(200).send(Buffer.from(pdfBuffer));

    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      
      // Si falla la generación del PDF, retornar información del certificado
      res.status(200).json({
        message: 'Certificado disponible',
        certificate: {
          id: certificate.id,
          certificate_number: certificate.certificate_number,
          issued_at: certificate.issued_at,
          status: certificate.status,
          course_title: enrollment.course_title,
          student_name: enrollment.user_name,
          instructor_name: enrollment.instructor_name
        },
        download_url: `/api/certificates/${certificate.id}/download`
      });
    }

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}