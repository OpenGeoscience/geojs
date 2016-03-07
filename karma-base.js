var webpack_config = require('./webpack.config');
var fs = require('fs');

// karma middleware the mimics a normal tile server.
var MockTileServer = function () {
  var cache = null;
  return function (request, response, next) {
    if (request.originalUrl.startsWith('/base/tests/data/tiles')) {
      // request.url = '/base/tests/data/white.jpg';
      response.setHeader('Content-Type', 'image/jpeg');
      if (cache) {
        response.writeHead(200);
        return response.end(cache);
      } else {
        return fs.readFile(__dirname + '/tests/data/white.jpg', function (err, data) {
          if (err) {
            console.log('Could not read default tile.');
          }
          cache = data.toString();
          response.writeHead(200);
          return response.end(cache);
        });
      }
    }
    next();
  };
};

module.exports = {
  files: [
    'tests/cases/**/*.js',
    {pattern: 'tests/data/**/*', included: false}
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
    'tests/cases/**/*.js': ['webpack', 'sourcemap']
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
