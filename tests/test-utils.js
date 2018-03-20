/* These are functions we want available to jasmine tests. */
/* exported waitForIt, closeToArray, closeToEqual, logCanvas2D, submitNote */
/* global CanvasRenderingContext2D */

var $ = require('jquery');

var geo = require('../src');
var bowser = require('bowser');

module.exports = {};

/**
 * Provides a uniform entry point into the geojs library.
 */
module.exports.geo = geo;
/**
 * Create a pair of it functions.  The first one waits for a function to return
 * a truthy value, and the second one runs after the first has assured its
 * completion.  This needs to be run within a describe block and not within
 * another it function.
 *
 * @param {string} desc a description of the task.
 * @param {function} testFunc a function that returns true when the
 *                            specification is complete.
 */
module.exports.waitForIt = function waitForIt(desc, testFunc) {
  'use strict';
  it('wait for ' + desc, function (done) {
    var interval;
    interval = setInterval(function () {
      if (testFunc()) {
        clearInterval(interval);
        done();
      }
    }, 10);
  });
  it('done waiting for ' + desc, function () {
  });
};

/**
 * Compare two arrays with a precision tolerance.
 * @param {array} a1 first array to compare
 * @param {array} a2 second array to compare
 * @param {number} precision precision used in jasmine's toBeCloseTo function
 * @return {boolean} true if the arrays are close.
 */
module.exports.closeToArray = function closeToArray(a1, a2, precision) {
  'use strict';
  var i;
  if (a1.length !== a2.length) {
    return false;
  }
  precision = (precision !== 0) ? (precision || 2) : precision;
  precision = Math.pow(10, -precision) / 2;
  for (i = 0; i < a1.length; i += 1) {
    if (Math.abs(a1[i] - a2[i]) >= precision) {
      return false;
    }
  }
  return true;
};

/**
 * Compare two objects containing numbers with a precision tolerance.
 * @param {array} a1 first object to compare
 * @param {array} a2 second object to compare
 * @param {number} precision precision used in jasmine's toBeCloseTo function
 * @return {boolean} true if the objects are close.
 */
module.exports.closeToEqual = function closeToEqual(o1, o2, precision) {
  'use strict';
  var key;

  precision = (precision !== 0) ? (precision || 2) : precision;
  precision = Math.pow(10, -precision) / 2;
  for (key in o1) {
    if (o1.hasOwnProperty(key)) {
      if (o2[key] === undefined ||
          Math.abs(o1[key] - o2[key]) >= precision) {
        console.log('not closeToEqual: ' + key + ' ' + o1[key] + ' !~= ' +
                    o2[key]);
        return false;
      }
    }
  }
  for (key in o2) {
    if (o2.hasOwnProperty(key) && o1[key] === undefined) {
      return false;
    }
  }
  return true;
};

/**
 * Add counters for various canvas calls so we can tell if they have been used.
 */
module.exports.logCanvas2D = function logCanvas2D(enable) {
  'use strict';

  if (window._canvasLog) {
    window._canvasLog.enable = enable;
    return;
  }

  var log = {enable: enable, counts: {}, log: []};

  var proto = CanvasRenderingContext2D.prototype;
  $.each(Object.keys(proto), function (idx, key) {
    try {
      var orig = proto[key];
    } catch (err) {
      return;
    }
    if (orig && orig.constructor && orig.call && orig.apply) {
      proto[key] = function () {
        log.counts[key] = (log.counts[key] || 0) + 1;
        if (log.enable) {
          log.log.push({func: key, arg: arguments});
        }
        return orig.apply(this, arguments);
      };
    }
  });

  window._canvasLog = log;
};

/**
 * Send data to be reported as part of the a build note.
 *
 * @param key: the key that this will be reported under.  This should be the
 *             name of the test.
 * @param note: the data to send.  This will be converted to JSON.
 */
module.exports.submitNote = function submitNote(key, note) {
  note.browser = bowser;
  return $.ajax({
    url: '/notes?key=' + encodeURIComponent(key),
    data: JSON.stringify(note),
    method: 'PUT',
    contentType: 'application/json'
  });
};

var origRequestAnimationFrame = window.requestAnimationFrame,
    origCancelAnimationFrame = window.cancelAnimationFrame,
    animFrameCallbacks = [];

module.exports.unmockAnimationFrame = function () {
  window.requestAnimationFrame = origRequestAnimationFrame;
  window.cancelAnimationFrame = origCancelAnimationFrame;
  window.stepAnimationFrame = undefined;
};

/* Call all animation frame functions that have been captured.
 *
 * @param {float} time float milliseconds.
 */
