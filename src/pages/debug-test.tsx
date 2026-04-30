import { useState, useEffect } from 'react'

export default function TestDebug() {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      const results: any = {}
      
      // Test 1: Servidor básico
      try {
        const basicTest = await fetch('/api/debug/test')
        results.basic = {
          status: basicTest.status,
          ok: basicTest.ok,
          data: await basicTest.json()
        }
      } catch (err: any) {
        results.basic = { error: err.message }
      }

      // Test 2: Debug instructor sin token
      try {
        const debugTest = await fetch('/api/debug/instructor-courses')
        results.debugInstructor = {
          status: debugTest.status,
          ok: debugTest.ok,
          data: await debugTest.json()
        }
      } catch (err: any) {
        results.debugInstructor = { error: err.message }
      }

      // Test 3: Cursos de instructor sin token
      try {
        const coursesTest = await fetch('/api/instructor/courses')
        results.instructorCourses = {
          status: coursesTest.status,
          ok: coursesTest.ok,
          data: await coursesTest.json()
        }
      } catch (err: any) {
        results.instructorCourses = { error: err.message }
      }

      setTestResults(results)
      setLoading(false)
    }

    runTests()
  }, [])

  const TestCard = ({ title, test }: { title: string, test: any }) => (
    <div style={{ 
      margin: '15px 0', 
      padding: '15px', 
      border: '1px solid #ddd',
      borderRadius: '8px',
      background: test.error ? '#ffe6e6' : '#e6f7ff'
    }}>
      <h3>{title}</h3>
      {test.error ? (
        <div style={{ color: 'red' }}>
          <strong>❌ Error:</strong> {test.error}
        </div>
      ) : (
        <div>
          <div><strong>Status:</strong> {test.status}</div>
          <div><strong>OK:</strong> {test.ok ? '✅' : '❌'}</div>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            marginTop: '10px',
            fontSize: '12px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {JSON.stringify(test.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )

  if (loading) {
    return <div style={{ padding: '20px', fontSize: '18px' }}>Ejecutando tests...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🧪 Test de Endpoints - Ajayu</h1>
      <p>Esta página prueba todos los endpoints para identificar problemas.</p>
      
      <TestCard title="🔧 Test Básico del Servidor" test={testResults.basic} />
      <TestCard title="🐛 Debug Instructor (sin token)" test={testResults.debugInstructor} />
      <TestCard title="📚 Cursos Instructor (sin token)" test={testResults.instructorCourses} />

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '8px' 
      }}>
        <h3>📋 Próximos Pasos:</h3>
        <ol>
          <li>Si algún test muestra <strong>error de conexión</strong>, reinicia el servidor</li>
          <li>Si muestra <strong>401/403</strong>, es normal (falta token de autenticación)</li>
          <li>Si muestra <strong>500</strong>, hay un error en el código</li>
        </ol>
      </div>
    </div>
  )
}