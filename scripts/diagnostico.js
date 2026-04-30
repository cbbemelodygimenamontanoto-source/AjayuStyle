const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '0000',
  database: process.env.DB_NAME || 'ajayu_db',
};

async function diagnosticarSistema() {
  console.log(' INICIANDO DIAGNÓSTICO COMPLETO DEL SISTEMA AJAUFINAL\n');
  console.log('=' .repeat(60));
  
  let connection;
  
  try {
    console.log('\n 1. VERIFICANDO CONEXIÓN A BASE DE DATOS...');
    connection = await mysql.createConnection(dbConfig);
    console.log(' Conexión a MySQL exitosa');
    
    console.log('\n 2. VERIFICANDO ESTRUCTURA DE TABLAS...');
    
    const tablasNecesarias = [
      'users',
      'user_roles', 
      'user_role_assignments',
      'courses',
      'lessons',
      'enrollments'
    ];
    
    for (const tabla of tablasNecesarias) {
      try {
        const [rows] = await connection.execute(`SHOW TABLES LIKE '${tabla}'`);
        if (rows.length > 0) {
          console.log(` Tabla '${tabla}' existe`);
          
          const [columns] = await connection.execute(`DESCRIBE ${tabla}`);
          console.log(`   - Columnas: ${columns.map(c => c.Field).join(', ')}`);
        } else {
          console.log(` Tabla '${tabla}' NO EXISTE`);
        }
      } catch (error) {
        console.log(` Error verificando tabla '${tabla}': ${error.message}`);
      }
    }
    
    console.log('\n👥 3. VERIFICANDO USUARIOS EN LA BASE DE DATOS...');
    
    try {
      const [usuarios] = await connection.execute(`
        SELECT u.id, u.email, u.name, u.status,
               GROUP_CONCAT(ur.name) as roles
        FROM users u
        LEFT JOIN user_role_assignments ura ON u.id = ura.student_id
        LEFT JOIN user_roles ur ON ura.role_id = ur.id
        GROUP BY u.id
        ORDER BY u.id
      `);
      
      if (usuarios.length === 0) {
        console.log(' NO HAY USUARIOS EN LA BASE DE DATOS');
      } else {
        console.log(` Encontrados ${usuarios.length} usuarios:`);
        usuarios.forEach(user => {
          console.log(`   - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.name}`);
          console.log(`     Rol: ${user.roles || 'sin rol'}, Estado: ${user.status}`);
        });
      }
    } catch (error) {
      console.log(` Error consultando usuarios: ${error.message}`);
    }
    
    console.log('\n 4. VERIFICANDO CURSOS EN LA BASE DE DATOS...');
    
    try {
      const [cursos] = await connection.execute(`
        SELECT c.id, c.title, c.published, c.instructor_id, u.name as instructor_name,
               COUNT(l.id) as total_lecciones
        FROM courses c
        JOIN users u ON c.instructor_id = u.id
        LEFT JOIN lessons l ON c.id = l.course_id
        GROUP BY c.id
        ORDER BY c.id
      `);
      
      if (cursos.length === 0) {
        console.log(' NO HAY CURSOS EN LA BASE DE DATOS');
      } else {
        console.log(` Encontrados ${cursos.length} cursos:`);
        cursos.forEach(curso => {
          console.log(`   - ID: ${curso.id}, Título: ${curso.title}`);
          console.log(`     Instructor: ${curso.instructor_name}, Publicado: ${curso.published ? 'Sí' : 'No'}`);
          console.log(`     Lecciones: ${curso.total_lecciones}`);
        });
      }
    } catch (error) {
      console.log(` Error consultando cursos: ${error.message}`);
    }
    
    console.log('\n🎓 5. VERIFICANDO INSCRIPCIONES A CURSOS...');
    
    try {
      const [inscripciones] = await connection.execute(`
        SELECT COUNT(*) as total_inscripciones
        FROM enrollments
      `);
      
      console.log(` Total de inscripciones: ${inscripciones[0].total_inscripciones}`);
    } catch (error) {
      console.log(` Error consultando inscripciones: ${error.message}`);
    }
    
    console.log('\n 6. PROBANDO AUTENTICACIÓN...');
    
    const usuariosTest = [
      'usuario.normal@gmail.com',
      'instructor.master@gmail.com',
      'admin.sistema@gmail.com'
    ];
    
    for (const email of usuariosTest) {
      try {
        const [user] = await connection.execute(
          'SELECT id, email, name, password_hash FROM users WHERE email = ?',
          [email]
        );
        
        if (user.length > 0) {
          console.log(` Usuario encontrado: ${email}`);
        } else {
          console.log(` Usuario NO encontrado: ${email}`);
        }
      } catch (error) {
        console.log(` Error consultando ${email}: ${error.message}`);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(' DIAGNÓSTICO COMPLETADO\n');
    
    const problemas = [];
    
    const [usuariosCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (usuariosCount[0].count === 0) {
      problemas.push(' No hay usuarios en la base de datos');
    }
    
    const [cursosCount] = await connection.execute('SELECT COUNT(*) as count FROM courses');
    if (cursosCount[0].count === 0) {
      problemas.push(' No hay cursos en la base de datos');
    }
    
    const [rolesCount] = await connection.execute('SELECT COUNT(*) as count FROM user_roles');
    if (rolesCount[0].count === 0) {
      problemas.push(' No existe el sistema de roles (tabla user_roles vacía)');
    }
    
    if (problemas.length > 0) {
      console.log(' PROBLEMAS DETECTADOS:');
      problemas.forEach(problema => console.log(`   ${problema}`));
      console.log('\n SOLUCIÓN: Ejecuta el script SQL: BASE_DATOS_AJAYU_CORREGIDA_FINAL.sql');
    } else {
      console.log(' BASE DE DATOS ESTÁ BIEN ESTRUCTURADA');
      console.log('\n SI AÚN NO FUNCIONA, EL PROBLEMA PUEDE SER:');
      console.log('   - Configuración de variables de entorno (.env)');
      console.log('   - Puerto incorrecto en el frontend');
      console.log('   - Problemas de caché del navegador');
      console.log('   - Errores en el código del frontend');
    }
    
  } catch (error) {
    console.log('\n ERROR DE CONEXIÓN A BASE DE DATOS:');
    console.log(`   ${error.message}`);
    console.log('\n POSIBLES SOLUCIONES:');
    console.log('   1. Verificar que MySQL esté ejecutándose');
    console.log('   2. Verificar credenciales en archivo .env');
    console.log('   3. Verificar que la base de datos "ajayu_db" existe');
    console.log('   4. Verificar puerto (por defecto 3306)');
    
    console.log('\nCONFIGURACIÓN ACTUAL:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    console.log(`   Usuario: ${dbConfig.user}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

diagnosticarSistema().catch(console.error);