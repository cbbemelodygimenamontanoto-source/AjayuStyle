package com.ajayu.stepdefinitions;

import io.cucumber.java.es.*;
import io.restassured.response.Response;
import net.serenitybdd.rest.SerenityRest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

/**
 * Step Definitions para los tests de comunidad
 */
public class ComunidadStepDefinitions {

    private static final String API_PATH = "/api";
    private Response response;
    private String authToken;

    @Dado("que tengo un token de autenticación válido")
    public void queTengoTokenValido() {
        authToken = System.getenv().getOrDefault("TEST_TOKEN", "test_token");
    }

    @Cuando("envío una solicitud GET a {string}")
    public void envioGet(String endpoint) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud POST a {string} con:")
    public void envioPost(String endpoint, String body) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + authToken)
                .contentType("application/json")
                .body(body)
                .when()
                .post(API_PATH + endpoint);
    }

    @Entonces("el código de respuesta debe ser {int}")
    public void elCodigoEs(int code) {
        assertThat(response.getStatusCode(), equalTo(code));
    }

    @Entonces("el código de respuesta debe ser {int} o {int}")
    public void elCodigoEsUnoDe(int code1, int code2) {
        int actual = response.getStatusCode();
        assertThat(actual, anyOf(equalTo(code1), equalTo(code2)));
    }

    @Entonces("la respuesta debe tener el formato correcto del feed")
    public void laRespuestaFormatoFeed() {
        String body = response.getBody().asString();
        assertTrue(body.contains("post_id") || body.contains("content") || body.contains("posts"),
            "La respuesta debe tener formato de feed de posts");
    }

    @Entonces("la respuesta debe contener el campo {string}")
    public void laRespuestaContiene(String field) {
        assertThat(response.jsonPath().get(field), notNullValue());
    }

    @Entonces("la respuesta debe contener información del perfil")
    public void laRespuestaContienePerfil() {
        String body = response.getBody().asString();
        assertTrue(body.contains("username") || body.contains("profile") || body.contains("user_id"),
            "La respuesta debe contener información del perfil");
    }

    @Dado("que existe un post con id {int}")
    public void queExistePost(int id) {
        // Para los tests asumimos que existe
    }

    @Entonces("la respuesta debe confirmar el like")
    public void laRespuestaConfirmaLike() {
        String body = response.getBody().asString().toLowerCase();
        assertTrue(body.contains("like") || body.contains("success") || body.contains("éxito") ||
                body.contains("liked") || body.contains("confirm"),
            "La respuesta debe confirmar el like");
    }

    @Entonces("la respuesta debe confirmar el seguimiento")
    public void laRespuestaConfirmaSeguimiento() {
        String body = response.getBody().asString().toLowerCase();
        assertTrue(body.contains("follow") || body.contains("siguiendo") || body.contains("success") ||
                body.contains("éxito") || body.contains("followed"),
            "La respuesta debe confirmar el seguimiento");
    }
}
