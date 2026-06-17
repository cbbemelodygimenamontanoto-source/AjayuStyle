package com.ajayu.stepdefinitions;

import io.cucumber.java.es.*;
import io.restassured.response.Response;
import net.serenitybdd.rest.SerenityRest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Step Definitions para los tests del panel de administración
 */
public class AdminStepDefinitions {

    private static final String API_PATH = "/api";
    private Response response;
    private String authToken;
    private String adminToken;

    @Dado("que tengo un token de administrador válido")
    public void queTengoTokenAdmin() {
        adminToken = System.getenv().getOrDefault("ADMIN_TOKEN", "admin_test_token");
        authToken = adminToken;
    }

    @Dado("que tengo un token de un usuario sin rol de administrador")
    public void queTengoTokenUsuarioNormal() {
        authToken = System.getenv().getOrDefault("TEST_TOKEN", "user_test_token");
    }

    @Cuando("envío una solicitud GET a {string} con autenticación")
    public void envioGetConAuth(String endpoint) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud GET a {string} sin token")
    public void envioGetSinToken(String endpoint) {
        response = SerenityRest.given()
                .when()
                .get(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud POST a {string} con:")
    public void envioPostConBody(String endpoint, String body) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType("application/json")
                .body(body)
                .when()
                .post(API_PATH + endpoint);
    }


    @Entonces("la respuesta debe contener el campo {string}")
    public void laRespuestaContiene(String field) {
        assertThat(response.jsonPath().get(field), notNullValue());
    }

    @Entonces("debe ser una lista de usuarios")
    public void debeSerListaUsuarios() {
        String body = response.getBody().asString();
        assertTrue(body.contains("[") || body.contains("\"id\":") || body.contains("users"),
            "La respuesta debe contener una lista de usuarios");
    }

    @Dado("que existe un usuario con id {int} para pruebas")
    public void queExisteUsuarioPruebas(int id) {
        // Para los tests asumimos que el usuario existe o se creará en el setup
    }

    @Dado("que existe un post con id {int} para pruebas")
    public void queExistePostPruebas(int id) {
        // Para los tests asumimos que el post existe o se creará en el setup
    }

    @Entonces("la respuesta debe contener un mensaje de éxito")
    public void laRespuestaContieneExito() {
        String body = response.getBody().asString().toLowerCase();
        assertTrue(body.contains("éxito") || body.contains("exito") || body.contains("success") ||
                body.contains("eliminad") || body.contains("actualizad") || body.contains("ocultad"),
            "La respuesta debe contener un mensaje de éxito");
    }
}
