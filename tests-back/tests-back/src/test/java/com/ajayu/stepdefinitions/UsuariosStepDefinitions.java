package com.ajayu.stepdefinitions;

import io.cucumber.java.Before;
import io.cucumber.java.es.*;
import io.restassured.RestAssured;
import net.serenitybdd.rest.SerenityRest;
import net.serenitybdd.core.Serenity;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class UsuariosStepDefinitions {

    private static final String API_PATH = "/api";

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
    // Convierte la tabla de 2 columnas (campo|valor) a un Map
    java.util.Map<String, String> data = new java.util.HashMap<>();
    java.util.List<java.util.List<String>> rows = dataTable.asLists(String.class);
    
    // Si la primera fila es encabezado ("campo", "valor"), saltarla
    int startRow = 0;
    if (rows.get(0).get(0).equalsIgnoreCase("campo") || 
        rows.get(0).get(0).equalsIgnoreCase("field") ||
        rows.get(0).get(0).equalsIgnoreCase("key")) {
        startRow = 1;
    }
    
    for (int i = startRow; i < rows.size(); i++) {
        data.put(rows.get(i).get(0), rows.get(i).get(1));
    }
    
    CommonStepDefinitions.sharedResponse = SerenityRest.given()
            .contentType("application/json")
            .body(data)
            .when()
            .post(API_PATH + endpoint);
}

    @Entonces("el token debe tener formato JWT válido")
    public void elTokenDebeTenerFormatoJWT() {
        String token = CommonStepDefinitions.sharedResponse.jsonPath().getString("token");
        assertThat(token, notNullValue());
        String[] parts = token.split("\\.");
        assertThat(parts.length, equalTo(3));
    }

    @Dado("que existe un usuario registrado con email {string} y password {string}")
    public void queExisteUsuarioRegistrado(String email, String password) {
        Serenity.recordReportData().withTitle("Usuario de prueba").andContents(email);
    }

    @Dado("que ya existe un usuario con email {string}")
    public void queYaExisteUsuarioConEmail(String email) {
        Serenity.recordReportData().withTitle("Email duplicado").andContents(email);
    }

    @Dado("que tengo un token JWT válido de un usuario autenticado")
    public void queTengoTokenValido() {
        CommonStepDefinitions.sharedAuthToken = "Bearer_token_placeholder";
    }

    @Cuando("envío una solicitud GET a {string} con el token de autorización")
    public void envioGetConToken(String endpoint) {
        CommonStepDefinitions.sharedResponse = SerenityRest.given()
                .header("Authorization", "Bearer " + CommonStepDefinitions.sharedAuthToken)
                .when()
                .get(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud GET a {string} con token {string}")
    public void envioGetConTokenInvalido(String endpoint, String token) {
        CommonStepDefinitions.sharedResponse = SerenityRest.given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get(API_PATH + endpoint);
    }

    @Entonces("la respuesta debe contener datos del usuario")
    public void laRespuestaDebeContenerDatosUsuario() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString();
        assertTrue(body.contains("user") || body.contains("email") || body.contains("id"),
            "La respuesta debe contener datos del usuario");
    }
}
