var vgl = require('./vgl');
var inherit = require('../inherit');

/**
 * Create a new instance of class renderWindow.
 *
 * @class
 * @alias vgl.renderWindow
 * @param {HTMLElement} canvas
 * @returns {vgl.renderWindow}
 */
vgl.renderWindow = function (canvas) {
  'use strict';

  if (!(this instanceof vgl.renderWindow)) {
    return new vgl.renderWindow(canvas);
  }
  vgl.graphicsObject.call(this);

  var m_this = this,
      m_x = 0,
      m_y = 0,
      m_width = 400,
      m_height = 400,
      m_canvas = canvas,
      m_activeRender = null,
      m_renderers = [],
      m_context = null;

  /**
   * Get size of the render window.
   *
   * @returns {number[]}
   */
  this.windowSize = function () {
    return [m_width, m_height];
  };

  /**
   * Get window position (top left coordinates).
   *
   * @returns {number[]}
   */
  this.windowPosition = function () {
    return [m_x, m_y];
  };

  /**
   * Return all renderers contained in the render window.
   *
   * @returns {vgl.renderer[]}
   */
  this.renderers = function () {
    return m_renderers;
  };

  /**
   * Get active renderer of the the render window.
   *
   * @returns {vgl.renderer}
   */
  this.activeRenderer = function () {
    return m_activeRender;
  };

  /**
   * Add renderer to the render window.
   *
   * @param {vgl.renderer} ren
   * @returns {boolean}
   */
  this.addRenderer = function (ren) {
    if (m_this.hasRenderer(ren) === false) {
      m_renderers.push(ren);
      ren.setRenderWindow(m_this);
      if (m_activeRender === null) {
        m_activeRender = ren;
      }
      if (ren.layer() !== 0) {
        ren.camera().setClearMask(vgl.GL.DepthBufferBit);
      }
      m_this.modified();
      return true;
    }
    return false;
  };

  /**
   * Check if the renderer exists.
   *
   * @param {vgl.renderer} ren
   * @returns {boolean}
   */
  this.hasRenderer = function (ren) {
    var i;
    for (i = 0; i < m_renderers.length; i += 1) {
      if (ren === m_renderers[i]) {
        return true;
      }
    }

    return false;
  };

  /**
   * Resize and reposition the window.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  this.positionAndResize = function (x, y, width, height) {
    m_x = x;
    m_y = y;
    m_width = width;
    m_height = height;
    var i;
    for (i = 0; i < m_renderers.length; i += 1) {
      m_renderers[i].positionAndResize(m_x, m_y, m_width, m_height);
    }
    m_this.modified();
  };

  /**
   * Create the window.
   *
   * @param {vgl.renderState} renderState
   * @returns {boolean}
   */
  this._setup = function (renderState) {
    m_context = null;

    try {
      // Try to grab the standard context. If it fails, fallback to
      // experimental.
      m_context = m_canvas.getContext('webgl') ||
            m_canvas.getContext('experimental-webgl');

      // Set width and height of renderers if not set already
      var i;
      for (i = 0; i < m_renderers.length; i += 1) {
        if ((m_renderers[i].width() > m_width) ||
            m_renderers[i].width() === 0 ||
            (m_renderers[i].height() > m_height) ||
            m_renderers[i].height() === 0) {
          m_renderers[i].resize(m_x, m_y, m_width, m_height);
        }
      }

      return true;
    } catch (e) {
    }

    // If we don't have a GL context, give up now
    if (!m_context) {
      console.warn('[ERROR] Unable to initialize WebGL. Your browser may not support it.');  // eslint-disable-line no-console
    }

    return false;
  };

  /**
   * Return current GL context.
   *
   * @returns {WebGLRenderingContext}
   */
  this.context = function () {
    return m_context;
  };

  /**
   * Delete this window and release any graphics resources.
   *
   * @param {vgl.renderState} renderState
   */
  this._cleanup = function (renderState) {
    var i;
    for (i = 0; i < m_renderers.length; i += 1) {
      m_renderers[i]._cleanup(renderState);
    }
    vgl.clearCachedShaders(renderState ? renderState.m_context : null);
    m_this.modified();
  };

  /**
   * Render the scene.
   */
  this.render = function () {
    var i;
    m_renderers.sort(function (a, b) { return a.layer() - b.layer(); });
    for (i = 0; i < m_renderers.length; i += 1) {
      m_renderers[i].render();
    }
  };

  return m_this;
};

inherit(vgl.renderWindow, vgl.graphicsObject);
