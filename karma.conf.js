// Defines a test server for running jasmine unit tests
// with coverage support.

// share configuration with the main webpack builder
var webpack_config = require('./webpack.config');

module.exports = function (config) {
  config.set({
    files: [
      'tests/cases/**/*.js'
    ],
    browsers: [
      'PhantomJS'
    ],
    reporters: [
      'progress',
      'coverage'
    ],
    preprocessors: {
      'tests/**/*.js': ['webpack', 'sourcemap']
    },
    coverageReporter: {
      reporters: [
        {type: 'lcov', dir: 'dist/coverage/'},
        {type: 'cobertura', dir: '.', file: 'coverage.txt'}
      ]
    },
    frameworks: [
      'jasmine'
    ],
    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        preloaders: [
          {
            test: /\.js$/,
            include: /src/,
            exclude: /(node_modules|bower_components|testing)/,
            loader: 'istanbul',
            query: {
              cacheDirectory: true
            }
          }
        ],
        loaders: webpack_config.module.loaders
      },
      resolve: webpack_config.resolve
    }
  });
};
