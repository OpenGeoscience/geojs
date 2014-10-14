//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class feature
 *
 * @class
 * @returns {geo.feature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.feature = function (arg) {
  "use strict";
  if (!(this instanceof geo.feature)) {
    return new geo.feature(arg);
  }
  geo.sceneObject.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  arg = arg || {};

  var m_this = this,
      m_style = {},
      m_layer = arg.layer === undefined ? null : arg.layer,
      m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs,
      m_visible = arg.visible === undefined ? true : arg.visible,
      m_bin = arg.bin === undefined ? 0 : arg.bin,
      m_renderer = arg.renderer === undefined ? null : arg.renderer,
      m_data = [],
      m_dataTime = geo.timestamp(),
      m_buildTime = geo.timestamp(),
      m_updateTime = geo.timestamp(),
      m_mouseover = null,
      m_mouseout = null,
      m_mousemove = null,
      m_mouseclick = null,
      m_brushend = null,
      m_brush = null,
      m_selectedFeatures = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private method to bind or unbind mouse handlers on the map element.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._updateMouseHandlers = function () {
    m_this.geoOff(geo.event.mousemove, m_this._handleMousemove);
    m_this.geoOff(geo.event.mouseclick, m_this._handleMouseclick);
    m_this.geoOff(geo.event.brushstart, m_this._handleBrush);
    m_this.geoOff(geo.event.brushend, m_this._handleBrush);
    m_this.geoOff(geo.event.brush, m_this._handleBrush);
    if (m_mouseout || m_mouseover || m_mousemove) {
      m_this.geoOn(geo.event.mousemove, m_this._handleMousemove);
    }
    if (m_mouseclick) {
      m_this.geoOn(geo.event.mouseclick, m_this._handleMouseclick);
    }
    if (m_brushend) {
      m_this.geoOn(geo.event.brushend, m_this._handleBrushend);
    }
    if (m_brush) {
      m_this.geoOn(geo.event.brush, m_this._handleBrush);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Public methods for binding mouse events.  These accept functions with
   * the following call signatures:
   *
   * function handler(data, index, mouse) {
   *   // data - the data object of the feature
   *   // index - the index inside the data array of the featue
   *   // mouse - mouse information object (see src/core/mapInteractor.js)
   *   // this - the current feature object
   * }
   *
   * Call with argument null to unbind.
   */
  ////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set the mouseover handler.  Fires once when the mouse enters the
   * feature.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mouseover = function (func) {
    if (func === undefined) {
      return m_mouseover;
    }
    m_mouseover = func;
    m_this._updateMouseHandlers();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set the mouseout handler.  Fires once when the mouse exits the
   * feature.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mouseout = function (func) {
    if (func === undefined) {
      return m_mouseout;
    }
    m_mouseout = func;
    m_this._updateMouseHandlers();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set the mousemove handler.  Fires continuously as the moves moves
   * inside the feature.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mousemove = function (func) {
    if (func === undefined) {
      return m_mousemove;
    }
    m_mousemove = func;
    m_this._updateMouseHandlers();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set the click handler.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.click = function (func) {
    if (func === undefined) {
      return m_mouseclick;
    }
    m_mouseclick = func;
    m_this._updateMouseHandlers();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set the brush handler.  Fires continuously.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.brush = function (func) {
    if (func === undefined) {
      return m_brush;
    }
    m_brush = func;
    m_this._updateMouseHandlers();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set the brushend handler.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.brushend = function (func) {
    if (func === undefined) {
      return m_brushend;
    }
    m_brushend = func;
    m_this._updateMouseHandlers();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Search for features containing the given point.
   *
   * Returns an object:
   * {
   *   data: [...] // an array of data objects for matching features
   *   index: [...] // an array of indices of the matching features
   * }
   *
   * @argument {Object} coordinate
   * @returns {Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private mousemove handler
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMousemove = function () {
    var mouse = m_this.layer().map().interactor().mouse(),
        data = m_this.data(),
        over = m_this.pointSearch(mouse.geo),
        newFeatures = [], oldFeatures = [];

    // There are probably faster ways of doing this:
    newFeatures = over.index.filter(function (i) {
      return m_selectedFeatures.indexOf(i) < 0;
    });
    oldFeatures = m_selectedFeatures.filter(function (i) {
      return over.index.indexOf(i) < 0;
    });

    // Fire events for mouse in first.
    if (m_mouseover) {
      newFeatures.forEach(function (i) {
        m_mouseover.call(
          m_this,
          data[i],
          i,
          mouse
        );
      });
    }

    // Fire events for mouse out next
    if (m_mouseout) {
      oldFeatures.forEach(function (i) {
        m_mouseout.call(
          m_this,
          data[i],
          i,
          mouse
        );
      });
    }

    // Fire events for mouse move last
    if (m_mousemove) {
      over.index.forEach(function (i) {
        m_mousemove.call(
          m_this,
          data[i],
          i,
          mouse
        );
      });
    }

    // Replace the selected features array
    m_selectedFeatures = over.index;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private mouseclick handler
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMouseclick = function () {
    var mouse = m_this.layer().map().interactor().mouse(),
        data = m_this.data(),
        over = m_this.pointSearch(mouse.geo);

    over.index.forEach(function (i) {
      m_mouseclick.call(
        m_this,
        data[i],
        i,
        mouse
      );
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private brush handler.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleBrush = function (brush) {
    var idx = m_this.boxSearch(brush.gcs.lowerLeft, brush.gcs.upperRight),
        data = m_this.data();

    idx.forEach(function (i) {
      m_brush.call(
        m_this,
        data[i],
        i,
        brush
      );
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private brushend handler.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleBrushend = function (brush) {
    var idx = m_this.boxSearch(brush.gcs.lowerLeft, brush.gcs.upperRight),
        data = m_this.data();

    idx.forEach(function (i) {
      m_brushend.call(
        m_this,
        data[i],
        i,
        brush
      );
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set style used by the feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.style = function (arg1, arg2) {
    if (arg1 === undefined) {
      return m_style;
    }  else if (arg2 === undefined) {
      m_style = $.extend({}, m_style, arg1);
      m_this.modified();
      return m_this;
    } else {
      m_style[arg1] = arg2;
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get layer referenced by the feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.layer = function () {
    return m_layer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get renderer used by the feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.renderer = function () {
    return m_renderer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get list of drawables or nodes that are context/api specific.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.drawables = function () {
    return m_this._drawables();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set projection of the feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcs = function (val) {
    if (val === undefined) {
      return m_gcs;
    } else {
      m_gcs = val;
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set visibility of the feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.visible = function (val) {
    if (val === undefined) {
      return m_visible;
    } else {
      m_visible = val;
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set bin of the feature
   *
   * Bin number is typically used for sorting the order of rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bin = function (val) {
    if (val === undefined) {
      return m_bin;
    } else {
      m_bin = val;
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set timestamp of data change
   */
  ////////////////////////////////////////////////////////////////////////////
  this.dataTime = function (val) {
    if (val === undefined) {
      return m_dataTime;
    } else {
      m_dataTime = val;
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set timestamp of last time build happened
   */
  ////////////////////////////////////////////////////////////////////////////
  this.buildTime = function (val) {
    if (val === undefined) {
      return m_buildTime;
    } else {
      m_buildTime = val;
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set timestamp of last time update happened
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateTime = function (val) {
    if (val === undefined) {
      return m_updateTime;
    } else {
      m_updateTime = val;
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set data
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function (data) {
    if (data === undefined) {
      return m_data;
    } else {
      m_data = data;
      m_this.dataTime().modified();
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   *
   * Derived class should implement this
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    if (!m_layer) {
      throw "Feature requires a valid layer";
    }
    m_style = $.extend({},
                {"opacity": 1.0}, arg.style === undefined ? {} :
                arg.style);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * Derived class should implement this
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get context specific drawables
   *
   * Derived class should implement this
   */
  ////////////////////////////////////////////////////////////////////////////
  this._drawables = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * Derived class should implement this
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   *
   * Derived class should implement this
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_mouseover = null;
    m_mouseout = null;
    m_mousemove = null;
    m_mouseclick = null;
    m_this._updateMouseHandlers();
  };

  this._init(arg);
  return this;
};

inherit(geo.feature, geo.sceneObject);
