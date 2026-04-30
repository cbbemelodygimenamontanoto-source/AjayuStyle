import { pool } from '../../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Agregando columna avatar a la tabla users...');
    
    // Verificar si la columna avatar ya existe
    const [columns] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ajayu_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar'"
    );
    
    if (columns.length > 0) {
      console.log('✅ La columna avatar ya existe');
      return res.status(200).json({ 
        success: true, 
        message: 'La columna avatar ya existe en la tabla users',
        columns: columns 
      });
    }
    
    // Agregar la columna avatar
    await pool.execute('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL DEFAULT NULL AFTER password_hash');
    console.log('✅ Columna avatar agregada exitosamente');
    
    // Verificar la estructura actualizada
    const [structure] = await pool.execute('DESCRIBE users');
    
    res.status(200).json({ 
      success: true, 
      message: 'Columna avatar agregada exitosamente',
      structure: structure 
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Error al agregar columna avatar',
      details: error.message 
    });
  }
}