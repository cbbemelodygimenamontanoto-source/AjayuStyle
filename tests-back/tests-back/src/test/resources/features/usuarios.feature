# language: es
# Tests de Usuarios - Sistema de Autenticación de Ajayu
# Autor: Ajayu Team

Característica: Gestión de usuarios y autenticación
  Como usuario de la plataforma Ajayu
  Quiero poder registrarme, iniciar sesión y gestionar mi cuenta
  Para acceder a los cursos y la comunidad

  Antecedentes:
    Dado que la API está disponible en "http://localhost:3000"

  @smoke @autenticacion
  Escenario: Registro exitoso de un nuevo usuario
    Cuando envío una solicitud POST a "/auth/register" con los datos:
      | name      | email                | password         | username |
      | Test User | test.ajayu@ejemplo.com | TestPassword123! | testuser |
    Entonces el código de respuesta debe ser 201
    Y la respuesta debe contener el campo "message"
    Y la respuesta debe contener el campo "user"

  @autenticacion @negativo
  Escenario: Registro con email duplicado debe fallar
    Dado que ya existe un usuario con email "test.ajayu@ejemplo.com"
    Cuando envío una solicitud POST a "/auth/register" con los datos:
      | name      | email                | password         | username   |
      | Otro User | test.ajayu@ejemplo.com | TestPassword123! | otro_user  |
    Entonces el código de respuesta debe ser 400 o 409
    Y la respuesta debe contener un mensaje de error

  @autenticacion
  Escenario: Login con credenciales válidas
    Dado que existe un usuario registrado con email "test.ajayu@ejemplo.com" y password "TestPassword123!"
    Cuando envío una solicitud POST a "/auth/login" con:
      """
      {
        "email": "test.ajayu@ejemplo.com",
        "password": "TestPassword123!"
      }
      """
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener el campo "token"
    Y la respuesta debe contener el campo "user"
    Y el token debe tener formato JWT válido

  @autenticacion @negativo
  Escenario: Login con contraseña incorrecta debe fallar
    Cuando envío una solicitud POST a "/auth/login" con:
      """
      {
        "email": "test.ajayu@ejemplo.com",
        "password": "ContraseñaIncorrecta"
      }
      """
    Entonces el código de respuesta debe ser 401
    Y la respuesta debe contener un mensaje de error

  @autenticacion @negativo
  Escenario: Login sin credenciales debe fallar
    Cuando envío una solicitud POST a "/auth/login" con:
      """
      {
        "email": "",
        "password": ""
      }
      """
    Entonces el código de respuesta debe ser 400
    Y la respuesta debe contener un mensaje de error

  @autenticacion
  Escenario: Verificar token de autenticación válido
    Dado que tengo un token JWT válido de un usuario autenticado
    Cuando envío una solicitud GET a "/auth/verify" con el token de autorización
    Entonces el código de respuesta debe ser 200
    Y la respuesta debe contener datos del usuario

  @autenticacion @negativo
  Escenario: Verificar token inválido debe fallar
    Cuando envío una solicitud GET a "/auth/verify" con token "token_invalido_123"
    Entonces el código de respuesta debe ser 401
