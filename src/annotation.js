var $ = require('jquery');
var inherit = require('./inherit');
var geo_event = require('./event');
var geo_action = require('./action');
var transform = require('./transform');
var util = require('./util');
var registerAnnotation = require('./registry').registerAnnotation;
var lineFeature = require('./lineFeature');
var pointFeature = require('./pointFeature');
var polygonFeature = require('./polygonFeature');
var textFeature = require('./textFeature');

var annotationId = 0;

var annotationState = {
  create: 'create',
  done: 'done',
  highlight: 'highlight',
  edit: 'edit'
};

var annotationActionOwner = 'annotationAction';

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
 * Base annotation class.
 *
 * @class
 * @alias geo.annotation
 * @param {string} type The type of annotation.  These should be registered
 *    with utils.registerAnnotation and can be listed with same function.
 * @param {object?} [args] Individual annotations have additional options.
 * @param {string} [args.name] A name for the annotation.  This defaults to
 *    the type with a unique ID suffixed to it.
 * @param {geo.annotationLayer} [arg.layer] A reference to the controlling
 *    layer.  This is used for coordinate transforms.
 * @param {string} [args.state] Initial annotation state.  One of the
 *    `geo.annotation.state` values.
 * @param {boolean|string[]} [args.showLabel=true] `true` to show the
 *    annotation label on annotations in done or edit states.  Alternately, a
 *    list of states in which to show the label.  Falsy to not show the label.
 * @returns {geo.annotation}
 */
