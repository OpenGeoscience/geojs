// Defines a test server for running jasmine unit tests
// with coverage support.

var path = require('path');

// share configuration with the main webpack builder
var webpack_config = require('./webpack.config');

/**
 * Return URL friendly browser string
 */
function browser(b) {
  return b.toLowerCase().split(/[ /-]/)[0];
}

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
      'kjhtml'
    ],
    preprocessors: {
      'tests/**/*.js': ['webpack', 'sourcemap']
    },
    coverageReporter: {
      reporters: [
        {type: 'html', dir: 'dist/coverage/', subdir: browser},
        {type: 'cobertura', dir: 'dist/cobertura/', file: 'coverage.xml', subdir: browser},
        {type: 'text-summary'}
      ]
    },
    frameworks: [
      'jasmine'
    ],
    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      module: {
        preLoaders: [
          {
            test: /\.js$/,
            include: path.resolve('src/'),
            loader: 'istanbul-instrumenter'
          }
        ],
        loaders: webpack_config.module.loaders
      },
      resolve: webpack_config.resolve
    }
  });
};
