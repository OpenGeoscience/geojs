/**
 * Entry point for all tests.
 */

var query = require('./test-utils').getQuery();

/* By default, general and gl tests are run.  Set the 'test' query parameter to
 * 'all' to run all tests, or use a specific test group name.
 */
var tests;
if (query.test === 'all' || query.test === 'general' || query.test === undefined) {
  tests = require.context('./cases', true, /.*\.js$/);
  tests.keys().forEach(tests);
}
if (query.test === 'all' || query.test === 'gl' || query.test === undefined) {
  tests = require.context('./gl-cases', true, /.*\.js$/);
  tests.keys().forEach(tests);
}
if (query.test === 'all' || query.test === 'headed') {
  tests = require.context('./headed-cases', true, /.*\.js$/);
  tests.keys().forEach(tests);
}
