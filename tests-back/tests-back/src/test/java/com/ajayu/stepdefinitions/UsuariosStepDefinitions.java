package com.ajayu.stepdefinitions;

import io.cucumber.java.Before;
import io.cucumber.java.es.*;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import net.serenitybdd.rest.SerenityRest;
import net.serenitybdd.core.Serenity;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Step Definitions para los tests de usuarios
 */
public class UsuariosStepDefinitions {

    private static final String BASE_URL = "http://localhost:3000";
    private static final String API_PATH = "/api";
    private Response response;
    private String authToken;

    @Before
    public void setup() {
        SerenityRest.useRelaxedHTTPSValidation();
    }

    @Dado("que la API está disponible en {string}")
    public void queLaApiEstaDisponible(String url) {
        RestAssured.baseURI = url;
    }

    @Cuando("envío una solicitud POST a {string} con los datos:")
    public void envioSolicitudPostConDatos(String endpoint, io.cucumber.datatable.DataTable dataTable) {
        var data = dataTable.asMap(String.class, String.class);
        response = SerenityRest.given()
                .contentType("application/json")
                .body(data)
                .when()
                .post(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud POST a {string} con:")
    public void envioSolicitudPostCon(String endpoint, String body) {
        response = SerenityRest.given()
                .contentType("application/json")
                .body(body)
                .when()
                .post(API_PATH + endpoint);
    }

    @Entonces("el código de respuesta debe ser {int}")
    public void elCodigoDeRespuestaDebeSer(int statusCode) {
        assertThat(response.getStatusCode(), equalTo(statusCode));
    }

    @Entonces("el código de respuesta debe ser {int} o {int}")
    public void elCodigoDeRespuestaDebeSerOpciones(int code1, int code2) {
        int actual = response.getStatusCode();
        assertTrue(actual == code1 || actual == code2,
            "Se esperaba código " + code1 + " o " + code2 + " pero se obtuvo " + actual);
    }

    @Entonces("la respuesta debe contener el campo {string}")
    public void laRespuestaDebeContenerCampo(String field) {
        assertThat(response.jsonPath().get(field), notNullValue());
    }

    @Entonces("la respuesta debe contener un mensaje de error")
    public void laRespuestaDebeContenerMensajeDeError() {
        String body = response.getBody().asString();
        assertThat(body.toLowerCase(), anyOf(containsString("error"), containsString("inválid"),
                containsString("requerido"), containsString("no encontrado")));
    }

    @Entonces("el token debe tener formato JWT válido")
    public void elTokenDebeTenerFormatoJWT() {
        String token = response.jsonPath().getString("token");
        assertThat(token, notNullValue());
        // JWT tiene 3 partes separadas por puntos
        String[] parts = token.split("\\.");
        assertThat(parts.length, equalTo(3));
    }

    @Dado("que existe un usuario registrado con email {string} y password {string}")
    public void queExisteUsuarioRegistrado(String email, String password) {
        // En un ambiente real, esto podría verificar la base de datos o crearlo
        // Para los tests asumimos que el usuario ya existe (configurado en el setup)
        Serenity.recordReportData().withTitle("Usuario de prueba").andContents(email);
    }

    @Dado("que ya existe un usuario con email {string}")
    public void queYaExisteUsuarioConEmail(String email) {
        // En producción, verificaríamos en la BD
        Serenity.recordReportData().withTitle("Email duplicado").andContents(email);
    }

    @Dado("que tengo un token JWT válido de un usuario autenticado")
    public void queTengoTokenValido() {
        // En un setup real, haríamos login primero y guardaríamos el token
        // Para este ejemplo, lo dejamos preparado para integración
        authToken = "Bearer_token_placeholder";
    }

    @Cuando("envío una solicitud GET a {string} con el token de autorización")
    public void envioGetConToken(String endpoint) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud GET a {string} con token {string}")
    public void envioGetConTokenInvalido(String endpoint, String token) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get(API_PATH + endpoint);
    }

    @Entonces("la respuesta debe contener datos del usuario")
    public void laRespuestaDebeContenerDatosUsuario() {
        String body = response.getBody().asString();
        assertTrue(body.contains("user") || body.contains("email") || body.contains("id"),
            "La respuesta debe contener datos del usuario");
    }
}
