/**
 * Entry point for all tests in ./headed-cases/*
 * This is here to prevent webpack from creating a separate bundle for each
 * test case.  See:  https://github.com/webpack/karma-webpack/issues/23
 */

var tests = require.context('./headed-cases', true, /.*\.js$/);
tests.keys().forEach(tests);
