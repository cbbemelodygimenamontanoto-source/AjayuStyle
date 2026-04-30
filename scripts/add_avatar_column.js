const mysql = require('mysql2');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '0000',
  database: 'ajayu_db',
};

async function addAvatarColumn() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log(' Conectado exitosamente');
    
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ajayu_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar'"
    );
    
    if (columns.length > 0) {
      console.log('La columna avatar ya existe en la tabla users');
    } else {
      console.log('Agregando columna avatar...');
      await connection.execute('ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL DEFAULT NULL AFTER password_hash');
      console.log('Columna avatar agregada exitosamente');
    }
    
    const [structure] = await connection.execute('DESCRIBE users');
    console.log('\n Estructura actual de la tabla users:');
    structure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
  } catch (error) {
    console.error(' Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log(' Conexión cerrada');
    }
  }
}

addAvatarColumn();