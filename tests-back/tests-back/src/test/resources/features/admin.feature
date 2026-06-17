# language: es
# Tests del Panel de Administración de Ajayu

Característica: Panel de administración
  Como administrador de la plataforma
  Quiero acceder al panel de administración
  Para gestionar usuarios, cursos, posts y denuncias

  Antecedentes:
    Dado que la API está disponible en "http://localhost:3000"
    Y que tengo un token de administrador válido

  @admin @smoke
  Escenario: Obtener estadísticas del panel admin
    Cuando envío una solicitud GET a "/admin/full-panel?action=stats" con autenticación
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener el campo "stats"

  @admin
  Escenario: Listar todos los usuarios como administrador
    Cuando envío una solicitud GET a "/admin/full-panel?action=users" con autenticación
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener el campo "users"
    Y debe ser una lista de usuarios

  @admin
  Escenario: Listar todos los posts como administrador
    Cuando envío una solicitud GET a "/admin/full-panel?action=posts" con autenticación
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener el campo "posts"

  @admin
  Escenario: Listar todos los cursos como administrador
    Cuando envío una solicitud GET a "/admin/full-panel?action=courses" con autenticación
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener el campo "courses"

  @admin
  Escenario: Listar todas las denuncias/reportes
    Cuando envío una solicitud GET a "/admin/full-panel?action=reports" con autenticación
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener el campo "reports"

  @admin @negativo
  Escenario: Acceder al panel admin sin token debe fallar
    Cuando envío una solicitud GET a "/admin/full-panel?action=stats" sin token
    Entonces el código de respuesta debe ser 401

  @admin @negativo
  Escenario: Acceder al panel admin con token de usuario normal debe fallar
    Dado que tengo un token de un usuario sin rol de administrador
    Cuando envío una solicitud GET a "/admin/full-panel?action=stats" con autenticación
    Entonces el código de respuesta debe ser 403

  @admin
  Escenario: Eliminar un usuario como administrador
    Dado que existe un usuario con id 99 para pruebas
    Cuando envío una solicitud POST a "/admin/full-panel" con:
      """
      {
        "operation": "delete_user",
        "userId": 99
      }
      """
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener un mensaje de éxito

  @admin
  Escenario: Eliminar un post como administrador
    Dado que existe un post con id 99 para pruebas
    Cuando envío una solicitud POST a "/admin/full-panel" con:
      """
      {
        "operation": "delete_post",
        "postId": 99
      }
      """
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener un mensaje de éxito

  @admin
  Escenario: Ocultar un curso como administrador
    Cuando envío una solicitud POST a "/admin/full-panel" con:
      """
      {
        "operation": "hide_course",
        "courseId": 1
      }
      """
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener un mensaje de éxito
