//////////////////////////////////////////////////////////////////////////////
/**
 * @module ggl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global window, ggl, ogs, vec4, inherit, $, geo*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vglRenderer
 *
 * @param canvas
 * @returns {ggl.vglRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.vglRenderer = function(arg) {
  'use strict';

  if (!(this instanceof ggl.vglRenderer)) {
    return new ggl.vglRenderer(arg);
  }
  ggl.renderer.call(this, arg);

  var m_this = this,
      m_viewer = null,
      m_interactorStyle = ggl.mapInteractorStyle(),
      s_init = this._init;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from display to world space
   *
   * @param points {array} Array of 2D or 3D points. In case of 3D points
   *        the third coordinate will be ignored.
   *
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
   * Convert array of points from world space to display space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function(points) {
    if (points instanceof Array) {

      var xyzFormat = points.length % 3 === 0 ? true : false,
          node = this.canvas(),
          delta = xyzFormat ? 3 : 2, ren = this.contextRenderer(),
          cam = ren.camera(), fdp = ren.focusDisplayPoint(),
          i, wps = [];

      if (xyzFormat) {
        for (i = 0; i < points.length; i =+ delta) {
          wps.push(ren.worldToDisplay(vec4.fromValues(
            points[i],
            points[i + 1],
            points[i + 2],
            1.0), cam.viewMatrix(), cam.projectionMatrix(),
            node.width(), node.height()));
        }
      } else {
        for (i = 0; i < points.length; i =+ delta) {
          wps.push(ren.worldToDisplay(vec4.fromValues(
            points[i],
            points[i + 1],
            0.0,
            1.0), cam.viewMatrix(), cam.projectionMatrix(),
            node.width(), node.height()));
        }
      }

      return wps;
    }

    throw "World to display conversion requires array of 2D/3D points";
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
    return 'vgl';
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

    /// VGL uses jquery trigger on methods
    $(m_interactorStyle).on(geo.event.pan, function(event, arg) {
      m_this.trigger(geo.event.pan, arg);
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect events to the map layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._connectMapEvents = function() {
    var map = $(m_this.layer().map().node());
    map.on('mousemove', function(event) {
      m_viewer.handleMouseMove(event);
    });

    map.on('mouseup', function(event) {
      m_viewer.handleMouseUp(event);
    });

    map.on('mousedown', function(event) {
      m_viewer.handleMouseDown(event);
    });

    map.on('keypress', function(event) {
      m_viewer.handleKeyPress(event);
    });

    map.on('contextmenu', function(event) {
      m_viewer.handleContextMenu(event);
    });

  };
  this.on(geo.event.layerAdd, function (event) {
    if (event.layer === m_this.layer()) {
      m_this._connectMapEvents();
    }
  });

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

inherit(ggl.vglRenderer, ggl.renderer);

geo.registerRenderer('vglRenderer', ggl.vglRenderer);
