var $ = require('jquery');
var inherit = require('./inherit');
var sceneObject = require('./sceneObject');
var timestamp = require('./timestamp');
var geo_event = require('./event');

/**
 * General specification for features.
 *
 * @typedef {object} geo.feature.spec
 * @property {geo.layer} [layer] the parent layer associated with the feature.
 * @property {boolean} [selectionAPI=false] If truthy, enable selection events
 *      on the feature.  Selection events are those in `geo.event.feature`.
 *      They can be bound via a call like
 *      <pre><code>
 *      feature.geoOn(geo.event.feature.mousemove, function (evt) {
 *        // do something with the feature
 *      });
 *      </code></pre>
 *      where the handler is passed a `geo.feature.event` object.
 * @property {boolean} [visible=true] If truthy, show the feature.  If falsy,
 *      hide the feature and do not allow interaction with it.
 * @property {string} [gcs] The interface gcs for this feature.  If `undefined`
 *      or `null`, this uses the layer's interface gcs.  This is a string used
 *      by {@linkcode geo.transform}.
 * @property {number} [bin=0] The bin number is used to determine the order
 *      of multiple features on the same layer.  It has no effect except on the
 *      vgl renderer.  A negative value hides the feature without stopping
 *      interaction with it.  Otherwise, more features with higher bin numbers
 *      are drawn above those with lower bin numbers.  If two features have the
 *      same bin number, their order relative to one another is indeterminate
 *      and may be unstable.
 * @property {geo.renderer?} [renderer] A reference to the renderer used for
 *      the feature.
 * @property {object} [style] An object that contains style values for the
 *      feature.
 * @property {function|number} [style.opacity=1] The opacity on a scale of 0 to
 *      1.
 */

/**
 * @typedef {geo.feature.spec} geo.feature.createSpec
 * @property {string} type A supported feature type.
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 *  construct the feature.  These objects (and their associated indices in the
 *  array) will be passed back to style and attribute accessors provided by the
 *  user.
 */

/**
 * @typedef {geo.event} geo.feature.event
 * @property {number} index The index of the feature within the data array.
 * @property {object} data The data element associated with the indexed
 *      feature.
 * @property {geo.mouseState} mouse The mouse information during the event.
 * @property {object} [extra] Additional information about the feature.  This
 *      is sometimes used to identify a subsection of the feature.
 * @property {number} [eventID] A monotonically increasing number identifying
 *      this feature event loop.  This is provided on
 *      `geo.event.feature.mousemove`, `geo.event.feature.mouseclick`,
 *      `geo.event.feature.mouseover`, `geo.event.feature.mouseout`,
 *      `geo.event.feature.brush`, and `geo.event.feature.brushend`
 *      events, since each of those can trigger multiple events for one mouse
 *      action (all events triggered by the same mouse action will have the
 *      same `eventID`).
 * @property {boolean} [top] `true` if this is the top-most feature that the
 *      mouse is over.  Only the top-most feature gets
 *      `geo.event.feature.mouseon` events, whereas multiple features can get
 *      other events.
 */

/**
 * @typedef {object} geo.feature.searchResult
 * @property {object[]} found A list of elements from the data array that were
 *      found by the search.
 * @property {number[]} index A list of the indices of the elements that were
 *      found by the search.
 * @property {object[]} [extra] A list of additional information per found
 *      element.  The information is passed to events without change.
 */

/**
 * Create a new instance of class feature.
 *
 * @class
 * @alias geo.feature
 * @extends geo.sceneObject
 * @param {geo.feature.spec} [arg] A feature specification.
 * @returns {geo.feature}
 */
