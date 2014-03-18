//////////////////////////////////////////////////////////////////////////////
/**
 * @module ggl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global window, ggl, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class simpleRenderer
 *
 * @param canvas
 * @returns {ggl.simpleRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.simpleRenderer = function(arg) {
  'use strict';

  if (!(this instanceof ggl.simpleRenderer)) {
    return new ggl.simpleRenderer(arg);
  }
  ggl.renderer.call(this, arg);

  var m_this = this,
      m_viewer = null,
      s_init = this._init;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    s_init.call(this, arg);

    if (!this.canvas()) {
      var canvas = $(document.createElement('canvas'));
      canvas.attr('class', '.webgl-canvas');
      this._canvas(canvas);
      this.layer().node().append(canvas);
    }
    m_viewer = vgl.viewer(this.canvas().get(0));
    m_viewer.init();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from display to world space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function(points) {
    if (points instanceof Array) {
      var xyzFormat = points.length % 3 === 0 ? true : false,
          node = this.canvas(),
          delta = xyzFormat ? 3 : 2, ren = this.contextRenderer(),
          cam = ren.camera(), fp = cam.focalPoint(),
          fwp = vec4.fromValues(fp[0], fp[1], 0.0, 1.0),
          fdp = ren.worldToDisplay(fwp, cam.viewMatrix(),
                                   cam.projectionMatrix(),
                                   node.width(), node.height()),
          i, wps = [];
      for (i = 0; i < points.length; i =+ delta) {
        wps.push(ren.displayToWorld(vec4.fromValues(
          points[i],
          points[i + 1],
          fdp[2],
          1.0), cam.viewMatrix(), cam.projectionMatrix(),
          node.width(), node.height()));
      }

      return wps;
    }

    throw "Display to world conversion requires array of 2D/3D points";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get context specific renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.contextRenderer = function() {
    return m_viewer.renderWindow().activeRenderer();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._api = function() {
    return 'webgl';
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function(x, y, w, h) {
    this.canvas().attr('width', w);
    this.canvas().attr('height', h);
    m_viewer.renderWindow().positionAndResize(x, y, w, h);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function() {
    m_viewer.renderWindow().activeRenderer().resetCamera();
    m_viewer.render();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function() {
  };

  this._init(arg);
  return this;
};

inherit(ggl.simpleRenderer, ggl.renderer);

geo.registerRenderer('simpleRenderer', ggl.simpleRenderer);