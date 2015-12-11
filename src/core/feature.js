//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class feature
 *
 * @class
 * @extends geo.sceneObject
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
      s_exit = this._exit,
      m_selectionAPI = arg.selectionAPI === undefined ? false : arg.selectionAPI,
      m_style = {},
      m_layer = arg.layer === undefined ? null : arg.layer,
      m_gcs = arg.gcs,
      m_visible = arg.visible === undefined ? true : arg.visible,
      m_bin = arg.bin === undefined ? 0 : arg.bin,
      m_renderer = arg.renderer === undefined ? null : arg.renderer,
      m_dataTime = geo.timestamp(),
      m_buildTime = geo.timestamp(),
      m_updateTime = geo.timestamp(),
      m_selectedFeatures = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private method to bind mouse handlers on the map element.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._bindMouseHandlers = function () {

    // Don't bind handlers for improved performance on features that don't
    // require it.
    if (!m_selectionAPI) {
      return;
    }

    // First unbind to be sure that the handlers aren't bound twice.
    m_this._unbindMouseHandlers();

    m_this.geoOn(geo.event.mousemove, m_this._handleMousemove);
    m_this.geoOn(geo.event.mouseclick, m_this._handleMouseclick);
    m_this.geoOn(geo.event.brushend, m_this._handleBrushend);
    m_this.geoOn(geo.event.brush, m_this._handleBrush);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private method to unbind mouse handlers on the map element.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._unbindMouseHandlers = function () {
    m_this.geoOff(geo.event.mousemove, m_this._handleMousemove);
    m_this.geoOff(geo.event.mouseclick, m_this._handleMouseclick);
    m_this.geoOff(geo.event.brushend, m_this._handleBrushend);
    m_this.geoOff(geo.event.brush, m_this._handleBrush);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * For binding mouse events, use functions with
   * the following call signatures:
   *
   * function handler(arg) {
   *   // arg.data - the data object of the feature
   *   // arg.index - the index inside the data array of the featue
   *   // arg.mouse - mouse information object (see src/core/mapInteractor.js)
   * }
   *
   * i.e.
   *
   * feature.geoOn(geo.event.feature.mousemove, function (arg) {
   *   // do something with the feature marker.
   * });
   */
  ////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Search for features containing the given point.
   *
   * Returns an object: ::
   *
   *   {
   *     data: [...] // an array of data objects for matching features
   *     index: [...] // an array of indices of the matching features
   *   }
   *
   * @argument {Object} coordinate
   * @returns {Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pointSearch = function () {
    // base class method does nothing
    return {
      index: [],
      found: []
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private mousemove handler
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleMousemove = function () {
    var mouse = m_this.layer().map().interactor().mouse(),
        data = m_this.data(),
        over = m_this.pointSearch(mouse.geo),
        newFeatures = [], oldFeatures = [], lastTop = -1, top = -1;

    // Get the index of the element that was previously on top
    if (m_selectedFeatures.length) {
      lastTop = m_selectedFeatures[m_selectedFeatures.length - 1];
    }

    // There are probably faster ways of doing this:
    newFeatures = over.index.filter(function (i) {
      return m_selectedFeatures.indexOf(i) < 0;
    });
    oldFeatures = m_selectedFeatures.filter(function (i) {
      return over.index.indexOf(i) < 0;
    });

    geo.feature.eventID += 1;
    // Fire events for mouse in first.
    newFeatures.forEach(function (i, idx) {
      m_this.geoTrigger(geo.event.feature.mouseover, {
        data: data[i],
        index: i,
        mouse: mouse,
        eventID: geo.feature.eventID,
        top: idx === newFeatures.length - 1
      }, true);
    });

    geo.feature.eventID += 1;
    // Fire events for mouse out next
    oldFeatures.forEach(function (i, idx) {
      m_this.geoTrigger(geo.event.feature.mouseout, {
        data: data[i],
        index: i,
        mouse: mouse,
        eventID: geo.feature.eventID,
        top: idx === oldFeatures.length - 1
      }, true);
    });

    geo.feature.eventID += 1;
    // Fire events for mouse move last
    over.index.forEach(function (i, idx) {
      m_this.geoTrigger(geo.event.feature.mousemove, {
        data: data[i],
        index: i,
        mouse: mouse,
        eventID: geo.feature.eventID,
        top: idx === over.index.length - 1
      }, true);
    });

    // Replace the selected features array
    m_selectedFeatures = over.index;

    // Get the index of the element that is now on top
    if (m_selectedFeatures.length) {
      top = m_selectedFeatures[m_selectedFeatures.length - 1];
    }

    if (lastTop !== top) {
      // The element on top changed so we need to fire mouseon/mouseoff
      if (lastTop !== -1) {
        m_this.geoTrigger(geo.event.feature.mouseoff, {
          data: data[lastTop],
          index: lastTop,
          mouse: mouse
        }, true);
      }

      if (top !== -1) {
        m_this.geoTrigger(geo.event.feature.mouseon, {
          data: data[top],
          index: top,
          mouse: mouse
        }, true);
      }
    }
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

    geo.feature.eventID += 1;
    over.index.forEach(function (i, idx) {
      m_this.geoTrigger(geo.event.feature.mouseclick, {
        data: data[i],
        index: i,
        mouse: mouse,
        eventID: geo.feature.eventID,
        top: idx === over.index.length - 1
      }, true);
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

    geo.feature.eventID += 1;
    idx.forEach(function (i, idx) {
      m_this.geoTrigger(geo.event.feature.brush, {
        data: data[i],
        index: i,
        mouse: brush.mouse,
        brush: brush,
        eventID: geo.feature.eventID,
        top: idx === idx.length - 1
      }, true);
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

    geo.feature.eventID += 1;
    idx.forEach(function (i, idx) {
      m_this.geoTrigger(geo.event.feature.brushend, {
        data: data[i],
        index: i,
        mouse: brush.mouse,
        brush: brush,
        eventID: geo.feature.eventID,
        top: idx === idx.length - 1
      }, true);
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
    } else if (typeof arg1 === "string" && arg2 === undefined) {
      return m_style[arg1];
    } else if (arg2 === undefined) {
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
   * A uniform getter that always returns a function even for constant styles.
   * Maybe extend later to support accessor-like objects.  If undefined input,
   * return all the styles as an object.
   *
   * @param {string|undefined} key
   * @return {function}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.style.get = function (key) {
    var tmp, out;
    if (key === undefined) {
      var all = {}, k;
      for (k in m_style) {
        if (m_style.hasOwnProperty(k)) {
          all[k] = m_this.style.get(k);
        }
      }
      return all;
    }
    if (key.toLowerCase().match(/color$/)) {
      if (geo.util.isFunction(m_style[key])) {
        tmp = geo.util.ensureFunction(m_style[key]);
        out = function () {
          return geo.util.convertColor(
            tmp.apply(this, arguments)
          );
        };
      } else {
        // if the color is not a function, only convert it once
        out = geo.util.ensureFunction(geo.util.convertColor(m_style[key]));
      }
    } else {
      out = geo.util.ensureFunction(m_style[key]);
    }
    return out;
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
   * Get/Set projection of the feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcs = function (val) {
    if (val === undefined) {
      if (m_gcs === undefined && m_renderer) {
        return m_renderer.layer().map().ingcs();
      }
      return m_gcs;
    } else {
      m_gcs = val;
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from the renderer's input gcs coordinates to display coordinates.
   *
   * @param {object} c The input coordinate to convert
   * @param {object} c.x
   * @param {object} c.y
   * @param {object} [c.z=0]
   * @return {object} Display space coordinates
   */
  this.featureGcsToDisplay = function (c) {
    var map = m_renderer.layer().map();
    c = map.gcsToWorld(c, map.ingcs());
    return map.worldToDisplay(c);
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

      // bind or unbind mouse handlers on visibility change
      if (m_visible) {
        m_this._bindMouseHandlers();
      } else {
        m_this._unbindMouseHandlers();
      }

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
   * Get/Set the data array for the feature.
   *
   * @returns {Array|this}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function (data) {
    if (data === undefined) {
      return m_this.style("data") || [];
    } else {
      m_this.style("data", data);
      m_this.dataTime().modified();
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Query if the selection API is enabled for this feature.
   * @returns {bool}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.selectionAPI = function () {
    return m_selectionAPI;
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
    m_this._bindMouseHandlers();
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
    m_this._unbindMouseHandlers();
    m_selectedFeatures = [];
    m_style = {};
    arg = {};
    s_exit();
  };

  this._init(arg);
  return this;
};

/**
 * The most recent feature event triggered.
 * @type {number}
 */
geo.feature.eventID = 0;

/**
 * General object specification for feature types.
 * @typedef geo.feature.spec
 * @type {object}
 * @property {string} type A supported feature type.
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 * construct the feature.  These objects (and their associated
 * indices in the array) will be passed back to style and attribute
 * accessors provided by the user.  In general the number of
 * "markers" drawn will be equal to the length of this array.
 */

/**
 * Create a feature from an object.  The implementation here is
 * meant to define the general interface of creating features
 * from a javascript object.  See documentation from individual
 * feature types for specific details.  In case of an error in
 * the arguments this method will return null;
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.feature.spec} [spec={}] The object specification
 * @returns {geo.feature|null}
 */
geo.feature.create = function (layer, spec) {
  "use strict";

  var type = spec.type;

  // Check arguments
  if (!(layer instanceof geo.layer)) {
    console.warn("Invalid layer");
    return null;
  }
  if (typeof spec !== "object") {
    console.warn("Invalid spec");
    return null;
  }
  var feature = layer.createFeature(type);
  if (!feature) {
    console.warn("Could not create feature type '" + type + "'");
    return null;
  }

  spec = spec || {};
  spec.data = spec.data || [];
  return feature.style(spec);
};

inherit(geo.feature, geo.sceneObject);
