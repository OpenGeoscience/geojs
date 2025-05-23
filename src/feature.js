var $ = require('jquery');
var inherit = require('./inherit');
var sceneObject = require('./sceneObject');
var timestamp = require('./timestamp');
var transform = require('./transform');
var geo_event = require('./event');

/**
 * General specification for features.
 *
 * @typedef {object} geo.feature.spec
 * @property {geo.layer} [layer] the parent layer associated with the feature.
 * @property {boolean|'auto'} [selectionAPI='auto'] If `'auto'`, enable
 *   selection events if any {@link geo.event.feature} events are bound to the
 *   feature.  Otherwise, if truthy, enable selection events on the feature.
 *   Selection events are those in {@link geo.event.feature}.  They can be
 *   bound via a call like
 *   ```
 *   feature.geoOn(geo.event.feature.mousemove, function (evt) {
 *     // do something with the feature
 *   });
 *   ```
 *   where the handler is passed a {@link geo.event.feature} object.
 * @property {boolean} [visible=true] If truthy, show the feature.  If falsy,
 *   hide the feature and do not allow interaction with it.
 * @property {string} [gcs] The interface gcs for this feature.  If `undefined`
 *   or `null`, this uses the layer's interface gcs.  This is a string used by
 *   {@link geo.transform}.
 * @property {number} [bin=null] The bin number is used to determine the order
 *   of multiple features on the same layer.  It has no effect except on the
 *   webgl renderer.  A negative value hides the feature without stopping
 *   interaction with it.  Otherwise, more features with higher bin numbers are
 *   drawn above those with lower bin numbers.  If two features have the same
 *   bin number, their order relative to one another is indeterminate and may
 *   be unstable.  A value of `null` will use the current position of the
 *   feature within its parent's list of children as the bin number.
 * @property {geo.renderer} [renderer] A reference to the renderer used for
 *   the feature.  If `null` or unset or identical to `layer.renderer()`, the
 *   layer's renderer is used.
 * @property {geo.feature.styleSpec} [style] An object that contains style
 *   values for the feature.
 */

/**
 * Style specification for a feature.
 *
 * @typedef {object} geo.feature.styleSpec
 * @property {object} The styyle.
 */

/**
 * @typedef {geo.feature.spec} geo.feature.createSpec
 * @extends geo.feature.spec
 * @property {string} type A supported feature type.
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 *   construct the feature.  These objects (and their associated indices in the
 *   array) will be passed back to style and attribute accessors provided by
 *   the user.
 */

/**
 * @typedef {geo.event} geo.feature.event
 * @property {number} index The index of the feature within the data array.
 * @property {object} data The data element associated with the indexed
 *   feature.
 * @property {geo.mouseState} mouse The mouse information during the event.
 * @property {object} [extra] Additional information about the feature.  This
 *   is sometimes used to identify a subsection of the feature.
 * @property {number} [eventID] A monotonically increasing number identifying
 *   this feature event loop.  This is provided on
 *   {@link geo.event.feature.mousemove}, {@link geo.event.feature.mouseclick},
 *   {@link geo.event.feature.mouseover}, {@link geo.event.feature.mouseout},
 *   {@link geo.event.feature.brush}, and {@link geo.event.feature.brushend}
 *   events, since each of those can trigger multiple events for one mouse
 *   action (all events triggered by the same mouse action will have the same
 *   `eventID`).
 * @property {boolean} [top] `true` if this is the top-most feature that the
 *   mouse is over.  Only the top-most feature gets
 *   {@link geo.event.feature.mouseon} events, whereas multiple features can
 *   get other events.
 */

