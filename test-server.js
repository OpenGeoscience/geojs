var express = require('express');
var path = require('path');
var fs = require('fs');
var getRawBody = require('raw-body');

var image_path = process.env.TEST_IMAGE_PATH || path.resolve('_build/images');

// Create the images directory, if it doesn't exist.
if (!fs.existsSync(image_path)) {
  fs.mkdirSync(image_path, { recursive: true });
}

/**
 * Determines if an image should be saved based on environment variables.
 * @param {string} name Name of the image.
 * @returns {boolean} True if image should be saved.
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

/**
 * Saves an image to disk.
 * @param {string} name Filename without extension.
 * @param {string} image Image data (base64 or data URL).
 * @param {boolean} [always] Force save regardless of settings.
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

/**
 * Captures a screenshot of a specific screen region.
 * @param {string} name Screenshot identifier.
 * @param {number} left X coordinate of crop region.
 * @param {number} top Y coordinate of crop region.
 * @param {number} width Width of crop region.
 * @param {number} height Height of crop region.
 * @returns {string} Base64-encoded image data URL.
 */
function getScreenImage(name, left, top, width, height) {
  var child_process = require('child_process');
  var dest = path.resolve(image_path, name + '-screen.png');
  var cpes = child_process.execSync;
  cpes(
    'import -window root ' +
    '-crop ' + width + 'x' + height + (left >= 0 ? '+' : '') + left +
    (top >= 0 ? '+' : '') + top + ' +repage ' +
    '\'' + dest.replace(/'/g, "'\\''") + '\'');
  var xvfbImage = Buffer.from(fs.readFileSync(dest)).toString('base64');
  xvfbImage = 'data:image/png;base64,' + xvfbImage;
  return xvfbImage;
}

/**
 * Compares two images and logs results.
 * @param {string} name Identifier for the image pair.
 * @param {string} image Test image data.
 * @param {number} threshold Acceptable difference threshold.
 * @param {function({ equal: boolean, passed: boolean }): void} [callback] Called with comparison results.
 */
function compareImage(name, image, threshold, callback) {
  var looksSame = require('looks-same');
  var src = path.resolve('dist/data/base-images', name + '.png');
  if (!fs.existsSync(src)) {
    src = path.resolve(image_path, name + '.png');
  }
  var refImageBuf = Buffer.from(fs.readFileSync(src));
  var refImage = 'data:image/png;base64,' + refImageBuf.toString('base64');
  var imageBuf = Buffer.from(image.replace(/^data:image\/png;base64,/, ''), 'base64');
  looksSame(imageBuf, refImageBuf, { ignoreAntialiasing: true, threshold: threshold })
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
 * Creates and configures an Express server.
 * @param {number} [port] Port number to listen on.
 * @returns {Promise<{server: import('http').Server, port: number}>} Server promise.
 */
function createServer(port) {
  var app = express();

  /* testImage endpoint */
  app.put('/testImage', function (req, res) {
    var query = req.query || {};
    getRawBody(req).then(function (body) {
      var name = query.name;
      var image;
      if (query.screen === 'true') {
        image = getScreenImage(name, query.left, query.top, query.width, query.height);
      } else {
        image = '' + body;
      }
      saveImage(name, image);
      if (query.compare === 'true') {
        compareImage(name, image, query.threshold, function (results) {
          res.status(200).send(JSON.stringify(results));
        });
      } else {
        res.status(200).send('{}');
      }
    }).catch(function (err) {
      res.status(500).send(err.message);
    });
  });

  app.get('/testImage', function (req, res) {
    var query = req.query || {};
    var src = path.resolve(image_path, query.name + '.png');
    var img = Buffer.from(fs.readFileSync(src)).toString('base64');
    img = 'data:image/png;base64,' + img;
    res.status(200).send(img);
  });

  /* OSM tiles proxy */
  app.get('{path}', function (req, res, next) {
    var match = req.url.match(/.*https?:\/\/([a-c]\.tile\.openstreetmap\.org|.*-[a-d]\.a\.ssl\.fastly\.net\/[a-z-]+)\/([0-9]+\/[0-9]+\/[0-9]+\.png)$/);
    if (match) {
      var imagePath = path.resolve('dist/data/tiles/' + match[2]);
      if (fs.existsSync(imagePath)) {
        var img = Buffer.from(fs.readFileSync(imagePath));
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', img.length);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send(img);
        return;
      }
    }
    next();
  });

  /* Static file mappings matching the old karma proxies */
  app.use('/testdata', express.static(path.resolve('tests/data')));
  app.use('/data', express.static(path.resolve('dist/data')));
  app.use('/examples', express.static(path.resolve('dist/examples')));
  app.use('/tutorials', express.static(path.resolve('dist/tutorials')));
  app.use('/built', express.static(path.resolve('dist/built')));

  /* Serve test bundle */
  app.use('/test-bundle', express.static(path.resolve('_build/test-bundle')));

  /* Serve the jasmine harness */
  app.use('/tests', express.static(path.resolve('tests')));

  /* Serve node_modules for jasmine-core and sinon */
  app.use('/node_modules', express.static(path.resolve('node_modules')));

  /* Serve project root for any other files */
  app.use(express.static(path.resolve('.')));

  return new Promise(function (resolve, reject) {
    var server = app.listen(port || 0, function () {
      var actualPort = server.address().port;
      console.log('Test server listening on port ' + actualPort);
      resolve({ server: server, port: actualPort });
    });
    server.on('error', reject);
  });
}

module.exports = { createServer: createServer };

/* If run directly, start the server */
if (require.main === module) {
  var port = parseInt(process.env.TEST_SERVER_PORT, 10) || 9876;
  createServer(port);
}
