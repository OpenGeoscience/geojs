/* These are functions we want available to jasmine tests. */
/* global it */
/* exported waitForIt, mockVGLRenderer, closeToArray, closeToEqual */

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
function waitForIt(desc, testFunc) {
  'use strict';
  it('wait for ' + desc, function (done) {
    var interval;
    interval = setInterval(function () {
      if (testFunc()) {
        clearInterval(interval);
        done();
      }
    }, 1);
  });
  it('done waiting for ' + desc, function () {
  });
}

/**
 * Compare two arrays with a precision tolerance.
 * @param {array} a1 first array to compare
 * @param {array} a2 second array to compare
 * @param {number} precision precision used in jasmine's toBeCloseTo function
 * @return {boolean} true if the arrays are close.
 */
function closeToArray(a1, a2, precision) {
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
}

/**
 * Compare two objects containing numbers with a precision tolerance.
 * @param {array} a1 first object to compare
 * @param {array} a2 second object to compare
 * @param {number} precision precision used in jasmine's toBeCloseTo function
 * @return {boolean} true if the objects are close.
 */
function closeToEqual(o1, o2, precision) {
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
}

/**
 * Replace vgl.renderer with a mocked version for phantom tests.
 */
function mockVGLRenderer() {
  'use strict';

  if (vgl._mocked) {
    return;
  }

  var noop = function () { };
  var _id = 0,
      incID = function () {
        _id += 1;
        return _id;
      };
  /* The context largely does nothing. */
  var m_context = {
    activeTexture: noop,
    attachShader: noop,
    bindAttribLocation: noop,
    bindBuffer: noop,
    bindFramebuffer: noop,
    bindTexture: noop,
    blendFuncSeparate: noop,
    bufferData: noop,
    bufferSubData: noop,
    checkFramebufferStatus: function (key) {
      if (key === vgl.GL.FRAMEBUFFER) {
        return vgl.GL.FRAMEBUFFER_COMPLETE;
      }
    },
    clear: noop,
    clearColor: noop,
    clearDepth: noop,
    compileShader: noop,
    createBuffer: incID,
    createFramebuffer: noop,
    createProgram: incID,
    createShader: incID,
    createTexture: incID,
    deleteBuffer: noop,
    deleteProgram: noop,
    deleteShader: noop,
    deleteTexture: noop,
    depthFunc: noop,
    disable: noop,
    disableVertexAttribArray: noop,
    drawArrays: noop,
    enable: noop,
    enableVertexAttribArray: noop,
    finish: noop,
    getExtension: incID,
    getParameter: function (key) {
      if (key === vgl.GL.DEPTH_BITS) {
        return 16;
      }
    },
    getProgramParameter: function (id, key) {
      if (key === vgl.GL.LINK_STATUS) {
        return true;
      }
    },
    getShaderInfoLog: function () {
      return 'log';
    },
    getShaderParameter: function (id, key) {
      if (key === vgl.GL.COMPILE_STATUS) {
        return true;
      }
    },
    getUniformLocation: incID,
    isEnabled: function (key) {
      if (key === vgl.GL.BLEND) {
        return true;
      }
    },
    linkProgram: noop,
    pixelStorei: noop,
    shaderSource: noop,
    texImage2D: noop,
    texParameteri: noop,
    uniform1iv: noop,
    uniform1fv: noop,
    uniform2fv: noop,
    uniform3fv: noop,
    uniform4fv: noop,
    uniformMatrix3fv: noop,
    uniformMatrix4fv: noop,
    useProgram: noop,
    vertexAttribPointer: noop,
    vertexAttrib3fv: noop,
    viewport: noop
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
    return true;
  };

  vgl._mocked = true;
}
