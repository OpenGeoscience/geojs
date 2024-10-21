var inherit = require('../inherit');
var registerRenderer = require('../registry').registerRenderer;
var renderer = require('../renderer');

/**
 * Create a new instance of class vtkjsRenderer.
 *
 * @class
 * @alias geo.vtkjs.vtkjsRenderer
 * @extends geo.renderer
 * @param {object} arg Options for the renderer.
 * @param {geo.layer} [arg.layer] Layer associated with the renderer.
 * @param {HTMLElement} [arg.canvas] Canvas element associated with the
 *   renderer.
 * @returns {geo.vtkjs.vtkjsRenderer}
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
      s_init = this._init;

  var vtkRenderer = vtkGenericRenderWindow.newInstance({
    background: [0, 0, 0, 0]});
  vtkRenderer.setContainer(m_this.layer().node().get(0));
  // TODO: Is there a way to start with no interactor rather than unbinding it?
  vtkRenderer.getInteractor().unbindEvents();
  vtkRenderer.resize();
  var vtkjsren = vtkRenderer.getRenderer();
  var renderWindow = vtkRenderer.getRenderWindow();

  /**
   * Get context specific renderer.
   *
   * @returns {object} The vtkjs context renderer.
   */
  this.contextRenderer = function () {
    return vtkjsren;
  };

  /**
   * Get API used by the renderer.
   *
   * @returns {string} `vtkjs`.
   */
  this.api = function () {
    return vtkjsRenderer.apiname;
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
   * Handle resize event.
   *
   * @param {number} x The left coordinate.
   * @param {number} y The top coordinate.
   * @param {number} w The width in pixels.
   * @param {number} h The height in pixels.
   * @returns {this}
   */
  this._resize = function (x, y, w, h) {
    m_this._setWidthHeight(w, h);
    vtkRenderer.resize();
    m_this._render();
    return m_this;
  };

  /**
   * Render.  This actually schedules rendering for the next animation frame.
   *
   * @returns {this}
   */
  this._render = function () {
    /* If we are already scheduled to render, don't schedule again.  Rather,
     * mark that we should render after other animation frame requests occur.
     * It would be nice if we could just reschedule the call by removing and
     * re-adding the animation frame request, but this doesn't work for if the
     * reschedule occurs during another animation frame callback (it then waits
     * until a subsequent frame). */
    m_this.layer().map().scheduleAnimationFrame(m_this._renderFrame, true);
    return m_this;
  };

  /**
   * This actually renders.
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
   * Exit.
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

  /* Connect to pan event.  This is sufficient, as all zooms and rotations also
   * produce a pan */
  m_this.layer().geoOn(geo_event.pan, function (evt) {
    // TODO: We may only need to do this if the zoom level has changed.
    m_this._render();
  });

  /* Connect to parallelprojection event. */
  m_this.layer().geoOn(geo_event.parallelprojection, function (evt) {
    // DO NOTHING
  });

  return this;
};
vtkjsRenderer.apiname = 'vtkjs';

inherit(vtkjsRenderer, renderer);

registerRenderer('vtkjs', vtkjsRenderer);

/**
 * Report if the vtkjs renderer is supported.  This is just a check if vtkjs is
 * available.
 *
 * @returns {boolean} true if available.
 */
vtkjsRenderer.supported = function () {
  delete vtkjsRenderer.vtkjs;
  // webpack expects optional dependencies to be wrapped in a try-catch
  try {
    vtkjsRenderer.vtkjs = require('vtk.js');
  } catch (_error) {}
  if ((!vtkjsRenderer.vtkjs || !vtkjsRenderer.vtkjs.Rendering) && window.vtk && window.vtk.Rendering) {
    vtkjsRenderer.vtkjs = window.vtk;
  }
  if (!vtkjsRenderer.vtkjs || !vtkjsRenderer.vtkjs.Rendering) {
    vtkjsRenderer.vtkjs = undefined;
  }
  return vtkjsRenderer.vtkjs !== undefined;
};

/**
 * If the vtkjs renderer is not supported, supply the name of a renderer that
 * should be used instead.  This asks for the null renderer.
 *
 * @returns {null} `null` for the null renderer.
 */
vtkjsRenderer.fallback = function () {
  return null;
};

vtkjsRenderer.supported();  // cache reference to vtkjs if it is available

module.exports = vtkjsRenderer;
