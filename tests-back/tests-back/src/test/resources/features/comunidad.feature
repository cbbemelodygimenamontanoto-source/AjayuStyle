# language: es
# Tests de Comunidad - Funcionalidad social de Ajayu

Característica: Gestión de la comunidad
  Como usuario de la comunidad Ajayu
  Quiero publicar, dar likes y seguir a otros usuarios
  Para interactuar con la comunidad

  Antecedentes:
    Dado que la API está disponible en "http://localhost:3000"
    Y que tengo un token de autenticación válido

  @comunidad @smoke
  Escenario: Ver el feed de posts públicos
    Cuando envío una solicitud GET a "/comunidad/posts?profile_id=1&limit=20"
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe tener el formato correcto del feed

  @comunidad
  Escenario: Crear un nuevo post en la comunidad
    Cuando envío una solicitud POST a "/comunidad/posts" con:
      """
      {
        "content": "Este es un post creado por los tests automatizados",
        "image_url": null
      }
      """
    Entonces el código de respuesta debe ser 200 o 201
    Y la respuesta debe contener el campo "post_id"

  @comunidad @negativo
  Escenario: Crear un post sin contenido debe fallar
    Cuando envío una solicitud POST a "/comunidad/posts" con:
      """
      {
        "content": ""
      }
      """
    Entonces el código de respuesta debe ser 400

  @comunidad
  Escenario: Obtener perfil social de un usuario
    Cuando envío una solicitud GET a "/comunidad/profiles?user_id=1"
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener información del perfil

  @comunidad
  Escenario: Dar like a un post
    Dado que existe un post con id 1
    Cuando envío una solicitud POST a "/comunidad/likes" con:
      """
      {
        "postId": 1,
        "action": "like"
      }
      """
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe confirmar el like

  @comunidad
  Escenario: Seguir a otro usuario
    Cuando envío una solicitud POST a "/comunidad/follows" con:
      """
      {
        "followingProfileId": 2,
        "action": "follow"
      }
      """
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe confirmar el seguimiento

  @comunidad
  Escenario: Crear una reseña de perfil
    Cuando envío una solicitud POST a "/comunidad/reviews" con:
      """
      {
        "reviewed_profile_id": 2,
        "rating": 5,
        "comment": "Excelente usuario!"
      }
      """
    Entonces el código de respuesta debe ser 200 o 201
