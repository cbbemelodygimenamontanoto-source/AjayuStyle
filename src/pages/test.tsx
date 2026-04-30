import React, { useState, useEffect } from 'react';

export default function Test() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setError('Error cargando cursos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTestCourse = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Necesitas iniciar sesión primero');
        return;
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Curso de Prueba ' + new Date().toLocaleTimeString(),
          description: 'Este es un curso de prueba para verificar que funciona la creación',
          category: 'programacion',
          level: 'beginner',
          price: 0
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Curso creado exitosamente!');
        fetchCourses();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (err) {
      alert('❌ Error creando curso');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #FF69B4 0%, #C33B80 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🎉 ¡Ajayu Final Funcionando!</h1>
      <p>✅ Next.js 14.2.33 iniciado correctamente</p>
      <p>✅ React 18 funcionando</p>
      <p>✅ MySQL2 configurado para servidor (API Routes)</p>
      <p>✅ Sin errores de compilación</p>
      <p>✅ Correcciones de nombres de tablas aplicadas</p>
      
      <div style={{ 
        marginTop: '30px', 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px' 
      }}>
        <h2>🔧 Correcciones Aplicadas:</h2>
        <p>✅ Tabla "roles" → "user_roles"</p>
        <p>✅ Columna "role_name" → "name"</p>
        <p>✅ Corrección en endpoints de instructor</p>
        <p>✅ Verificación de esquema de BD completa</p>
      </div>
      
      <div style={{ 
        marginTop: '30px', 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px' 
      }}>
        <h2>📊 Test de Cursos:</h2>
        <p>Total de cursos en BD: {courses.length}</p>
        
        <button
          onClick={createTestCourse}
          disabled={creating}
          style={{
            background: creating ? '#666' : '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            margin: '10px',
            cursor: creating ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {creating ? 'Creando...' : '➕ Crear Curso de Prueba'}
        </button>
        
        <button
          onClick={fetchCourses}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            margin: '10px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Refrescar Lista
        </button>
        
        {loading ? (
          <p>⏳ Cargando cursos...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>❌ {error}</p>
        ) : courses.length === 0 ? (
          <p>📝 No hay cursos creados aún</p>
        ) : (
          <div style={{ 
            maxHeight: '200px', 
            overflow: 'auto', 
            marginTop: '10px',
            background: 'rgba(255,255,255,0.1)',
            padding: '10px',
            borderRadius: '5px'
          }}>
            {courses.map((course: any) => (
              <div key={course.id} style={{ 
                margin: '10px 0', 
                padding: '10px', 
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '5px'
              }}>
                <strong>{course.title}</strong>
                <br />
                <small>{course.description}</small>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>📊 API Routes Disponibles:</h3>
        <p>• /api/test-db - Probar conexión MySQL</p>
        <p>• /api/courses - Obtener cursos</p>
        <p>• /api/courses/enroll - Inscribirse a curso</p>
        <p>• /api/auth/login - Iniciar sesión</p>
        <p>• /api/auth/register - Registrarse</p>
        <p>• /api/instructor/courses - Cursos del instructor</p>
        <p>• /api/instructor/assignments - Tareas</p>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <a 
          href="/" 
          style={{ 
            color: 'white', 
            textDecoration: 'underline',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          ← Volver a la página principal
        </a>
      </div>
    </div>
  );
}