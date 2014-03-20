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
      m_interactorStyle = ggl.mapInteractorStyle(),
      s_init = this._init;

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
          cam = ren.camera(), fdp = ren.focusDisplayPoint(),
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
  this.api = function() {
    return 'webgl';
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    var canvas;

    s_init.call(this, arg);

    if (!this.canvas()) {
      canvas = $(document.createElement('canvas'));
      canvas.attr('class', '.webgl-canvas');
      this.canvas(canvas);
      this.layer().node().append(canvas);
    }
    m_viewer = vgl.viewer(this.canvas().get(0));
    m_viewer.setInteractorStyle(m_interactorStyle);
    m_viewer.init();

    m_viewer.renderWindow().resize(this.canvas().width(),
                                   this.canvas().height());
    m_interactorStyle.map(this.layer().map());

    this.canvas().on('mousemove', function(event) {
      m_viewer.handleMouseMove(event);
    });

    this.canvas().on('mouseup', function(event) {
      m_viewer.handleMouseUp(event);
    });

    this.canvas().on('mousedown', function(event) {
      m_viewer.handleMouseDown(event);
    });

    this.canvas().on('keypress', function(event) {
      m_viewer.handleKeyPress(event);
    });

    this.canvas().on('contextmenu', function(event) {
      m_viewer.handleContextMenu(event);
    });

    /// VGL uses jquery trigger on methods
    $(m_interactorStyle).on(geo.event.pan, function(event) {
      m_this.trigger(geo.event.pan, event);
    });
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
    this._render();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function() {
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