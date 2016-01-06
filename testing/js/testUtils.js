/* These are functions we want available to jasmine tests. */
/* global it */
/* exported waitForIt, mockVGLRenderer */

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

  vgl._mocked = true;
}
