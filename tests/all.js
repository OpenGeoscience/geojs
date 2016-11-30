/**
 * Entry point for all tests.
 */

var tests;
tests = require.context('./cases', true, /.*\.js$/);
tests.keys().forEach(tests);
tests = require.context('./gl-cases', true, /.*\.js$/);
tests.keys().forEach(tests);
