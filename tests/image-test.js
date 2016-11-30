// var resemble = require('node-resemble');
var $ = require('jquery');

module.exports = {};

/* Compare an image from a canvas object by sending it to our express server
 * letting it do the work.
 *
 * @param {string} name: name of the base image.  This is probably the name of
 *    the test.
 * @param {HTMLCanvasObject} canvas: the image is obtained via
 *    canvas.toDataURL().
 * @param {number} threshold: allowed difference between this image and the
 *    base image.
 * @param {function} callback: a function to call when complete.
 */
function compareImage(name, canvas, threshold, callback) {
  if (threshold === undefined) {
    threshold = 0.001;
  }
  $.ajax({
    url: '/testImage?compare=true&threshold=' + encodeURIComponent(threshold) + '&name=' + encodeURIComponent(name),
    data: '' + canvas.toDataURL(),
    method: 'PUT',
    contentType: 'image/png',
    dataType: 'json'
  }).success(function (data) {
    expect(Number(data.misMatchPercentage) * 0.01).not.toBeGreaterThan(threshold);
    if (callback) {
      callback();
    }
  });
}

/**
 * Call this before creating any geojs canvas instances to ensure that the
 * image test can collect data.
 */
module.exports.prepareImageTest = function () {
  window.contextPreserveDrawingBuffer = true;
  $('#map').remove();
  var map = $('<div id="map"/>').css({width: '800px', height: '600px'});
  $('body').css({overflow: 'hidden'}).append(map);
};

/**
 * Compare a composite of all canvas elements with a base image.
 *
 * @param {string} name: name of the base image.  This is probably the name of
 *    the test.
 * @param {number} threshold: allowed difference between this image and the
 *    base image.
 * @param {function} doneFunc: a function to call when complete.  Optional.
 * @param {function} idleFunc: a function to call to ensure that the map is
 *    idle.  No other tests or delays are supplied until this is called.  It
 *    is expected to take a callback function itself.
 * @param {number} delay: additional delay in milliseconds to wait after idle.
 * @param {integer} rafCount: additional number of renderAnimationFrames to
 *    wait after the delay.
 */
module.exports.imageTest = function (name, threshold, doneFunc, idleFunc, delay, rafCount) {
  var readyFunc = function () {
    var result = $('<canvas>')[0];
    result.width = $('canvas')[0].width;
    result.height = $('canvas')[0].height;
    var context = result.getContext('2d');
    $('canvas').each(function () {
      context.drawImage($(this)[0], 0, 0);
    });
    compareImage(name, result, threshold, function () {
      if (doneFunc) {
        doneFunc();
      }
    });
  };

  var rafCounter = rafCount === undefined ? 2 : rafCount;

  if (rafCounter) {
    var rafCallback = readyFunc;
    var rafFunc = function () {
      if (rafCounter <= 0) {
        rafCallback();
      } else {
        window.requestAnimationFrame(function () {
          rafCounter -= 1;
          rafFunc();
        });
      }
    };
    readyFunc = rafFunc;
  }

  if (delay) {
    var delayFunc = readyFunc;
    readyFunc = window.setTimeout(delayFunc, delay);
  }

  if (idleFunc) {
    idleFunc(readyFunc);
  } else {
    readyFunc();
  }
};
