/* eslint-disable camelcase */

var $ = require('jquery');
var webglRenderer = require('../webgl/webglRenderer');

var _renderWindow, _supported;

module.exports = {};

/**
 * Replace webgl.renderer with a mocked version for testing in a non-webGL
 * state.  Use restoreWebglRenderer to unmock.  Call vgl.mockCounts() to get
 * the number of times different webGL functions have been called.
 *
 * @param {boolean} [supported=true] If false, then the webgl renderer will
 *      indicate that this is an unsupported browser environment.
 * @alias geo.util.mockWebglRenderer
 */
module.exports.mockWebglRenderer = function mockWebglRenderer(supported) {
  'use strict';
  var vgl = require('../vgl');

  if (supported === undefined) {
    supported = true;
  }

  if (vgl._mocked) {
    throw new Error('webgl renderer already mocked');
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
  var default_context = {
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
    detachShader: noop('detachShader'),
    depthFunc: noop('depthFunc'),
    disable: noop('disable'),
    disableVertexAttribArray: noop('disableVertexAttribArray'),
    drawArrays: noop('drawArrays'),
    enable: noop('enable'),
    enableVertexAttribArray: noop('enableVertexAttribArray'),
    finish: noop('finish'),
    getError: noop('getError'),
    getExtension: incID('getExtension'),
    getParameter: function (key) {
      count('getParameter');
      switch (key) {
        case vgl.GL.ALIASED_POINT_SIZE_RANGE: return [1, 64];
        case vgl.GL.DEPTH_BITS: return 16;
        case vgl.GL.MAX_TEXTURE_SIZE: return 4096;
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
    getSupportedExtensions: function () {
      count('getSupportedExtensions');
      return [];
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

  _renderWindow = vgl.renderWindow;
  var mockedRenderWindow = function () {
    /* Temporarily put back the original definition of renderWindow so that the
     * class instance will be instantiated correctly. */
    vgl.renderWindow = _renderWindow;
    var m_this = new vgl.renderWindow(),
        m_context;
    vgl.renderWindow = mockedRenderWindow;

    m_this._setup = function () {
      var i, renderers = m_this.renderers(),
          wsize = m_this.windowSize(),
          wpos = m_this.windowPosition();

      m_context = $.extend({}, vgl.GL, default_context);

      for (i = 0; i < renderers.length; i += 1) {
        if ((renderers[i].width() > wsize[0]) ||
            renderers[i].width() === 0 ||
            (renderers[i].height() > wsize[1]) ||
            renderers[i].height() === 0) {
          renderers[i].resize(wpos[0], wpos[1], wsize[0], wsize[1]);
        }
      }
      return true;
    };
    m_this.context = function () {
      return m_context;
    };
    return m_this;
  };
  vgl.renderWindow = mockedRenderWindow;

  _supported = webglRenderer.supported;
  webglRenderer.supported = function () {
    return !!supported;
  };
  webglRenderer._maxTextureSize = 4096;
  webglRenderer._maxPointSize = 64;

  vgl._mocked = true;
  vgl.mockCounts = function () {
    return mockCounts;
  };
};

/**
 * Unmock the vgl renderer.
 * @alias geo.util.restoreWebglRenderer
 */
module.exports.restoreWebglRenderer = function () {
  var vgl = require('../vgl');

  if (vgl._mocked) {
    vgl.renderWindow = _renderWindow;
    webglRenderer.supported = _supported;
    delete vgl._mocked;
    delete vgl.mockCounts;
  }
};
