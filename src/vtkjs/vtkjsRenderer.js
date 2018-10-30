var inherit = require('../inherit');
var registerRenderer = require('../registry').registerRenderer;
var renderer = require('../renderer');

/**
 * Create a new instance of class vtkjsRenderer
 *
 * @class geo.gl.vtkjsRenderer
 * @extends geo.renderer
 * @param canvas
 * @returns {geo.gl.vtkjsRenderer}
 */
var vtkjsRenderer = function (arg) {
  'use strict';

  if (!(this instanceof vtkjsRenderer)) {
    return new vtkjsRenderer(arg);
  }
  arg = arg || {};
  renderer.call(this, arg);

  var mat4 = require('gl-mat4');
  var geo_event = require('../event');
  var vtkjs = vtkjsRenderer.vtkjs;
  var vtkGenericRenderWindow = vtkjs.Rendering.Misc.vtkGenericRenderWindow;

  var m_this = this,
      m_width = 0,
      m_height = 0,
      s_init = this._init;

  var vtkRenderer = vtkGenericRenderWindow.newInstance({
    background: [0, 0, 0, 0]});
  vtkRenderer.setContainer(m_this.layer().node().get(0));
  // TODO: Is there a way to start with no interactor rather than unbinding it?
  vtkRenderer.getInteractor().unbindEvents()
  vtkRenderer.resize();
  var vtkjsren = vtkRenderer.getRenderer();
  var renderWindow = vtkRenderer.getRenderWindow();

  /**
   * Return width of the renderer
   */
  this.width = function () {
    return m_width;
  };

  /**
   * Return height of the renderer
   */
  this.height = function () {
    return m_height;
  };

  /**
   * Get context specific renderer
   */
  this.contextRenderer = function () {
    return vtkjsren;
  };

  /**
   * Get API used by the renderer
   */
  this.api = function () {
    return 'vtkjs';
  };

  /**
   * Initialize
   */
  this._init = function () {
    if (m_this.initialized()) {
      return m_this;
    }

    s_init.call(m_this);

    /* Initialize the size of the renderer */
    var map = m_this.layer().map(),
        mapSize = map.size();
    m_this._resize(0, 0, mapSize.width, mapSize.height);
    // TODO: figure out what the clipbounds actually should be and handle
    // perspective modes properly.
    map.camera().clipbounds = {near: -map.unitsPerPixel(), far: map.unitsPerPixel()};
    return m_this;
  };

  /**
   * Handle resize event
   */
  this._resize = function (x, y, w, h) {
    vtkRenderer.resize();
    m_this._render();
    return m_this;
  };

  /**
   * Render.  This actually schedules rendering for the next animation frame.
   */
  this._render = function () {
    /* If we are already scheduled to render, don't schedule again.  Rather,
     * mark that we should render after other animation frame requests occur.
     * It would be nice if we could just reschedule the call by removing and
     * readding the animation frame request, but this doesn't work for if the
     * reschedule occurs during another animation frame callback (it then waits
     * until a subsequent frame). */
    m_this.layer().map().scheduleAnimationFrame(this._renderFrame, true);
    return m_this;
  };

  /**
   * This clears the render timer and actually renders.
   */
  this._renderFrame = function () {
    var layer = m_this.layer(),
        features = layer.features(),
        i;
    // TODO: draw something else should trigger feature update
    for (i = 0; i < features.length; i += 1) {
      if (features[i].visible()) {
        features[i]._update();
      }
    }
    m_this._updateRendererCamera();
    renderWindow.render();
  };

  /**
   * Exit
   */
  this._exit = function () {
    // DO NOTHING
  };

  this._updateRendererCamera = function () {
    var map = m_this.layer().map(),
        camera = map.camera(),
        view = camera.view,
        proj = camera.projectionMatrix;
    var viewmat = mat4.create();
    mat4.copy(viewmat, view);
    var projmat = mat4.create();
    mat4.copy(projmat, proj);
    m_this.contextRenderer().getActiveCamera().setViewMatrix(viewmat);
    m_this.contextRenderer().getActiveCamera().setProjectionMatrix(projmat);
  };

  /**
   * Connect to pan event.  This is sufficient, as all zooms and rotations also
   * produce a pan
   */
  m_this.layer().geoOn(geo_event.pan, function (evt) {
    // TODO: If the zoom level has changed, our point size needs to be
    // recalculated, so we should call m_this._render
    // DO NOTHING
  });

  /**
   * Connect to parallelprojection event
   */
  m_this.layer().geoOn(geo_event.parallelprojection, function (evt) {
    // DO NOTHING
  });

  return this;
};

inherit(vtkjsRenderer, renderer);

registerRenderer('vtkjs', vtkjsRenderer);

/**
 * Report if the vtkjs renderer is supported.  This is just a check if vtkjs is available.
 *
 * @returns {boolean} true if available.
 */
vtkjsRenderer.supported = function () {
  delete vtkjsRenderer.vtkjs;
  // webpack expects optional dependencies to be wrapped in a try-catch
  try {
    vtkjsRenderer.vtkjs = require('vtk.js');
  } catch (_error) {}
  return vtkjsRenderer.vtkjs !== undefined;
};

/**
 * If the vtks renderer is not supported, supply the name of a renderer that
 * should be used instead.  This asks for the null renderer.
 *
 * @returns {null} `null` for the null renderer.
 */
vtkjsRenderer.fallback = function () {
  return null;
};

vtkjsRenderer.supported();  // cache reference to vtkjs if it is available

module.exports = vtkjsRenderer;
