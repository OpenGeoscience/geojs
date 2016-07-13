/* These are functions we want available to jasmine tests. */
/* exported waitForIt, mockVGLRenderer, closeToArray, closeToEqual, logCanvas2D, submitNote */
/* global CanvasRenderingContext2D */

var vgl = require('vgl');
var _renderWindow = vgl.renderWindow;

var $ = require('jquery');

var geo = require('../src');
var _supported = geo.gl.vglRenderer.supported;

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
 * Replace vgl.renderer with a mocked version for phantom tests.
 * Returns a function that, when called, will restore vgl to its
 * default state.
 *
 * @param {boolean} [supported=true] If false, then the vgl renderer
 * will indicate that this is an unsupported browser environment.
 */
module.exports.mockVGLRenderer = function mockVGLRenderer(supported) {
  'use strict';
  var vgl = require('vgl');

  if (supported === undefined) {
    supported = true;
  }

  if (vgl._mocked) {
    throw new Error('VGL renderer already mocked');
  }

  var mockCounts = {};
  var count = function (name) {
    mockCounts[name] = (mockCounts[name] || 0) + 1;
  };
  var noop = function (name) {
    return function () {
      count(name);
    };
  };
  var _id = 0,
      incID = function (name) {
        return function () {
          count(name);
          _id += 1;
          return _id;
        };
      };
  /* The context largely does nothing. */
  var m_context = {
    activeTexture: noop('activeTexture'),
    attachShader: noop('attachShader'),
    bindAttribLocation: noop('bindAttribLocation'),
    bindBuffer: noop('bindBuffer'),
    bindFramebuffer: noop('bindFramebuffer'),
    bindTexture: noop('bindTexture'),
    blendFuncSeparate: noop('blendFuncSeparate'),
    bufferData: noop('bufferData'),
    bufferSubData: noop('bufferSubData'),
    checkFramebufferStatus: function (key) {
      count('checkFramebufferStatus');
      if (key === vgl.GL.FRAMEBUFFER) {
        return vgl.GL.FRAMEBUFFER_COMPLETE;
      }
    },
    clear: noop('clear'),
    clearColor: noop('clearColor'),
    clearDepth: noop('clearDepth'),
    compileShader: noop('compileShader'),
    createBuffer: incID('createBuffer'),
    createFramebuffer: noop('createFramebuffer'),
    createProgram: incID('createProgram'),
    createShader: incID('createShader'),
    createTexture: incID('createTexture'),
    deleteBuffer: noop('deleteBuffer'),
    deleteProgram: noop('deleteProgram'),
    deleteShader: noop('deleteShader'),
    deleteTexture: noop('deleteTexture'),
    depthFunc: noop('depthFunc'),
    disable: noop('disable'),
    disableVertexAttribArray: noop('disableVertexAttribArray'),
    drawArrays: noop('drawArrays'),
    enable: noop('enable'),
    enableVertexAttribArray: noop('enableVertexAttribArray'),
    finish: noop('finish'),
    getExtension: incID('getExtension'),
    getParameter: function (key) {
      count('getParameter');
      if (key === vgl.GL.DEPTH_BITS) {
        return 16;
      }
    },
    getProgramParameter: function (id, key) {
      count('getProgramParameter');
      if (key === vgl.GL.LINK_STATUS) {
        return true;
      }
    },
    getShaderInfoLog: function () {
      count('getShaderInfoLog');
      return 'log';
    },
    getShaderParameter: function (id, key) {
      count('getShaderParameter');
      if (key === vgl.GL.COMPILE_STATUS) {
        return true;
      }
    },
    getUniformLocation: incID('getUniformLocation'),
    isEnabled: function (key) {
      count('isEnabled');
      if (key === vgl.GL.BLEND) {
        return true;
      }
    },
    linkProgram: noop('linkProgram'),
    pixelStorei: noop('pixelStorei'),
    shaderSource: noop('shaderSource'),
    texImage2D: noop('texImage2D'),
    texParameteri: noop('texParameteri'),
    uniform1iv: noop('uniform1iv'),
    uniform1fv: noop('uniform1fv'),
    uniform2fv: noop('uniform2fv'),
    uniform3fv: noop('uniform3fv'),
    uniform4fv: noop('uniform4fv'),
    uniformMatrix3fv: noop('uniformMatrix3fv'),
    uniformMatrix4fv: noop('uniformMatrix4fv'),
    useProgram: noop('useProgram'),
    vertexAttribPointer: noop('vertexAttribPointer'),
    vertexAttrib3fv: noop('vertexAttrib3fv'),
    viewport: noop('viewport')
  };

  /* Our mock has only a single renderWindow */
  var m_renderWindow = vgl.renderWindow();
  m_renderWindow._setup = function () {
    return true;
  };
  m_renderWindow.context = function () {
    return m_context;
  };
  vgl.renderWindow = function () {
    return m_renderWindow;
  };
  geo.gl.vglRenderer.supported = function () {
    return !!supported;
  };

  vgl._mocked = true;
  vgl.mockCounts = function () {
    return mockCounts;
  };
};

/**
 * Restore the vgl renderer to a pristine state.
 */
module.exports.restoreVGLRenderer = function () {
  vgl.renderWidow = _renderWindow;
  geo.gl.vglRenderer.supported = _supported;
  delete vgl._mocked;
  delete vgl.mockCounts;
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
  $.each(proto, function (key) {
    var orig = proto[key];
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