var annotation = function (type, args) {
  'use strict';
  if (!(this instanceof annotation)) {
    return new annotation(type, args);
  }

  var m_this = this,
      m_options = $.extend({}, {showLabel: true}, args || {}),
      m_id = m_options.annotationId;
  delete m_options.annotationId;
  if (m_id === undefined || (m_options.layer && m_options.layer.annotationById(m_id))) {
    annotationId += 1;
    if (m_id !== undefined) {
      console.warn('Annotation id ' + m_id + ' is in use; using ' + annotationId + ' instead.');
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

  /**
   * Clean up any resources that the annotation is using.
   */
  this._exit = function () {
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
   * Get or set the name of this annotation.
   *
   * @param {string|undefined} arg If `undefined`, return the name, otherwise
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
   * @param {string|null|undefined} arg If `undefined`, return the label,
   *    otherwise change it.  `null` to clear the label.
   * @param {boolean} noFallback If not truthy and the label is `null`, return
   *    the name, otherwise return the actual value for label.
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
        coor = m_this._coordinates(),
        center = util.centerFromPerimeter(m_this._coordinates()),
        dispCenter = center ? map.gcsToDisplay(center, null) : undefined,
        i, pos, maxr2 = 0, r;
    if (!center) {
      return;
    }
    offset = offset || 0;
    rotation = rotation || 0;
    for (i = 0; i < coor.length; i += 1) {
      pos = map.gcsToDisplay(coor[i], null);
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
   * in a `geo.textFeature`.
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

  /**
   * Get or set the state of this annotation.
   *
   * @param {string|undefined} arg If `undefined`, return the state,
   *    otherwise change it.  This should be one of the
   *    `geo.annotation.state` values.
   * @returns {this|string} The current state or this annotation.
   */
  this.state = function (arg) {
    if (arg === undefined) {
      return m_state;
    }
    if (m_state !== arg) {
      m_state = arg;
      if (m_this.layer()) {
        m_this.layer().geoTrigger(geo_event.annotation.state, {
          annotation: this
        });
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
  this.processAction = function () {
    return undefined;
  };

  /**
   * Process any edit actions for this annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean} `true` to update the annotation, falsy to not update
   *    anything.
   */
  this.processEditAction = function (evt) {
    if (!evt || !m_this._editHandle || !m_this._editHandle.handle) {
      return;
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
  };

  /**
   * When an edit handle is selected or deselected (for instance, by moving the
   * mouse on or off of it), mark if it is selected and record the current
   * coordinates.
   *
   * @param {object} handle The data for the edit handle.
   * @param {boolean} enable True to enable the handle, false to disable.
   * @returns {this}
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
      startCoordinates: m_this._coordinates().slice(),
      center: util.centerFromPerimeter(m_this._coordinates()),
      rotatePosition: m_this._rotateHandlePosition(
        handle.style.rotateHandleOffset, handle.style.rotateHandleRotation + amountRotated),
      startAmountRotated: amountRotated,
      amountRotated: amountRotated,
      resizePosition: m_this._rotateHandlePosition(
        handle.style.resizeHandleOffset, handle.style.resizeHandleRotation)
    };
    return m_this;
  };

  /**
   * Set or get options.
   *
   * @param {string|object} [arg1] If `undefined`, return the options object.
   *    If a string, either set or return the option of that name.  If an
   *    object, update the options with the object's values.
   * @param {object} [arg2] If `arg1` is a string and this is defined, set
   *    the option to this value.
   * @returns {object|this} If options are set, return the annotation,
   *    otherwise return the requested option or the set of options.
   */
  this.options = function (arg1, arg2) {
    if (arg1 === undefined) {
      return m_options;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return m_options[arg1];
    }
    if (arg2 === undefined) {
      m_options = $.extend(true, m_options, arg1);
      /* For style objects, re-extend them without recursion.  This allows
       * setting colors without an opacity field, for instance. */
      ['style', 'createStyle', 'editStyle', 'editHandleStyle', 'labelStyle',
        'highlightStyle'
      ].forEach(function (key) {
        if (arg1[key] !== undefined) {
          $.extend(m_options[key], arg1[key]);
        }
      });
    } else {
      m_options[arg1] = arg2;
    }
    if (m_options.coordinates) {
      var coor = m_options.coordinates;
      delete m_options.coordinates;
      m_this._coordinates(coor);
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
    return this;
  };

  /**
   * Set or get style.
   *
   * @param {string|object} [arg1] If `undefined`, return the current style
   *    object.  If a string and `arg2` is undefined, return the style
   *    associated with the specified key.  If a string and `arg2` is defined,
   *    set the named style to the specified value.  Otherwise, extend the
   *    current style with the values in the specified object.
   * @param {*} [arg2] If `arg1` is a string, the new value for that style.
   * @param {string} [styleType='style'] The name of the style type, such as
   *    `createStyle', `editStyle`, `editHandleStyle`, `labelStyle`, or
   *    `highlightStyle`.
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
      m_options[styleType] = $.extend(true, m_options[styleType], arg1);
    } else {
      m_options[styleType][arg1] = arg2;
    }
    m_this.modified();
    return m_this;
  };

  ['createStyle', 'editStyle', 'editHandleStyle', 'labelStyle', 'highlightStyle'
  ].forEach(function (styleType) {
    /**
     * Set or get a specific style type.
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
      return $.extend({}, m_options.style, m_options[state + 'Style']);
    }
    if (state === annotationState.create) {
      return $.extend({}, m_options.style, m_options.editStyle,
                      m_options[state + 'Style']);
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

  /**
   * Get coordinates associated with this annotation.
   *
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.geoPosition[]} An array of coordinates.
   */
  this.coordinates = function (gcs) {
    var coord = m_this._coordinates() || [];
    if (m_this.layer()) {
      var map = m_this.layer().map();
      gcs = (gcs === null ? map.gcs() : (
             gcs === undefined ? map.ingcs() : gcs));
      if (gcs !== map.gcs()) {
        coord = transform.transformCoordinates(map.gcs(), gcs, coord);
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
   * @returns {object} The annotation as a geojson object, or `undefined` if it
   *    should not be represented (for instance, while it is being created).
   */
  this.geojson = function (gcs, includeCrs) {
    var coor = m_this._geojsonCoordinates(gcs),
        geotype = m_this._geojsonGeometryType(),
        styles = m_this._geojsonStyles(),
        objStyle = m_this.options('style') || {},
        objLabelStyle = m_this.labelStyle() || {},
        i, key, value;
    if (!coor || !coor.length || !geotype) {
      return;
    }
    var obj = {
      type: 'Feature',
      geometry: {
        type: geotype,
        coordinates: coor
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
        if (key.toLowerCase().match(/color$/)) {
          value = util.convertColorToHex(value, 'needed');
        }
        obj.properties[key] = value;
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
   * @param {boolean} [isOpen=false] If true, no edge handle will be created
   *    between the last and first vertices.
   */
  this._addEditHandles = function (features, vertices, opts, isOpen) {
    var editPoints,
        style = $.extend({}, defaultEditHandleStyle, m_this.editHandleStyle()),
        handles = util.ensureFunction(style.handles)() || {},
        selected = (m_this._editHandle && m_this._editHandle.handle &&
                    m_this._editHandle.handle.selected ?
                    m_this._editHandle.handle : undefined);
    /* opts specify which handles are allowed.  They must be allowed by the
     * original opts object and by the editHandleStyle.handle object. */
    opts = $.extend({}, opts);
    Object.keys(handles).forEach(function (key) {
      if (handles[key] === false) {
        opts[key] = false;
      }
    });
    if (!features[editHandleFeatureLevel]) {
      features[editHandleFeatureLevel] = {point: []};
    }
    editPoints = features[editHandleFeatureLevel].point;
    vertices.forEach(function (pt, idx) {
      if (opts.vertex !== false) {
        editPoints.push($.extend({}, pt, {type: 'vertex', index: idx, style: style, editHandle: true}));
      }
      if (opts.edge !== false && idx !== vertices.length - 1 && (pt.x !== vertices[idx + 1].x || pt.y !== vertices[idx + 1].y)) {
        editPoints.push($.extend({
          x: (pt.x + vertices[idx + 1].x) / 2,
          y: (pt.y + vertices[idx + 1].y) / 2
        }, {type: 'edge', index: idx, style: style, editHandle: true}));
      }
      if (opts.edge !== false && !isOpen && idx === vertices.length - 1 && (pt.x !== vertices[0].x || pt.y !== vertices[0].y)) {
        editPoints.push($.extend({
          x: (pt.x + vertices[0].x) / 2,
          y: (pt.y + vertices[0].y) / 2
        }, {type: 'edge', index: idx, style: style, editHandle: true}));
      }
    });
    if (opts.center !== false) {
      editPoints.push($.extend({}, util.centerFromPerimeter(m_this._coordinates()), {type: 'center', style: style, editHandle: true}));
    }
    if (opts.rotate !== false) {
      editPoints.push($.extend(m_this._rotateHandlePosition(
        style.rotateHandleOffset,
        style.rotateHandleRotation + (selected && selected.type === 'rotate' ? m_this._editHandle.amountRotated : 0)
      ), {type: 'rotate', style: style, editHandle: true}));
      if (m_this._editHandle && (!selected || selected.type !== 'rotate')) {
        m_this._editHandle.amountRotated = 0;
      }
    }
    if (opts.resize !== false) {
      editPoints.push($.extend(m_this._rotateHandlePosition(
        style.resizeHandleOffset,
        style.resizeHandleRotation
      ), {type: 'resize', style: style, editHandle: true}));
    }
    if (selected) {
      editPoints.forEach(function (pt) {
        if (pt.type === selected.type && pt.index === selected.index) {
          pt.selected = true;
        }
      });
    }
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
    var pts = start.map(function (elem) {
      return {x: elem.x + delta.x, y: elem.y + delta.y};
    });
    if (pts[0].x !== curPts[0].x || pts[0].y !== curPts[0].y) {
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
    var pts = start.map(function (elem) {
      var delta = {x: elem.x - handle.center.x, y: elem.y - handle.center.y};
      return {
        x: delta.x * Math.cos(ang) - delta.y * Math.sin(ang) + handle.center.x,
        y: delta.x * Math.sin(ang) + delta.y * Math.cos(ang) + handle.center.y
      };
    });
    if (pts[0].x !== curPts[0].x || pts[0].y !== curPts[0].y) {
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
      var pts = start.map(function (elem) {
        return {
          x: (elem.x - handle.center.x) * scale + handle.center.x,
          y: (elem.y - handle.center.y) * scale + handle.center.y
        };
      });
      if (pts[0].x !== curPts[0].x || pts[0].y !== curPts[0].y) {
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
        curPts = m_this._coordinates();
    curPts.splice(index + 1, 0, {x: handle.handle.x, y: handle.handle.y});
    handle.handle.type = 'vertex';
    handle.handle.index += 1;
    handle.startCoordinates = curPts.slice();
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
        start = handle.startCoordinates,
        curPts = m_this._coordinates(),
        origLen = curPts.length,
        origPt = curPts[index],
        delta = {
          x: evt.mouse.mapgcs.x - evt.state.origin.mapgcs.x,
          y: evt.mouse.mapgcs.y - evt.state.origin.mapgcs.y
        },
        layer = m_this.layer(),
        aPP = layer.options('adjacentPointProximity'),
        near, atEnd;

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
    m_this._coordinates(curPts);
    return true;
  };
};

/**
 * Rectangle annotation class.
 *
 * Rectangles are always rendered as polygons.  This could be changed -- if no
 * stroke is specified, the quad feature would be sufficient and work on more
 * renderers.
 *
 * @class
 * @alias geo.rectangleAnnotation
 * @extends geo.annotation
 *
 * @param {object?} [args] Options for the annotation.
 * @param {string} [args.name] A name for the annotation.  This defaults to
 *    the type with a unique ID suffixed to it.
 * @param {string} [args.state] initial annotation state.  One of the
 *    annotation.state values.
 * @param {boolean|string[]} [args.showLabel=true] `true` to show the
 *    annotation label on annotations in done or edit states.  Alternately, a
 *    list of states in which to show the label.  Falsy to not show the label.
 * @param {geo.geoPosition[]} [args.corners] A list of four corners in map
 *    gcs coordinates.  These must be in order around the perimeter of the
 *    rectangle (in either direction).
 * @param {geo.geoPosition[]} [args.coordinates] An alternate name for
 *    `args.corners`.
 * @param {object} [args.style] The style to apply to a finished rectangle.
 *    This uses styles for polygons, including `fill`, `fillColor`,
 *    `fillOpacity`, `stroke`, `strokeWidth`, `strokeColor`, and
 *    `strokeOpacity`.
 * @param {object} [args.editStyle] The style to apply to a rectangle in edit
 *    mode.  This uses styles for polygons and lines, including `fill`,
 *    `fillColor`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeColor`, and
 *    `strokeOpacity`.
 */
var rectangleAnnotation = function (args) {
  'use strict';
  if (!(this instanceof rectangleAnnotation)) {
    return new rectangleAnnotation(args);
  }

  args = $.extend(true, {}, {
    style: {
      fill: true,
      fillColor: {r: 0, g: 1, b: 0},
      fillOpacity: 0.25,
      polygon: function (d) { return d.polygon; },
      stroke: true,
      strokeColor: {r: 0, g: 0, b: 0},
      strokeOpacity: 1,
      strokeWidth: 3,
      uniformPolygon: true
    },
    highlightStyle: {
      fillColor: {r: 0, g: 1, b: 1},
      fillOpacity: 0.5,
      strokeWidth: 5
    },
    createStyle: {
      fillColor: {r: 0.3, g: 0.3, b: 0.3},
      fillOpacity: 0.25,
      strokeColor: {r: 0, g: 0, b: 1}
    }
  }, args || {});
  args.corners = args.corners || args.coordinates || [];
  delete args.coordinates;
  annotation.call(this, 'rectangle', args);

  var m_this = this,
      s_actions = this.actions,
      s_processEditAction = this.processEditAction;

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
      case annotationState.create:
        return [{
          action: geo_action.annotation_rectangle,
          name: 'rectangle create',
          owner: annotationActionOwner,
          input: 'left',
          modifiers: {shift: false, ctrl: false},
          selectionRectangle: true
        }];
      default:
        return s_actions.apply(m_this, arguments);
    }
  };

  /**
   * Process any actions for this annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, `'done'` if the
   *    annotation was completed (changed from create to done state),
   *    `'remove'` if the annotation should be removed, falsy to not update
   *    anything.
   */
  this.processAction = function (evt) {
    var layer = m_this.layer();
    if (m_this.state() !== annotationState.create || !layer ||
        evt.event !== geo_event.actionselection ||
        evt.state.action !== geo_action.annotation_rectangle) {
      return;
    }
    var map = layer.map(),
        corners = [
          /* Keep in map gcs, not interface gcs to avoid wrapping issues */
          map.displayToGcs({x: evt.lowerLeft.x, y: evt.lowerLeft.y}, null),
          map.displayToGcs({x: evt.lowerLeft.x, y: evt.upperRight.y}, null),
          map.displayToGcs({x: evt.upperRight.x, y: evt.upperRight.y}, null),
          map.displayToGcs({x: evt.upperRight.x, y: evt.lowerLeft.y}, null)
        ];
    /* Don't keep rectangles that have nearly zero area in display pixels */
    if (layer.displayDistance(corners[0], null, corners[1], null) *
        layer.displayDistance(corners[0], null, corners[3], null) < 0.01) {
      return 'remove';
    }
    m_this.options('corners', corners);
    m_this.state(annotationState.done);
    return 'done';
  };

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = m_this.options(),
        state = m_this.state(),
        features;
    switch (state) {
      case annotationState.create:
        features = [];
        if (opt.corners && opt.corners.length >= 4) {
          features = [{
            polygon: {
              polygon: opt.corners,
              style: m_this.styleForState(state)
            }
          }];
        }
        break;
      default:
        features = [{
          polygon: {
            polygon: opt.corners,
            style: m_this.styleForState(state)
          }
        }];
        if (state === annotationState.edit) {
          m_this._addEditHandles(features, opt.corners);
        }
        break;
    }
    return features;
  };

  /**
   * Get coordinates associated with this annotation in the map gcs coordinate
   * system.
   *
   * @param {geo.geoPosition[]} [coordinates] An optional array of coordinates
   *  to set.
   * @returns {geo.geoPosition[]} The current array of coordinates.
   */
  this._coordinates = function (coordinates) {
    if (coordinates && coordinates.length >= 4) {
      m_this.options('corners', coordinates.slice(0, 4));
      /* Should we ensure that the four points form a rectangle in the current
       * projection, though this might not be rectangular in another gcs? */
    }
    return m_this.options('corners');
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
    var src = m_this.coordinates(gcs);
    if (!src || m_this.state() === annotationState.create || src.length < 4) {
      return;
    }
    var coor = [];
    for (var i = 0; i < 4; i += 1) {
      coor.push([src[i].x, src[i].y]);
    }
    coor.push([src[0].x, src[0].y]);
    return [coor];
  };

  /**
   * Return the geometry type that is used to store this annotation in geojson.
   *
   * @returns {string} A geojson geometry type.
   */
  this._geojsonGeometryType = function () {
    return 'Polygon';
  };

  /**
   * Return a list of styles that should be preserved in a geojson
   * representation of the annotation.
   *
   * @returns {string[]} A list of style names to store.
   */
  this._geojsonStyles = function () {
    return [
      'fill', 'fillColor', 'fillOpacity', 'lineCap', 'lineJoin', 'stroke',
      'strokeColor', 'strokeOffset', 'strokeOpacity', 'strokeWidth'];
  };

  /**
   * Set three corners based on an initial corner and a mouse event.
   *
   * @param {geo.geoPosition} corners An array of four corners to update.
   * @param {geo.event} evt The mouse move event.
   */
  this._setCornersFromMouse = function (corners, evt) {
    var map = m_this.layer().map(),
        c0 = map.gcsToDisplay({x: corners[0].x, y: corners[0].y}, null),
        c2 = map.gcsToDisplay(evt.mapgcs, null),
        c1 = {x: c2.x, y: c0.y},
        c3 = {x: c0.x, y: c2.y};
    corners[2] = $.extend({}, evt.mapgcs);
    corners[1] = map.displayToGcs(c1, null);
    corners[3] = map.displayToGcs(c3, null);
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt The mouse move event.
   * @returns {boolean} Truthy to update the annotation, falsy to not
   *    update anything.
   */
  this.mouseMove = function (evt) {
    if (m_this.state() !== annotationState.create) {
      return;
    }
    var corners = m_this.options('corners');
    if (corners.length) {
      m_this._setCornersFromMouse(corners, evt);
      return true;
    }
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
    var layer = m_this.layer();
    if (m_this.state() !== annotationState.create || !layer) {
      return;
    }
    if (!evt.buttonsDown.left && !evt.buttonsDown.right) {
      return;
    }
    var corners = m_this.options('corners');
    if (evt.buttonsDown.right && !corners.length) {
      return;
    }
    evt.handled = true;
    if (corners.length) {
      m_this._setCornersFromMouse(corners, evt);
      /* Don't keep rectangles that have nearly zero area in display pixels */
      if (layer.displayDistance(corners[0], null, corners[1], null) *
          layer.displayDistance(corners[0], null, corners[3], null) < 0.01) {
        return 'remove';
      }
      m_this.state(annotationState.done);
      return 'done';
    }
    if (evt.buttonsDown.left) {
      corners.push($.extend({}, evt.mapgcs));
      corners.push($.extend({}, evt.mapgcs));
      corners.push($.extend({}, evt.mapgcs));
      corners.push($.extend({}, evt.mapgcs));
      return true;
    }
  };

  /**
   * Process any edit actions for this annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, falsy to not
   *    update anything.
   */
  this.processEditAction = function (evt) {
    var start = m_this._editHandle.startCoordinates,
        delta = {
          x: evt.mouse.mapgcs.x - evt.state.origin.mapgcs.x,
          y: evt.mouse.mapgcs.y - evt.state.origin.mapgcs.y
        },
        type = m_this._editHandle.handle.type,
        index = m_this._editHandle.handle.index,
        ang = [
          Math.atan2(start[1].y - start[0].y, start[1].x - start[0].x),
          Math.atan2(start[2].y - start[1].y, start[2].x - start[1].x),
          Math.atan2(start[3].y - start[2].y, start[3].x - start[2].x),
          Math.atan2(start[0].y - start[3].y, start[0].x - start[3].x)
        ],
        corners, delta1, delta2, ang1, ang2;
    // an angle can be zero because it is horizontal or undefined.  If opposite
    // angles are both zero, this is a degenerate rectangle (a line or a point)
    if (!ang[0] && !ang[1] && !ang[2] && !ang[3]) {
      ang[1] = Math.PI / 2;
      ang[2] = Math.PI;
      ang[3] = -Math.PI / 2;
    }
    if (!ang[0] && !ang[2]) {
      ang[0] = ang[1] - Math.PI / 2;
      ang[2] = ang[1] + Math.PI / 2;
    }
    if (!ang[1] && !ang[3]) {
      ang[1] = ang[2] - Math.PI / 2;
      ang[3] = ang[2] + Math.PI / 2;
    }
    switch (type) {
      case 'vertex':
        corners = start.map(function (elem) {
          return {x: elem.x, y: elem.y};
        });
        ang1 = ang[(index + 1) % 4];
        delta1 = {
          x: (delta.x * Math.cos(ang1) + delta.y * Math.sin(ang1)) * Math.cos(ang1),
          y: (delta.y * Math.sin(ang1) + delta.x * Math.cos(ang1)) * Math.sin(ang1)
        };
        ang2 = ang[index];
        delta2 = {
          x: (delta.x * Math.cos(ang2) + delta.y * Math.sin(ang2)) * Math.cos(ang2),
          y: (delta.y * Math.sin(ang2) + delta.x * Math.cos(ang2)) * Math.sin(ang2)
        };
        corners[index].x += delta.x;
        corners[index].y += delta.y;
        corners[(index + 1) % 4].x += delta1.x;
        corners[(index + 1) % 4].y += delta1.y;
        corners[(index + 3) % 4].x += delta2.x;
        corners[(index + 3) % 4].y += delta2.y;
        m_this.options('corners', corners);
        return true;
      case 'edge':
        corners = start.map(function (elem) {
          return {x: elem.x, y: elem.y};
        });
        ang1 = ang[(index + 1) % 4];
        delta = {
          x: (delta.x * Math.cos(ang1) + delta.y * Math.sin(ang1)) * Math.cos(ang1),
          y: (delta.y * Math.sin(ang1) + delta.x * Math.cos(ang1)) * Math.sin(ang1)
        };
        corners[index].x += delta.x;
        corners[index].y += delta.y;
        corners[(index + 1) % 4].x += delta.x;
        corners[(index + 1) % 4].y += delta.y;
        m_this.options('corners', corners);
        return true;
    }
    return s_processEditAction.apply(m_this, arguments);
  };
};
inherit(rectangleAnnotation, annotation);

var rectangleRequiredFeatures = {};
rectangleRequiredFeatures[polygonFeature.capabilities.feature] = true;
registerAnnotation('rectangle', rectangleAnnotation, rectangleRequiredFeatures);

/**
 * Polygon annotation class
 *
 * When complete, polygons are rendered as polygons.  During creation they are
 * rendered as lines and polygons.
 *
 * @class
 * @alias geo.polygonAnnotation
 * @extends geo.annotation
 *
 * @param {object?} [args] Options for the annotation.
 * @param {string} [args.name] A name for the annotation.  This defaults to
 *    the type with a unique ID suffixed to it.
 * @param {string} [args.state] initial annotation state.  One of the
 *    annotation.state values.
 * @param {boolean|string[]} [args.showLabel=true] `true` to show the
 *    annotation label on annotations in done or edit states.  Alternately, a
 *    list of states in which to show the label.  Falsy to not show the label.
 * @param {geo.geoPosition[]} [args.vertices] A list of vertices in map gcs
 *    coordinates.  These must be in order around the perimeter of the
 *    polygon (in either direction).
 * @param {geo.geoPosition[]} [args.coordinates] An alternate name for
 *    `args.vertices`.
 * @param {object} [args.style] The style to apply to a finished polygon.
 *    This uses styles for polygons, including `fill`, `fillColor`,
 *    `fillOpacity`, `stroke`, `strokeWidth`, `strokeColor`, and
 *    `strokeOpacity`.
 * @param {object} [args.editStyle] The style to apply to a polygon in edit
 *    mode.  This uses styles for polygons and lines, including `fill`,
 *    `fillColor`, `fillOpacity`, `stroke`, `strokeWidth`, `strokeColor`, and
 *    `strokeOpacity`.
 */
var polygonAnnotation = function (args) {
  'use strict';
  if (!(this instanceof polygonAnnotation)) {
    return new polygonAnnotation(args);
  }

  args = $.extend(true, {}, {
    style: {
      fill: true,
      fillColor: {r: 0, g: 1, b: 0},
      fillOpacity: 0.25,
      polygon: function (d) { return d.polygon; },
      stroke: true,
      strokeColor: {r: 0, g: 0, b: 0},
      strokeOpacity: 1,
      strokeWidth: 3,
      uniformPolygon: true
    },
    highlightStyle: {
      fillColor: {r: 0, g: 1, b: 1},
      fillOpacity: 0.5,
      strokeWidth: 5
    },
    createStyle: {
      closed: false,
      fillColor: {r: 0.3, g: 0.3, b: 0.3},
      fillOpacity: 0.25,
      line: function (d) {
        /* Return an array that has the same number of items as we have
         * vertices. */
        return Array.apply(null, Array(m_this.options('vertices').length)).map(
            function () { return d; });
      },
      position: function (d, i) {
        return m_this.options('vertices')[i];
      },
      stroke: false,
      strokeColor: {r: 0, g: 0, b: 1}
    }
  }, args || {});
  args.vertices = args.vertices || args.coordinates || [];
  delete args.coordinates;
  annotation.call(this, 'polygon', args);

  var m_this = this;

  /**
   * Get a list of renderable features for this annotation.  When the polygon
   * is done, this is just a single polygon.  During creation this can be a
   * polygon and line at z-levels 1 and 2.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = m_this.options(),
        state = m_this.state(),
        style = m_this.styleForState(state),
        features;
    switch (state) {
      case annotationState.create:
        features = [];
        if (opt.vertices && opt.vertices.length >= 3) {
          features[1] = {
            polygon: {
              polygon: opt.vertices,
              style: style
            }
          };
        }
        if (opt.vertices && opt.vertices.length >= 2) {
          features[2] = {
            line: {
              line: opt.vertices,
              style: style
            }
          };
        }
        break;
      default:
        features = [{
          polygon: {
            polygon: opt.vertices,
            style: style
          }
        }];
        if (state === annotationState.edit) {
          m_this._addEditHandles(features, opt.vertices);
        }
        break;
    }
    return features;
  };

  /**
   * Get coordinates associated with this annotation in the map gcs coordinate
   * system.
   *
   * @param {geo.geoPosition[]} [coordinates] An optional array of coordinates
   *  to set.
   * @returns {geo.geoPosition[]} The current array of coordinates.
   */
  this._coordinates = function (coordinates) {
    if (coordinates) {
      m_this.options('vertices', coordinates);
    }
    return m_this.options('vertices');
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt The mouse move event.
   * @returns {boolean} Truthy to update the annotation, falsy to not
   *    update anything.
   */
  this.mouseMove = function (evt) {
    if (m_this.state() !== annotationState.create) {
      return;
    }
    var vertices = m_this.options('vertices');
    if (vertices.length) {
      vertices[vertices.length - 1] = evt.mapgcs;
      return true;
    }
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
    var layer = m_this.layer();
    if (m_this.state() !== annotationState.create || !layer) {
      return;
    }
    var end = !!evt.buttonsDown.right, skip;
    if (!evt.buttonsDown.left && !evt.buttonsDown.right) {
      return;
    }
    var vertices = m_this.options('vertices');
    if (evt.buttonsDown.right && !vertices.length) {
      return;
    }
    evt.handled = true;
    if (evt.buttonsDown.left) {
      if (vertices.length) {
        if (vertices.length >= 2 && layer.displayDistance(
            vertices[vertices.length - 2], null, evt.map, 'display') <=
            layer.options('adjacentPointProximity')) {
          skip = true;
          if (m_this._lastClick &&
              evt.time - m_this._lastClick < layer.options('dblClickTime')) {
            end = true;
          }
        } else if (vertices.length >= 2 && layer.displayDistance(
            vertices[0], null, evt.map, 'display') <=
            layer.options('finalPointProximity')) {
          end = true;
        } else {
          vertices[vertices.length - 1] = evt.mapgcs;
        }
      } else {
        vertices.push(evt.mapgcs);
      }
      if (!end && !skip) {
        vertices.push(evt.mapgcs);
      }
      m_this._lastClick = evt.time;
    }
    if (end) {
      if (vertices.length < 4) {
        return 'remove';
      }
      vertices.pop();
      m_this.state(annotationState.done);
      return 'done';
    }
    return (end || !skip);
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
    var src = m_this.coordinates(gcs);
    if (!src || src.length < 3 || m_this.state() === annotationState.create) {
      return;
    }
    var coor = [];
    for (var i = 0; i < src.length; i += 1) {
      coor.push([src[i].x, src[i].y]);
    }
    coor.push([src[0].x, src[0].y]);
    return [coor];
  };

  /**
   * Return the geometry type that is used to store this annotation in geojson.
   *
   * @returns {string} A geojson geometry type.
   */
  this._geojsonGeometryType = function () {
    return 'Polygon';
  };

  /**
   * Return a list of styles that should be preserved in a geojson
   * representation of the annotation.
   *
   * @returns {string[]} A list of style names to store.
   */
  this._geojsonStyles = function () {
    return [
      'fill', 'fillColor', 'fillOpacity', 'lineCap', 'lineJoin', 'stroke',
      'strokeColor', 'strokeOffset', 'strokeOpacity', 'strokeWidth'];
  };
};
inherit(polygonAnnotation, annotation);

var polygonRequiredFeatures = {};
polygonRequiredFeatures[polygonFeature.capabilities.feature] = true;
polygonRequiredFeatures[lineFeature.capabilities.basic] = [annotationState.create];
registerAnnotation('polygon', polygonAnnotation, polygonRequiredFeatures);

/**
 * Line annotation class.
 *
 * @class
 * @alias geo.lineAnnotation
 * @extends geo.annotation
 *
 * @param {object?} [args] Options for the annotation.
 * @param {string} [args.name] A name for the annotation.  This defaults to
 *    the type with a unique ID suffixed to it.
 * @param {string} [args.state] initial annotation state.  One of the
 *    annotation.state values.
 * @param {boolean|string[]} [args.showLabel=true] `true` to show the
 *    annotation label on annotations in done or edit states.  Alternately, a
 *    list of states in which to show the label.  Falsy to not show the label.
 * @param {geo.geoPosition[]} [args.vertices] A list of vertices in map gcs
 *    coordinates.
 * @param {geo.geoPosition[]} [args.coordinates] An alternate name for
 *    `args.corners`.
 * @param {object} [args.style] The style to apply to a finished line.
 *    This uses styles for lines, including `strokeWidth`, `strokeColor`,
 *    `strokeOpacity`, `strokeOffset`, `closed`, `lineCap`, and `lineJoin`.
 * @param {object} [args.editStyle] The style to apply to a line in edit
 *    mode.  This uses styles for lines, including `strokeWidth`,
 *    `strokeColor`, `strokeOpacity`, `strokeOffset`, `closed`, `lineCap`,
 *    and `lineJoin`.
 */
var lineAnnotation = function (args) {
  'use strict';
  if (!(this instanceof lineAnnotation)) {
    return new lineAnnotation(args);
  }

  args = $.extend(true, {}, {
    style: {
      line: function (d) {
        /* Return an array that has the same number of items as we have
         * vertices. */
        return Array.apply(null, Array(m_this.options('vertices').length)).map(
            function () { return d; });
      },
      position: function (d, i) {
        return m_this.options('vertices')[i];
      },
      strokeColor: {r: 0, g: 0, b: 0},
      strokeOpacity: 1,
      strokeWidth: 3,
      closed: false,
      lineCap: 'butt',
      lineJoin: 'miter'
    },
    highlightStyle: {
      strokeWidth: 5
    },
    createStyle: {
      line: function (d) {
        /* Return an array that has the same number of items as we have
         * vertices. */
        return Array.apply(null, Array(m_this.options('vertices').length)).map(
            function () { return d; });
      },
      position: function (d, i) {
        return m_this.options('vertices')[i];
      },
      strokeColor: {r: 0, g: 0, b: 1},
      strokeOpacity: 1,
      strokeWidth: 3,
      closed: false,
      lineCap: 'butt',
      lineJoin: 'miter'
    }
  }, args || {});
  args.vertices = args.vertices || args.coordinates || [];
  delete args.coordinates;
  annotation.call(this, 'line', args);

  var m_this = this,
      s_actions = this.actions,
      s_processEditAction = this.processEditAction;

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = m_this.options(),
        state = m_this.state(),
        features;
    switch (state) {
      case annotationState.create:
        features = [{
          line: {
            line: opt.vertices,
            style: m_this.styleForState(state)
          }
        }];
        break;
      default:
        features = [{
          line: {
            line: opt.vertices,
            style: m_this.styleForState(state)
          }
        }];
        if (state === annotationState.edit) {
          m_this._addEditHandles(features, opt.vertices, undefined, !m_this.style('closed'));
        }
        break;
    }
    return features;
  };

  /**
   * Get coordinates associated with this annotation in the map gcs coordinate
   * system.
   *
   * @param {geo.geoPosition[]} [coordinates] An optional array of coordinates
   *  to set.
   * @returns {geo.geoPosition[]} The current array of coordinates.
   */
  this._coordinates = function (coordinates) {
    if (coordinates) {
      m_this.options('vertices', coordinates);
    }
    return m_this.options('vertices');
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt The mouse move event.
   * @returns {boolean} Truthy to update the annotation, falsy to not
   *    update anything.
   */
  this.mouseMove = function (evt) {
    if (m_this.state() !== annotationState.create) {
      return;
    }
    var vertices = m_this.options('vertices');
    if (vertices.length) {
      vertices[vertices.length - 1] = evt.mapgcs;
      return true;
    }
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
    var layer = m_this.layer();
    if (m_this.state() !== annotationState.create || !layer) {
      return;
    }
    var end = !!evt.buttonsDown.right, skip;
    if (!evt.buttonsDown.left && !evt.buttonsDown.right) {
      return;
    }
    var vertices = m_this.options('vertices');
    if (evt.buttonsDown.right && !vertices.length) {
      return;
    }
    evt.handled = true;
    if (evt.buttonsDown.left) {
      if (vertices.length) {
        if (vertices.length >= 2 && layer.displayDistance(
            vertices[vertices.length - 2], null, evt.map, 'display') <=
            layer.options('adjacentPointProximity')) {
          skip = true;
          if (m_this._lastClick &&
              evt.time - m_this._lastClick < layer.options('dblClickTime')) {
            end = true;
          }
        } else if (vertices.length >= 2 && layer.displayDistance(
            vertices[0], null, evt.map, 'display') <=
            layer.options('finalPointProximity')) {
          end = 'close';
        } else {
          vertices[vertices.length - 1] = evt.mapgcs;
        }
      } else {
        vertices.push(evt.mapgcs);
      }
      if (!end && !skip) {
        vertices.push(evt.mapgcs);
      }
      m_this._lastClick = evt.time;
      m_this._lastClickVertexCount = vertices.length;
    }
    if (end) {
      if (vertices.length < 3) {
        return 'remove';
      }
      vertices.pop();
      m_this.options('style').closed = end === 'close';
      m_this.state(annotationState.done);
      return 'done';
    }
    return (end || !skip);
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
      case annotationState.create:
        return [{
          action: geo_action.annotation_line,
          name: 'line create',
          owner: annotationActionOwner,
          input: 'left',
          modifiers: {shift: false, ctrl: false}
        }, {
          action: geo_action.annotation_line,
          name: 'line create',
          owner: annotationActionOwner,
          input: 'pan'
        }];
      default:
        return s_actions.apply(m_this, arguments);
    }
  };

  /**
   * Process any actions for this annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, `'done'` if the
   *    annotation was completed (changed from create to done state),
   *    `'remove'` if the annotation should be removed, falsy to not update
   *    anything.
   */
  this.processAction = function (evt) {
    var layer = m_this.layer();
    if (m_this.state() !== annotationState.create || !layer ||
        evt.state.action !== geo_action.annotation_line) {
      return;
    }
    var cpp = layer.options('continuousPointProximity');
    var cpc = layer.options('continuousPointColinearity');
    if (cpp || cpp === 0) {
      var vertices = m_this.options('vertices');
      if (!vertices.length) {
        vertices.push(evt.mouse.mapgcs);
        vertices.push(evt.mouse.mapgcs);
        return true;
      }
      var dist = layer.displayDistance(vertices[vertices.length - 2], null, evt.mouse.map, 'display');
      if (dist && dist > cpp) {
        // combine nearly colinear points
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
        return true;
      }
    }
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
    var src = m_this.coordinates(gcs);
    if (!src || src.length < 2 || m_this.state() === annotationState.create) {
      return;
    }
    var coor = [];
    for (var i = 0; i < src.length; i += 1) {
      coor.push([src[i].x, src[i].y]);
    }
    return coor;
  };

  /**
   * Return the geometry type that is used to store this annotation in geojson.
   *
   * @returns {string} A geojson geometry type.
   */
  this._geojsonGeometryType = function () {
    return 'LineString';
  };

  /**
   * Return a list of styles that should be preserved in a geojson
   * representation of the annotation.
   *
   * @returns {string[]} A list of style names to store.
   */
  this._geojsonStyles = function () {
    return [
      'closed', 'lineCap', 'lineJoin', 'strokeColor', 'strokeOffset',
      'strokeOpacity', 'strokeWidth'];
  };

  /**
   * Process any edit actions for this annotation.
   *
   * @param {geo.event} evt The action event.
   * @returns {boolean|string} `true` to update the annotation, falsy to not
   *    update anything.
   */
  this.processEditAction = function (evt) {
    switch (m_this._editHandle.handle.type) {
      case 'vertex':
        return m_this._processEditActionVertex(evt, true);
    }
    return s_processEditAction.apply(m_this, arguments);
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
    // if we get a left double click on an edge on a closed line, break the
    // line at that edge
    var layer = m_this.layer(),
        handle = m_this._editHandle,
        split;
    // ensure we are in edit mode and this is a left click
    if (m_this.state() !== annotationState.edit || !layer || !evt.buttonsDown.left) {
      return;
    }
    // ensure this is an edge on a closed line
    if (!handle || !handle.handle.selected || handle.handle.type !== 'edge' || !m_this.options('style').closed) {
      return;
    }
    evt.handled = true;
    if (m_this._lastClick && evt.time - m_this._lastClick < layer.options('dblClickTime')) {
      split = true;
    }
    m_this._lastClick = evt.time;
    if (split) {
      var index = handle.handle.index,
          curPts = m_this._coordinates(),
          pts = curPts.slice(index + 1).concat(curPts.slice(0, index + 1));
      m_this._coordinates(pts);
      m_this.options('style').closed = false;
      handle.handle.index = undefined;
      return true;
    }
  };

};
inherit(lineAnnotation, annotation);

var lineRequiredFeatures = {};
lineRequiredFeatures[lineFeature.capabilities.basic] = [annotationState.create];
registerAnnotation('line', lineAnnotation, lineRequiredFeatures);

/**
 * Point annotation class.
 *
 * @class
 * @alias geo.poinyAnnotation
 * @extends geo.annotation
 *
 * @param {object?} [args] Options for the annotation.
 * @param {string} [args.name] A name for the annotation.  This defaults to
 *    the type with a unique ID suffixed to it.
 * @param {string} [args.state] initial annotation state.  One of the
 *    annotation.state values.
 * @param {boolean|string[]} [args.showLabel=true] `true` to show the
 *    annotation label on annotations in done or edit states.  Alternately, a
 *    list of states in which to show the label.  Falsy to not show the label.
 * @param {geo.geoPosition} [args.position] A coordinate in map gcs
 *    coordinates.
 * @param {geo.geoPosition[]} [args.coordinates] An array with one coordinate
 *  to use in place of `args.position`.
 * @param {object} [args.style] The style to apply to a finished point.
 *    This uses styles for points, including `radius`, `fill`, `fillColor`,
 *    `fillOpacity`, `stroke`, `strokeWidth`, `strokeColor`, `strokeOpacity`,
 *    and `scaled`.  If `scaled` is `false`, the point is not scaled with
 *    zoom level.  If it is `true`, the radius is based on the zoom level at
 *    first instantiation.  Otherwise, if it is a number, the radius is used
 *    at that zoom level.
 * @param {object} [args.editStyle] The style to apply to a point in edit
 *    mode.
 */
var pointAnnotation = function (args) {
  'use strict';
  if (!(this instanceof pointAnnotation)) {
    return new pointAnnotation(args);
  }

  args = $.extend(true, {}, {
    style: {
      fill: true,
      fillColor: {r: 0, g: 1, b: 0},
      fillOpacity: 0.25,
      radius: 10,
      scaled: false,
      stroke: true,
      strokeColor: {r: 0, g: 0, b: 0},
      strokeOpacity: 1,
      strokeWidth: 3
    },
    createStyle: {
      fillColor: {r: 0.3, g: 0.3, b: 0.3},
      fillOpacity: 0.25,
      strokeColor: {r: 0, g: 0, b: 1}
    },
    highlightStyle: {
      fillColor: {r: 0, g: 1, b: 1},
      fillOpacity: 0.5,
      strokeWidth: 5
    }
  }, args || {});
  args.position = args.position || (args.coordinates ? args.coordinates[0] : undefined);
  delete args.coordinates;
  annotation.call(this, 'point', args);

  var m_this = this;

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = m_this.options(),
        state = m_this.state(),
        features, style, scaleOnZoom;
    switch (state) {
      case annotationState.create:
        features = [];
        break;
      default:
        style = m_this.styleForState(state);
        if (opt.style.scaled || opt.style.scaled === 0) {
          if (opt.style.scaled === true) {
            opt.style.scaled = m_this.layer().map().zoom();
          }
          style = $.extend({}, style, {
            radius: function () {
              var radius = opt.style.radius,
                  zoom = m_this.layer().map().zoom();
              if (util.isFunction(radius)) {
                radius = radius.apply(m_this, arguments);
              }
              radius *= Math.pow(2, zoom - opt.style.scaled);
              return radius;
            }
          });
          scaleOnZoom = true;
        }
        features = [{
          point: {
            x: opt.position.x,
            y: opt.position.y,
            style: style,
            scaleOnZoom: scaleOnZoom
          }
        }];
        if (state === annotationState.edit) {
          m_this._addEditHandles(
            features, [opt.position],
            {edge: false, center: false, resize: false, rotate: false});
        }
        break;
    }
    return features;
  };

  /**
   * Get coordinates associated with this annotation in the map gcs coordinate
   * system.
   *
   * @param {geo.geoPosition[]} [coordinates] An optional array of coordinates
   *  to set.
   * @returns {geo.geoPosition[]} The current array of coordinates.
   */
  this._coordinates = function (coordinates) {
    if (coordinates && coordinates.length >= 1) {
      m_this.options('position', coordinates[0]);
    }
    if (m_this.state() === annotationState.create) {
      return [];
    }
    return [m_this.options('position')];
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
    if (m_this.state() !== annotationState.create) {
      return;
    }
    if (!evt.buttonsDown.left) {
      return;
    }
    evt.handled = true;
    m_this.options('position', evt.mapgcs);
    m_this.state(annotationState.done);
    return 'done';
  };

  /**
   * Return a list of styles that should be preserved in a geojson
   * representation of the annotation.
   *
   * @returns {string[]} A list of style names to store.
   */
  this._geojsonStyles = function () {
    return [
      'fill', 'fillColor', 'fillOpacity', 'radius', 'scaled', 'stroke',
      'strokeColor', 'strokeOpacity', 'strokeWidth'];
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
    var src = m_this.coordinates(gcs);
    if (!src || m_this.state() === annotationState.create || src.length < 1 || src[0] === undefined) {
      return;
    }
    return [src[0].x, src[0].y];
  };

  /**
   * Return the geometry type that is used to store this annotation in geojson.
   *
   * @returns {string} A geojson geometry type.
   */
  this._geojsonGeometryType = function () {
    return 'Point';
  };
};
inherit(pointAnnotation, annotation);

var pointRequiredFeatures = {};
pointRequiredFeatures[pointFeature.capabilities.feature] = true;
registerAnnotation('point', pointAnnotation, pointRequiredFeatures);

module.exports = {
  state: annotationState,
  actionOwner: annotationActionOwner,
  annotation: annotation,
  lineAnnotation: lineAnnotation,
  pointAnnotation: pointAnnotation,
  polygonAnnotation: polygonAnnotation,
  rectangleAnnotation: rectangleAnnotation,
  _editHandleFeatureLevel: editHandleFeatureLevel
};