module.exports.stepAnimationFrame = function (time) {
  if (time === undefined) {
    time = new Date().getTime();
  }
  var callbacks = animFrameCallbacks, action;
  animFrameCallbacks = [];
  while (callbacks.length > 0) {
    action = callbacks.shift();
    action.callback.call(window, time);
  }
};

/**
 * Allow stepping through animation frames.  Call unmockAnimationFrame to
 * retore the original animation frame behavior.
 */
module.exports.mockAnimationFrame = function (mockDate) {

  var animFrameIndex = 0;

  /* Replace window.requestAnimationFrame with this function, then call
   * stepAnimationFrame with a delta from when this was supposed to start to
   * test asynchronous animations.
   *
   * @param {function} callback the function to call on an animation frame
   *                            interval.
   */
  function mockedRequestAnimationFrame(callback) {
    animFrameIndex += 1;
    var id = animFrameIndex;
    animFrameCallbacks.push({id: id, callback: callback});
    return id;
  }

  /* Replace window.cancelAnimationFrame with this function.
   *
   * @param {number} id id of the callback to cancel.
   */
  function mockedCancelAnimationFrame(id) {
    for (var i = 0; i < animFrameCallbacks.length; i += 1) {
      if (animFrameCallbacks[i].id === id) {
        animFrameCallbacks.splice(i, 1);
        return;
      }
    }
  }

  window.requestAnimationFrame = mockedRequestAnimationFrame;
  window.cancelAnimationFrame = mockedCancelAnimationFrame;
};

var origDate = window.Date,
    startDate = (new Date()).getTime();

/**
 * Allow mocking calls to Date so that each new object is slightly after the
 * previous one.  Use a delta of 0 and calls to advanceDate() for complete
 * controls.
 *
 * @param {number} delta number of milliseconds added to each call.
 */
module.exports.mockDate = function (delta) {
  if (window.unmockDate) {
    return;
  }
  var mockDelta = delta === undefined ? 15 : delta;

  /**
   * Override window.Date so that every fetch increments the date by a few
   * milliseconds.
   */
  geo.mockedDate = function (args) {
    if (!(this instanceof geo.mockedDate)) {
      return new geo.mockedDate(args);
    }
    startDate += mockDelta;
    return new origDate(startDate);
  };
  geo.mockedDate.now = function () {
    return startDate;
  };

  window.Date = geo.mockedDate;
};

/* Stop mocking. */
module.exports.unmockDate = function () {
  window.Date = origDate;
  window.unmockDate = undefined;
  window.advanceDate = undefined;
};

/**
 * Change the date that will be reported by new Date().
 *
 * @param {number} delta milliseconds to advance the date.
 */
module.exports.advanceDate = function (delta) {
  startDate += delta;
};

/**
 * Decode query components into a dictionary of values.
 *
 * @returns {object} the query parameters as a dictionary.
 */
module.exports.getQuery = function () {
  var query = document.location.search.replace(/(^\?)/, '').split(
    '&').map(function (n) {
      n = n.split('=');
      if (n[0]) {
        this[decodeURIComponent(n[0].replace(/\+/g, '%20'))] = decodeURIComponent(n[1].replace(/\+/g, '%20'));
      }
      return this;
    }.bind({}))[0];
  return query;
};

/**
 * Destroy a map for testing.  This removes any existing node called '#map'.
 * It should be done if the VGL renderer was mocked before it is restored.
 */
function destroyMap() {
  if ($('#map').data('data-geojs-map') && $.isFunction($('#map').data('data-geojs-map').exit)) {
    $('#map').data('data-geojs-map').exit();
  }
  $('#map').remove();
}
module.exports.destroyMap = destroyMap;

/**
 * Create a map for testing.  This removes any existing node called '#map' and
 * creates a new one.
 *
 * @param {object} [opts] Additional options to pass to the map class creator.
 * @param {object} [css] Additional css to apply to the map node.  Default is
 *   width: 640px, height: 360px.
 * @returns {geo.map} the created map.
 */
module.exports.createMap = function (opts, css) {
  destroyMap();
  var node = $('<div id="map"/>').css($.extend({}, {width: '640px', height: '360px'}, css));
  $('body').prepend(node);
  opts = $.extend({}, opts);
  opts.node = node;
  return geo.map(opts);
};

/**
 * Return true if the browser is probably PhantomJS.
 *
 * @returns {boolean}
 */
module.exports.isPhantomJS = function () {
  // PhantomJS doesn't have Math.log10, but Chrome and Firefox do
  return !Math.log10;
};
