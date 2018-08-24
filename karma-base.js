var webpack_config = require('./webpack.base.config');
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
  var resemble = require('resemblejs');
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
    var match = request.url.match(/.*https?:\/\/[a-c]\.tile.openstreetmap.org\/([0-9]+\/[0-9]+\/[0-9]+.png)$/);
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

/* Reduce the number of external connections Chrome makes. */
var ChromeFlags = [
  '--no-sandbox',  // necessary to run tests in a docker
  '--no-pings',    // no auditing pings
  '--force-color-profile=srgb',  // for consistent tests
  '--disable-background-networking',
  '--disable-component-extensions-with-background-pages'
];

/* By default, when Firefox starts it makes many connections to sites like
 * mozilla.org, yahoo.com, google.com, etc.  This limits these connections (but
 * doesn't eliminate them completely, especially when accessing the 2d canvas).
 * See
 * https://support.mozilla.org/en-US/kb/how-stop-firefox-making-automatic-connections
 */
var FirefoxPrefs = {
  'browser.aboutHomeSnippets.updateUrl': '',
  'browser.casting.enabled': false,
  'browser.library.activity-stream.enabled': false,
  'browser.newtabpage.activity-stream.enabled': false,
  'browser.search.geoip.url': '',
  'browser.selfsupport.enabled': false,
  'browser.selfsupport.url': '',
  'browser.startup.homepage_override.mstone': 'ignore',
  'extensions.getAddons.cache.enabled': false,
  'extensions.pocket.enabled': false,
  'extensions.update.enabled': false,
  'network.captive-portal-service.enabled': false,
  'network.dns.disablePrefetch': true,
  'network.http.speculative-parallel-limit': 0,
  'network.prefetch-next': false,
  // these further limit firefox connections
  'browser.safebrowsing.provider.mozilla.gethashURL': '',
  'browser.safebrowsing.provider.mozilla.updateURL': '',
  'browser.safebrowsing.provider.google.gethashURL': '',
  'browser.safebrowsing.provider.google.updateURL': '',
  'browser.safebrowsing.provider.google4.dataSharingURL': '',
  'browser.safebrowsing.provider.google4.gethashURL': '',
  'browser.safebrowsing.provider.google4.updateURL': '',
  'datareporting.healthreport.uploadEnabled': false,
  'datareporting.policy.dataSubmissionEnabled': false,
  'media.gmp-gmpopenh264.autoupdate': false,
  'media.gmp-manager.url': ''
};

module.exports = function (config) {
  webpack_config.plugins.push(function () {
    this.plugin('done', function (stats) {
      if (stats.compilation.warnings.length) {
        // Log each of the warnings
        stats.compilation.warnings.forEach(function (warning) {
          console.log(warning.message || warning);
        });
        // Pretend no assets were generated. This prevents the tests
        // from running making it clear that there were warnings.
        stats.stats = [{
          toJson: function () {
            return this;
          },
          assets: []
        }];
      }
    });
  });
  var newConfig = {
    autoWatch: false,
    files: [
      test_case,
      {pattern: 'tests/data/**/*', included: false},
      {pattern: 'tests/cases/**/*.js', included: false, served: false, watched: true},
      {pattern: 'tests/gl-cases/**/*.js', included: false, served: false, watched: true},
      {pattern: 'tests/headed-cases/**/*.js', included: false, served: false, watched: true},
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
        flags: ChromeFlags.concat([
          '--touch-events'
        ])
      },
      ChromeFull: {
        base: 'Chrome',
        flags: ChromeFlags.concat([
          '--device-scale-factor=1',
          '--window-position=0,0',
          '--start-fullscreen',
          '--kiosk',
          '--incognito'
        ])
      },
      ChromeWithProxy: {
        // inheriting from ChromeFull ignores the flags in this entry, so we
        // need to inherit from Chrome
        base: 'Chrome',
        flags: ChromeFlags.concat([
          '--device-scale-factor=1',
          '--window-position=0,0',
          '--start-fullscreen',
          '--kiosk',
          '--incognito',
          '--translate-script-url=""',
          '--proxy-pac-url=' + config.protocol + '//' + (config.hostname || '127.0.0.1') + ':' + config.port + '/testdata/proxy-for-tests.pac'
        ])
      },
      FirefoxHeadlessTouch: {
        base: 'FirefoxHeadless',
        prefs: Object.assign({
          // enable touch
          'dom.w3c_touch_events.enabled': 1
        }, FirefoxPrefs)
      },
      FirefoxWithProxy: {
        base: 'Firefox',
        prefs: Object.assign({
          // enable proxy
          'network.proxy.type': 2,
          'network.proxy.autoconfig_url': config.protocol + '//' + (config.hostname || '127.0.0.1') + ':' + config.port + '/testdata/proxy-for-tests.pac',
          // enable touch
          'dom.w3c_touch_events.enabled': 1
        }, FirefoxPrefs)
      }
    },
    browserNoActivityTimeout: 300000,
    reporters: [
      'spec',  // we had used the 'progress' reporter in the past.
      'kjhtml'
    ],
    // We could suppress passing results
    // specReporter = {suppressPassed: true, suppressSkipped: true},
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
    client: {
      jasmine: {
        random: false
      }
    },
    webpack: {
      /* webpack 4
      mode: 'production',
       */
      performance: {hints: false},
      cache: true,
      devtool: 'inline-source-map',
      module: {
        rules: webpack_config.module.rules
      },
      resolve: webpack_config.resolve,
      plugins: webpack_config.plugins
    },
    webpackMiddleware: {
      stats: 'errors-only'
    }
  };
  newConfig.preprocessors[test_case] = ['webpack', 'sourcemap'];
  return newConfig;
};
