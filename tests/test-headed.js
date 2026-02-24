/**
 * Entry point for all tests in ./headed-cases/*
 * This is here to prevent webpack from creating a separate bundle for each
 * test case.
 */

var tests = require.context('./headed-cases', true, /.*\.js$/);
tests.keys().forEach(tests);
