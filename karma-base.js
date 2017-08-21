var webpack_config = require('./webpack.config');
var url = require('url');
var fs = require('fs');
var path = require('path');
var notes_path = process.env.CTEST_NOTES_PATH || path.resolve('notes');
var image_path = process.env.CTEST_IMAGE_PATH || path.resolve('images');
var test_case = process.env.GEOJS_TEST_CASE || 'tests/all.js';
var getRawBody = require('raw-body');

// Create the notes directory, if it doesn't exist.
if (!fs.existsSync(notes_path)) {
  fs.mkdirSync(notes_path);
}
if (!fs.existsSync(image_path)) {
  fs.mkdirSync(image_path);
}

/**
 * This function returns true if (1) there is an environment variable set
 * called "TEST_SAVE_IMAGE", and either (2a) the name of the test appears in
 * the value of the variable when treated as a comma separated list of strings,
 * or (2b) the variable reads "all".
 */
function doSaveImage(name) {
  var saveList = process.env.TEST_SAVE_IMAGE;
  var result;
  if (saveList === 'all' || !saveList) {
    result = !!saveList;
  } else {
    result = saveList.split(',').indexOf(name) >= 0;
    if (name.indexOf('-') >= 0) {
      result = result || saveList.split(',').indexOf(name.split('-')[1]) >= 0;
    }
  }
  return result;
}

/* Save an image.  The image is expected to be a base64 encoded string, with or
 * without a mime type specifier.
 *
 * @param {string} name: base name for the image.
 * @param {string} image: a base64 encoded png image.
 * @param {boolean} always: if true, always save the image regardless of
 *    environment settings.
 */
function saveImage(name, image, always) {
  if (always || doSaveImage(name)) {
    if (image.indexOf(',') >= 0) {
      image = image.split(',')[1];
    }
    var dest = path.resolve(image_path, name + '.png');
    fs.writeFileSync(dest, image, 'base64');
  }
}

/* Use ImageMagick's import tool to get a portion of the screen.  The caller is
 * responsible for identifying the useful portion of the screen.
 *
 * @param {string} name: base name for the image.
 * @param {number} left: left screen coordinate
 * @param {number} top: top screen coordinate
 * @param {number} width: width in pixels of area to fetch.
 * @param {number} height: height in pixels of area to fetch.
 * @returns: a base64-encoded image.
 */
