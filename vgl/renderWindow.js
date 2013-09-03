//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

// TODO Current we support only one context
var gl = 0;

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class renderWindow
 *
 * @class
 * @returns {vglModule.renderWindow}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.renderWindow = function(canvas) {
  'use strict';

  if (!(this instanceof vglModule.renderWindow)) {
    return new vglModule.renderWindow(canvas);
  }
  vglModule.object.call(this);

  /** @private */
  var m_x = 0,
      m_y = 0,
      m_width = 400,
      m_height = 400,
      m_canvas = canvas,
      m_activeRender = null,
      m_renderers = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get size of the render window
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.windowSize = function() {
    return [ m_width, m_height ];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set size of the render window
   *
   * @param width
   * @param height
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setWindowSize = function(width, height) {

    if (width !== width || height !== height) {
      m_width = width;
      m_height = height;

      this.modified();

      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get window position (top left coordinates)
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.windowPosition = function() {
    return [ m_x, m_y ];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set window position (top left coordinates)
   *
   * @param x
   * @param y
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setWindowPosition = function(x, y) {
    if ((m_x != x) || (m_y != y)) {
      m_x = x;
      m_y = y;
      this.modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get active renderer of the the render window
   *
   * @returns vglModule.renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.activeRenderer = function() {
    return m_activeRender;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add renderer to the render window
   *
   * @param ren
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addRenderer = function(ren) {
    if (this.hasRenderer(ren) === false) {
      m_renderers.push(ren);
      if (m_activeRender === null) {
        m_activeRender = ren;
      }
      this.modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove renderer from the render window
   *
   * @param ren
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeRenderer = function(ren) {
    var index = m_renderers.indexOf(ren);
    if (index !== -1) {
      if (m_activeRender === ren) {
        m_activeRender = null;
      }
      m_renderers = m_renderers.splice(index, 1);
      this.modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return a renderer at a given index
   *
   * @param index
   * @returns {vglModule.renderer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getRenderer = function(index) {
    if (index < m_renderers.length) {
      return m_renderers[index];
    }

    console.log("[WARNING] Out of index array");
    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if the renderer exists
   *
   * @param ren
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hasRenderer = function(ren) {
    var i;
    for (i = 0; i < m_renderers.length; ++i) {
      if (ren === m_renderers[i]) {
        return true;
      }
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize window
   *
   * @param width
   * @param height
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function(width, height) {
    this.positionAndResize(m_x, m_y, width, height);
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize and reposition the window
   *
   * @param x
   * @param y
   * @param width
   * @param height
   */
  ////////////////////////////////////////////////////////////////////////////
  this.positionAndResize = function(x, y, width, height) {
    m_x = x;
    m_y = y;
    m_width = width;
    m_height = height;
    var i;
    for (i = 0; i < m_renderers.length; ++i) {
      m_renderers[i].positionAndResize(m_x, m_y, m_width, m_height);
    }
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create the window
   *
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createWindow = function() {
    // Initialize the global variable gl to null.
    gl = null;

    try {
      // Try to grab the standard context. If it fails, fallback to
      // experimental.
      gl = m_canvas.getContext("webgl")
           || m_canvas.getContext("experimental-webgl");

      // Set width and height of renderers if not set already
      var i;
      for (i = 0; i < m_renderers.length; ++i) {
        if ((m_renderers[i].width() > m_width) || m_renderers[i].width() === 0
            || (m_renderers[i].height() > m_height)
            || m_renderers[i].height() === 0) {
          m_renderers[i].resize(m_x, m_y, m_width, m_height);
        }
      }

      return true;
    }
    catch (e) {
    }

    // If we don't have a GL context, give up now
    if (!gl) {
      console("[ERROR] Unable to initialize WebGL. Your browser may not support it.");
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete this window and release any graphics resources
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteWindow = function() {
    // TODO
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render the scene
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function() {
    var i;
    for (i = 0; i < m_renderers.length; ++i) {
      m_renderers[i].render();
    }
  };

  return this;
};

inherit(vglModule.renderWindow, vglModule.object);
