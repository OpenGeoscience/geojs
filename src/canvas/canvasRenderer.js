//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class canvasRenderer
 *
 * @class
 * @extends geo.renderer
 * @param canvas
 * @returns {geo.canvas.canvasRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.canvas.canvasRenderer = function (arg) {
  'use strict';

  if (!(this instanceof geo.canvas.canvasRenderer)) {
    return new geo.canvas.canvasRenderer(arg);
  }
  arg = arg || {};
  geo.renderer.call(this, arg);

  var m_this = this,
      m_width = 0,
      m_height = 0,
      m_renderAnimFrameRef = null,
      s_init = this._init,
      s_exit = this._exit;

  /// TODO: Move this API to the base class
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return width of the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.width = function () {
    return m_width;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return height of the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.height = function () {
    return m_height;
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
    m_width = w;
    m_height = h;
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
        m_this.context2d.setTransform(1, 0, 0, 1, 0, 0);
        m_this.context2d.clearRect(0, 0, viewport.width, viewport.height);

        var features = layer.features();
        // loop ?
        features[0]._renderImageQuads(m_this.context2d, map);
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

inherit(geo.canvas.canvasRenderer, geo.renderer);

geo.registerRenderer('canvas', geo.canvas.canvasRenderer);

(function () {
  'use strict';
  /**
   * Report if the canvas renderer is supported.
   *
   * @returns {boolean} true if available.
   */
  geo.canvas.canvasRenderer.supported = function () {
    // ccl: can we get rid of this.
    return true;
  };

  /**
   * If the canvas renderer is not supported, supply the name of a renderer that
   * should be used instead.  This asks for the null renderer.
   *
   * @returns null for the null renderer.
   */
  geo.canvas.canvasRenderer.fallback = function () {
    return null;
  };
})();
