var geo_event = require('../event');
var geo_action = require('../action');
var transform = require('../transform');
var util = require('../util');
var textFeature = require('../textFeature');

var annotationId = 0;

/**
 * @alias geo.annotation.state
 * @enum {string}
 */
var annotationState = {
  create: 'create',
  done: 'done',
  highlight: 'highlight',
  edit: 'edit',
  cursor: 'cursor'
};

var annotationActionOwner = 'annotationAction';

/**
 * These styles are applied to edit handles, and can be overridden by
 * individual annotations.
 *
 * @alias geo.annotation.defaultEditHandleStyle
 * @type {object}
 * @default
 */
var defaultEditHandleStyle = {
  fill: true,
  fillColor: function (d) {
    return d.selected ? {r: 0, g: 1, b: 1} : {r: 0.3, g: 0.3, b: 0.3};
  },
  fillOpacity: function (d) {
    return d.selected ? 0.5 : 0.25;
  },
  radius: function (d) {
    return d.type === 'edge' || d.type === 'rotate' ? 8 : 10;
  },
  scaled: false,
  stroke: true,
  strokeColor: {r: 0, g: 0, b: 1},
  strokeOpacity: 1,
  strokeWidth: function (d) {
    return d.type === 'edge' || d.type === 'rotate' ? 2 : 3;
  },
  rotateHandleOffset: 24, // should be roughly twice radius + strokeWidth
  rotateHandleRotation: -Math.PI / 4,
  resizeHandleOffset: 48, // should be roughly twice radius + strokeWidth + rotateHandleOffset
  resizeHandleRotation: -Math.PI / 4,
  // handles may be a function to dynamically generate the results
  handles: {  // if `false`, the handle won't be created for editing
    vertex: true,
    edge: true,
    center: true,
    rotate: true,
    resize: true
  }
};
var editHandleFeatureLevel = 3;

/**
 * General annotation specification.
 *
 * @typedef {object} geo.annotation.spec
 * @property {string} [name] A name for the annotation.  This defaults to the
 *    type with a unique ID suffixed to it.
 * @property {geo.annotationLayer} [layer] A reference to the controlling
 *    layer.  This is used for coordinate transforms.
 * @property {string} [state] Initial annotation state.  One of the
 *    {@link geo.annotation.state} values.
 * @property {boolean|string[]} [showLabel=true] `true` to show the annotation
 *    label on annotations in done or edit states.  Alternately, a list of
 *    states in which to show the label.  Falsy to not show the label.
 * @property {boolean} [allowBooleanOperations] This defaults to `true` for
 *    annotations that have area and `false` for those without area (e.g.,
 *    false for lines and points).  If it is truthy, then, when the annotation
 *    is being created, it checks the metakeys on the first click that defines
 *    a coordinate to determine what boolean polygon operation should be
 *    performaned on the completion of the annotation.
 */

/**
 * Base annotation class.
 *
 * @class
 * @alias geo.annotation
 * @param {string} type The type of annotation.  These should be registered
 *    with {@link geo.registerAnnotation} and can be listed with
 *    {@link geo.listAnnotations}.
 * @param {geo.annotation.spec?} [args] Options for the annotation.
 * @returns {geo.annotation}
 */
