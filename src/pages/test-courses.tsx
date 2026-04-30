import { useState, useEffect } from 'react'

export default function QuickTest() {
  const [status, setStatus] = useState<string>('Iniciando...')
  const [courses, setCourses] = useState<any[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const testCourses = async () => {
      try {
        setStatus('Obteniendo token...')
        
        // Obtener token del localStorage
        const token = localStorage.getItem('ajayu_token')
        if (!token) {
          throw new Error('No hay token de autenticación')
        }

        setStatus('Llamando API de cursos...')
        
        const response = await fetch('/api/instructor/courses', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        setStatus(`API respondió con status: ${response.status}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Error ${response.status}: ${errorData.message || 'Error desconocido'}`)
        }

        const data = await response.json()
        
        setStatus(`✅ API funcionando - ${Array.isArray(data) ? data.length : 'no array'} cursos encontrados`)
        setCourses(Array.isArray(data) ? data : [])
        setError('')
        
      } catch (err: any) {
        setStatus(`❌ Error: ${err.message}`)
        setError(err.message)
      }
    }

    testCourses()
  }, [])

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>🧪 Prueba Rápida - Cursos Instructor</h1>
      
      <div style={{ 
        background: '#f0f8ff', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #0066cc'
      }}>
        <strong>Estado:</strong> {status}
      </div>

      {error && (
        <div style={{ 
          background: '#ffe6e6', 
          color: '#cc0000',
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ff9999'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {courses.length > 0 && (
        <div style={{ 
          background: '#e6ffe6', 
          color: '#006600',
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #99ff99'
        }}>
          <strong>✅ Éxito:</strong> Se encontraron {courses.length} cursos
        </div>
      )}

      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>📚 Cursos encontrados:</h3>
        {courses.length === 0 ? (
          <p style={{ color: '#666' }}>No hay cursos para mostrar</p>
        ) : (
          <ul>
            {courses.map((course, index) => (
              <li key={course.id || index} style={{ marginBottom: '10px' }}>
                <strong>{course.title}</strong> 
                {course.published ? ' (✅ Publicado)' : ' (📝 Borrador)'}
                <br />
                <small>
                  Estudiantes: {course.student_count || 0} | 
                  Lecciones: {course.lesson_count || 0} | 
                  Precio: ${course.price || 0}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h3>📋 Próximos pasos:</h3>
        <ol>
          <li>Si muestra <strong>✅ Éxito</strong> con cursos, el endpoint funciona</li>
          <li>Si muestra <strong>❌ Error</strong>, revisa la consola del navegador</li>
          <li>Una vez funcionando, ve al dashboard principal</li>
        </ol>
      </div>
    </div>
  )
}