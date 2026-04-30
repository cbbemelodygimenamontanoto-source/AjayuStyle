import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== DEBUG AUTH ENDPOINT ===');
  
  // Información completa del header Authorization
  const authHeader = req.headers.authorization;
  console.log('Authorization header completo:', authHeader);
  console.log('Headers disponibles:', JSON.stringify(req.headers, null, 2));
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    authorization_header: authHeader,
    authorization_exists: !!authHeader,
    authorization_format: authHeader ? 'found' : 'missing',
    has_bearer_prefix: authHeader ? authHeader.startsWith('Bearer ') : false,
    token_extracted: null,
    token_length: 0,
    jwt_secret_used: process.env.JWT_SECRET || 'NOT_SET',
    verification_result: null,
    verification_error: null,
    decoded_token: null
  };

  if (!authHeader) {
    debugInfo.verification_error = 'No Authorization header found';
    console.log('❌ ERROR: No Authorization header found');
    return res.status(400).json({
      success: false,
      error: 'No Authorization header',
      debug: debugInfo
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    debugInfo.verification_error = 'Authorization header does not start with "Bearer "';
    console.log('❌ ERROR: Authorization header does not start with "Bearer "');
    return res.status(400).json({
      success: false,
      error: 'Invalid Authorization header format',
      debug: debugInfo
    });
  }

  // Extraer el token
  const token = authHeader.replace('Bearer ', '');
  debugInfo.token_extracted = token;
  debugInfo.token_length = token.length;
  
  console.log('Token extraído:', token);
  console.log('Longitud del token:', token.length);

  // Intentar verificar el token
  const jwtSecret = process.env.JWT_SECRET || 'tu-secret-super-secreto-aqui-cambialo-2024';
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    debugInfo.verification_result = 'SUCCESS';
    debugInfo.decoded_token = decoded;
    
    console.log('✅ JWT Verification SUCCESSFUL');
    console.log('Token decodificado:', decoded);
    
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      debug: debugInfo
    });
    
  } catch (error: any) {
    debugInfo.verification_result = 'FAILED';
    debugInfo.verification_error = error.message;
    
    console.log('❌ JWT Verification FAILED');
    console.log('Error:', error.message);
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      debug: debugInfo
    });
  }
}