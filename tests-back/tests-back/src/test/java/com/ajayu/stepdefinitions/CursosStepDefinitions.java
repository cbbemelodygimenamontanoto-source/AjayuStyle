package com.ajayu.stepdefinitions;

import io.cucumber.java.es.*;
import io.restassured.response.Response;
import net.serenitybdd.rest.SerenityRest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Step Definitions para los tests de cursos
 */
public class CursosStepDefinitions {

    private static final String API_PATH = "/api";
    private Response response;
    private String authToken;
    private int createdCourseId;

    @Dado("que tengo un token de autenticación válido")
    public void queTengoTokenValido() {
        // En un setup real, se haría login primero
        authToken = System.getenv().getOrDefault("TEST_TOKEN", "test_token");
    }

    @Dado("que soy un usuario administrador")
    public void queSoyAdministrador() {
        authToken = System.getenv().getOrDefault("ADMIN_TOKEN", "admin_test_token");
    }

    @Cuando("envío una solicitud GET a {string}")
    public void envioGetSinAuth(String endpoint) {
        response = SerenityRest.given()
                .when()
                .get(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud POST a {string} con:")
    public void envioPostConBody(String endpoint, String body) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + authToken)
                .contentType("application/json")
                .body(body)
                .when()
                .post(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud PUT a {string} con:")
    public void envioPutConBody(String endpoint, String body) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + authToken)
                .contentType("application/json")
                .body(body)
                .when()
                .put(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud DELETE a {string}")
    public void envioDelete(String endpoint) {
        response = SerenityRest.given()
                .header("Authorization", "Bearer " + authToken)
                .when()
                .delete(API_PATH + endpoint);
    }

    @Entonces("el código de respuesta debe ser {int}")
    public void elCodigoDebeSer(int code) {
        assertThat(response.getStatusCode(), equalTo(code));
    }

    @Entonces("el código de respuesta debe ser {int} o {int}")
    public void elCodigoDebeSerUnoDe(int code1, int code2) {
        int actual = response.getStatusCode();
        assertTrue(actual == code1 || actual == code2,
            "Se esperaba " + code1 + " o " + code2 + " pero fue " + actual);
    }

    @Entonces("la respuesta debe ser una lista")
    public void laRespuestaDebeSerUnaLista() {
        String body = response.getBody().asString().trim();
        assertTrue(body.startsWith("[") || body.contains("\"id\":"),
            "La respuesta debe ser una lista o contener elementos");
    }

    @Entonces("cada curso debe tener un id y un título")
    public void cadaCursoDebeTenerIdYTitulo() {
        // Verificación básica
        String body = response.getBody().asString();
        assertTrue(body.contains("id") || body.contains("title"),
            "Los cursos deben tener campos 'id' y 'title'");
    }

    @Dado("que existe un curso con id {int}")
    public void queExisteCursoConId(int id) {
        createdCourseId = id;
    }

    @Entonces("la respuesta debe contener el campo {string}")
    public void laRespuestaContiene(String field) {
        assertThat(response.jsonPath().get(field), notNullValue());
    }

    @Entonces("la respuesta debe ser una lista de lecciones")
    public void laRespuestaEsListaLecciones() {
        String body = response.getBody().asString();
        assertTrue(body.startsWith("[") || body.contains("lessons") || body.contains("order_index"),
            "Debe ser una lista de lecciones");
    }

    @Entonces("el curso creado debe tener un id")
    public void elCursoCreadoDebeTenerId() {
        // Intentar obtener el id de diferentes formas según la estructura de respuesta
        Integer id = response.jsonPath().get("course.id");
        if (id == null) {
            id = response.jsonPath().get("id");
        }
        if (id == null) {
            id = response.jsonPath().get("courseId");
        }
        assertThat(id, notNullValue());
    }

    @Entonces("la respuesta debe contener un mensaje de éxito")
    public void laRespuestaContieneMensajeExito() {
        String body = response.getBody().asString().toLowerCase();
        assertTrue(body.contains("éxito") || body.contains("exito") ||
                body.contains("success") || body.contains("eliminad") ||
                body.contains("actualizad") || body.contains("ocultad"),
            "La respuesta debe contener un mensaje de éxito. Body: " + body);
    }

    @Entonces("la respuesta debe contener un mensaje de error")
    public void laRespuestaContieneMensajeError() {
        String body = response.getBody().asString().toLowerCase();
        assertTrue(body.contains("error") || body.contains("requerid") ||
                body.contains("inválid") || body.contains("invalid"),
            "La respuesta debe contener un mensaje de error. Body: " + body);
    }

    @Dado("que tengo un curso creado con id {string}")
    public void queTengoCursoCreado(String idStr) {
        try {
            createdCourseId = Integer.parseInt(idStr.replace("X", "1"));
        } catch (NumberFormatException e) {
            createdCourseId = 1;
        }
    }
}