function getScreenImage(name, left, top, width, height) {
  var child_process = require('child_process');
  var dest = path.resolve(image_path, name + '-screen.png');
  child_process.execSync(
     'import -window root ' +
    '-crop ' + width + 'x' + height + (left >= 0 ? '+' : '') + left +
    (top >= 0 ? '+' : '') + top + ' +repage ' +
    '\'' + dest.replace(/'/g, "'\\''") + '\'');
  var xvfbImage = Buffer.from(fs.readFileSync(dest)).toString('base64');
  xvfbImage = 'data:image/png;base64,' + xvfbImage;
  return xvfbImage;
}

/* Compare an image to a base image.  If it violates a threshold, save the
 * image and a diff between it and the base image.  Returns the resemble
 * results.
 *
 * @param {string} name: base name for the image.
 * @param {string} image: a base64 encoded png image.
 * @param {number} threshold: allowed difference between this image and the
 *    base image.
 * @param {function} callback: a function to call when complete.
 */
function compareImage(name, image, threshold, callback) {
  var resemble = require('node-resemble');
  var src = path.resolve('dist/data/base-images', name + '.png');
  if (!fs.existsSync(src)) {
    src = path.resolve(image_path, name + '.png');
  }
  var refImage = Buffer.from(fs.readFileSync(src)).toString('base64');
  refImage = 'data:image/png;base64,' + refImage;
  resemble(image)
    .compareTo(refImage)
    .ignoreAntialiasing()
    .onComplete(function (results) {
      console.log('Image comparison: ' + name + ', delta: ' +
                  Number(results.misMatchPercentage) * 0.01);
      var passed = (Number(results.misMatchPercentage) <= threshold * 100);
      saveImage(name + '-base', refImage, !passed);
      saveImage(name + '-test', image, !passed);
      saveImage(name + '-diff', results.getImageDataUrl(), !passed);
      results.passed = passed;
      if (callback) {
        callback(results);
      }
    });
}

/**
 * Express style middleware to handle REST requests to `/notes` and
 * `/testImage` on the test server.
 */
var notes_middleware = function (config) {
  var notes = {};

  return function (request, response, next) {
    var parsed = url.parse(request.url, true);
    var query = (parsed.query || {});
    var key = query.key || 'default';
    if (parsed.pathname === '/notes') {
      if (request.method === 'PUT') {
        return getRawBody(request, {encoding: 'utf-8'}).then(function (body) {
          body = body.toString() || '{}';
          notes[key] = JSON.parse(body);
          fs.writeFileSync(path.resolve(notes_path, key) + '.json', body);
          response.writeHead(200);
          return response.end('{}');
        }).catch(function (err) {
          response.writeHead(500);
          response.end(err.message);
        });
      } else if (request.method === 'POST' && query.length) {
        fs.writeFileSync(query.path || 'notes.txt', JSON.stringify(notes));
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
    } else if (parsed.pathname === '/testImage') {
      if (request.method === 'PUT') {
        return getRawBody(request).then(function (body) {
          var name = query.name;
          var image;
          if (query.screen === 'true') {
            image = getScreenImage(name, query.left, query.top,
                                   query.width, query.height);
          } else {
            image = '' + body;
          }
          saveImage(name, image);
          if (query.compare === 'true') {
            compareImage(name, image, query.threshold, function (results) {
              response.writeHead(200);
              return response.end(JSON.stringify(results));
            });
          } else {
            response.writeHead(200);
            return response.end('{}');
          }
        }).catch(function (err) {
          response.writeHead(500);
          response.end(err.message);
        });
      } else if (request.method === 'GET') {
        var src = path.resolve(image_path, query.name + '.png');
        var img = Buffer.from(fs.readFileSync(src)).toString('base64');
        img = 'data:image/png;base64,' + img;
        response.writeHead(200);
        return response.end(img);
      }
    }
    next();
  };
};

/**
 * Express style middleware to handle REST requests for OSM tiles on the test
 * server.
 */
var osmtiles_middleware = function (config) {
  return function (request, response, next) {
    var match = request.url.match(/.*http:\/\/[a-c]\.tile.openstreetmap.org\/([0-9]+\/[0-9]+\/[0-9]+.png)$/);
    /* Serve tiles if they have been proxied */
    if (match && request.method === 'GET') {
      var imagePath = 'dist/data/tiles/' + match[1];
      var img = Buffer.from(fs.readFileSync(imagePath));
      response.setHeader('Content-Type', 'image/png');
      response.setHeader('Content-Length', img.length);
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.writeHead(200);
      return response.end(img);
    }
    next();
  };
};

module.exports = function (config) {
  var newConfig = {
    autoWatch: false,
    files: [
      test_case,
      {pattern: 'tests/data/**/*', included: false},
      {pattern: 'tests/cases/**/*.js', included: false, served: false, watched: true},
      {pattern: 'tests/gl-cases/**/*.js', included: false, served: false, watched: true},
      {pattern: 'tests/example-cases/**/*.js', included: false, served: false, watched: true},
      {pattern: 'dist/data/**/*', included: false},
      {pattern: 'dist/examples/**/*', included: false},
      {pattern: 'dist/tutorials/**/*', included: false},
      {pattern: 'dist/built/**/*', included: false}
    ],
    proxies: {
      '/testdata/': '/base/tests/data/',
      '/data/': '/base/dist/data/',
      '/examples/': '/base/dist/examples/',
      '/tutorials/': '/base/dist/tutorials/',
      '/built/': '/base/dist/built/'
    },
    browsers: [
      'PhantomJS'
    ],
    customLaunchers: {
      ChromeHeadlessTouch: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',  // necessary to run tests in a docker
          '--no-pings',    // no auditing pings
          '--touch-events'
        ]
      },
      ChromeFull: {
        base: 'Chrome',
        flags: [
          '--no-sandbox',  // necessary to run tests in a docker
          '--no-pings',    // no auditing pings
          '--device-scale-factor=1',
          '--window-position=0,0',
          '--start-fullscreen',
          '--kiosk',
          '--incognito'
        ]
      },
      ChromeWithProxy: {
        base: 'ChromeFull',
        flags: [
          '--proxy-pac-url=' + config.protocol + '//' + config.hostname + ':' + config.port + '/testdata/proxy-for-tests.pac'
        ]
      },
      FirefoxTouch: {
        base: 'Firefox',
        prefs: {
          'dom.w3c_touch_events.enabled': 1
        }
      },
      FirefoxWithProxy: {
        base: 'FirefoxTouch',
        prefs: {
          'network.proxy.type': 2,
          'network.proxy.autoconfig_url': config.protocol + '//' + config.hostname + ':' + config.port + '/testdata/proxy-for-tests.pac'
        }
      }
    },
    browserNoActivityTimeout: 30000,
    reporters: [
      'progress',
      'kjhtml'
    ],
    middleware: [
      'notes',
      'osmtiles'
    ],
    plugins: [
      {'middleware:notes': ['factory', notes_middleware]},
      {'middleware:osmtiles': ['factory', osmtiles_middleware]},
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
  newConfig.preprocessors[test_case] = ['webpack', 'sourcemap'];
  return newConfig;
};
