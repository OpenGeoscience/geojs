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
      m_selectionAPI = arg.selectionAPI === undefined ? false : arg.selectionAPI,
      m_style = {},
      m_layer = arg.layer === undefined ? null : arg.layer,
      m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs,
      m_visible = arg.visible === undefined ? true : arg.visible,
      m_bin = arg.bin === undefined ? 0 : arg.bin,
      m_renderer = arg.renderer === undefined ? null : arg.renderer,
      m_dataTime = geo.timestamp(),
      m_buildTime = geo.timestamp(),
      m_updateTime = geo.timestamp(),
      m_selectedFeatures = [],
      m_properties = {data: [], spec: {}};

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
      return m_properties.data;
    } else {
      m_properties.data = data;
      m_this.dataTime().modified();
      m_this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add a property API to the class instance.  This will provide a new
   * property to the internal data representation derived from user provided
   * accessors on the data object.  This method is designed only to be called
   * from a class' constructor, calling it after construction will result in
   * undefined behavior.
   * @protected
   *
   * @param {string} name The method name added to the class
   * @param {string} path The target path of the new property
   * @param {string} type The property type
   * @param {*} defaultValue The default value of the property
   * @param {function?} getter A custom internal array getter (see gl features)
   * @param {function?} setter A custom internal array setter (see gl features)
   * @param {function?} creator A custom internal array creator (see gl features)
   */
  ////////////////////////////////////////////////////////////////////////////
  this._property = function (
    name, path, type, defaultValue) {

    if (m_this.hasOwnProperty(name)) {
      console.warn("Property '" + name + "' overrides existing method.");
    }

    // The current accessor value/method.
    var accessor = defaultValue;

    // Get the property type from the static object.
    var prop = geo.feature.property[type];

    // Several sanity checks for the developer
    if (prop === undefined) {
      throw new Error(
        "Invalid property type '" + type + "' " +
        "given for '" + name + "'."
      );
    }
    if (prop.normalize(defaultValue) === null) {
      console.warn(
        "The default '" + defaultValue + "' " +
        "is not a valid '" + type + "' " +
        "for '" + name + "'."
      );
    }

    var parent = m_properties.spec;
    path = path.split(".");
    path.forEach(function (p, i) {
      if (!parent) {
        return;
      }
      if (i === path.length - 1) {
        if (parent.hasOwnProperty(p)) {
          console.warn(
            "Overriding existing local path '" + path + "' " +
            "for property '" + name + "'."
          );
        }
        parent[p] = type;
      } else {
        if (!parent.hasOwnProperty(p)) {
          console.warn(
            "Unknown container '" + p + "' " +
            "in path '" + path.join(".") + "' " +
            "for property '" + name + "'."
          );
          parent = null;
        } else if (geo.util.typeOf(parent[p]) !== "object") {
          console.warn(
            "Container '" + p + "' " +
            "in path '" + path.join(".") + "' " +
            "for property '" + name + "' " +
            "overrides a value."
          );
          parent = null;
        } else {
          parent = parent.properties[p];
        }
      }
    });
    if (!parent) {
      console.error("Failed to add property '" + name + "'.");
      return m_this;
    }

    /**
     * This will be the (g|s)etter function for the property that is added to the
     * class.  The argument is any constant valid for the property type (when
     * the property value is data independent) or an accessor method with the
     * following call signature:
     * <pre>
     *   accessor(datum, index, container_datum, container_index, ...)
     * </pre>
     * @private
     */
    var func = function (arg) {
      if (arg === undefined) {
        return accessor;
      }
      // Check that non function values are valid for the type
      if (!geo.util.isFunction(arg) && prop.normalize(arg) === null) {
        console.warn(
          "Setting '" + name + "' " +
          "to an invalid value '" + arg + "'."
        );
      }
      accessor = arg.bind(m_this);
      // (re)build cache for the property
      return m_this;
    };

    m_this[name] = func;
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
    m_this._unbindMouseHandlers();
  };

  this._init(arg);
  return this;
};

////////////////////////////////////////////////////////////////////////////
/**
 * This event object provides mouse/keyboard events that can be handled
 * by the features.  This provides a similar interface as core events,
 * but with different names so the events don't interfere.  Subclasses
 * can override this to provide custom events.
 */
////////////////////////////////////////////////////////////////////////////
geo.event.feature = {
  mousemove:  "geo_feature_mousemove",
  mouseover:  "geo_feature_mouseover",
  mouseout:   "geo_feature_mouseout",
  mouseclick: "geo_feature_mouseclick",
  brushend:   "geo_feature_brushend",
  brush:      "geo_feature_brush"
};

inherit(geo.feature, geo.sceneObject);