var feature = function (arg) {
  'use strict';
  if (!(this instanceof feature)) {
    return new feature(arg);
  }
  sceneObject.call(this);

  var util = require('./util');

  /**
   * @private
   */
  arg = arg || {};

  var m_this = this,
      s_exit = this._exit,
      m_selectionAPI = arg.selectionAPI === undefined ? false : !!arg.selectionAPI,
      m_style = {},
      m_layer = arg.layer === undefined ? null : arg.layer,
      m_gcs = arg.gcs,
      m_visible = arg.visible === undefined ? true : arg.visible,
      m_bin = arg.bin === undefined ? 0 : arg.bin,
      m_renderer = arg.renderer === undefined ? null : arg.renderer,
      m_dataTime = timestamp(),
      m_buildTime = timestamp(),
      m_updateTime = timestamp(),
      m_dependentFeatures = [],
      m_selectedFeatures = [];

  // subclasses can add keys to this for styles that apply to subcomponents of
  // data items, such as individual vertices on lines or polygons.
  this._subfeatureStyles = {};

  /**
   * Private method to bind mouse handlers on the map element.  This does
   * nothing if the selectionAPI is turned off.  Otherwise, it first unbinds
   * any existing handlers and then binds handlers.
   */
  this._bindMouseHandlers = function () {

    // Don't bind handlers for improved performance on features that don't
    // require it.
    if (!this.selectionAPI()) {
      return;
    }

    // First unbind to be sure that the handlers aren't bound twice.
    m_this._unbindMouseHandlers();

    m_this.geoOn(geo_event.mousemove, m_this._handleMousemove);
    m_this.geoOn(geo_event.mouseclick, m_this._handleMouseclick);
    m_this.geoOn(geo_event.brushend, m_this._handleBrushend);
    m_this.geoOn(geo_event.brush, m_this._handleBrush);
  };

  /**
   * Private method to unbind mouse handlers on the map element.
   */
  this._unbindMouseHandlers = function () {
    m_this.geoOff(geo_event.mousemove, m_this._handleMousemove);
    m_this.geoOff(geo_event.mouseclick, m_this._handleMouseclick);
    m_this.geoOff(geo_event.brushend, m_this._handleBrushend);
    m_this.geoOff(geo_event.brush, m_this._handleBrush);
  };

  /**
   * Search for features containing the given point.  This should be defined in
   * relevant subclasses.
   *
   * @param {geo.geoPosition} geo Coordinate in interface gcs.
   * @returns {geo.feature.searchResult} An object with a list of features and
   *    feature indices that are located at the specified point.
   */
  this.pointSearch = function (geo) {
    // base class method does nothing
    return {
      index: [],
      found: []
    };
  };

  /**
   * Search for features contained within a rectangilar region.  This should be
   * defined in relevant subclasses.
   *
   * @param {geo.geoPosition} lowerLeft Lower-left corner in gcs coordinates.
   * @param {geo.geoPosition} upperRight Upper-right corner in gcs coordinates.
   * @param {object} [opts] Additional search options.
   * @param {boolean} [opts.partial=false] If truthy, include features that are
   *    partially in the box, otherwise only include features that are fully
   *    within the region.
   * @returns {number[]} A list of features indices that are in the box region.
   */
  this.boxSearch = function (lowerLeft, upperRight, opts) {
    // base class method does nothing
    return [];
  };

  /**
   * Private mousemove handler.  This uses `pointSearch` to determine which
   * features the mouse is over, then fires appropriate events.
   *
   * @fires geo.event.feature.mouseover
   * @fires geo.event.feature.mouseout
   * @fires geo.event.feature.mousemove
   * @fires geo.event.feature.mouseoff
   * @fires geo.event.feature.mouseon
   */
  this._handleMousemove = function () {
    var mouse = m_this.layer().map().interactor().mouse(),
        data = m_this.data(),
        over = m_this.pointSearch(mouse.geo),
        newFeatures = [], oldFeatures = [], lastTop = -1, top = -1, extra;

    // exit if we have no old or new found entries
    if (!m_selectedFeatures.length && !over.index.length) {
      return;
    }
    extra = over.extra || {};
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

    feature.eventID += 1;
    // Fire events for mouse in first.
    newFeatures.forEach(function (i, idx) {
      m_this.geoTrigger(geo_event.feature.mouseover, {
        data: data[i],
        index: i,
        extra: extra[i],
        mouse: mouse,
        eventID: feature.eventID,
        top: idx === newFeatures.length - 1
      }, true);
    });

    feature.eventID += 1;
    // Fire events for mouse out next
    oldFeatures.forEach(function (i, idx) {
      m_this.geoTrigger(geo_event.feature.mouseout, {
        data: data[i],
        index: i,
        mouse: mouse,
        eventID: feature.eventID,
        top: idx === oldFeatures.length - 1
      }, true);
    });

    feature.eventID += 1;
    // Fire events for mouse move last
    over.index.forEach(function (i, idx) {
      m_this.geoTrigger(geo_event.feature.mousemove, {
        data: data[i],
        index: i,
        extra: extra[i],
        mouse: mouse,
        eventID: feature.eventID,
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
        m_this.geoTrigger(geo_event.feature.mouseoff, {
          data: data[lastTop],
          index: lastTop,
          mouse: mouse
        }, true);
      }

      if (top !== -1) {
        m_this.geoTrigger(geo_event.feature.mouseon, {
          data: data[top],
          index: top,
          extra: extra[top],
          mouse: mouse
        }, true);
      }
    }
  };

  /**
   * Clear our tracked selected features.
   *
   * @returns {this}
   */
  this._clearSelectedFeatures = function () {
    m_selectedFeatures = [];
    return m_this;
  };

  /**
   * Private mouseclick handler.  This uses `pointSearch` to determine which
   * features the mouse is over, then fires a click event for each such
   * feature.
   *
   * @param {geo.event} evt The event that triggered this handler.
   * @fires geo.event.feature.mouseclick
   */
  this._handleMouseclick = function (evt) {
    var mouse = m_this.layer().map().interactor().mouse(),
        data = m_this.data(),
        over = m_this.pointSearch(mouse.geo),
        extra = over.extra || {};

    mouse.buttonsDown = evt.buttonsDown;
    feature.eventID += 1;
    over.index.forEach(function (i, idx) {
      m_this.geoTrigger(geo_event.feature.mouseclick, {
        data: data[i],
        index: i,
        extra: extra[i],
        mouse: mouse,
        eventID: feature.eventID,
        top: idx === over.index.length - 1
      }, true);
    });
  };

  /**
   * Private brush handler.  This uses `boxSearch` to determine which features
   * the brush includes, then fires appropriate events.
   *
   * @param {geo.brushSelection} brush The current brush selection.
   * @fires geo.event.feature.brush
   */
  this._handleBrush = function (brush) {
    var idx = m_this.boxSearch(brush.gcs.lowerLeft, brush.gcs.upperRight),
        data = m_this.data();

    feature.eventID += 1;
    idx.forEach(function (i, idx) {
      m_this.geoTrigger(geo_event.feature.brush, {
        data: data[i],
        index: i,
        mouse: brush.mouse,
        brush: brush,
        eventID: feature.eventID,
        top: idx === idx.length - 1
      }, true);
    });
  };

  /**
   * Private brushend handler.  This uses `boxSearch` to determine which
   * features the brush includes, then fires appropriate events.
   *
   * @param {geo.brushSelection} brush The current brush selection.
   * @fires geo.event.feature.brushend
   */
  this._handleBrushend = function (brush) {
    var idx = m_this.boxSearch(brush.gcs.lowerLeft, brush.gcs.upperRight),
        data = m_this.data();

    feature.eventID += 1;
    idx.forEach(function (i, idx) {
      m_this.geoTrigger(geo_event.feature.brushend, {
        data: data[i],
        index: i,
        mouse: brush.mouse,
        brush: brush,
        eventID: feature.eventID,
        top: idx === idx.length - 1
      }, true);
    });
  };

  /**
   * Get/Set style used by the feature.
   *
   * @param {string|object} [arg1] If `undefined`, return the current style
   *    object.  If a string and `arg2` is undefined, return the style
   *    associated with the specified key.  If a string and `arg2` is defined,
   *    set the named style to the specified value.  Otherwise, extend the
   *    current style with the values in the specified object.
   * @param {*} [arg2] If `arg1` is a string, the new value for that style.
   * @returns {object|this} Either the entire style object, the value of a
   *    specific style, or the current class instance.
   */
  this.style = function (arg1, arg2) {
    if (arg1 === undefined) {
      return m_style;
    } else if (typeof arg1 === 'string' && arg2 === undefined) {
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

  /**
   * A uniform getter that always returns a function even for constant styles.
   * This can also return all defined styles as functions in a single object.
   *
   * @param {string} [key] If defined, return a function for the named style.
   *    Otherwise, return an object with a function for all defined styles.
   * @returns {function|object} Either a function for the named style or an
   *    object with functions for all defined styles.
   */
  this.style.get = function (key) {
    var out;
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
      if (util.isFunction(m_style[key])) {
        out = function () {
          return util.convertColor(
            m_style[key].apply(this, arguments)
          );
        };
      } else {
        // if the color is not a function, only convert it once
        out = util.ensureFunction(util.convertColor(m_style[key]));
      }
    } else {
      out = util.ensureFunction(m_style[key]);
    }
    return out;
  };

  /**
   * Set style(s) from array(s).  For each style, the array should have one
   * value per data item.  The values are not converted or validated.  Color
   * values should be `geo.geoColorObject`s.  If invalid values are given the
   * behavior is undefined.
   *   For some feature styles, if the first entry of an array is itself an
   * array, then each entry of the array is expected to be an array, and values
   * are used from these subarrays.  This allows a style to apply, for
   * instance, per vertex of a data item rather than per data item.
   *
   * @param {string|object} keyOrObject Either the name of a single style or
   *    an object where the keys are the names of styles and the values are
   *    each arrays.
   * @param {array} styleArray If keyOrObject is a string, an array of values
   *    for the style.  If keyOrObject is an object, this parameter is ignored.
   * @param {boolean} [refresh=false] `true` to redraw the feature when it has
   *    been updated.  If an object with styles is passed, the redraw is only
   *    done once.
   * @returns {this} The feature instance.
   */
  this.updateStyleFromArray = function (keyOrObject, styleArray, refresh) {
    if (typeof keyOrObject !== 'string') {
      $.each(keyOrObject, function (key, value) {
        m_this.updateStyleFromArray(key, value);
      });
    } else {
      /* colors are always expected to be objects with r, g, b values, so for
       * any color, make sure we don't have undefined entries. */
      var fallback;
      if (keyOrObject.toLowerCase().match(/color$/)) {
        fallback = {r: 0, g: 0, b: 0};
      }
      if (!Array.isArray(styleArray)) {
        return m_this;
      }
      if (m_this._subfeatureStyles[keyOrObject]) {
        if (styleArray.length && Array.isArray(styleArray[0])) {
          m_this.style(keyOrObject, function (v, j, d, i) {
            var val = (styleArray[i] || [])[j];
            return val !== undefined ? val : fallback;
          });
        } else {
          m_this.style(keyOrObject, function (v, j, d, i) {
            var val = styleArray[i];
            return val !== undefined ? val : fallback;
          });
        }
      } else {
        m_this.style(keyOrObject, function (d, i) {
          var val = styleArray[i];
          return val !== undefined ? val : fallback;
        });
      }
    }
    if (refresh && m_this.visible()) {
      m_this.draw();
    }
    return m_this;
  };

  /**
   * Get the layer referenced by the feature.
   *
   * @returns {geo.layer} The layer associated with the feature.
   */
  this.layer = function () {
    return m_layer;
  };

  /**
   * Get the renderer used by the feature.
   *
   * @returns {geo.renderer} The renderer used to render the feature.
   */
  this.renderer = function () {
    return m_renderer;
  };

  /**
   * Get/Set the projection of the feature.
   *
   * @param {string?} [val] If `undefined`, return the current gcs.  If
   *    `null`, use the map's interface gcs.  Otherwise, set a new value for
   *    the gcs.
   * @returns {string|this} A string used by {@linkcode geo.transform}.  If the
   *    map interface gcs is in use, that value will be returned.  If the gcs
   *    is set, return the current class instance.
   */
  this.gcs = function (val) {
    if (val === undefined) {
      if ((m_gcs === undefined || m_gcs === null) && m_layer) {
        return m_layer.map().ingcs();
      }
      return m_gcs;
    } else {
      m_gcs = val;
      m_this.modified();
      return m_this;
    }
  };

  /**
   * Convert from the feature's gcs coordinates to display coordinates.
   *
   * @param {geo.geoPosition} c The input coordinate to convert.
   * @returns {geo.screenPosition} Display space coordinates.
   */
  this.featureGcsToDisplay = function (c) {
    var map = m_layer.map();
    c = map.gcsToWorld(c, m_this.gcs());
    c = map.worldToDisplay(c);
    if (m_renderer.baseToLocal) {
      c = m_renderer.baseToLocal(c);
    }
    return c;
  };

  /**
   * Get/Set the visibility of the feature.
   *
   * @param {boolean} [val] A boolean to change the visibility, or `undefined`
   *    to return the visibility.
   * @param {boolean} [direct] If `true`, when getting the visibility,
   *    disregard the visibility of the parent layer, and when setting, refresh
   *    the state regardless of whether it has changed or not.  Otherwise, the
   *    functional visibility is returned, where both the feature and the layer
   *    must be visible for a `true` result.
   * @returns {boolean|this} Either the visibility (if getting) or the feature
   *    (if setting).
   */
  this.visible = function (val, direct) {
    if (val === undefined) {
      if (!direct && m_layer && m_layer.visible && !m_layer.visible()) {
        return false;
      }
      return m_visible;
    }
    if (m_visible !== val || direct) {
      m_visible = val;
      m_this.modified();
      if (m_layer && m_layer.visible && !m_layer.visible()) {
        val = false;
      }
      // bind or unbind mouse handlers on visibility change
      if (val) {
        m_this._bindMouseHandlers();
      } else {
        m_this._unbindMouseHandlers();
      }
      for (var i = 0; i < m_dependentFeatures.length; i += 1) {
        m_dependentFeatures[i].visible(m_visible, direct);
      }
    }
    return m_this;
  };

  /**
   * Get/Set a list of dependent features.  Dependent features have their
   * visibility changed at the same time as the feature.
   *
   * @param {geo.feature[]} [arg] If specified, the new list of dependent
   *    features.  Otherwise, return the current list of dependent features.
   * @returns {geo.feature[]|this} The current list of dependent features or
   *    a reference to `this`.
   */
  this.dependentFeatures = function (arg) {
    if (arg === undefined) {
      return m_dependentFeatures.slice();
    }
    m_dependentFeatures = arg.slice();
    return m_this;
  };

  /**
   * Get/Set bin of the feature.  The bin number is used to determine the order
   * of multiple features on the same layer.  It has no effect except on the
   * vgl renderer.  A negative value hides the feature without stopping
   * interaction with it.  Otherwise, more features with higher bin numbers are
   * drawn above those with lower bin numbers.  If two features have the same
   * bin number, their order relative to one another is indeterminate and may
   * be unstable.
   *
   * @param {number} [val] The new bin number.  If `undefined`, return the
   *    current bin number.
   * @returns {number|this} The current bin number or a reference to `this`.
   */
  this.bin = function (val) {
    if (val === undefined) {
      return m_bin;
    } else {
      m_bin = val;
      m_this.modified();
      return m_this;
    }
  };

  /**
   * Get/Set timestamp of data change.
   *
   * @param {geo.timestamp} [val] The new data timestamp object or `undefined`
   *    to get the current data timestamp object.
   * @returns {geo.timestamp|this}
   */
  this.dataTime = function (val) {
    if (val === undefined) {
      return m_dataTime;
    } else {
      m_dataTime = val;
      m_this.modified();
      return m_this;
    }
  };

  /**
   * Get/Set timestamp of last time a build happened.
   *
   * @param {geo.timestamp} [val] The new build timestamp object or `undefined`
   *    to get the current build timestamp object.
   * @returns {geo.timestamp|this}
   */
  this.buildTime = function (val) {
    if (val === undefined) {
      return m_buildTime;
    } else {
      m_buildTime = val;
      m_this.modified();
      return m_this;
    }
  };

  /**
   * Get/Set timestamp of last time an update happened.
   *
   * @param {geo.timestamp} [val] The new update timestamp object or
   *    `undefined` to get the current update timestamp object.
   * @returns {geo.timestamp|this}
   */
  this.updateTime = function (val) {
    if (val === undefined) {
      return m_updateTime;
    } else {
      m_updateTime = val;
      m_this.modified();
      return m_this;
    }
  };

  /**
   * Get/Set the data array for the feature.  This is equivalent to getting or
   * setting the `data` style, except that setting the data array via this
   * method updates the data timestamp, whereas setting it via the style does
   * not.
   *
   * @param {array} [data] A new data array or `undefined` to return the
   *    existing array.
   * @returns {array|this}
   */
  this.data = function (data) {
    if (data === undefined) {
      return m_this.style('data') || [];
    } else {
      m_this.style('data', data);
      m_this.dataTime().modified();
      m_this.modified();
      return m_this;
    }
  };

  /**
   * Get/Set if the selection API is enabled for this feature.
   *
   * @param {boolean} [arg] `undefined` to return the selectionAPI state, or a
   *    boolean to change the state.
   * @param {boolean} [direct] If `true`, when getting the selectionAPI state,
   *    disregard the state of the parent layer, and when setting, refresh the
   *    state regardless of whether it has changed or not.
   * @returns {boolean|this} Either the selectionAPI state (if getting) or the
   *    feature (if setting).
   */
  this.selectionAPI = function (arg, direct) {
    if (arg === undefined) {
      if (!direct && m_layer && m_layer.selectionAPI && !m_layer.selectionAPI()) {
        return false;
      }
      return m_selectionAPI;
    }
    arg = !!arg;
    if (arg !== m_selectionAPI || direct) {
      m_selectionAPI = arg;
      this._unbindMouseHandlers();
      this._bindMouseHandlers();
    }
    return this;
  };

  /**
   * Initialize the class instance.  Derived classes should implement this.
   *
   * @param {geo.feature.spec} arg The feature specification.
   */
  this._init = function (arg) {
    if (!m_layer) {
      throw new Error('Feature requires a valid layer');
    }
    m_style = $.extend({},
                {'opacity': 1.0}, arg.style === undefined ? {} :
                arg.style);
    m_this._bindMouseHandlers();
  };

  /**
   * Build.
   *
   * Derived classes should implement this.
   */
  this._build = function () {
  };

  /**
   * Update.
   *
   * Derived classes should implement this.
   */
  this._update = function () {
  };

  /**
   * Destroy.  Unbind mouse handlers, clear internal variables, and call the
   * parent destroy method.
   *
   * Derived classes should implement this.
   */
  this._exit = function () {
    m_this._unbindMouseHandlers();
    m_selectedFeatures = [];
    m_style = {};
    s_exit();
  };

  this._init(arg);
  return this;
};

/**
 * The most recent `geo.feature.event` triggered.
 * @type {number}
 */
feature.eventID = 0;

/**
 * Create a feature.  This defines a general interface; see individual feature
 * types for specific details.
 *
 * @param {geo.layer} layer The layer to add the feature to.
 * @param {geo.feature.spec} spec The feature specification.  At least the
 *      `type` must be specified.
 * @returns {geo.feature|null} The created feature or `null` for a failure.
 */
feature.create = function (layer, spec) {
  'use strict';

  // Check arguments
  if (!(layer instanceof require('./layer'))) {
    console.warn('Invalid layer');
    return null;
  }
  if (typeof spec !== 'object') {
    console.warn('Invalid spec');
    return null;
  }
  var type = spec.type;
  var feature = layer.createFeature(type, spec);
  if (!feature) {
    console.warn('Could not create feature type "' + type + '"');
    return null;
  }

  spec.data = spec.data || [];
  return feature.style(spec);
};

inherit(feature, sceneObject);
module.exports = feature;
