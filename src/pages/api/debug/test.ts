import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo devolver información básica sin autenticación
  res.status(200).json({
    message: '✅ Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: 'OK'
  });
}