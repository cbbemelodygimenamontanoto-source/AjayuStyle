// Nueva clase: CommonStepDefinitions.java
package com.ajayu.stepdefinitions;

import io.cucumber.java.es.Entonces;

public class CommonStepDefinitions {

    @Entonces("el código es {int}")
    public void elCodigoEs(int codigo) {
        // lógica de verificación del código HTTP
    }
}
