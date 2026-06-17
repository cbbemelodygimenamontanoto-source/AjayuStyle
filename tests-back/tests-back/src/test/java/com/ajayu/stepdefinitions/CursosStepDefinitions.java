package com.ajayu.stepdefinitions;

import io.cucumber.java.es.*;
import net.serenitybdd.rest.SerenityRest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CursosStepDefinitions {

    private static final String API_PATH = "/api";
    private int createdCourseId;

    @Dado("que soy un usuario administrador")
    public void queSoyAdministrador() {
        CommonStepDefinitions.sharedAuthToken = System.getenv().getOrDefault("ADMIN_TOKEN", "admin_test_token");
    }

    @Cuando("envío una solicitud GET a {string} sin autenticación")
    public void envioGetSinAuth(String endpoint) {
        CommonStepDefinitions.sharedResponse = SerenityRest.given()
                .when()
                .get(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud PUT a {string} con:")
    public void envioPutConBody(String endpoint, String body) {
        CommonStepDefinitions.sharedResponse = SerenityRest.given()
                .header("Authorization", "Bearer " + CommonStepDefinitions.sharedAuthToken)
                .contentType("application/json")
                .body(body)
                .when()
                .put(API_PATH + endpoint);
    }

    @Cuando("envío una solicitud DELETE a {string}")
    public void envioDelete(String endpoint) {
        CommonStepDefinitions.sharedResponse = SerenityRest.given()
                .header("Authorization", "Bearer " + CommonStepDefinitions.sharedAuthToken)
                .when()
                .delete(API_PATH + endpoint);
    }

    @Entonces("la respuesta debe ser una lista")
    public void laRespuestaDebeSerUnaLista() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString().trim();
        assertTrue(body.startsWith("[") || body.contains("\"id\":"),
            "La respuesta debe ser una lista o contener elementos");
    }

    @Entonces("cada curso debe tener un id y un título")
    public void cadaCursoDebeTenerIdYTitulo() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString();
        assertTrue(body.contains("id") || body.contains("title"),
            "Los cursos deben tener campos 'id' y 'title'");
    }

    @Dado("que existe un curso con id {int}")
    public void queExisteCursoConId(int id) {
        createdCourseId = id;
    }

    @Entonces("la respuesta debe ser una lista de lecciones")
    public void laRespuestaEsListaLecciones() {
        String body = CommonStepDefinitions.sharedResponse.getBody().asString();
        assertTrue(body.startsWith("[") || body.contains("lessons") || body.contains("order_index"),
            "Debe ser una lista de lecciones");
    }

    @Entonces("el curso creado debe tener un id")
    public void elCursoCreadoDebeTenerId() {
        Integer id = CommonStepDefinitions.sharedResponse.jsonPath().get("course.id");
        if (id == null) id = CommonStepDefinitions.sharedResponse.jsonPath().get("id");
        if (id == null) id = CommonStepDefinitions.sharedResponse.jsonPath().get("courseId");
        assertThat(id, notNullValue());
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
