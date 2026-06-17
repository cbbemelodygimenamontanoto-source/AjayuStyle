package com.ajayu.stepdefinitions;

import io.cucumber.java.es.*;
import net.serenitybdd.rest.SerenityRest;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class AdminStepDefinitions {

    private static final String API_PATH = "/api";
    private String adminToken;

    @Dado("que tengo un token de administrador válido")
    public void queTengoTokenAdmin() {
        adminToken = System.getenv().getOrDefault("ADMIN_TOKEN", "admin_test_token");
        CommonStepDefinitions.sharedAuthToken = adminToken;
    }

    @Dado("que tengo un token de un usuario sin rol de administrador")
    public void queTengoTokenUsuarioNormal() {
        CommonStepDefinitions.sharedAuthToken = System.getenv().getOrDefault("TEST_TOKEN", "user_test_token");
    }

    @Cuando("envío una solicitud GET a {string} con autenticación")
    public void envioGetConAuth(String endpoint) {
        CommonStepDefinitions.sharedResponse = SerenityRest.given()
                .header("Authorization", "Bearer " + CommonStepDefinitions.sharedAuthToken)
                .when()
                .get(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud GET a {string} sin token")
    public void envioGetSinToken(String endpoint) {
        CommonStepDefinitions.sharedResponse = SerenityRest.given()
                .when()
                .get(API_PATH + endpoint);
    }

    @Entonces("debe ser una lista de usuarios")
    public void debeSerListaUsuarios() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString();
        assertTrue(body.contains("[") || body.contains("\"id\":") || body.contains("users"),
            "La respuesta debe contener una lista de usuarios");
    }

    @Dado("que existe un usuario con id {int} para pruebas")
    public void queExisteUsuarioPruebas(int id) {
        // Para los tests asumimos que el usuario existe
    }

    @Dado("que existe un post con id {int} para pruebas")
    public void queExistePostPruebas(int id) {
        // Para los tests asumimos que el post existe
    }
}
