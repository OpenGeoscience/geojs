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
      m_layer = arg.layer === undefined ? null : arg.layer,
      m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs,
      m_visible = arg.visible === undefined ? true : arg.visible,
      m_bin = arg.bin === undefined ? 0 : arg.bin,
      m_renderer = arg.renderer === undefined ? null : arg.renderer,
      m_dataTime = geo.timestamp(),
      m_buildTime = geo.timestamp(),
      m_updateTime = geo.timestamp(),
      m_selectedFeatures = [],
      m_properties = {data: [], cache: {}, spec: {}, paths: {}};

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
      m_this._cache(true);
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * A style interface compatible with the old style API for compatibility.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.style = function (arg1, arg2) {
    var property, output, spec;
    if (arg1 === undefined) {
      output = {};
      for (property in m_properties.paths) {
        if (m_properties.paths.hasOwnProperty(property)) {
          spec = m_properties.spec[property];
          output[spec.name] = m_this.style(spec.name);
        }
      }
      return output;
    } else if (typeof arg1 === "string") {
      return m_this[arg1](arg2);
    } else if (arg2 === undefined) {
      for (property in arg1) {
        if (arg1.hasOwnProperty(property)) {
          m_this.style(property, arg1[property]);
        }
      }
      return m_this;
    } else {
      console.warn("Unknown style call method.");
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
   */
  ////////////////////////////////////////////////////////////////////////////
  this._property = function (name, path, type, defaultValue) {

    if (m_this.hasOwnProperty(name)) {
      console.warn("Property '" + name + "' overrides existing method.");
    }

    var setter = m_this._propertySetter;

    // The current accessor value/method.
    var accessor = defaultValue;

    // Get the property type from the static object.
    var prop = geo.property[type];

    // Children object populated when the property is a container
    var children = {};

    // Several sanity checks for the developer
    if (prop === undefined) {
      throw new Error(
        "Invalid property type '" + type + "' " +
        "given for '" + name + "'."
      );
    }
    if (!geo.util.isFunction(defaultValue) && prop.normalize(defaultValue) === null) {
      console.warn(
        "The default '" + defaultValue + "' " +
        "is not a valid '" + type + "' " +
        "for '" + name + "'."
      );
    }
    // Property names must start with a lower case letter
    if (name.match(/^[^a-z]/)) {
      throw new Error(
        "Invalid property name."
      );
    }

    var plist = path.split(".");
    var parent = path.split(".").slice(0, plist.length - 1).join(".");
    var localName = plist[plist.length - 1];
    if (parent !== "" && (m_properties.spec[parent] || {}).type !== "container") {
      console.error(
        "Unknown parent container " +
        "in path '" + path + "' " +
        "for property '" + name + "'."
      );
      return m_this;
    }
    if (m_properties.spec.hasOwnProperty(path)) {
      console.warn(
        "Overriding existing local path '" + path + "' " +
        "for property '" + name + "'."
      );
    }
    if (m_properties.paths[name]) {
      console.warn(
        "Overriding existing property '" + name + "'."
      );
    }
    m_properties.paths[name] = path;

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
      if (geo.util.isFunction(arg)) {
        accessor = arg.bind(m_this);
      } else {
        accessor = arg;
      }

      // (re)build cache for the property
      return m_this;
    };

    /**
     * Return the container inside the cache for the given context.
     * This function in particular is the default
     * used for accessors at the root level.
     * @private
     */
    var getContainer = function () {
      return m_properties.cache;
    };

    /**
     * This function returns arguments required to call a properties
     * accessor.  It transforms an array of indices to an array:
     *   args = [ d_n, i_n, ... , d_0, i_0 ]
     * The child method calls:
     *   value = accessor.apply(m_this, args)
     * @private
     */
    var getContext = function () {
      return [];
    };

    /**
     * This function returns the data object for the given context.
     * @private
     */
    var getData = function () {
      return m_properties.data;
    };

    parent = m_properties.spec[parent];
    /**
     * This will be the function that builds the internal cache for the
     * property values.
     * @private
     */
    // add context as arguments data, index, data, index, ....
    var build = function () {
      var root = getContainer.apply(m_this, arguments);
      var ctx = getContext.apply(m_this, arguments);
      var cdata = getData.apply(m_this, ctx);
      var args = Array.prototype.slice.call(arguments);

      setter(localName, root, cdata.map(function (d, i) {
        var largs, val;

        if (geo.util.isFunction(accessor)) {
          largs = [d, i].concat(args);
          val = prop.normalize(accessor.apply(m_this, largs));
          if (val === null) {
            console.warn(
              "Invalid value returned by accessor for property '" +
              name + "'."
            );
            val = defaultValue;
          }
        } else {
          val = prop.normalize(accessor);
        }

        return val;
      }));

      // Update the cache for children
      root[localName].forEach(function (d, i) {
        var key, largs = [d, i].concat(args);
        for (key in children) {
          if (children.hasOwnProperty(key)) {
            children[key].build.apply(m_this, largs);
          }
        }
      });
    };

    var parentUtils;
    if (parent) {
      // TODO
      // Add a method to containers that wraps the builder with
      // the parent context.  Something like this:
      // build = parent.addProperty(
      //   name,
      //   build,
      //   ...
      // );
      //
      // Parent containers call build on all their children,
      // children call just the wrapped builder.  So, either of these
      // will work:
      //
      // feature.data(...).line(...).position(...)
      //
      //   or
      //
      // feature.data(...).position(...).line(...)
      parentUtils = parent.addChild(localName, build);

      // set the context and container methods
      getContainer = parentUtils.container;
      getContext = parentUtils.context;
    }

    /**
     * This function is called by children of a container to register
     * themselves to container's build method.  This ensures that
     * when the datum for any container changes, the contained properties
     * will be updated as well.
     *
     * Returns a builder utilities that take the place of the root level
     * methods.
     * @private
     * @argument {string} childName The local name of the child property
     * @returns {function}
     */
    var addChild = function (childName, childBuilder) {
      children[childName] = childBuilder;
      return {
        // Return the cache root.
        container: function () {
          var args = Array.prototype.slice.call(arguments);
          var i = args.shift();
          var cache = getContainer.apply(m_this, args);
          // add an empty array to the cache if it doesn't exist
          if (!cache[localName]) {
            cache[localName] = [];
          }
          return cache[localName][i];
        },

        // Return to the child the data context.
        context: function () {
          // maybe add some sanity checks/warnings here
          var args = Array.prototype.slice.call(arguments);
          var i = args.shift();
          var ctx = getContext.apply(m_this, args);
          var d = func.apply(m_this, ctx);
          return [d, i].concat(args);
        },

        // Return the data object for a context... relies on the cache
        // being current.
        data: function () {
          return getContainer.apply(m_this, arguments)[localName];
        }
      };
    };

    m_properties.spec[path] = {
      type: type,
      name: name,
      defaultValue: defaultValue,
      property: prop,
      build: build,
      addChildren: addChild,
      children: children,
      context: getContext,
      container: getContainer
    };

    m_this[name] = func;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * A renderer specific handler for property caching.  This function is
   * on every property during every cache rebuild allowing the renderer
   * to do caching of its own.  Classes overriding this should call
   * the superclass method or perform the assignment by themselves,
   * otherwise base class methods such as the mouse handling api
   * won't work.
   * @protected
   * @param {string} name The feature name
   * @param {object} root The object root in the cache
   * @param {array} data The data to be added to root as
   *    <code>root[name] = data</code>
   */
  ////////////////////////////////////////////////////////////////////////////
  this._propertySetter = function (name, root, data) {
    root[name] = data;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * A renderer specific handler for property caching.  This function
   * is provided by feature subclasses that change the default
   * property setter to convert the cached values from local to normal form.
   *
   * @todo
   * The interface for this isn't defined yet.  It is assumed for the moment
   * that property setters don't do anything incompatible with standard
   * getters.  In the future, the function could be used to improve the
   * caching performance while maintaining renderer agnostic methods.
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._propertyGetter = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the current property cache content and optionally
   * rebuild the cache.
   * @param {bool} rebuild Force rebuilding the cache
   * @returns {object}
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._cache = function (rebuild) {
    var prop;
    if (rebuild) {
      for (prop in m_properties.spec) {
        if (m_properties.spec.hasOwnProperty(prop)) {
          m_properties.spec[prop].build();
        }
      }
    }
    return m_properties.cache;
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
    m_this.style(arg.style);
    m_this._bindMouseHandlers();

    // build the cache with defaults
    m_this._cache(true);
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
    m_selectedFeatures = [];
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
  if (!layer instanceof geo.layer) {
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
