/**
 * Entry point for all tests in ./cases/*
 * This is here to prevent webpack from create a separate bundle for each
 * test case.
 */
var tests = require.context('./cases', true, /.*\.js$/);
tests.keys().forEach(tests);
