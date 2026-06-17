# language: es
# Tests de Cursos - Plataforma Educativa de Ajayu

Característica: Gestión de cursos
  Como instructor de Ajayu
  Quiero crear, editar y gestionar cursos
  Para compartir conocimiento con los estudiantes

  Antecedentes:
    Dado que la API está disponible en "http://localhost:3000"
    Y que tengo un token de autenticación válido

  @cursos @smoke
  Escenario: Listar todos los cursos publicados
    Cuando envío una solicitud GET a "/courses"
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe ser una lista
    Y cada curso debe tener un id y un título

  @cursos
  Escenario: Obtener detalles de un curso específico
    Dado que existe un curso con id 1
    Cuando envío una solicitud GET a "/courses/1"
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener el campo "title"
    Y la respuesta debe contener el campo "description"

  @cursos
  Escenario: Obtener lecciones de un curso
    Dado que existe un curso con id 1
    Cuando envío una solicitud GET a "/courses/1/lessons"
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe ser una lista de lecciones

  @cursos @instructor
  Escenario: Crear un nuevo curso siendo instructor
    Cuando envío una solicitud POST a "/courses/create" con:
      """
      {
        "title": "Curso de Prueba Automatizado",
        "description": "Este es un curso creado por los tests automatizados",
        "category": "programacion",
        "level": "beginner",
        "price": 0
      }
      """
    Entonces el código de respuesta debe ser 201
    Y la respuesta debe contener el campo "course"
    Y el curso creado debe tener un id

  @cursos @negativo
  Escenario: Crear curso sin título debe fallar
    Cuando envío una solicitud POST a "/courses/create" con:
      """
      {
        "description": "Sin título"
      }
      """
    Entonces el código de respuesta debe ser 400
    Y la respuesta debe contener un mensaje de error

  @cursos @instructor
  Escenario: Editar un curso existente
    Dado que tengo un curso creado con id "X"
    Cuando envío una solicitud PUT a "/courses/X/edit" con:
      """
      {
        "title": "Curso Editado por Tests",
        "description": "Descripción actualizada"
      }
      """
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener un mensaje de éxito

  @cursos
  Escenario: Inscribirse a un curso
    Dado que existe un curso con id 1
    Cuando envío una solicitud POST a "/courses/enroll" con:
      """
      {
        "courseId": 1
      }
      """
    Entonces el código de respuesta debe ser 200 o 201
    Y la respuesta debe contener un mensaje de éxito

  @cursos @admin
  Escenario: Eliminar un curso como administrador
    Dado que soy un usuario administrador
    Cuando envío una solicitud DELETE a "/courses/X/delete"
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener un mensaje de éxito
