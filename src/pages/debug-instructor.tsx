import { useState, useEffect } from 'react';

export default function DebugInstructor() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ajayu_token');
      
      if (!token) {
        setError('No hay token de autenticación. Inicia sesión primero.');
        return;
      }

      const response = await fetch('/api/debug/instructor-courses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setDebugInfo(data);

      if (!response.ok) {
        setError(data.message || 'Error en la respuesta');
      }

    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const createTestCourse = async () => {
    try {
      const token = localStorage.getItem('ajayu_token');
      
      if (!token) {
        alert('No hay token de autenticación');
        return;
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Curso Debug ' + new Date().toLocaleTimeString(),
          description: 'Curso creado para debugging',
          category: 'debug',
          level: 'beginner',
          price: 0
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Curso creado exitosamente! Ahora actualiza para ver los cambios.');
        fetchDebugInfo();
      } else {
        alert('❌ Error: ' + data.message);
      }

    } catch (err) {
      console.error('Error:', err);
      alert('❌ Error creando curso');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔄 Cargando información de debug...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={fetchDebugInfo}>🔄 Reintentar</button>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No hay información de debug</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1>🔍 Debug - Instructor Courses</h1>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={createTestCourse}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          ➕ Crear Curso de Prueba
        </button>
        
        <button 
          onClick={fetchDebugInfo}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>📋 Resumen</h3>
        <p><strong>User ID:</strong> {debugInfo.userId}</p>
        <p><strong>Es Instructor:</strong> {debugInfo.isInstructor ? '✅ Sí' : '❌ No'}</p>
        <p><strong>Roles:</strong> {debugInfo.userRoles?.map((r: any) => r.name).join(', ') || 'Ninguno'}</p>
        <p><strong>Total Cursos (BD):</strong> {debugInfo.allUserCourses?.length || 0}</p>
        <p><strong>Cursos con Stats:</strong> {debugInfo.instructorCourses?.length || 0}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>📚 Todos los Cursos del Usuario (BD Directa)</h3>
          <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd' }}>
            <pre style={{ padding: '10px', background: 'white' }}>
              {JSON.stringify(debugInfo.allUserCourses, null, 2)}
            </pre>
          </div>
        </div>

        <div>
          <h3>📊 Cursos con Estadísticas (API)</h3>
          <div style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #ddd' }}>
            <pre style={{ padding: '10px', background: 'white' }}>
              {JSON.stringify(debugInfo.instructorCourses, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '5px' }}>
        <h3>🎯 Conclusiones</h3>
        <p>• Si los cursos aparecen en "BD Directa" pero no en "API", hay un problema en la consulta del endpoint</p>
        <p>• Si no aparecen en ambos, el curso no se está creando correctamente</p>
        <p>• Si no hay roles de instructor, el usuario necesita ser asignado como instructor</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/instructor-dashboard" style={{ 
          background: '#FF9800', 
          color: 'white', 
          padding: '10px 20px', 
          borderRadius: '5px', 
          textDecoration: 'none' 
        }}>
          🚀 Ir al Dashboard del Instructor
        </a>
      </div>
    </div>
  );
}