// Defines a test server for running jasmine unit tests
// with coverage support.

var path = require('path');

/**
 * Return URL friendly browser string
 */
function browser(b) {
  return b.toLowerCase().split(/[ /-]/)[0];
}

function subdir_name(b) {
  var subdir = browser(b);
  if (process.env.GEOJS_TEST_CASE) {
    var parts = /^(.+\/)*(([^\/]+)\.[^\/.]*|[^\/.]+)$/.exec(process.env.GEOJS_TEST_CASE);
    if (parts) {
      subdir += '_' + (parts[3] || parts[2]);
    }
  }
  return subdir;
}

module.exports = function (config) {
  var karma_config = require('./karma-base')(config);

  karma_config.reporters = ['progress', 'coverage'];
  karma_config.coverageReporter = {
    reporters: [
      {type: 'html', dir: 'dist/coverage/', subdir: subdir_name},
      {type: 'cobertura', dir: 'dist/cobertura/', file: 'coverage.xml', subdir: subdir_name},
      {type: 'json', dir: 'dist/coverage/json/', subdir: subdir_name},
      {type: 'lcovonly', dir: 'lcov', subdir: subdir_name},
      {type: 'text'}
    ]
  };
  karma_config.webpack.module.preLoaders = [
    {
      test: /\.js$/,
      include: path.resolve('src/'),
      loader: 'istanbul-instrumenter'
    }
  ];

  config.set(karma_config);
};
