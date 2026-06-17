package com.ajayu.stepdefinitions;

import io.cucumber.java.es.*;
import net.serenitybdd.rest.SerenityRest;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class ComunidadStepDefinitions {

    private static final String API_PATH = "/api";

    @Dado("que tengo un token de autenticación válido")
    public void queTengoTokenValido() {
        CommonStepDefinitions.sharedAuthToken = System.getenv().getOrDefault("password123", "ana_garcia");
    }

    @Cuando("envío una solicitud GET a {string}")
    public void envioGet(String endpoint) {
        CommonStepDefinitions.sharedResponse = SerenityRest.given()
                .header("Authorization", "Bearer " + CommonStepDefinitions.sharedAuthToken)
                .when()
                .get(API_PATH + endpoint);
    }

    @Entonces("la respuesta debe tener el formato correcto del feed")
    public void laRespuestaFormatoFeed() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString();
        assertTrue(body.contains("post_id") || body.contains("content") || body.contains("posts"),
            "La respuesta debe tener formato de feed de posts");
    }

    @Entonces("la respuesta debe contener información del perfil")
    public void laRespuestaContienePerfil() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString();
        assertTrue(body.contains("username") || body.contains("profile") || body.contains("user_id"),
            "La respuesta debe contener información del perfil");
    }

    @Dado("que existe un post con id {int}")
    public void queExistePost(int id) {
        // Para los tests asumimos que existe
    }

    @Entonces("la respuesta debe confirmar el like")
    public void laRespuestaConfirmaLike() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString().toLowerCase();
        assertTrue(body.contains("like") || body.contains("success") ||
                body.contains("éxito") || body.contains("liked") || body.contains("confirm"),
            "La respuesta debe confirmar el like");
    }

    @Entonces("la respuesta debe confirmar el seguimiento")
    public void laRespuestaConfirmaSeguimiento() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString().toLowerCase();
        assertTrue(body.contains("follow") || body.contains("siguiendo") ||
                body.contains("success") || body.contains("éxito") || body.contains("followed"),
            "La respuesta debe confirmar el seguimiento");
    }
}
