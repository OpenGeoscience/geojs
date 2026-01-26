var webpack_config = require('./webpack.base.config');
var fs = require('fs');
var path = require('path');
var image_path = process.env.TEST_IMAGE_PATH || path.resolve('_build/images');
var test_case = process.env.GEOJS_TEST_CASE || 'tests/all.js';
var getRawBody = require('raw-body');

// Create the images directory, if it doesn't exist.
if (!fs.existsSync(image_path)) {
  fs.mkdirSync(image_path, {recursive: true});
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
 * image.
 *
 * @param {string} name: base name for the image.
 * @param {string} image: a base64 encoded png image.
 * @param {number} threshold: allowed difference between this image and the
 *    base image.
 * @param {Function} callback: a function to call when complete with the
 *    direct comparison results.
 */
function compareImage(name, image, threshold, callback) {
  const looksSame = require('looks-same');
  let src = path.resolve('dist/data/base-images', name + '.png');
  if (!fs.existsSync(src)) {
    src = path.resolve(image_path, name + '.png');
  }
  const refImageBuf = Buffer.from(fs.readFileSync(src));
  const refImage = 'data:image/png;base64,' + refImageBuf.toString('base64');
  const imageBuf = Buffer.from(image.replace(/^data:image\/png;base64,/, ''), 'base64');
  looksSame(imageBuf, refImageBuf, {ignoreAntialiasing: true, threshold: threshold})
    .then(function (results) {
      console.log('Image comparison: ' + name + ', equal: ' + results.equal);
      var passed = results.equal;
      saveImage(name + '-base', refImage, !passed);
      saveImage(name + '-test', image, !passed);
      results.passed = passed;
      if (callback) {
        callback(results);
      }
    });
}

/**
 * Express style middleware to handle REST requests to `/testImage` on the test
 * server.
 */
var testimage_middleware = function (config) {
  return function (request, response, next) {
    const requestURL = new URL(request.url, 'http://nowhere.com');
    const parsed = {
      pathname: requestURL.pathname,
      query: Object.fromEntries(requestURL.searchParams)
    };
    var query = (parsed.query || {});
    if (parsed.pathname === '/testImage') {
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
    var match = request.url.match(/.*https?:\/\/([a-c]\.tile.openstreetmap.org|.*-[a-d]\.a\.ssl\.fastly\.net\/[a-z-]+)\/([0-9]+\/[0-9]+\/[0-9]+.png)$/);
    /* Serve tiles if they have been proxied */
    if (match && request.method === 'GET') {
      var imagePath = 'dist/data/tiles/' + match[2];
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
  '--disable-component-extensions-with-background-pages',
  '--translate-script-url=""',
  '--enable-unsafe-swiftshader'
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

/* If webpack of a test fails, stop rather than run some tests */
class KarmaWarningsToErrorsWebpackPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('KarmaWarningsToErrorsWebpackPlugin', (stats) => {
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
  }
}

module.exports = function (config) {
  /* If webpack of a test fails, stop rather than run some tests */
  webpack_config.plugins.push(new KarmaWarningsToErrorsWebpackPlugin());
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
      'ChromeHeadlessTouch'
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
    browserDisconnectTimeout: 30000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 300000,
    reporters: [
      'spec',  // we had used the 'progress' reporter in the past.
      'kjhtml'
    ],
    /* enable for testing */
    // logLevel: config.LOG_DEBUG,
    /* We could suppress passing results */
    // specReporter = {suppressPassed: true, suppressSkipped: true},
    middleware: [
      'testimage',
      'osmtiles'
    ],
    plugins: [
      {'middleware:testimage': ['factory', testimage_middleware]},
      {'middleware:osmtiles': ['factory', osmtiles_middleware]},
      'karma-*'
    ],
    preprocessors: {},
    frameworks: [
      'jasmine', 'sinon', 'webpack'
    ],
    client: {
      jasmine: {
        random: false,
        timeoutInterval: 30000
      }
    },
    webpack: {
      mode: 'development',
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
  /* Suppress a babel warning */
  newConfig.webpack.module.rules[0].use[0].options.compact = false;
  newConfig.preprocessors[test_case] = ['webpack', 'sourcemap'];
  return newConfig;
};
