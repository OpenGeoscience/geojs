var inherit = require('../inherit');
var registerRenderer = require('../registry').registerRenderer;
var renderer = require('../renderer');

/**
 * Create a new instance of class canvasRenderer.
 *
 * @class geo.canvas.renderer
 * @extends geo.renderer
 * @param {object} arg Options for the renderer.
 * @param {geo.layer} [arg.layer] Layer associated with the renderer.
 * @param {HTMLElement} [arg.canvas] Canvas element associated with the
 *   renderer.
 * @returns {geo.canvas.canvasRenderer}
 */
var canvasRenderer = function (arg) {
  'use strict';

  var $ = require('jquery');

  if (!(this instanceof canvasRenderer)) {
    return new canvasRenderer(arg);
  }
  arg = arg || {};
  renderer.call(this, arg);

  var m_this = this,
      m_clearCanvas = true,
      s_init = this._init,
      s_exit = this._exit;

  /**
   * Set the clear canvas flag.  If truthy, the canvas is erased at the start
   * of the render cycle.  If falsy, the old data is kept.
   *
   * @param {boolean} arg Truthy to clear the canvas when rendering is started.
   */
  this.clearCanvas = function (arg) {
    m_clearCanvas = arg;
  };

  /**
   * Get API used by the renderer.
   *
   * @returns {string} 'canvas'.
   */
  this.api = function () {
    return 'canvas';
  };

  /**
   * Initialize.
   *
   * @returns {this}
   */
  this._init = function () {
    if (m_this.initialized()) {
      return m_this;
    }

    s_init.call(m_this);

    var canvas = $(document.createElement('canvas'));
    m_this.context2d = canvas[0].getContext('2d');

    canvas.addClass('canvas-canvas');
    $(m_this.layer().node().get(0)).append(canvas);

    m_this.canvas(canvas);
    /* Initialize the size of the renderer */
    var map = m_this.layer().map(),
        mapSize = map.size();
    m_this._resize(0, 0, mapSize.width, mapSize.height);

    return m_this;
  };

  /**
   * Handle resize event.
   *
   * @param {number} x Ignored.
   * @param {number} y Ignored.
   * @param {number} w New width in pixels.
   * @param {number} h New height in pixels.
   * @returns {this}
   */
  this._resize = function (x, y, w, h) {
    m_this.canvas().attr('width', w);
    m_this.canvas().attr('height', h);
    m_this._render();

    return m_this;
  };

  /**
   * Render.
   *
   * @returns {this}
   */
  this._render = function () {
    m_this.layer().map().scheduleAnimationFrame(this._renderFrame);
    return m_this;
  };

  /**
   * Render during an animation frame callback.
   */
  this._renderFrame = function () {
    var layer = m_this.layer(),
        map = layer.map(),
        camera = map.camera(),
        viewport = camera._viewport,
        features = layer.features(),
        i;

    for (i = 0; i < features.length; i += 1) {
      if (features[i]._delayRender()) {
        // reschedule the render for the next animation frame
        m_this._render();
        // exit this render loop so it doesn't occur
        return;
      }
    }

    // Clear the canvas.
    if (m_clearCanvas) {
      m_this.context2d.setTransform(1, 0, 0, 1, 0, 0);
      m_this.context2d.clearRect(0, 0, viewport.width, viewport.height);
    }

    for (i = 0; i < features.length; i += 1) {
      if (features[i].visible()) {
        features[i]._renderOnCanvas(m_this.context2d, map);
      }
    }
  };

  /**
   * Exit.
   */
  this._exit = function () {
    m_this.canvas().remove();
    s_exit();
  };

  return this;
};

inherit(canvasRenderer, renderer);

registerRenderer('canvas', canvasRenderer);

(function () {
  'use strict';

  var checkedCanvas;

  /**
   * Report if the canvas renderer is supported.
   *
   * @returns {boolean} true if available.
   */
  canvasRenderer.supported = function () {
    if (checkedCanvas === undefined) {
      /* This is extracted from what Modernizr uses. */
      var canvas; // eslint-disable-line no-unused-vars
      try {
        canvas = document.createElement('canvas');
        checkedCanvas = !!(canvas.getContext && canvas.getContext('2d'));
      } catch (e) {
        checkedCanvas = false;
      }
      canvas = undefined;
    }
    return checkedCanvas;
  };

  /**
   * If the canvas renderer is not supported, supply the name of a renderer that
   * should be used instead.  This asks for the null renderer.
   *
   * @returns {null} `null` for the null renderer.
   */
  canvasRenderer.fallback = function () {
    return null;
  };
})();

module.exports = canvasRenderer;
