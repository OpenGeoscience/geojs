var webpack_config = require('./webpack.config');
var url = require('url');
var fs = require('fs');
var path = require('path');
var notes_path = process.env.CTEST_NOTES_PATH || path.resolve('notes');
var test_case = process.env.GEOJS_TEST_CASE || 'tests/all.js';

// Create the notes directory, if it doesn't exist.
if (!fs.existsSync(notes_path)) {
  fs.mkdirSync(notes_path);
}

/**
 * Express style middleware to handle REST requests
 * to `/notes` on the test server.
 */
var notes_middleware = function (config) {
  var notes = {};

  return function (request, response, next) {
    var parsed = url.parse(request.url, true);
    var query = (parsed.query || {});
    var body, key;

    if (parsed.pathname === '/notes') {
      if (request.method === 'PUT') {
        body = request.read() || '';
        key = query.key || 'default';
        body = body.toString() || '{}';
        notes[key] = JSON.parse(body);
        fs.writeFile(path.resolve(notes_path, key) + '.json', body);
        response.writeHead(200);
        return response.end('{}');
      } else if (request.method === 'POST' && query.length) {
        fs.writeFile(query.path || 'notes.txt', JSON.stringify(notes));
        response.writeHead(200);
        return response.end('{}');
      } else if (request.method === 'DELETE') {
        notes = {};
        response.writeHead(200);
        return response.end('{}');
      } else if (request.method === 'GET') {
        response.writeHead(200);
        return response.end(JSON.stringify(notes));
      }
    }
    next();
  };
};

module.exports = {
  autoWatch: false,
  files: [
    test_case,
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
  middleware: [
    'notes'
  ],
  plugins: [
    {'middleware:notes': ['factory', notes_middleware]},
    'karma-*'
  ],
  preprocessors: {},
  frameworks: [
    'jasmine', 'sinon'
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

module.exports.preprocessors[test_case] = ['webpack', 'sourcemap'];