/**
 * @typedef {object} geo.feature.searchResult
 * @property {object[]} found A list of elements from the data array that were
 *   found by the search.
 * @property {number[]} index A list of the indices of the elements that were
 *   found by the search.
 * @property {object[]} [extra] A list of additional information per found
 *   element.  The information is passed to events without change.
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
      s_geoOn = this.geoOn,
      s_geoOff = this.geoOff,
      m_ready,
      m_selectionAPI = arg.selectionAPI === undefined ? 'auto' : arg.selectionAPI,
      m_style = {},
      m_layer = arg.layer === undefined ? null : arg.layer,
      m_gcs = arg.gcs,
      m_visible = arg.visible === undefined ? true : arg.visible,
      m_bin = arg.bin === undefined ? null : arg.bin,
      m_renderer = arg.renderer === undefined || (m_layer && arg.renderer === m_layer.renderer()) ? null : arg.renderer,
      m_dataTime = timestamp(),
      m_buildTime = timestamp(),
      m_updateTime = timestamp(),
      m_dependentFeatures = [],
      m_selectedFeatures = [];

  // subclasses can add keys to this for styles that apply to subcomponents of
  // data items, such as individual vertices on lines or polygons.
  this._subfeatureStyles = {};

  /**
   * @property {boolean} ready `true` if this feature has been initialized,
   *    `false` if it was destroyed, `undefined` if it was created but not
   *    initialized.
   * @name geo.feature#ready
   */
  Object.defineProperty(this, 'ready', {
    get: function () {
      return m_ready;
    }
  });

  /**
   * Private method to bind mouse handlers on the map element.  This does
   * nothing if the selectionAPI is turned off.  Otherwise, it first unbinds
   * any existing handlers and then binds handlers.
   */
  this._bindMouseHandlers = function () {
    // Don't bind handlers for improved performance on features that don't
    // require it.
    if (!m_this.selectionAPI()) {
      return;
    }

    // First unbind to be sure that the handlers aren't bound twice.
    m_this._unbindMouseHandlers();

    m_this.geoOn(geo_event.mousemove, m_this._handleMousemove);
    m_this.geoOn(geo_event.mousedown, m_this._handleMousedown);
    m_this.geoOn(geo_event.mouseup, m_this._handleMouseup);
    m_this.geoOn(geo_event.mouseclick, m_this._handleMouseclick);
    m_this.geoOn(geo_event.brushend, m_this._handleBrushend);
    m_this.geoOn(geo_event.brush, m_this._handleBrush);
  };

  /**
   * Private method to unbind mouse handlers on the map element.
   */
  this._unbindMouseHandlers = function () {
    m_this.geoOff(geo_event.mousemove, m_this._handleMousemove);
    m_this.geoOff(geo_event.mousedown, m_this._handleMousedown);
    m_this.geoOff(geo_event.mouseup, m_this._handleMouseup);
    m_this.geoOff(geo_event.mouseclick, m_this._handleMouseclick);
    m_this.geoOff(geo_event.brushend, m_this._handleBrushend);
    m_this.geoOff(geo_event.brush, m_this._handleBrush);
  };

  /**
   * Search for features containing the given point.  This should be defined in
   * relevant subclasses.
   *
   * @param {geo.geoPosition} geo Coordinate.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.feature.searchResult} An object with a list of features and
   *    feature indices that are located at the specified point.
   */
  this.pointSearch = function (geo, gcs) {
    // base class method does nothing
    return {
      index: [],
      found: []
    };
  };

  /**
   * Search for features contained within a rectangular region.
   *
   * @param {geo.geoPosition} lowerLeft Lower-left corner.
   * @param {geo.geoPosition} upperRight Upper-right corner.
   * @param {object} [opts] Additional search options.
   * @param {boolean} [opts.partial] If truthy, include features that are
   *    partially in the box, otherwise only include features that are fully
   *    within the region.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.feature.searchResult} An object with a list of features and
   *    feature indices that are located at the specified point.
   */
  this.boxSearch = function (lowerLeft, upperRight, opts, gcs) {
    return m_this.polygonSearch([
      lowerLeft, {x: lowerLeft.x, y: upperRight.y},
      upperRight, {x: upperRight.x, y: lowerLeft.y}], opts, gcs);
  };

  /**
   * Search for features contained within a polygon.  This should be defined in
   * relevant subclasses.
   *
   * @param {geo.polygonObject} poly A polygon as an array of coordinates or an
   *    object with `outer` and optionally `inner` parameters.
   * @param {object} [opts] Additional search options.
   * @param {boolean} [opts.partial] If truthy, include features that are
   *    partially in the polygon, otherwise only include features that are
   *    fully within the region.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.feature.searchResult} An object with a list of features and
   *    feature indices that are located at the specified point.
   */
  this.polygonSearch = function (poly, opts, gcs) {
    // base class method does nothing
    return {
      index: [],
      found: []
    };
  };

  /**
   * Private mousedown handler.  This uses `pointSearch` to determine which
   * features the mouse is over, then fires appropriate events.
   *
   * @param {geo.event} evt The event that triggered this handler.
   * @fires geo.event.feature.mousedown
   */
  this._handleMousedown = function (evt) {
    this._handleMousemove(evt, geo_event.feature.mousedown);
  };

  /**
   * Private mouseup handler.  This uses `pointSearch` to determine which
   * features the mouse is over, then fires appropriate events.
   *
   * @param {geo.event} evt The event that triggered this handler.
   * @fires geo.event.feature.mouseup
   */
  this._handleMouseup = function (evt) {
    this._handleMousemove(evt, geo_event.feature.mouseup);
  };

  /**
   * Private mousemove handler.  This uses `pointSearch` to determine which
   * features the mouse is over, then fires appropriate events.
   *
   * @param {geo.event} evt The event that triggered this handler.
   * @param {string} [updown] If "mouseup" or "mousedown", fire that event
   *    instead of mouseon.
   * @fires geo.event.feature.mouseover_order
   * @fires geo.event.feature.mouseover
   * @fires geo.event.feature.mouseout
   * @fires geo.event.feature.mousemove
   * @fires geo.event.feature.mouseoff
   * @fires geo.event.feature.mouseon
   * @fires geo.event.feature.mouseup
   * @fires geo.event.feature.mousedown
   */
  this._handleMousemove = function (evt, updown) {
    var mouse = evt && evt.mouse ? evt.mouse : m_this.layer().map().interactor().mouse(),
        data = m_this.data(),
        over = m_this.pointSearch(mouse.geo),
        newFeatures = [], oldFeatures = [], lastTop = -1, top = -1, extra;

    // exit if we have no old or new found entries
    if (!m_selectedFeatures.length && !over.index.length) {
      return;
    }

    extra = over.extra || {};

    // if we are over more than one item, trigger an event that is allowed to
    // reorder the values in evt.over.index.  Event handlers don't have to
    // maintain evt.over.found.  Handlers should not modify evt.over.extra or
    // evt.previous.
    if (over.index.length > 1) {
      m_this.geoTrigger(geo_event.feature.mouseover_order, {
        feature: m_this,
        mouse: mouse,
        previous: m_selectedFeatures,
        over: over,
        sourceEvent: evt
      });
    }

    feature.eventID += 1;

    if (updown) {
      over.index.forEach((i, idx) => {
        m_this.geoTrigger(updown, {
          data: data[i],
          index: i,
          extra: extra[i],
          mouse: mouse,
          eventID: feature.eventID,
          top: idx === over.length - 1,
          sourceEvent: evt
        }, true);
      });
      return;
    }

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

    // Fire events for mouse in first.
    newFeatures.forEach(function (i, idx) {
      m_this.geoTrigger(geo_event.feature.mouseover, {
        data: data[i],
        index: i,
        extra: extra[i],
        mouse: mouse,
        eventID: feature.eventID,
        top: idx === newFeatures.length - 1,
        sourceEvent: evt
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
        top: idx === oldFeatures.length - 1,
        sourceEvent: evt
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
        top: idx === over.index.length - 1,
        sourceEvent: evt
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
          mouse: mouse,
          sourceEvent: evt
        }, true);
      }

      if (top !== -1) {
        m_this.geoTrigger(geo_event.feature.mouseon, {
          data: data[top],
          index: top,
          extra: extra[top],
          mouse: mouse,
          sourceEvent: evt
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
   * @fires geo.event.feature.mouseclick_order
   * @fires geo.event.feature.mouseclick
   */
  this._handleMouseclick = function (evt) {
    var mouse = m_this.layer().map().interactor().mouse(),
        data = m_this.data(),
        over = m_this.pointSearch(mouse.geo),
        extra = over.extra || {};

    // if we are over more than one item, trigger an event that is allowed to
    // reorder the values in evt.over.index.  Event handlers don't have to
    // maintain evt.over.found.  Handlers should not modify evt.over.extra.
    if (over.index.length > 1) {
      m_this.geoTrigger(geo_event.feature.mouseclick_order, {
        feature: m_this,
        mouse: mouse,
        over: over,
        sourceEvent: evt
      });
    }
    mouse.buttonsDown = evt.buttonsDown;
    feature.eventID += 1;
    over.index.forEach(function (i, idx) {
      m_this.geoTrigger(geo_event.feature.mouseclick, {
        data: data[i],
        index: i,
        extra: extra[i],
        mouse: mouse,
        eventID: feature.eventID,
        top: idx === over.index.length - 1,
        sourceEvent: evt
      }, true);
    });
  };

  /**
   * Private brush handler.  This uses `polygonSearch` to determine which
   * features the brush includes, then fires appropriate events.
   *
   * @param {geo.brushSelection} brush The current brush selection.
   * @fires geo.event.feature.brush
   */
  this._handleBrush = function (brush) {
    let corners = [brush.gcs.lowerLeft, brush.gcs.lowerRight, brush.gcs.upperRight, brush.gcs.upperLeft];
    if (m_this.layer()) {
      const map = m_this.layer().map();
      corners = transform.transformCoordinates(map.gcs(), map.ingcs(), corners);
    }
    const search = m_this.polygonSearch(corners);

    feature.eventID += 1;
    search.index.forEach(function (idx, i) {
      m_this.geoTrigger(geo_event.feature.brush, {
        data: search.found[i],
        index: idx,
        mouse: brush.mouse,
        brush: brush,
        eventID: feature.eventID,
        top: i === search.index.length - 1
      }, true);
    });
  };

  /**
   * Private brushend handler.  This uses `polygonSearch` to determine which
   * features the brush includes, then fires appropriate events.
   *
   * @param {geo.brushSelection} brush The current brush selection.
   * @fires geo.event.feature.brushend
   */
  this._handleBrushend = function (brush) {
    let corners = [brush.gcs.lowerLeft, brush.gcs.lowerRight, brush.gcs.upperRight, brush.gcs.upperLeft];
    if (m_this.layer()) {
      const map = m_this.layer().map();
      corners = transform.transformCoordinates(map.gcs(), map.ingcs(), corners);
    }
    const search = m_this.polygonSearch(corners);

    feature.eventID += 1;
    search.index.forEach(function (idx, i) {
      m_this.geoTrigger(geo_event.feature.brushend, {
        data: search.found[i],
        index: idx,
        mouse: brush.mouse,
        brush: brush,
        eventID: feature.eventID,
        top: i === search.index.length - 1
      }, true);
    });
  };

  /**
   * Get/Set style used by the feature.  Styles can be constant values or
   * functions.  If a function, the style is typically called with parameters
   * such as `(dataElement, dataIndex)` or, if the specific style of a feature
   * has a subfeature style, with `(subfeatureElement, subfeatureIndex,
   * dataElement, dataIndex)`.
   *
   * See the <a href="#.styleSpec">style specification
   * <code>styleSpec</code></a> for available styles.
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
      m_style = Object.assign({}, m_style, arg1);
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
   * If the style `key` is a color, the returned function will also coerce
   * the result to be a {@link geo.geoColorObject}.
   *
   * @function style_DOT_get
   * @memberof geo.feature
   * @instance
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
            m_style[key].apply(m_this, arguments)
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
   * values should be {@link geo.geoColorObject}s.  If invalid values are given
   * the behavior is undefined.
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
   * @param {boolean} [refresh] `true` to redraw the feature when it has
   *    been updated.  If an object with styles is passed, the redraw is only
   *    done once.
   * @param {number} [stride] If specified, the array should be sampled at this
   *    spacing.
   * @returns {this} The feature instance.
   */
  this.updateStyleFromArray = function (keyOrObject, styleArray, refresh, stride) {
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
            var val = (styleArray[stride ? Math.floor(i / stride) : i] || [])[j];
            return val !== undefined ? val : fallback;
          });
        } else {
          m_this.style(keyOrObject, function (v, j, d, i) {
            var val = styleArray[stride ? Math.floor(i / stride) : i];
            return val !== undefined ? val : fallback;
          });
        }
      } else {
        m_this.style(keyOrObject, function (d, i) {
          var val = styleArray[stride ? Math.floor(i / stride) : i];
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
    return m_renderer || (m_layer && m_layer.renderer());
  };

  /**
   * Get/Set the projection of the feature.
   *
   * @param {string?} [val] If `undefined`, return the current gcs.  If
   *    `null`, use the map's interface gcs.  Otherwise, set a new value for
   *    the gcs.
   * @returns {string|this} A string used by {@link geo.transform}.  If the
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
    if (m_this.renderer().baseToLocal) {
      c = m_this.renderer().baseToLocal(c);
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
   * webgl renderer.  A negative value hides the feature without stopping
   * interaction with it.  Otherwise, features with higher bin numbers are
   * drawn above those with lower bin numbers.  If two features have the same
   * bin number, their order relative to one another is indeterminate and may
   * be unstable.
   *
   * @param {number} [val] The new bin number.  If `undefined`, return the
   *    current bin number.  If `null`, the bin is dynamically computed based
   *    on order within the parent.  If children are nested, this may not be
   *    what is desired.
   * @param {boolean} [actualValue] If truthy and `val` is undefined, return
   *    the actual value of bin, rather than the dynamically computed value.
   * @returns {number|this} The current bin number or a reference to `this`.
   */
  this.bin = function (val, actualValue) {
    if (val === undefined) {
      if (m_bin === null && !actualValue) {
        var parent = m_this.parent(),
            idx = parent ? parent.children().indexOf(m_this) : -1;
        return idx >= 0 ? idx : 0;
      }
      return m_bin;
    } else {
      if (util.isNonNullFinite(val)) {
        m_bin = parseInt(val, 10);
      } else {
        m_bin = null;
      }
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
   * @param {boolean|string} [arg] `undefined` to return the selectionAPI
   *    state, a boolean to change the state, or `'auto'` to set the state
   *    based on the existence of event handlers.  When getting the state, if
   *    `direct` is not specified, `'auto'` is never returned.
   * @param {boolean} [direct] If `true`, when getting the selectionAPI state,
   *    disregard the state of the parent layer, and when setting, refresh the
   *    state regardless of whether it has changed or not.
   * @returns {boolean|string|this} Either the selectionAPI state or the
   *    feature instance.
   */
  this.selectionAPI = function (arg, direct) {
    if (arg === undefined) {
      if (!direct && m_layer && m_layer.selectionAPI && !m_layer.selectionAPI()) {
        return false;
      }
      if (!direct && m_selectionAPI === 'auto') {
        return !!m_this.geoIsOn(Object.values(geo_event.feature));
      }
      return m_selectionAPI;
    }
    if (arg !== 'auto') {
      arg = !!arg;
    }
    if (arg !== m_selectionAPI || direct) {
      m_selectionAPI = arg;
      m_this._unbindMouseHandlers();
      m_this._bindMouseHandlers();
    }
    return m_this;
  };

  /**
   * If the selectionAPI is on, then setting
   * `this.geoOn(geo.event.feature.mouseover_order, this.mouseOverOrderHighestIndex)`
   * will make it so that the mouseon events prefer the highest index feature.
   *
   * @param {geo.event} evt The event; this should be triggered from
   *    {@link geo.event.feature.mouseover_order}.
   */
  this.mouseOverOrderHighestIndex = function (evt) {
    // sort the found indices.  The last one is the one "on top".
    evt.over.index.sort();
    // this isn't necessary, but ensures that other event handlers have
    // consistent information
    var data = evt.feature.data();
    evt.over.index.forEach(function (di, idx) {
      evt.over.found[idx] = data[di];
    });
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
    m_style = Object.assign(
      {},
      {opacity: 1.0},
      arg.style === undefined ? {} : arg.style);
    m_this._bindMouseHandlers();
    m_ready = true;
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
   * Bind an event handler to this object.
   *
   * @param {string} event An event from {@link geo.event} or a user-defined
   *   value.
   * @param {function} handler A function that is called when `event` is
   *   triggered.  The function is passed a {@link geo.event} object.
   * @returns {this}
   */
  this.geoOn = function (event, handler) {
    var isAuto = m_this.selectionAPI(undefined, true) === 'auto',
        selection = isAuto && m_this.selectionAPI();
    var result = s_geoOn.apply(m_this, arguments);
    if (isAuto && !selection && m_this.selectionAPI()) {
      m_this._bindMouseHandlers();
    }
    return result;
  };

  /**
   * Remove handlers from one event or an array of events.  If no event is
   * provided all handlers will be removed.
   *
   * @param {string|string[]} [event] An event or a list of events from
   *   {@link geo.event} or defined by the user, or `undefined` to remove all
   *   events (in which case `arg` is ignored).
   * @param {(function|function[])?} [arg] A function or array of functions to
   *   remove from the events or a falsy value to remove all handlers from the
   *   events.
   * @returns {this}
   */
  this.geoOff = function (event, arg) {
    var isAuto = m_this.selectionAPI(undefined, true) === 'auto',
        selection = isAuto && m_this.selectionAPI();
    var result = s_geoOff.apply(m_this, arguments);
    if (isAuto && selection && !m_this.selectionAPI()) {
      m_this._unbindMouseHandlers();
    }
    return result;
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
    m_ready = false;
  };

  this._init(arg);
  return this;
};

/**
 * The most recent {@link geo.feature.event} triggered.
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
