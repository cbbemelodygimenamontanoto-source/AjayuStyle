package com.ajayu.stepdefinitions;

import io.cucumber.java.es.*;
import io.restassured.response.Response;
import net.serenitybdd.rest.SerenityRest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CommonStepDefinitions {

    private static final String API_PATH = "/api";
    public static Response sharedResponse;
    public static String sharedAuthToken = "";

    @Cuando("envío una solicitud POST a {string} con:")
    public void envioPostConBody(String endpoint, String body) {
        sharedResponse = SerenityRest.given()
                .header("Authorization", "Bearer " + sharedAuthToken)
                .contentType("application/json")
                .body(body)
                .when()
                .post(API_PATH + endpoint);
    }

    @Entonces("el código de respuesta debe ser {int}")
    public void elCodigoDeRespuestaDebeSer(int statusCode) {
        assertThat(sharedResponse.getStatusCode(), equalTo(statusCode));
    }

    @Entonces("el código de respuesta debe ser {int} o {int}")
    public void elCodigoDebeSerUnoDe(int code1, int code2) {
        int actual = sharedResponse.getStatusCode();
        assertTrue(actual == code1 || actual == code2,
            "Se esperaba " + code1 + " o " + code2 + " pero fue " + actual);
    }

    @Entonces("la respuesta debe contener el campo {string}")
    public void laRespuestaContieneCampo(String field) {
        assertThat(sharedResponse.jsonPath().get(field), notNullValue());
    }

    @Entonces("la respuesta debe contener un mensaje de error")
    public void laRespuestaContieneMensajeError() {
        String body = sharedResponse.getBody().asString().toLowerCase();
        assertTrue(body.contains("error") || body.contains("inválid") ||
                body.contains("invalid") || body.contains("requerid") ||
                body.contains("no encontrado"),
            "La respuesta debe contener un mensaje de error. Body: " + body);
    }

    @Entonces("la respuesta debe contener un mensaje de éxito")
    public void laRespuestaContieneMensajeExito() {
        String body = sharedResponse.getBody().asString().toLowerCase();
        assertTrue(body.contains("éxito") || body.contains("exito") ||
                body.contains("success") || body.contains("eliminad") ||
                body.contains("actualizad") || body.contains("ocultad"),
            "La respuesta debe contener un mensaje de éxito. Body: " + body);
    }
}
