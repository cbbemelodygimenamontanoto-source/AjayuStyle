package com.ajayu.runners;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME;

/**
 * Test Runner principal de Ajayu
 * Ejecuta todos los features de Cucumber con Serenity BDD
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.ajayu.stepdefinitions")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME, value = "io.cucumber.core.plugin.SerenityReporterParallel")
public class TestRunner {
}
