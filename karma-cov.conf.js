// Defines a test server for running jasmine unit tests
// with coverage support.

var path = require('path');
var karma_config = require('./karma-base');

/**
 * Return URL friendly browser string
 */
function browser(b) {
  return b.toLowerCase().split(/[ /-]/)[0];
}

karma_config.reporters = ['progress', 'coverage'];
karma_config.coverageReporter = {
  reporters: [
    {type: 'html', dir: 'dist/coverage/', subdir: browser},
    {type: 'cobertura', dir: 'dist/cobertura/', file: 'coverage.xml', subdir: browser},
    {type: 'lcovonly', dir: 'lcov', subdir: browser},
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

module.exports = function (config) {
  config.set(karma_config);
};
