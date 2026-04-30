import { useState, useEffect } from 'react'

export default function DebugSimple() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const debugData = async () => {
      try {
        // Test basic API
        const response = await fetch('/api/debug/instructor-courses')
        const data = await response.json()
        
        console.log('Debug data:', data)
        
        if (response.ok) {
          setUser(data.user)
          setCourses(data.courses || [])
          setError('')
        } else {
          setError(data.error || 'Error en la API')
        }
      } catch (err: any) {
        setError(`Error de conexión: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    debugData()
  }, [])

  if (loading) {
    return <div style={{ padding: '20px', fontSize: '18px' }}>Cargando...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🐛 Debug Simple - Ajayu</h1>
      
      {error && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '15px', 
          margin: '10px 0',
          borderRadius: '5px'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      <div style={{ margin: '20px 0' }}>
        <h2>📋 Estado de Usuario:</h2>
        <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2>📚 Cursos Encontrados: {courses.length}</h2>
        {courses.length === 0 ? (
          <div style={{ 
            background: '#ffe6e6', 
            padding: '15px', 
            borderRadius: '5px',
            border: '1px solid #ffcccc'
          }}>
            <strong>⚠️ No se encontraron cursos</strong>
            <p>Esto confirma el problema que estás reportando.</p>
          </div>
        ) : (
          <div style={{ 
            background: '#e6ffe6', 
            padding: '15px', 
            borderRadius: '5px',
            border: '1px solid #ccffcc'
          }}>
            <strong>✅ Se encontraron {courses.length} cursos</strong>
            <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px', borderRadius: '3px' }}>
              {JSON.stringify(courses, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2>🔧 Comandos de Prueba:</h2>
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
          <p><strong>En consola del navegador (F12 → Console):</strong></p>
          <code>
            fetch('/api/debug/instructor-courses').then(r => r.json()).then(console.log)
          </code>
          <br /><br />
          <p><strong>Verificar base de datos:</strong></p>
          <code>mysql -u root -p0000 ajayu_db -e "SELECT * FROM courses LIMIT 5;"</code>
        </div>
      </div>
    </div>
  )
}