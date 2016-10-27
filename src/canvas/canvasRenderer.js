var inherit = require('../inherit');
var registerRenderer = require('../registry').registerRenderer;
var renderer = require('../renderer');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class canvasRenderer
 *
 * @class geo.canvas.renderer
 * @extends geo.renderer
 * @param canvas
 * @returns {geo.canvas.canvasRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
var canvasRenderer = function (arg) {
  'use strict';

  var $ = require('jquery');

  if (!(this instanceof canvasRenderer)) {
    return new canvasRenderer(arg);
  }
  arg = arg || {};
  renderer.call(this, arg);

  var m_this = this,
      m_renderAnimFrameRef = null,
      m_clearCanvas = true,
      s_init = this._init,
      s_exit = this._exit;

  this.clearCanvas = function (arg) {
    m_clearCanvas = arg;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.api = function () {
    return 'canvas';
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    if (m_this.initialized()) {
      return m_this;
    }

    s_init.call(m_this);

    var canvas = $(document.createElement('canvas'));
    m_this.context2d = canvas[0].getContext('2d');

    canvas.attr('class', 'canvas-canvas');
    $(m_this.layer().node().get(0)).append(canvas);

    m_this.canvas(canvas);
    /* Initialize the size of the renderer */
    var map = m_this.layer().map(),
        mapSize = map.size();
    m_this._resize(0, 0, mapSize.width, mapSize.height);

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function (x, y, w, h) {
    m_this.canvas().attr('width', w);
    m_this.canvas().attr('height', h);
    m_this._render();

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function () {
    if (m_renderAnimFrameRef === null) {
      m_renderAnimFrameRef = window.requestAnimationFrame(function () {
        m_renderAnimFrameRef = null;

        var layer = m_this.layer(),
            map = layer.map(),
            camera = map.camera(),
            viewport = camera._viewport;

        // Clear the canvas.
        if (m_clearCanvas) {
          m_this.context2d.setTransform(1, 0, 0, 1, 0, 0);
          m_this.context2d.clearRect(0, 0, viewport.width, viewport.height);
        }

        var features = layer.features();
        for (var i = 0; i < features.length; i += 1) {
          if (features[i].visible()) {
            features[i]._renderOnCanvas(m_this.context2d, map);
          }
        }
      });
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   */
  ////////////////////////////////////////////////////////////////////////////
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
   * @returns null for the null renderer.
   */
  canvasRenderer.fallback = function () {
    return null;
  };
})();

module.exports = canvasRenderer;
