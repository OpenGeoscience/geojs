//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, document, inherit, $, HTMLCanvasElement, Image*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all layer types geo.layer represents any object that be
 * rendered on top of the map base. This could include image, points, line, and
 * polygons.
 *
 * @class geo.layer
 * @returns {geo.layer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.layer = function(arg) {
  "use strict";

  if (!(this instanceof geo.layer)) {
    return new geo.layer(arg);
  }
  arg = arg || {};
  geo.object.call(this, arg);

  //////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  //////////////////////////////////////////////////////////////////////////////
  var m_that = this,
      m_style = arg.style === undefined ? {"opacity" : 0.5,
                                           "color" : [0.8, 0.8, 0.8],
                                           "visible" : true,
                                           "bin" : 100} : arg.style;
      m_id = "",
      m_name = "",
      m_gcs = 'EPSG:4326',
      m_timeRange = [],
      m_source = arg.source || null,
      m_container = arg.container,
      m_isReference = false,
      m_xOffset = 0,
      m_yOffset = 0,
      m_width = 0,
      m_height = 0,
      m_node = null,
      m_context = null,
      m_renderer = null,
      m_rendererType = arg.renderer  === undefined ?  'webgl' : arg.renderer,
      m_updateTime = vgl.timestamp(),
      m_drawTime = vgl.timestamp();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set root node of the layer
   *
   * @returns {div}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.node = function() {
    return m_node;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set id of the layer
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.id = function(val) {
    if (val === undefined ) {
      return m_id;
    } else {
      m_id = id;
      this.modified();
      return this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set name of the layer
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.name = function(val) {
    if (val === undefined ) {
      return m_name;
    } else {
      m_name = val;
      this.modified();
      return this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set opacity of the layer
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.opacity = function(val) {
    if (val === undefined ) {
      return m_style.opacity;
    } else {
      m_style.opacity = val;
      this.modified();
      return this;
    }
  };s

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set visibility of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.visible = function(val) {
    if (val === undefined ) {
      return m_style.visible;
    } else {
      m_style.visible = val;
      this.modified();
      return this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set bin of the layer
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bin = function(val) {
    if (val === undefined ) {
      return m_style.bin;
    } else {
      m_style.bin = val;
      this.modified();
      return this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set projection of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcs = function(val) {
    if (val === undefined ) {
      return m_gcs;
    } else {
      m_gcs = val;
      this.modified();
      return this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set time range of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.timeRange = function(val) {
    if (val === undefined ) {
      return timeRange;
    } else {
      timeRange = val.slice(0);
      this.modified();
      return this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set source of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.source = function(val) {
    if (val === undefined ) {
      return m_source;
    } else {
      m_source = val;
      this.modified();
      return this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get renderer type for the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.rendererType = function() {
    return m_rendererType;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get shared context (gl, canvas2D) of the layer
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.context = function() {
    return m_context;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get viewport of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewport = function() {
    return [m_xOffset, m_yOffset, m_width, m_height];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the modified time for the last update that did something
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateTime = function() {
    return m_updateTime;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the modified time for the last draw call that did something
   */
  ////////////////////////////////////////////////////////////////////////////
  this.drawTime = function() {
    return m_drawTime;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Run given query and return result afterwards
   */
  ////////////////////////////////////////////////////////////////////////////
  this.query = function(arg) {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set layer as the reference layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.isReference = function(val) {
    if(val === undefined) {
      m_isReference = val;
      this.modified();
      return this;
    }
    return m_isReference;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function(x, y, w, h) {
    m_xOffset = x;
    m_yOffset = y;
    m_width = w;
    m_height = h;

    $(this).trigger({
      type: geo.event.resize,
      target: m_this,
      x_offset: m_xOffset,
      y_offset: m_yOffset,
      width: width,
      height: height
    });

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from world to GCS coordinate space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToGcs = function(points) {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from world to display space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function(points) {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from display to world space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function(points) {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert array of points from display to GCS space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToGcs = function(points) {
    throw "Should be implemented by derivied classes";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Init layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function() {
    if (m_container === undefined) {
      throw "Layer requires valid container";
    }

    // Create top level div for the layer hers
    m_node = $(document.createElemenet('div'));
    m_node.attr('id', m_name);
    m_container.node().append(m_node);

    // Share context if have valid one
    if (m_context) {
      m_renderer = geo.createRenderer(m_rendererType, m_node, m_context);
    } else {
      m_renderer = geo.createRenderer(m_rendererType, m_node);
      m_context = m_renderer.context();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clean up resouces
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function(request) {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function(request) {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Prepare layer for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this._draw = function(request) {
  };

  this._init();

  return this;
};

inherit(geo.layer, vgl.object);
