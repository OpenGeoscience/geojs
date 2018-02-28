var inherit = require('../inherit');
var registerRenderer = require('../registry').registerRenderer;
var renderer = require('../renderer');
var vtk = require('vtk.js');
var vtkFullScreenRenderWindow = vtk.Rendering.Misc.vtkFullScreenRenderWindow;

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vtkjsRenderer
 *
 * @class geo.gl.vtkjsRenderer
 * @extends geo.renderer
 * @param canvas
 * @returns {geo.gl.vtkjsRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
var vtkjsRenderer = function (arg) {
  'use strict';

  if (!(this instanceof vtkjsRenderer)) {
    return new vtkjsRenderer(arg);
  }
  arg = arg || {};
  renderer.call(this, arg);

  var $ = require('jquery');
  var vgl = require('vgl');
  var mat4 = require('gl-mat4');
  var util = require('../util');
  var geo_event = require('../event');

  var m_this = this,
      m_contextRenderer = null,
      m_viewer = null,
      m_width = 0,
      m_height = 0,
      m_lastZoom,
      m_updateCamera = false,
      s_init = this._init,
      s_exit = this._exit;

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({ background: [0.1, 0.5, 0.5] });
  const vtkjsren = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

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
    return vtkjsren;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.api = function () {
    return 'vtkjs';
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
    // var renderWindow = m_viewer.renderWindow();

    // m_width = w;
    // m_height = h;
    // m_this.canvas().attr('width', w);
    // m_this.canvas().attr('height', h);
    // renderWindow.positionAndResize(x, y, w, h);

    // m_updateCamera = true;
    m_this._render();

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render.  This actually schedules rendering for the next animation frame.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function () {
    /* If we are already scheduled to render, don't schedule again.  Rather,
     * mark that we should render after other animation frame requests occur.
     * It would be nice if we could just reschedule the call by removing and
     * readding the animation frame request, but this doesn't work for if the
     * reschedule occurs during another animation frame callback (it then waits
     * until a subsequent frame). */
    // m_this.layer().map().scheduleAnimationFrame(this._renderFrame, true);
    // return m_this;

    // m_this.contextRenderer().resetCamera();
    // renderWindow.render();
    m_this.contextRenderer().resetCamera();
    m_this._updateRendererCamera();
    renderWindow.render();
  };

  /**
   * This clears the render timer and actually renders.
   */
  this._renderFrame = function () {
    m_this._updateRendererCamera();
    renderWindow.render();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    // m_this.canvas().remove();
    // m_viewer.exit();
    // s_exit();
  };

  this._updateRendererCamera = function () {
    var map = m_this.layer().map(),
        camera = map.camera(),
        rotation = map.rotation() || 0,
        view = camera.view,
        proj = camera.projectionMatrix;
    //  if (proj[15]) {
    /* we want positive z to be closer to the camera, but webGL does the
     * converse, so reverse the z coordinates. */
    //    proj = mat4.scale(util.mat4AsArray(), proj, [1, 1, -1]);
    //  }
    /* A similar kluge as in the base camera class worldToDisplay4.  With this,
     * we can show z values from 0 to 1. */
    // proj = mat4.translate(util.mat4AsArray(), proj,
    //                       [0, 0, camera.constructor.bounds.far]);

    console.log(`VTKJS: viewMat: ${m_this.contextRenderer().getActiveCamera().getViewMatrix()}`);
    console.log(`GEOJS: viewMat: ${view}`);
    console.log(`VTKJS: projMat: ${m_this.contextRenderer().getActiveCamera().getProjectionMatrix()}`);
    console.log(`GEOJS: projMat: ${proj}`);
    // m_this.contextRenderer().getActiveCamera().computeViewParametersFromPhysicalMatrix(view);
    m_this.contextRenderer().getActiveCamera().setViewMatrix(view);
    m_this.contextRenderer().getActiveCamera().setProjectionMatrix(proj);
    // camera.view = m_this.contextRenderer().getActiveCamera().getViewMatrix();
    // camera.projectionMatrix = m_this.contextRenderer().getActiveCamera().getProjectionMatrix();
  };

  // Connect to pan event.  This is sufficient, as all zooms and rotations also
  // produce a pan
  m_this.layer().geoOn(geo_event.pan, function (evt) {
    // DO NOTHING
  });

  // Connect to parallelprojection event
  m_this.layer().geoOn(geo_event.parallelprojection, function (evt) {
    // DO NOTHING
  });

  return this;
};

inherit(vtkjsRenderer, renderer);

registerRenderer('vtkjs', vtkjsRenderer);

module.exports = vtkjsRenderer;
