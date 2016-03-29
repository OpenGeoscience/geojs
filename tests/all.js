/**
 * Entry point for all tests in ./cases/*
 * This is here to prevent webpack from create a seperate bundle for each
 * test case.  See:  https://github.com/webpack/karma-webpack/issues/23
 */
var tests = require.context('./cases', true, /.*\.js$/);
tests.keys().forEach(tests);
