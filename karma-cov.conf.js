// Defines a test server for running jasmine unit tests
// with coverage support.

/**
 * Return URL friendly browser string
 */
function browser(b) {
  /* The browser string starts with the basic browser name (Firefox, Chrome,
   * etc.).  Split on the first space or dash to isolate this name. */
  return b.toLowerCase().split(/[ /-]/)[0];
}

function subdir_name(b) {
  var subdir = browser(b);
  if (process.env.GEOJS_TEST_CASE) {
    /* Use the test case and as part of the name so that different tests end
     * up in different coverage directories.  Get the last element of the path
     * without the extension from the test case for this purpose. */
    var parts = /^(.+\/)*(([^/]+)\.[^/.]*|[^/.]+)$/.exec(process.env.GEOJS_TEST_CASE);
    if (parts) {
      subdir += '_' + (parts[3] || parts[2]);
    }
  }
  return subdir;
}

module.exports = function (config) {
  var karma_config = require('./karma-base')(config);

  karma_config.reporters = ['spec', 'coverage'];
  /* Suppress listing passing and skipped tests when getting coverage. */
  karma_config.specReporter = {suppressPassed: true, suppressSkipped: true};
  karma_config.coverageReporter = {
    reporters: [
      {type: 'cobertura', dir: 'dist/cobertura/', file: 'coverage.xml', subdir: subdir_name},
      {type: 'json', dir: 'dist/coverage/json/', subdir: subdir_name},
      {type: 'lcovonly', dir: 'dist/coverage/lcov', subdir: subdir_name},
      {type: 'text-summary'}
    ]
  };
  /* Alter our first webpack module rule which should just apply to src/*.js
   * files. */
  karma_config.webpack.module.rules[0].use.push({
    loader: '@jsdevtools/coverage-istanbul-loader',
    options: {esModules: true}
  });

  config.set(karma_config);
};
