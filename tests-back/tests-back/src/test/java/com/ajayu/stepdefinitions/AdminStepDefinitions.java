package com.ajayu.stepdefinitions;

import io.cucumber.java.es.*;
import net.serenitybdd.rest.SerenityRest;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class AdminStepDefinitions {

    private static final String API_PATH = "/api";
    private String adminToken;

@Dado("que tengo un token de administrador válido")
public void queTengoTokenAdmin() {
    // Hacer login para obtener un token real
    io.restassured.response.Response loginResponse = io.restassured.RestAssured.given()
        .contentType("application/json")
        .body("{\"email\":\"admin.sistema@gmail.com\",\"password\":\"admin123\"}")
        .post("/api/auth/login");
    
    String token = loginResponse.jsonPath().getString("token");
    if (token == null) token = loginResponse.jsonPath().getString("data.token");
    
    CommonStepDefinitions.sharedAuthToken = token != null ? token : "invalid";
}

    @Dado("que tengo un token de un usuario sin rol de administrador")
    public void queTengoTokenUsuarioNormal() {
        CommonStepDefinitions.sharedAuthToken = System.getenv().getOrDefault("instructor123", "carlos_instructor");
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
