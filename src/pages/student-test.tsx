import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'

export default function StudentTestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/courses')
      const data = await response.json()
      setCourses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading courses:', error)
      setMessage('Error cargando cursos')
    } finally {
      setLoading(false)
    }
  }

  const enrollInCourse = async (courseId: string) => {
    setLoading(true)
    setMessage('')
    
    try {
      const token = localStorage.getItem('ajayu_token')
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ course_id: courseId })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('¡Te has inscrito exitosamente!')
        loadCourses()
      } else {
        setMessage(data.message || 'Error al inscribirse')
      }
    } catch (error) {
      console.error('Error enrolling:', error)
      setMessage('Error al inscribirse al curso')
    } finally {
      setLoading(false)
    }
  }

  const loadCourseDetails = async (courseId: string) => {
    setLoading(true)
    try {
      // Cargar lecciones
      const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`)
      const lessonsData = await lessonsResponse.json()
      setLessons(lessonsData.lessons || [])

      // Cargar tareas
      const assignmentsResponse = await fetch(`/api/assignments?course_id=${courseId}`)
      const assignmentsData = await assignmentsResponse.json()
      setAssignments(assignmentsData.assignments || [])

      // Cargar progreso
      const progressResponse = await fetch(`/api/student/progress?courseId=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ajayu_token')}`
        }
      })
      const progressData = await progressResponse.json()
      setProgress(progressData)

      // Cargar reseñas
      const reviewsResponse = await fetch(`/api/reviews?course_id=${courseId}`)
      const reviewsData = await reviewsResponse.json()
      setReviews(reviewsData.reviews || [])

      // Obtener información del curso
      const courseResponse = await fetch(`/api/courses/${courseId}`)
      const courseData = await courseResponse.json()
      setSelectedCourse(courseData)

    } catch (error) {
      console.error('Error loading course details:', error)
      setMessage('Error cargando detalles del curso')
    } finally {
      setLoading(false)
    }
  }

  const submitAssignment = async (assignmentId: string) => {
    setLoading(true)
    setMessage('')
    
    try {
      const token = localStorage.getItem('ajayu_token')
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          file_name: 'tarea_ejemplo.pdf',
          file_path: '/uploads/tarea_ejemplo.pdf'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('¡Tarea enviada exitosamente!')
        loadCourseDetails(selectedCourse.id)
      } else {
        setMessage(data.message || 'Error enviando tarea')
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      setMessage('Error enviando tarea')
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (courseId: string, rating: number, comment: string) => {
    setLoading(true)
    setMessage('')
    
    try {
      const token = localStorage.getItem('ajayu_token')
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: courseId,
          rating: rating,
          comment: comment
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('¡Reseña enviada exitosamente!')
        loadCourseDetails(courseId)
      } else {
        setMessage(data.message || 'Error enviando reseña')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      setMessage('Error enviando reseña')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Acceso Requerido</h1>
            <p className="mb-4">Debes iniciar sesión para probar las funcionalidades del estudiante.</p>
            <button 
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Ir a Login
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Prueba de Funcionalidades del Estudiante</h1>
            <p className="text-gray-600">Prueba todas las funcionalidades: inscripción, lecciones, tareas, calificaciones y reseñas</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Panel izquierdo: Lista de cursos */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">📚 Cursos Disponibles</h2>
                
                {loading && <div className="text-center py-4">Cargando...</div>}
                
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">${course.price || 'Gratis'}</span>
                        <div className="space-x-2">
                          <button
                            onClick={() => loadCourseDetails(course.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Ver Detalles
                          </button>
                          <button
                            onClick={() => enrollInCourse(course.id)}
                            disabled={loading}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            Inscribirse
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCourse && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">📊 Progreso del Estudiante</h2>
                  
                  {progress ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Progreso General:</span>
                        <span className="font-bold">{progress.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${progress.completion_percentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div>Lecciones: {progress.completed_lessons}/{progress.total_lessons}</div>
                          <div>Tareas: {progress.submitted_assignments}/{progress.total_assignments}</div>
                        </div>
                        <div>
                          <div>Promedio: {progress.average_grade}%</div>
                          <div>Inscrito: {new Date(progress.enrolled_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No hay datos de progreso</div>
                  )}
                </div>
              )}
            </div>

            {/* Panel derecho: Detalles del curso seleccionado */}
            <div className="space-y-6">
              {selectedCourse ? (
                <>
                  {/* Lecciones */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">📖 Lecciones</h3>
                    {lessons.length > 0 ? (
                      <div className="space-y-2">
                        {lessons.map((lesson, index) => (
                          <div key={lesson.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>Lección {index + 1}: {lesson.title}</span>
                            <span className="text-sm text-green-600">✓ Disponible</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500">No hay lecciones disponibles</div>
                    )}
                  </div>

                  {/* Tareas */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">📝 Tareas</h3>
                    {assignments.length > 0 ? (
                      <div className="space-y-3">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="border rounded p-3">
                            <h4 className="font-semibold">{assignment.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">
                                {assignment.has_submitted ? (
                                  <span className="text-green-600">✓ Enviada</span>
                                ) : (
                                  <span className="text-orange-600">⏳ Pendiente</span>
                                )}
                              </span>
                              {!assignment.has_submitted && (
                                <button
                                  onClick={() => submitAssignment(assignment.id)}
                                  disabled={loading}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Enviar Tarea
                                </button>
                              )}
                              {assignment.grade && (
                                <span className="text-sm font-bold">
                                  Calificación: {Math.round((assignment.grade.score / assignment.grade.max_score) * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500">No hay tareas disponibles</div>
                    )}
                  </div>

                  {/* Reseñas */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">⭐ Reseñas</h3>
                    
                    {/* Formulario para nueva reseña */}
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                      <h4 className="font-semibold mb-2">Deja tu reseña:</h4>
                      <div className="space-y-2">
                        <select id="rating" className="w-full p-2 border rounded">
                          <option value="">Selecciona calificación</option>
                          <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                          <option value="4">⭐⭐⭐⭐ Muy bueno</option>
                          <option value="3">⭐⭐⭐ Bueno</option>
                          <option value="2">⭐⭐ Regular</option>
                          <option value="1">⭐ Malo</option>
                        </select>
                        <textarea 
                          id="comment" 
                          placeholder="Escribe tu opinión..."
                          className="w-full p-2 border rounded"
                          rows={3}
                        ></textarea>
                        <button
                          onClick={() => {
                            const rating = (document.getElementById('rating') as HTMLSelectElement)?.value
                            const comment = (document.getElementById('comment') as HTMLTextAreaElement)?.value
                            if (rating) {
                              submitReview(selectedCourse.id, parseInt(rating), comment || '')
                            }
                          }}
                          disabled={loading}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Enviar Reseña
                        </button>
                      </div>
                    </div>

                    {/* Lista de reseñas */}
                    <div className="space-y-2">
                      {reviews.length > 0 ? (
                        reviews.map((review) => (
                          <div key={review.id} className="border rounded p-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold">{review.student_name}</span>
                              <span className="text-yellow-500">{'⭐'.repeat(review.rating)}</span>
                            </div>
                            <p className="text-sm text-gray-600">{review.comment || 'Sin comentario'}</p>
                            <span className="text-xs text-gray-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">No hay reseñas aún</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-center text-gray-500">
                    <h3 className="text-lg font-semibold mb-2">Selecciona un curso</h3>
                    <p>Haz clic en "Ver Detalles" de cualquier curso para probar todas las funcionalidades</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}