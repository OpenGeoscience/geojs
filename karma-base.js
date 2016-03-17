var webpack_config = require('./webpack.config');

// karma middleware the mimics a normal tile server.
var MockTileServer = function () {
  return function (request, response, next) {
    next();
  };
};

module.exports = {
  autoWatch: false,
  files: [
    'tests/all.js',
    {pattern: 'tests/data/**/*', included: false},
    {pattern: 'tests/cases/**/*.js', included: false, served: false, watched: true}
  ],
  proxies: {
    '/data/': '/base/tests/data/'
  },
  browsers: [
    'PhantomJS'
  ],
  reporters: [
    'progress',
    'kjhtml'
  ],
  middleware: ['mock-tile-server'],
  plugins: [
    'karma-*',
    {'middleware:mock-tile-server': ['factory', MockTileServer]}
  ],
  preprocessors: {
    'tests/all.js': ['webpack', 'sourcemap']
  },
  frameworks: [
    'jasmine'
  ],
  webpack: {
    cache: true,
    devtool: 'inline-source-map',
    module: {
      loaders: webpack_config.module.loaders
    },
    resolve: webpack_config.resolve,
    plugins: webpack_config.exposed_plugins
  }
};
