//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Layer options object specification
 *
 * @class geo.layerOptions
 */
//////////////////////////////////////////////////////////////////////////////
geo.layerOptions = function () {
  "use strict";

  if (!(this instanceof geo.layerOptions)) {
    return new geo.layerOptions();
  }

  this.opacity = 0.5;
  this.showAttribution = true;
  this.visible = true;
  this.binNumber = vgl.material.RenderBin.Default;

  return this;
};

geo.newLayerId = (function () {
    "use strict";
    var currentId = 1;
    return function () {
      var id = currentId;
      currentId += 1;
      return id;
    };
  }()
);

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
geo.layer = function (arg) {
  "use strict";

  if (!(this instanceof geo.layer)) {
    return new geo.layer(arg);
  }
  arg = arg || {};
  geo.sceneObject.call(this, arg);

  //////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  //////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_style = arg.style === undefined ? {"opacity" : 0.5,
                                           "color" : [0.8, 0.8, 0.8],
                                           "visible" : true,
                                           "bin" : 100} : arg.style,
      m_id = arg.id === undefined ? geo.newLayerId() : arg.id,
      m_name = "",
      m_gcs = "EPSG:4326",
      m_timeRange = null,
      m_source = arg.source || null,
      m_map = arg.map === undefined ? null : arg.map,
      m_isReference = false,
      m_x = 0,
      m_y = 0,
      m_width = 0,
      m_height = 0,
      m_node = null,
      m_canvas = null,
      m_renderer = null,
      m_initialized = false,
      m_rendererName = arg.renderer  === undefined ? "vglRenderer" : arg.renderer,
      m_dataTime = geo.timestamp(),
      m_updateTime = geo.timestamp(),
      m_drawTime = geo.timestamp(),
      m_sticky = arg.sticky === undefined ? true : arg.sticky;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get whether or not the layer is sticky (navigates with the map).
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sticky = function () {
    return m_sticky;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set root node of the layer
   *
   * @returns {div}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.node = function () {
    return m_node;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set id of the layer
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.id = function (val) {
    if (val === undefined) {
      return m_id;
    }
    m_id = geo.newLayerId();
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set name of the layer
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.name = function (val) {
    if (val === undefined) {
      return m_name;
    }
    m_name = val;
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set opacity of the layer
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.opacity = function (val) {
    if (val === undefined) {
      return m_style.opacity;
    }
    m_style.opacity = val;
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set visibility of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.visible = function (val) {
    if (val === undefined) {
      return m_style.visible;
    }
    m_style.visible = val;
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set bin of the layer
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bin = function (val) {
    if (val === undefined) {
      return m_style.bin;
    }
    m_style.bin = val;
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set projection of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcs = function (val) {
    if (val === undefined) {
      return m_gcs;
    }
    m_gcs = val;
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform layer to the reference layer gcs
   */
  ////////////////////////////////////////////////////////////////////////////
  this.transform = function (val) {
    geo.transform.transformLayer(val, m_this, m_map.baseLayer());
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set time range of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.timeRange = function (val) {
    if (val === undefined) {
      return m_timeRange;
    }
    m_timeRange = val;
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set source of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.source = function (val) {
    if (val === undefined) {
      return m_source;
    }
    m_source = val;
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set map of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function (val) {
    if (val === undefined) {
      return m_map;
    }
    m_map = val;
    m_map.node().append(m_node);
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get renderer for the layer if any
   */
  ////////////////////////////////////////////////////////////////////////////
  this.renderer = function () {
    return m_renderer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get canvas of the layer
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.canvas = function () {
    return m_canvas;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get viewport of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewport = function () {
    return [m_x, m_y, m_width, m_height];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return last time data got changed
   */
  ////////////////////////////////////////////////////////////////////////////
  this.dataTime = function () {
    return m_dataTime;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the modified time for the last update that did something
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateTime = function () {
    return m_updateTime;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the modified time for the last draw call that did something
   */
  ////////////////////////////////////////////////////////////////////////////
  this.drawTime = function () {
    return m_drawTime;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Run query and return results for it
   */
  ////////////////////////////////////////////////////////////////////////////
  this.query = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set layer as the reference layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.referenceLayer = function (val) {
    if (val !== undefined) {
      m_isReference = val;
      m_this.modified();
      return m_this;
    }
    return m_isReference;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set if the layer has been initialized
   */
  ////////////////////////////////////////////////////////////////////////////
  this.initialized = function (val) {
    if (val !== undefined) {
      m_initialized = val;
      return m_this;
    }
    return m_initialized;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point or array of points in GCS space to
   * local space of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.toLocal = function (input) {
    return input;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point or array of points in local space to
   * latitude-longitude space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.fromLocal = function (input) {
    return input;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Init layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    if (m_initialized) {
      return m_this;
    }

    // Create top level div for the layer
    m_node = $(document.createElement("div"));
    m_node.attr("id", m_name);
    // TODO: need to position according to offsets from the map element
    //       and maybe respond to events in case the map element moves
    //       around the page.
    m_node.css("position", "absolute");

    if (m_map) {
      m_map.node().append(m_node);

    }

    // Share context if have valid one
    if (m_canvas) {
      m_renderer = geo.createRenderer(m_rendererName, m_this, m_canvas);
    } else {
      m_renderer = geo.createRenderer(m_rendererName, m_this);
      m_canvas = m_renderer.canvas();
    }

    m_initialized = true;

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clean up resouces
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Respond to resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function (x, y, w, h) {
    m_x = x;
    m_y = y;
    m_width = w;
    m_height = h;
    m_node.width(w);
    m_node.height(h);

    m_this.modified();
    m_this.geoTrigger(geo.event.resize,
      {x: x, y: y, width: m_width, height: m_height});

    return m_this;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the width of the layer in pixels
   */
  ////////////////////////////////////////////////////////////////////////////
  this.width = function () {
    return m_width;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the height of the layer in pixels
   */
  ////////////////////////////////////////////////////////////////////////////
  this.height = function () {
    return m_height;
  };

  return this;
};

inherit(geo.layer, geo.sceneObject);
