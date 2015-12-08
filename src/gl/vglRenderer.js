//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vglRenderer
 *
 * @class
 * @extends geo.renderer
 * @param canvas
 * @returns {geo.gl.vglRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.vglRenderer = function (arg) {
  'use strict';

  if (!(this instanceof geo.gl.vglRenderer)) {
    return new geo.gl.vglRenderer(arg);
  }
  arg = arg || {};
  geo.renderer.call(this, arg);

  var m_this = this,
      m_contextRenderer = null,
      m_viewer = null,
      m_width = 0,
      m_height = 0,
      s_init = this._init;

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
   * Get context specific renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.contextRenderer = function () {
    return m_contextRenderer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.api = function () {
    return 'vgl';
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
    canvas.attr('class', 'webgl-canvas');
    $(m_this.layer().node().get(0)).append(canvas);
    m_viewer = vgl.viewer(canvas.get(0), arg.options);
    m_viewer.init();
    m_contextRenderer = m_viewer.renderWindow().activeRenderer();
    m_contextRenderer.setResetScene(false);

    if (m_viewer.renderWindow().renderers().length > 0) {
      m_contextRenderer.setLayer(m_viewer.renderWindow().renderers().length);
    }
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
    var renderWindow = m_viewer.renderWindow();

    m_width = w;
    m_height = h;
    m_this.canvas().attr('width', w);
    m_this.canvas().attr('height', h);
    renderWindow.positionAndResize(x, y, w, h);

    m_this._updateRendererCamera();
    m_this._render();

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function () {
    m_viewer.render();
    return m_this;
  };

  this._updateRendererCamera = function () {
    var renderWindow = m_viewer.renderWindow(),
        map = m_this.layer().map(),
        camera = map.camera(),
        view = camera.view, proj = camera.projectionMatrix;
    /* we want positive z to be closer to the camera. */
    proj = mat4.scale(mat4.create(), proj, [1, 1, -1]);
    /* Same kluge as in the base camera class worldToDisplay4.  With this, we
     * are currently showing z values from 0 to 1. */
    proj = mat4.translate(mat4.create(), proj, [0, 0, -2]);
    renderWindow.renderers().forEach(function (renderer) {
      var cam = renderer.camera();
      cam.setViewMatrix(view);
      cam.setProjectionMatrix(proj);
      if (proj[1] || proj[2] || proj[3] || proj[4] || proj[6] || proj[7] ||
          proj[8] || proj[9] || proj[11] || proj[15] !== 1) {
        /* Don't align texels */
        cam.viewAlignment = function () {
          return null;
        };
      } else {
        /* Set information for texel alignment.  The rounding factors should
         * probably be divided by window.devicePixelRatio. */
        cam.viewAlignment = function () {
          var align = {
            roundx: 2.0 / camera.viewport.width,
            roundy: 2.0 / camera.viewport.height
          };
          align.dx = (camera.viewport.width % 2) ? align.roundx * 0.5 : 0;
          align.dy = (camera.viewport.height % 2) ? align.roundy * 0.5 : 0;
          return align;
        };
      }
    });
  };

  // Connect to interactor events
  // Connect to pan event
  m_this.layer().geoOn(geo.event.pan, function (evt) {
    void(evt);
    m_this._updateRendererCamera();
  });

  // Connect to zoom event
  m_this.layer().geoOn(geo.event.zoom, function (evt) {
    void(evt);
    m_this._updateRendererCamera();
  });

  // Connect to parallelprojection event
  m_this.layer().geoOn(geo.event.parallelprojection, function (evt) {
    var vglRenderer = m_this.contextRenderer(),
        camera,
        layer = m_this.layer();

    if (evt.geo && evt.geo._triggeredBy !== layer) {
      if (!vglRenderer || !vglRenderer.camera()) {
        console.log('Parallel projection event triggered on unconnected VGL ' +
                    'renderer.');
      }
      camera = vglRenderer.camera();
      camera.setEnableParallelProjection(evt.parallelProjection);
      m_this._updateRendererCamera();
    }
  });

  return this;
};

inherit(geo.gl.vglRenderer, geo.renderer);

geo.registerRenderer('vgl', geo.gl.vglRenderer);