var annotation = function (type, args) {
  'use strict';
  if (!(this instanceof annotation)) {
    return new annotation(type, args);
  }

  var m_this = this,
      m_options = util.deepMerge({}, this.constructor.defaults, args || {}),
      m_id = m_options.annotationId;
  delete m_options.annotationId;
  if (m_id === undefined || (m_options.layer && m_options.layer.annotationById(m_id))) {
    annotationId += 1;
    if (m_id !== undefined) {
      console.warn('Annotation id ' + m_id + ' is in use; using ' + annotationId + ' instead.');  // eslint-disable-line no-console
    }
    m_id = annotationId;
  } else {
    if (m_id > annotationId) {
      annotationId = m_id;
    }
  }
  var m_name = m_options.name || (
        type.charAt(0).toUpperCase() + type.substr(1) + ' ' + m_id),
      m_label = m_options.label || null,
      m_description = m_options.description || undefined,
      m_type = type,
      m_layer = m_options.layer,
      /* one of annotationState.* */
      m_state = m_options.state || annotationState.done;
  delete m_options.state;
  delete m_options.layer;
  delete m_options.name;
  delete m_options.label;
  delete m_options.description;

  if (m_options.constraint) {
    if (util.isFunction(m_options.constraint)) {
      this._selectionConstraint = m_options.constraint;
    } else {
      this._selectionConstraint = constrainAspectRatio(m_options.constraint);
    }
  }

  /**
   * Clean up any resources that the annotation is using.
   */
  this._exit = function () {
    if (m_this.layer()) {
      m_this.layer().geoOff(geo_event.mousemove, m_this._cursorHandleMousemove);
    }
  };

  /**
   * Get a unique annotation id.
   *
   * @returns {number} The annotation id.
   */
  this.id = function () {
    return m_id;
  };

  /**
   * Assign a new id to this annotation.
   *
   * @returns {this}
   */
  this.newId = function () {
    annotationId += 1;
    m_id = annotationId;
    return m_this;
  };

  /**
   * Get or set the name of this annotation.
   *
   * @param {string|undefined} [arg] If `undefined`, return the name, otherwise
   *    change it.  When setting the name, the value is trimmed of
   *    whitespace.  The name will not be changed to an empty string.
   * @returns {this|string} The current name or this annotation.
   */
  this.name = function (arg) {
    if (arg === undefined) {
      return m_name;
    }
    if (arg !== null && ('' + arg).trim()) {
      arg = ('' + arg).trim();
      if (arg !== m_name) {
        m_name = arg;
        m_this.modified();
      }
    }
    return m_this;
  };

  /**
   * Get or set the label of this annotation.
   *
   * @param {string|null|undefined} [arg] If `undefined`, return the label,
   *    otherwise change it.  `null` to clear the label.
   * @param {boolean} [noFallback] If not truthy and the label is `null`,
   *    return the name, otherwise return the actual value for label.
   * @returns {this|string} The current label or this annotation.
   */
  this.label = function (arg, noFallback) {
    if (arg === undefined) {
      return m_label === null && !noFallback ? m_name : m_label;
    }
    if (arg !== m_label) {
      m_label = arg;
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Return the coordinate associated with the label.
   *
   * @returns {geo.geoPosition|undefined} The map gcs position for the label,
   *    or `undefined` if no such position exists.
   */
  this._labelPosition = function () {
    return util.centerFromPerimeter(m_this._coordinates());
  };

  /**
   * Return the coordinate associated with the rotation handle for the
   * annotation.
   *
   * @param {number} [offset] An additional offset from cetner to apply to the
   *    handle.
   * @param {number} [rotation] An additional rotation to apply to the handle.
   * @returns {geo.geoPosition|undefined} The map gcs position for the handle,
   *    or `undefined` if no such position exists.
   */
  this._rotateHandlePosition = function (offset, rotation) {
    var map = m_this.layer().map(),
        coord = m_this._coordinates(),
        center = util.centerFromPerimeter(m_this._coordinates()),
        dispCenter = center ? map.gcsToDisplay(center, null) : undefined,
        i, pos, maxr2 = 0, r;
    if (!center) {
      return;
    }
    offset = offset || 0;
    rotation = rotation || 0;
    coord = coord.outer ? coord.outer : coord;
    for (i = 0; i < coord.length; i += 1) {
      pos = map.gcsToDisplay(coord[i], null);
      maxr2 = Math.max(maxr2, Math.pow(pos.x - dispCenter.x, 2) + Math.pow(pos.y - dispCenter.y, 2));
    }
    r = Math.sqrt(maxr2) + offset;
    pos = map.displayToGcs({
      x: dispCenter.x + r * Math.cos(rotation),
      y: dispCenter.y - r * Math.sin(rotation)}, null);
    return pos;
  };

  /**
   * If the label should be shown, get a record of the label that can be used
   * in a {@link geo.textFeature}.
   *
   * @returns {geo.annotationLayer.labelRecord|undefined} A label record, or
   *    `undefined` if it should not be shown.
   */
  this.labelRecord = function () {
    var show = m_this.options('showLabel');
    if (!show) {
      return;
    }
    var state = m_this.state();
    if ((show === true && state === annotationState.create) ||
        (show !== true && show.indexOf(state) < 0)) {
      return;
    }
    var style = m_this.labelStyle();
    var labelRecord = {
      text: m_this.label(),
      position: m_this._labelPosition()
    };
    if (!labelRecord.position) {
      return;
    }
    if (style) {
      labelRecord.style = style;
    }
    return labelRecord;
  };

  /**
   * Get or set the description of this annotation.
   *
   * @param {string|undefined} arg If `undefined`, return the description,
   *    otherwise change it.
   * @returns {this|string} The current description or this annotation.
   */
  this.description = function (arg) {
    if (arg === undefined) {
      return m_description;
    }
    if (arg !== m_description) {
      m_description = arg;
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get or set the annotation layer associated with this annotation.
   *
   * @param {geo.annotationLayer|undefined} arg if undefined, return the layer,
   *    otherwise change it.
   * @returns {this|geo.annotationLayer} the current layer or this annotation.
   */
  this.layer = function (arg) {
    if (arg === undefined) {
      return m_layer;
    }
    m_layer = arg;
    return m_this;
  };

  this._cursorHandleMousemove = function (evt) {
    m_this.layer()._handleMouseMoveModifiers(evt);
    const center = m_this._cursorCenter;
    const delta = {
      x: evt.mapgcs.x - center.x,
      y: evt.mapgcs.y - center.y
    };
    if (delta.x || delta.y) {
      const curPts = m_this._coordinates();
      var pts = m_this._coordinatesMapFunc(curPts, function (elem) {
        return {x: elem.x + delta.x, y: elem.y + delta.y};
      });
      m_this._coordinates(pts);
      m_this._cursorCenter = evt.mapgcs;
      m_this.modified();
      m_this.draw();
      return true;
    }
    return false;
  };

  /**
   * Get or set the state of this annotation.
   *
   * @param {string|undefined} [arg] If `undefined`, return the state,
   *    otherwise change it.  This should be one of the
   *    {@link geo.annotation.state} values.
   * @returns {this|string} The current state or this annotation.
   * @fires geo.event.annotation.state
   */
  this.state = function (arg) {
    if (arg === undefined) {
      return m_state;
    }
    if (m_state !== arg) {
      m_state = arg;
      if (m_this.layer()) {
        m_this.layer().geoTrigger(geo_event.annotation.state, {
          annotation: m_this
        });
      }
      if (m_this.layer()) {
        m_this.layer().geoOff(geo_event.mousemove, m_this._cursorHandleMousemove);
      }
      switch (m_state) {
        case annotationState.cursor:
          m_this._cursorCenter = util.centerFromPerimeter(m_this._coordinates());
          if (m_this.layer()) {
            m_this.layer().geoOn(geo_event.mousemove, m_this._cursorHandleMousemove);
          }
          break;
      }
    }
    return m_this;
  };

  /**
   * Return actions needed for the specified state of this annotation.
   *
   * @param {string} [state] The state to return actions for.  Defaults to
   *    the current state.
   * @returns {geo.actionRecord[]} A list of actions.
   */
  this.actions = function (state) {
    if (!state) {
      state = m_this.state();
    }
    switch (state) {
      case annotationState.edit:
        return [{
          action: geo_action.annotation_edit_handle,
          name: 'annotation edit',
          owner: annotationActionOwner,
          input: 'left'
        }, {
          action: geo_action.annotation_edit_handle,
          name: 'annotation edit',
          owner: annotationActionOwner,
          input: 'pan'
        }];
      case annotationState.cursor:
        return [{
          action: geo_action.annotation_cursor,
          name: 'annotation cursor',
          owner: annotationActionOwner,
          input: 'pan'
        }, {
          action: geo_action.annotation_cursor,
          name: 'annotation cursor',
          owner: annotationActionOwner,
          input: 'left'
        }];
      default:
        return [];
    }
  };

  /**
   * Process any non-edit actions for this annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, `'done'` if the
   *    annotation was completed (changed from create to done state),
   *    `'remove'` if the annotation should be removed, falsy to not update
   *    anything.
   */
  this.processAction = function (evt) {
    return undefined;
  };

  /**
   * Process any edit actions for this annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean?} `true` to update the annotation, falsy to not update
   *    anything.
   */
  this.processEditAction = function (evt) {
    if (!evt || !m_this._editHandle || !m_this._editHandle.handle) {
      return undefined;
    }
    switch (m_this._editHandle.handle.type) {
      case 'vertex':
        return m_this._processEditActionVertex(evt);
      case 'edge':
        return m_this._processEditActionEdge(evt);
      case 'center':
        return m_this._processEditActionCenter(evt);
      case 'rotate':
        return m_this._processEditActionRotate(evt);
      case 'resize':
        return m_this._processEditActionResize(evt);
    }
    return undefined;
  };

  /**
   * Return a copy of the _coordinates or a geo.polygon record so that it
   * doesn't share memory with the original.
   *
   * @param {geo.polygon} [coord] if specified, return a copy of this object.
   *   Otherwise, return a copy of this._coordinates.
   * @returns {geo.polygon}
   */
  this._copyOfCoordinates = function (coord) {
    coord = coord || m_this._coordinates();
    if (!coord.outer) {
      return coord.slice();
    }
    return {outer: coord.outer.slice(), inner: (coord.inner || []).map((h) => h.slice())};
  };

  /**
   * When an edit handle is selected or deselected (for instance, by moving the
   * mouse on or off of it), mark if it is selected and record the current
   * coordinates.
   *
   * @param {object} handle The data for the edit handle.
   * @param {boolean} enable True to enable the handle, false to disable.
   * @returns {this}
   * @fires geo.event.annotation.select_edit_handle
   */
  this.selectEditHandle = function (handle, enable) {
    if (enable && m_this._editHandle && m_this._editHandle.handle &&
        m_this._editHandle.handle.selected) {
      m_this._editHandle.handle.selected = false;
    }
    handle.selected = enable;
    var amountRotated = (m_this._editHandle || {}).amountRotated || 0;
    m_this._editHandle = {
      handle: handle,
      startCoordinates: m_this._copyOfCoordinates(),
      center: util.centerFromPerimeter(m_this._coordinates()),
      rotatePosition: m_this._rotateHandlePosition(
        handle.style.rotateHandleOffset, handle.style.rotateHandleRotation + amountRotated),
      startAmountRotated: amountRotated,
      amountRotated: amountRotated,
      resizePosition: m_this._rotateHandlePosition(
        handle.style.resizeHandleOffset, handle.style.resizeHandleRotation)
    };
    if (m_this.layer()) {
      m_this.layer().geoTrigger(geo_event.annotation.select_edit_handle, {
        annotation: m_this,
        handle: m_this._editHandle,
        enable: enable
      });
    }
    return m_this;
  };

  /**
   * Get or set options.
   *
   * @param {string|object} [arg1] If `undefined`, return the options object.
   *    If a string, either set or return the option of that name.  If an
   *    object, update the options with the object's values.
   * @param {object} [arg2] If `arg1` is a string and this is defined, set
   *    the option to this value.
   * @returns {object|this} If options are set, return the annotation,
   *    otherwise return the requested option or the set of options.
   * @fires geo.event.annotation.coordinates
   */
  this.options = function (arg1, arg2) {
    if (arg1 === undefined) {
      return m_options;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return m_options[arg1];
    }
    var coordinatesSet;
    if (arg2 === undefined) {
      coordinatesSet = arg1[m_this._coordinateOption] !== undefined;
      m_options = util.deepMerge(m_options, arg1);
      /* For style objects, re-extend them without recursion.  This allows
       * setting colors without an opacity field, for instance. */
      ['style', 'createStyle', 'editStyle', 'editHandleStyle', 'labelStyle',
        'highlightStyle', 'cursorStyle'
      ].forEach(function (key) {
        if (arg1[key] !== undefined) {
          Object.assign(m_options[key], arg1[key]);
        }
      });
    } else {
      coordinatesSet = arg1 === m_this._coordinateOption;
      m_options[arg1] = arg2;
    }
    if (m_options.coordinates) {
      var coord = m_options.coordinates;
      delete m_options.coordinates;
      m_this._coordinates(coord);
    }
    if (m_options.name !== undefined) {
      var name = m_options.name;
      delete m_options.name;
      m_this.name(name);
    }
    if (m_options.label !== undefined) {
      var label = m_options.label;
      delete m_options.label;
      m_this.label(label);
    }
    if (m_options.description !== undefined) {
      var description = m_options.description;
      delete m_options.description;
      m_this.description(description);
    }
    m_this.modified();
    if (coordinatesSet && m_this.layer()) {
      m_this.layer().geoTrigger(geo_event.annotation.coordinates, {
        annotation: m_this
      });
    }
    return m_this;
  };

  /**
   * Get or set style.
   *
   * @param {string|object} [arg1] If `undefined`, return the current style
   *    object.  If a string and `arg2` is undefined, return the style
   *    associated with the specified key.  If a string and `arg2` is defined,
   *    set the named style to the specified value.  Otherwise, extend the
   *    current style with the values in the specified object.
   * @param {*} [arg2] If `arg1` is a string, the new value for that style.
   * @param {string} [styleType] The name of the style type, such as
   *    `createStyle`, `editStyle`, `editHandleStyle`, `labelStyle`,
   *    `highlightStyle`, or `cursorStyle`.
   * @returns {object|this} Either the entire style object, the value of a
   *    specific style, or the current class instance.
   */
  this.style = function (arg1, arg2, styleType) {
    styleType = styleType || 'style';
    if (arg1 === undefined) {
      return m_options[styleType];
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return (m_options[styleType] || {})[arg1];
    }
    if (m_options[styleType] === undefined) {
      m_options[styleType] = {};
    }
    if (arg2 === undefined) {
      m_options[styleType] = util.deepMerge(m_options[styleType], arg1);
    } else {
      m_options[styleType][arg1] = arg2;
    }
    m_this.modified();
    return m_this;
  };

  /**
   * Calls {@link geo.annotation#style} with `styleType='createStyle'`.
   * @function createStyle
   * @memberof geo.annotation
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='editStyle'`.
   * @function editStyle
   * @memberof geo.annotation
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='editHandleStyle'`.
   * @function editHandleStyle
   * @memberof geo.annotation
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='labelStyle'`.
   * @function labelStyle
   * @memberof geo.annotation
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='highlightStyle'`.
   * @function highlightStyle
   * @memberof geo.annotation
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='cursorStyle'`.
   * @function cursorStyle
   * @memberof geo.annotation
   * @instance
   */
  ['createStyle', 'editStyle', 'editHandleStyle', 'labelStyle', 'highlightStyle', 'cursorStyle'
  ].forEach(function (styleType) {
    m_this[styleType] = function (arg1, arg2) {
      return m_this.style(arg1, arg2, styleType);
    };
  });

  /**
   * Return the style dictionary for a particular state.
   * @param {string} [state] The state to return styles for.  Defaults to the
   *    current state.
   * @returns {object} The style object for the state.  If there is no such
   *    style defined, the default style is used.
   */
  this.styleForState = function (state) {
    state = state || m_this.state();
    /* for some states, fall back to the general style if they don't specify a
     * value explicitly. */
    if (state === annotationState.edit || state === annotationState.highlight) {
      return Object.assign({}, m_options.style, m_options[state + 'Style']);
    }
    if (state === annotationState.create) {
      return Object.assign({}, m_options.style, m_options.editStyle,
                           m_options[state + 'Style']);
    }
    if (state === annotationState.cursor) {
      return Object.assign({}, m_options.style, m_options.editStyle,
                           m_options.createStyle, m_options[state + 'Style']);
    }
    return m_options[state + 'Style'] || m_options.style || {};
  };

  /**
   * Get the type of this annotation.
   *
   * @returns {string} The annotation type.
   */
  this.type = function () {
    return m_type;
  };

  /**
   * Get a list of renderable features for this annotation.  The list index is
   * functionally a z-index for the feature.  Each entry is a dictionary with
   * the key as the feature name (such as `line`, `quad`, or `polygon`), and
   * the value a dictionary of values to pass to the feature constructor, such
   * as `style` and `coordinates`.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    return [];
  };

  /**
   * Handle a mouse click on this annotation.  If the event is processed,
   * evt.handled should be set to `true` to prevent further processing.
   *
   * @param {geo.event} evt The mouse click event.
   * @returns {boolean|string} `true` to update the annotation, `'done'` if
   *    the annotation was completed (changed from create to done state),
   *    `'remove'` if the annotation should be removed, falsy to not update
   *    anything.
   */
  this.mouseClick = function (evt) {
    return undefined;
  };

  /**
   * Handle a mouse click on this annotation when in edit mode.  If the event
   * is processed, evt.handled should be set to `true` to prevent further
   * processing.
   *
   * @param {geo.event} evt The mouse click event.
   * @returns {boolean|string} `true` to update the annotation, `'done'` if
   *    the annotation was completed (changed from create to done state),
   *    `'remove'` if the annotation should be removed, falsy to not update
   *    anything.
   */
  this.mouseClickEdit = function (evt) {
    return undefined;
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt The mouse move event.
   * @returns {boolean} Truthy to update the annotation, falsy to not
   *    update anything.
   */
  this.mouseMove = function (evt) {
    return undefined;
  };

  /**
   * Get or set coordinates associated with this annotation in the map gcs
   * coordinate system.
   *
   * @param {geo.geoPosition[]} [coordinates] An optional array of coordinates
   *  to set.
   * @returns {geo.geoPosition[]} The current array of coordinates.
   */
  this._coordinates = function (coordinates) {
    return [];
  };

  this._coordinateOption = 'vertices';

  /**
   * Get coordinates associated with this annotation.
   *
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.geoPosition[]} An array of coordinates.
   */
  this.coordinates = function (gcs) {
    var coord = m_this._coordinates() || [];
    if (!coord.length && (!coord.outer || !coord.outer.length)) {
      coord = [];
    }
    if (m_this.layer()) {
      var map = m_this.layer().map();
      gcs = (gcs === null ? map.gcs() : (
        gcs === undefined ? map.ingcs() : gcs));
      if (gcs !== map.gcs()) {
        coord = m_this._convertCoordinates(map.gcs(), gcs, coord);
      }
    }
    return coord;
  };

  /**
   * Mark this annotation as modified.  This just marks the parent layer as
   * modified.
   *
   * @returns {this} The annotation.
   */
  this.modified = function () {
    if (m_this.layer()) {
      m_this.layer().modified();
    }
    return m_this;
  };

  /**
   * Draw this annotation.  This just updates and draws the parent layer.
   *
   * @returns {this} The annotation.
   */
  this.draw = function () {
    if (m_this.layer()) {
      m_this.layer()._update();
      m_this.layer().draw();
    }
    return m_this;
  };

  /**
   * Return a list of styles that should be preserved in a geojson
   * representation of the annotation.
   *
   * @returns {string[]} A list of style names to store.
   */
  this._geojsonStyles = function () {
    return [
      'closed', 'fill', 'fillColor', 'fillOpacity', 'lineCap', 'lineJoin',
      'radius', 'stroke', 'strokeColor', 'strokeOffset', 'strokeOpacity',
      'strokeWidth'];
  };

  /**
   * Return the coordinates to be stored in a geojson geometry object.
   *
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.
   * @returns {array} An array of flattened coordinates in the interface gcs
   *    coordinate system.  `undefined` if this annotation is incomplete.
   */
  this._geojsonCoordinates = function (gcs) {
    return [];
  };

  /**
   * Return the geometry type that is used to store this annotation in geojson.
   *
   * @returns {string} A geojson geometry type.
   */
  this._geojsonGeometryType = function () {
    return '';
  };

  /**
   * Return the annotation as a geojson object.
   *
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.
   * @param {boolean} [includeCrs] If truthy, include the coordinate system.
   * @returns {object?} The annotation as a geojson object, or `undefined` if it
   *    should not be represented (for instance, while it is being created).
   */
  this.geojson = function (gcs, includeCrs) {
    var coord = m_this._geojsonCoordinates(gcs),
        geotype = m_this._geojsonGeometryType(),
        styles = m_this._geojsonStyles(),
        objStyle = m_this.options('style') || {},
        objLabelStyle = m_this.labelStyle() || {},
        i, key, value;
    if (!coord || !coord.length || !geotype) {
      return undefined;
    }
    var obj = {
      type: 'Feature',
      geometry: {
        type: geotype,
        coordinates: coord
      },
      properties: {
        annotationType: m_type,
        name: m_this.name(),
        annotationId: m_this.id()
      }
    };
    if (m_label) {
      obj.properties.label = m_label;
    }
    if (m_description) {
      obj.properties.description = m_description;
    }
    if (m_this.options('showLabel') === false) {
      obj.properties.showLabel = m_this.options('showLabel');
    }
    for (i = 0; i < styles.length; i += 1) {
      key = styles[i];
      value = util.ensureFunction(objStyle[key])();
      if (value !== undefined) {
        let defvalue = ((m_this.constructor.defaults || {}).style || {})[key];
        if (key.toLowerCase().match(/color$/)) {
          value = util.convertColorToHex(value, 'needed');
          defvalue = defvalue !== undefined ? util.convertColorToHex(defvalue, 'needed') : defvalue;
        }
        if (value !== defvalue) {
          obj.properties[key] = value;
        }
      }
    }
    for (i = 0; i < textFeature.usedStyles.length; i += 1) {
      key = textFeature.usedStyles[i];
      value = util.ensureFunction(objLabelStyle[key])();
      if (value !== undefined) {
        if (key.toLowerCase().match(/color$/)) {
          value = util.convertColorToHex(value, 'needed');
        }
        obj.properties['label' + key.charAt(0).toUpperCase() + key.slice(1)] = value;
      }
    }
    if (includeCrs) {
      var map = m_this.layer().map();
      gcs = (gcs === null ? map.gcs() : (
        gcs === undefined ? map.ingcs() : gcs));
      obj.crs = {
        type: 'name',
        properties: {
          type: 'proj4',
          name: gcs
        }
      };
    }
    return obj;
  };

  /**
   * Add edit handles to the feature list.
   *
   * @param {array} features The array of features to modify.
   * @param {geo.geoPosition[]} vertices An array of vertices in map gcs
   *    coordinates.
   * @param {object} [opts] If specified, the keys are the types of the
   *    handles.  This matches the `editHandleStyle.handle` object.  Any type
   *    that is set to `false` in either `opts` or `editHandleStyle.handle`
   *    will prevent those handles from being created.
   * @param {boolean} [isOpen] If true, no edge handle will be created
   *    between the last and first vertices.
   */
  this._addEditHandles = function (features, vertices, opts, isOpen) {
    var editPoints,
        style = Object.assign({}, defaultEditHandleStyle, m_this.editHandleStyle()),
        handles = util.ensureFunction(style.handles)() || {},
        selected = (
          m_this._editHandle && m_this._editHandle.handle &&
          m_this._editHandle.handle.selected ?
            m_this._editHandle.handle : undefined);
    /* opts specify which handles are allowed.  They must be allowed by the
     * original opts object and by the editHandleStyle.handle object. */
    opts = Object.assign({}, opts);
    Object.keys(handles).forEach(function (key) {
      if (handles[key] === false) {
        opts[key] = false;
      }
    });
    if (!features[editHandleFeatureLevel]) {
      features[editHandleFeatureLevel] = {point: []};
    }
    editPoints = features[editHandleFeatureLevel].point;
    const vertexList = vertices.outer ? [vertices.outer].concat(vertices.inner || []) : [vertices];
    vertexList.forEach((vert, vidx) => {
      vert.forEach(function (pt, idx) {
        if (opts.vertex !== false) {
          editPoints.push(Object.assign({}, pt, {type: 'vertex', index: idx, vindex: vidx, style: style, editHandle: true}));
        }
        if (opts.edge !== false && idx !== vert.length - 1 && (pt.x !== vert[idx + 1].x || pt.y !== vert[idx + 1].y)) {
          editPoints.push(Object.assign({
            x: (pt.x + vert[idx + 1].x) / 2,
            y: (pt.y + vert[idx + 1].y) / 2
          }, {type: 'edge', index: idx, vindex: vidx, style: style, editHandle: true}));
        }
        if (opts.edge !== false && !isOpen && idx === vert.length - 1 && (pt.x !== vert[0].x || pt.y !== vert[0].y)) {
          editPoints.push(Object.assign({
            x: (pt.x + vert[0].x) / 2,
            y: (pt.y + vert[0].y) / 2
          }, {type: 'edge', index: idx, vindex: vidx, style: style, editHandle: true}));
        }
      });
    });
    if (opts.center !== false) {
      editPoints.push(Object.assign({}, util.centerFromPerimeter(m_this._coordinates()), {type: 'center', style: style, editHandle: true}));
    }
    if (opts.rotate !== false) {
      editPoints.push(Object.assign(m_this._rotateHandlePosition(
        style.rotateHandleOffset,
        style.rotateHandleRotation + (selected && selected.type === 'rotate' ? m_this._editHandle.amountRotated : 0)
      ), {type: 'rotate', style: style, editHandle: true}));
      if (m_this._editHandle && (!selected || selected.type !== 'rotate')) {
        m_this._editHandle.amountRotated = 0;
      }
    }
    if (opts.resize !== false) {
      editPoints.push(Object.assign(m_this._rotateHandlePosition(
        style.resizeHandleOffset,
        style.resizeHandleRotation
      ), {type: 'resize', style: style, editHandle: true}));
    }
    if (selected) {
      editPoints.forEach(function (pt) {
        if (pt.type === selected.type && pt.index === selected.index && pt.vindex === selected.vindex) {
          pt.selected = true;
        }
      });
    }
  };

  /**
   * Apply a map function of a geo.polygon.
   *
   * @param {geo.polygon} coord The polygon to apply the function to.
   * @param {function} func The function to apply.
   * @returns {array} The map results.
   */
  this._coordinatesMapFunc = function (coord, func) {
    if (!coord.outer) {
      return coord.map(func);
    }
    return {
      outer: coord.outer.map(func),
      inner: (coord.inner || []).map((h) => h.map(func))
    };
  };

  /**
   * Check if two geo.polygons differ in their first point.
   *
   * @param {geo.polygon} coord1 One polygon to compare.
   * @param {geo.polygon} coord2 A second polygon to compare.
   * @returns {boolean} true if the first point matches.
   */
  this._firstPointDifferent = function (coord1, coord2) {
    coord1 = coord1.outer ? coord1.outer : coord1;
    coord2 = coord2.outer ? coord2.outer : coord2;
    return (coord1[0].x !== coord2[0].x || coord1[0].y !== coord2[0].y);
  };

  /**
   * Process the edit center action for a general annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, falsy to not
   *    update anything.
   */
  this._processEditActionCenter = function (evt) {
    var start = m_this._editHandle.startCoordinates,
        delta = {
          x: evt.mouse.mapgcs.x - evt.state.origin.mapgcs.x,
          y: evt.mouse.mapgcs.y - evt.state.origin.mapgcs.y
        },
        curPts = m_this._coordinates();
    var pts = m_this._coordinatesMapFunc(start, function (elem) {
      return {x: elem.x + delta.x, y: elem.y + delta.y};
    });
    if (m_this._firstPointDifferent(pts, curPts)) {
      m_this._coordinates(pts);
      return true;
    }
    return false;
  };

  /**
   * Process the edit rotate action for a general annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, falsy to not
   *    update anything.
   */
  this._processEditActionRotate = function (evt) {
    var handle = m_this._editHandle,
        start = handle.startCoordinates,
        delta = {
          x: evt.mouse.mapgcs.x - evt.state.origin.mapgcs.x,
          y: evt.mouse.mapgcs.y - evt.state.origin.mapgcs.y
        },
        ang1 = Math.atan2(
          handle.rotatePosition.y - handle.center.y,
          handle.rotatePosition.x - handle.center.x),
        ang2 = Math.atan2(
          handle.rotatePosition.y + delta.y - handle.center.y,
          handle.rotatePosition.x + delta.x - handle.center.x),
        ang = ang2 - ang1,
        curPts = m_this._coordinates();
    var pts = m_this._coordinatesMapFunc(start, function (elem) {
      var delta = {x: elem.x - handle.center.x, y: elem.y - handle.center.y};
      return {
        x: delta.x * Math.cos(ang) - delta.y * Math.sin(ang) + handle.center.x,
        y: delta.x * Math.sin(ang) + delta.y * Math.cos(ang) + handle.center.y
      };
    });
    if (m_this._firstPointDifferent(pts, curPts)) {
      m_this._coordinates(pts);
      handle.amountRotated = handle.startAmountRotated + ang;
      return true;
    }
    return false;
  };

  /**
   * Process the edit resize action for a general annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, falsy to not
   *    update anything.
   */
  this._processEditActionResize = function (evt) {
    var handle = m_this._editHandle,
        start = handle.startCoordinates,
        delta = {
          x: evt.mouse.mapgcs.x - evt.state.origin.mapgcs.x,
          y: evt.mouse.mapgcs.y - evt.state.origin.mapgcs.y
        },
        map = m_this.layer().map(),
        p0 = map.gcsToDisplay(handle.center, null),
        p1 = map.gcsToDisplay(handle.resizePosition, null),
        p2 = map.gcsToDisplay({
          x: handle.resizePosition.x + delta.x,
          y: handle.resizePosition.y + delta.y
        }, null),
        d01 = Math.pow(Math.pow(p1.y - p0.y, 2) +
                       Math.pow(p1.x - p0.x, 2), 0.5) -
              handle.handle.style.resizeHandleOffset,
        d02 = Math.pow(Math.pow(p2.y - p0.y, 2) +
                       Math.pow(p2.x - p0.x, 2), 0.5) -
              handle.handle.style.resizeHandleOffset,
        curPts = m_this._coordinates();
    if (d02 && d01) {
      var scale = d02 / d01;
      var pts = m_this._coordinatesMapFunc(start, function (elem) {
        return {
          x: (elem.x - handle.center.x) * scale + handle.center.x,
          y: (elem.y - handle.center.y) * scale + handle.center.y
        };
      });
      if (m_this._firstPointDifferent(pts, curPts)) {
        m_this._coordinates(pts);
        return true;
      }
    }
    return false;
  };

  /**
   * Process the edit edge action for a general annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, falsy to not
   *    update anything.
   */
  this._processEditActionEdge = function (evt) {
    var handle = m_this._editHandle,
        index = handle.handle.index,
        vindex = handle.handle.vindex,
        curPts = m_this._coordinates();
    if (!curPts.outer) {
      curPts.splice(index + 1, 0, {x: handle.handle.x, y: handle.handle.y});
    } else {
      const loop = vindex ? curPts.inner[vindex - 1] : curPts.outer;
      loop.splice(index + 1, 0, {x: handle.handle.x, y: handle.handle.y});
    }
    handle.handle.type = 'vertex';
    handle.handle.index += 1;
    handle.startCoordinates = m_this._copyOfCoordinates(curPts);
    m_this.modified();
    return true;
  };

  /**
   * Process the edit vertex action for a general annotation.
   *
   * @param {geo.event} evt The action event.
   * @param {boolean} [canClose] if True, this annotation has a closed style
   *    that indicates if the first and last vertices are joined.  If falsy, is
   *    allowed to be changed to true.
   * @returns {boolean|string} `true` to update the annotation, `false` to
   *    prevent closure, any other falsy to not update anything.
   */
  this._processEditActionVertex = function (evt, canClose) {
    var handle = m_this._editHandle,
        index = handle.handle.index,
        vindex = handle.handle.vindex,
        start = handle.startCoordinates,
        ptsRef = m_this._coordinates(),
        curPts = ptsRef.outer ? (vindex ? ptsRef.inner[vindex - 1] : ptsRef.outer) : ptsRef,
        origLen = curPts.length,
        origPt = curPts[index],
        delta = {
          x: evt.mouse.mapgcs.x - evt.state.origin.mapgcs.x,
          y: evt.mouse.mapgcs.y - evt.state.origin.mapgcs.y
        },
        layer = m_this.layer(),
        aPP = layer.options('adjacentPointProximity'),
        near, atEnd;

    if (start.outer) {
      start = vindex ? start.inner[vindex - 1] : start.outer;
    }
    curPts[index] = {
      x: start[index].x + delta.x,
      y: start[index].y + delta.y
    };
    if (layer.displayDistance(curPts[index], null, start[index], null) <= aPP) {
      /* if we haven't moved at least aPP from where the vertex started, don't
       * allow it to be merged into another vertex.  This prevents small scale
       * edits from collapsing immediately. */
    } else if (layer.displayDistance(
      curPts[index], null,
      curPts[(index + 1) % curPts.length], null) <= aPP) {
      near = (index + 1) % curPts.length;
    } else if (layer.displayDistance(
      curPts[index], null,
      curPts[(index + curPts.length - 1) % curPts.length], null) <= aPP) {
      near = (index + curPts.length - 1) % curPts.length;
    }
    atEnd = ((near === 0 && index === curPts.length - 1) ||
             (near === curPts.length - 1 && index === 0));
    if (canClose === false && atEnd) {
      near = undefined;
    }
    if (near !== undefined && curPts.length > (canClose || m_this.options('style').closed ? 3 : 2)) {
      curPts[index] = {x: curPts[near].x, y: curPts[near].y};
      if (evt.event === geo_event.actionup) {
        if (canClose && atEnd) {
          m_this.options('style').closed = true;
        }
        curPts.splice(index, 1);
      }
    }
    if (curPts.length === origLen &&
        curPts[index].x === origPt.x && curPts[index].y === origPt.y) {
      return false;
    }

    m_this._coordinates(ptsRef);
    return true;
  };

  /**
   * Transform the annotations coordinates from one gcs to another.
   *
   * @param {string|geo.transform} oldgcs The current gcs.
   * @param {string|geo.transform} newgcs The new gcs.
   * @param {geo.polygon} [coord] If not specified, convert the coordinates in
   *   place.  If specified, convert these coordinates and return them (don't
   *   alter the existing values).
   * @returns {geo.polygon}
   */
  this._convertCoordinates = function (oldgcs, newgcs, coord) {
    const store = !coord;
    coord = coord || m_this._coordinates();
    if (!coord.outer) {
      coord = transform.transformCoordinates(oldgcs, newgcs, coord);
    } else {
      coord = {
        outer: transform.transformCoordinates(oldgcs, newgcs, coord.outer),
        inner: (coord.inner || []).map((h) => transform.transformCoordinates(oldgcs, newgcs, h))
      };
    }
    if (store) {
      m_this._coordinates(coord);
    }
    return coord;
  };
};

/* Functions used by multiple annotations */

/**
 * Return actions needed for the specified state of this annotation.
 *
 * @private
 * @param {object} m_this The current annotation instance.
 * @param {function} s_actions The parent actions method.
 * @param {string|undefined} state The state to return actions for.  Defaults
 *    to the current state.
 * @param {string} name The name of this annotation.
 * @param {Array} originalArgs arguments to original call
 * @returns {geo.actionRecord[]} A list of actions.
 */
function continuousVerticesActions(m_this, s_actions, state, name, originalArgs) {
  if (!state) {
    state = m_this.state();
  }
  switch (state) {
    case annotationState.create:
      return [{
        action: geo_action['annotation_' + name],
        name: name + ' create',
        owner: annotationActionOwner,
        input: 'left'
      }, {
        action: geo_action['annotation_' + name],
        name: name + ' create',
        owner: annotationActionOwner,
        input: 'pan'
      }];
    default:
      return s_actions.apply(m_this, originalArgs);
  }
}

/**
 * Process actions to allow drawing continuous vertices for an annotation.
 *
 * @private
 * @param {object} m_this The current annotation instance.
 * @param {geo.event} evt The action event.
 * @param {string} name The name of this annotation.
 * @returns {boolean|string|undefined} `true` to update the annotation,
 *    `'done'` if the annotation was completed (changed from create to done
 *    state), `'remove'` if the annotation should be removed, falsy to not
 *    update anything.
 */
function continuousVerticesProcessAction(m_this, evt, name) {
  var layer = m_this.layer();
  if (m_this.state() !== annotationState.create || !layer ||
      evt.state.action !== geo_action['annotation_' + name]) {
    return undefined;
  }
  var cpp = layer.options('continuousPointProximity');
  var cpc = layer.options('continuousPointCollinearity');
  var ccp = layer.options('continuousCloseProximity');
  if (cpp || cpp === 0) {
    var vertices = m_this.options('vertices');
    var update = false;
    if (!vertices.length) {
      vertices.push(evt.mouse.mapgcs);
      vertices.push(evt.mouse.mapgcs);
      return true;
    }
    var dist = layer.displayDistance(vertices[vertices.length - 2], null, evt.mouse.map, 'display');
    if (dist && dist > cpp) {
      // combine nearly collinear points
      if (vertices.length >= (m_this._lastClickVertexCount || 1) + 3) {
        var d01 = layer.displayDistance(vertices[vertices.length - 3], null, vertices[vertices.length - 2], null),
            d12 = dist,
            d02 = layer.displayDistance(vertices[vertices.length - 3], null, evt.mouse.map, 'display');
        if (d01 && d02) {
          var costheta = (d02 * d02 - d01 * d01 - d12 * d12) / (2 * d01 * d12);
          if (costheta > Math.cos(cpc)) {
            vertices.pop();
          }
        }
      }
      vertices[vertices.length - 1] = evt.mouse.mapgcs;
      vertices.push(evt.mouse.mapgcs);
      update = true;
    }
    if ((ccp || ccp === 0) && evt.event === geo_event.actionup &&
        (ccp === true || layer.displayDistance(vertices[0], null, evt.mouse.map, 'display') <= cpp)) {
      if (vertices.length < 3 + (name === 'polygon' ? 1 : 0)) {
        return 'remove';
      }
      vertices.pop();
      m_this.state(annotationState.done);
      return 'done';
    }
    return update;
  }
  return undefined;
}

/**
 * Return a function that can be used as a selectionConstraint that requires
 * that the aspect ratio of a rectangle-like selection is a specific value or
 * range of values.
 *
 * @private
 * @param {number|number[]|geo.geoSize|geo.geoSize[]} ratio Either a single
 *   aspect ratio, a single size, or a list of allowed aspect ratios and sizes.
 *   For instance, 1 will require that the selection square, 2 would require
 *   that it is twice as wide as tall, [2, 1/2] would allow it to be twice as
 *   wide or half as wide as it is tall.  Sizes (e.g., {width: 400, height:
 *   500}) snap to that size.
 * @returns {function} A function that can be passed to the mapIterator
 *   selectionConstraint or to an annotation constraint function.
 */
function constrainAspectRatio(ratio) {
  const ratios = Array.isArray(ratio) ? ratio : [ratio];

  /**
   * Constrain a mouse action or annotation action to a list of aspect ratios.
   *
   * @param {geo.geoPosition} pos Mouse or new location in map gcs.
   * @param {geo.geoPosition} origin Origin in map gcs when the activity
   *    started.
   * @param {geo.geoPosition} [corners] If specified, an array of corner
   *    locations in mapgcs.  This may be modified.
   * @param {string?} [mode] 'edge', 'vertex' or falsy.  A falsy value implies
   *    this is just the most recent point in the annotation, otherwise it is
   *    the portion of the annotation being modified.
   * @param {number} [ang] A list of angles of each side of the polygon
   *    represented by corners or the original annotation.
   * @param {integer} [index] The specific vertex or edge that is being
   *    modified.
   * @returns {object} An object with the ``origin`` (this is what is passed
   *    in), a new position as ``pos``, and the updated corners as ``corners``.
   */
  function constraintFunction(pos, origin, corners, mode, ang, index) {
    let newpos = pos;
    let best;
    if (!corners) {
      corners = [
        {x: origin.x, y: origin.y},
        {x: pos.x, y: origin.y},
        {x: pos.x, y: pos.y},
        {x: origin.x, y: pos.y}
      ];
    }
    if (mode) {
      /* Edit a vertex or edge */
      const i1 = (index + 1) % 4;
      const i2 = (index + 2) % 4;
      const i3 = (index + 3) % 4;
      const dist1 = ((corners[index].x - corners[i1].x) ** 2 + (corners[index].y - corners[i1].y) ** 2) ** 0.5;
      const dist3 = ((corners[index].x - corners[i3].x) ** 2 + (corners[index].y - corners[i3].y) ** 2) ** 0.5;
      const area = Math.abs(dist1 * dist3);
      let shape, edge;
      ratios.forEach((ratio) => {
        let width, height;
        if (ratio.width) {
          width = ratio.width;
          height = ratio.height;
        } else {
          width = (area * ratio) ** 0.5;
          height = width / ratio;
        }
        if (width !== height && !(index % 2)) {
          [width, height] = [height, width];
        }
        const score = (width - dist3) ** 2 + (height - dist1) ** 2;
        if (best === undefined || score < best) {
          best = score;
          shape = {
            w: width,
            h: height
          };
        }
      });
      const ang1 = ang[i1];
      const delta1 = {
        x: -shape.w * Math.cos(ang1),
        y: -shape.w * Math.sin(ang1)
      };
      const ang2 = ang[index];
      const delta2 = {
        x: -shape.h * Math.cos(ang2),
        y: -shape.h * Math.sin(ang2)
      };
      switch (mode) {
        case 'vertex':
          corners[index].x = corners[i2].x + delta1.x + delta2.x;
          corners[index].y = corners[i2].y + delta1.y + delta2.y;
          corners[i1].x = corners[i2].x + delta1.x;
          corners[i1].y = corners[i2].y + delta1.y;
          corners[i3].x = corners[i2].x + delta2.x;
          corners[i3].y = corners[i2].y + delta2.y;
          break;
        case 'edge':
          edge = {
            x: (corners[i2].x + corners[i3].x) * 0.5,
            y: (corners[i2].y + corners[i3].y) * 0.5
          };
          corners[i2].x = edge.x + delta2.x / 2;
          corners[i2].y = edge.y + delta2.y / 2;
          corners[index].x = edge.x + delta1.x - delta2.x / 2;
          corners[index].y = edge.y + delta1.y - delta2.y / 2;
          corners[i1].x = edge.x + delta1.x + delta2.x / 2;
          corners[i1].y = edge.y + delta1.y + delta2.y / 2;
          corners[i3].x = edge.x - delta2.x / 2;
          corners[i3].y = edge.y - delta2.y / 2;
          break;
      }
    } else {
      /* Not in edit vertex or edge mode */
      const area = Math.abs((pos.x - origin.x) * (pos.y - origin.y));
      ratios.forEach((ratio) => {
        let width, height;
        if (ratio.width) {
          width = ratio.width;
          height = ratio.height;
        } else {
          width = (area * ratio) ** 0.5;
          height = width / ratio;
        }
        const adjusted = {
          x: origin.x + Math.sign(pos.x - origin.x) * width,
          y: origin.y + Math.sign(pos.y - origin.y) * height
        };
        const score = (adjusted.x - pos.x) ** 2 + (adjusted.y - pos.y) ** 2;
        if (best === undefined || score < best) {
          best = score;
          newpos = adjusted;
        }
      });
      corners[0].y = corners[1].y = origin.y;
      corners[0].x = corners[3].x = origin.x;
      corners[1].x = corners[2].x = newpos.x;
      corners[2].y = corners[3].y = newpos.y;
    }
    return {
      corners: corners,
      origin: origin,
      pos: newpos
    };
  }

  return constraintFunction;
}

/**
 * This object contains the default options to initialize the class.
 */
annotation.defaults = {
  showLabel: true
};

module.exports = {
  state: annotationState,
  actionOwner: annotationActionOwner,
  annotation: annotation,
  _editHandleFeatureLevel: editHandleFeatureLevel,
  defaultEditHandleStyle,
  constrainAspectRatio,
  // these aren't exposed in index.js
  annotationActionOwner,
  continuousVerticesActions,
  continuousVerticesProcessAction
};
