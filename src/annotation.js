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
  edit: 'edit'
};

var annotationActionOwner = 'annotationAction';

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

  var m_options = $.extend({}, {showLabel: true}, args || {}),
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
        this.modified();
      }
    }
    return this;
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
      this.modified();
    }
    return this;
  };

  /**
   * Return the coordinate associated with the center of the annotation.
   *
   * @returns {geo.geoPosition|undefined} The map gcs position for the center,
   *    or `undefined` if no such position exists.
   */
  this._centerPosition = function () {
    var coor = this._coordinates(), position, p0, p1, w, sumw, i;
    if (!coor || !coor.length) {
      return undefined;
    }
    if (coor.length === 1) {
      return coor[0];
    }
    position = {x: 0, y: 0};
    sumw = 0;
    p0 = coor[coor.length - 1];
    for (i = 0; i < coor.length; i += 1) {
      p1 = p0;
      p0 = coor[i];
      w = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
      position.x += (p0.x + p1.x) * w;
      position.y += (p0.y + p1.y) * w;
      sumw += 2 * w;
    }
    position.x /= sumw;
    position.y /= sumw;
    return sumw ? position : p0;  // return p0 if all points are the same
  };

  /**
   * Return the coordinate associated with the label.
   *
   * @returns {geo.geoPosition|undefined} The map gcs position for the label,
   *    or `undefined` if no such position exists.
   */
  this._labelPosition = function () {
    return this._centerPosition();
  };

  /**
   * If the label should be shown, get a record of the label that can be used
   * in a `geo.textFeature`.
   *
   * @returns {geo.annotationLayer.labelRecord|undefined} A label record, or
   *    `undefined` if it should not be shown.
   */
  this.labelRecord = function () {
    var show = this.options('showLabel');
    if (!show) {
      return;
    }
    var state = this.state();
    if ((show === true && state === annotationState.create) ||
        (show !== true && show.indexOf(state) < 0)) {
      return;
    }
    var style = this.options('labelStyle');
    var labelRecord = {
      text: this.label(),
      position: this._labelPosition()
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
      this.modified();
    }
    return this;
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
    return this;
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
      if (this.layer()) {
        this.layer().geoTrigger(geo_event.annotation.state, {
          annotation: this
        });
      }
    }
    return this;
  };

  /**
   * Return actions needed for the specified state of this annotation.
   *
   * @param {string} [state] The state to return actions for.  Defaults to
   *    the current state.
   * @returns {geo.actionRecord[]} A list of actions.
   */
  this.actions = function () {
    return [];
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
  this.processAction = function () {
    return undefined;
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
      ['style', 'editStyle', 'labelStyle'].forEach(function (key) {
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
      this._coordinates(coor);
    }
    if (m_options.name !== undefined) {
      var name = m_options.name;
      delete m_options.name;
      this.name(name);
    }
    if (m_options.label !== undefined) {
      var label = m_options.label;
      delete m_options.label;
      this.label(label);
    }
    if (m_options.description !== undefined) {
      var description = m_options.description;
      delete m_options.description;
      this.description(description);
    }
    this.modified();
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
   * @returns {object|this} Either the entire style object, the value of a
   *    specific style, or the current class instance.
   */
  this.style = function (arg1, arg2) {
    if (arg1 === undefined) {
      return m_options.style;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return m_options.style[arg1];
    }
    if (arg2 === undefined) {
      m_options.style = $.extend(true, m_options.style, arg1);
    } else {
      m_options.style[arg1] = arg2;
    }
    this.modified();
    return this;
  };

  /**
   * Set or get edit style.  These are the styles used in edit and create mode.
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
  this.editStyle = function (arg1, arg2) {
    if (arg1 === undefined) {
      return m_options.editStyle;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return m_options.editStyle[arg1];
    }
    if (arg2 === undefined) {
      m_options.editStyle = $.extend(true, m_options.editStyle, arg1);
    } else {
      m_options.editStyle[arg1] = arg2;
    }
    this.modified();
    return this;
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
   * Get coordinates associated with this annotation in the map gcs coordinate
   * system.
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
    var coord = this._coordinates() || [];
    if (this.layer()) {
      var map = this.layer().map();
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
    if (this.layer()) {
      this.layer().modified();
    }
    return this;
  };

  /**
   * Draw this annotation.  This just updates and draws the parent layer.
   *
   * @returns {this} The annotation.
   */
  this.draw = function () {
    if (this.layer()) {
      this.layer()._update();
      this.layer().draw();
    }
    return this;
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
    var coor = this._geojsonCoordinates(gcs),
        geotype = this._geojsonGeometryType(),
        styles = this._geojsonStyles(),
        objStyle = this.options('style') || {},
        objLabelStyle = this.options('labelStyle') || {},
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
        name: this.name(),
        annotationId: this.id()
      }
    };
    if (m_label) {
      obj.properties.label = m_label;
    }
    if (m_description) {
      obj.properties.description = m_description;
    }
    if (this.options('showLabel') === false) {
      obj.properties.showLabel = this.options('showLabel');
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
      var map = this.layer().map();
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
    editStyle: {
      fill: true,
      fillColor: {r: 0.3, g: 0.3, b: 0.3},
      fillOpacity: 0.25,
      polygon: function (d) { return d.polygon; },
      stroke: true,
      strokeColor: {r: 0, g: 0, b: 1},
      strokeOpacity: 1,
      strokeWidth: 3,
      uniformPolygon: true
    }
  }, args || {});
  args.corners = args.corners || args.coordinates || [];
  delete args.coordinates;
  annotation.call(this, 'rectangle', args);

  /**
   * Return actions needed for the specified state of this annotation.
   *
   * @param {string} [state] The state to return actions for.  Defaults to
   *    the current state.
   * @returns {geo.actionRecord[]} A list of actions.
   */
  this.actions = function (state) {
    if (!state) {
      state = this.state();
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
        return [];
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
    var layer = this.layer();
    if (this.state() !== annotationState.create || !layer ||
        evt.event !== geo_event.actionselection ||
        evt.state.action !== geo_action.annotation_rectangle) {
      return;
    }
    var map = layer.map();
    this.options('corners', [
      /* Keep in map gcs, not interface gcs to avoid wrapping issues */
      map.displayToGcs({x: evt.lowerLeft.x, y: evt.lowerLeft.y}, null),
      map.displayToGcs({x: evt.lowerLeft.x, y: evt.upperRight.y}, null),
      map.displayToGcs({x: evt.upperRight.x, y: evt.upperRight.y}, null),
      map.displayToGcs({x: evt.upperRight.x, y: evt.lowerLeft.y}, null)
    ]);
    this.state(annotationState.done);
    return 'done';
  };

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = this.options(),
        state = this.state(),
        features;
    switch (state) {
      case annotationState.create:
        features = [];
        if (opt.corners && opt.corners.length >= 4) {
          features = [{
            polygon: {
              polygon: opt.corners,
              style: opt.editStyle
            }
          }];
        }
        break;
      default:
        features = [{
          polygon: {
            polygon: opt.corners,
            style: opt.style
          }
        }];
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
      this.options('corners', coordinates.slice(0, 4));
      /* Should we ensure that the four points form a rectangle in the current
       * projection, though this might not be rectangular in another gcs? */
    }
    return this.options('corners');
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
    var src = this.coordinates(gcs);
    if (!src || this.state() === annotationState.create || src.length < 4) {
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
    var map = this.layer().map(),
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
    if (this.state() !== annotationState.create) {
      return;
    }
    var corners = this.options('corners');
    if (corners.length) {
      this._setCornersFromMouse(corners, evt);
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
    var layer = this.layer();
    if (this.state() !== annotationState.create || !layer) {
      return;
    }
    if (!evt.buttonsDown.left && !evt.buttonsDown.right) {
      return;
    }
    var corners = this.options('corners');
    if (evt.buttonsDown.right && !corners.length) {
      return;
    }
    evt.handled = true;
    if (corners.length) {
      this._setCornersFromMouse(corners, evt);
      this.state(annotationState.done);
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

  var m_this = this;

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
    editStyle: {
      closed: false,
      fill: true,
      fillColor: {r: 0.3, g: 0.3, b: 0.3},
      fillOpacity: 0.25,
      line: function (d) {
        /* Return an array that has the same number of items as we have
         * vertices. */
        return Array.apply(null, Array(m_this.options('vertices').length)).map(
            function () { return d; });
      },
      polygon: function (d) { return d.polygon; },
      position: function (d, i) {
        return m_this.options('vertices')[i];
      },
      stroke: false,
      strokeColor: {r: 0, g: 0, b: 1},
      strokeOpacity: 1,
      strokeWidth: 3,
      uniformPolygon: true
    }
  }, args || {});
  args.vertices = args.vertices || args.coordinates || [];
  delete args.coordinates;
  annotation.call(this, 'polygon', args);

  /**
   * Get a list of renderable features for this annotation.  When the polygon
   * is done, this is just a single polygon.  During creation this can be a
   * polygon and line at z-levels 1 and 2.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = this.options(),
        state = this.state(),
        features;
    switch (state) {
      case annotationState.create:
        features = [];
        if (opt.vertices && opt.vertices.length >= 3) {
          features[1] = {
            polygon: {
              polygon: opt.vertices,
              style: opt.editStyle
            }
          };
        }
        if (opt.vertices && opt.vertices.length >= 2) {
          features[2] = {
            line: {
              line: opt.vertices,
              style: opt.editStyle
            }
          };
        }
        break;
      default:
        features = [{
          polygon: {
            polygon: opt.vertices,
            style: opt.style
          }
        }];
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
      this.options('vertices', coordinates);
    }
    return this.options('vertices');
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt The mouse move event.
   * @returns {boolean} Truthy to update the annotation, falsy to not
   *    update anything.
   */
  this.mouseMove = function (evt) {
    if (this.state() !== annotationState.create) {
      return;
    }
    var vertices = this.options('vertices');
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
    var layer = this.layer();
    if (this.state() !== annotationState.create || !layer) {
      return;
    }
    var end = !!evt.buttonsDown.right, skip;
    if (!evt.buttonsDown.left && !evt.buttonsDown.right) {
      return;
    }
    var vertices = this.options('vertices');
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
      this.state(annotationState.done);
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
    var src = this.coordinates(gcs);
    if (!src || src.length < 3 || this.state() === annotationState.create) {
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

  var m_this = this;

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
    editStyle: {
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

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = this.options(),
        state = this.state(),
        features;
    switch (state) {
      case annotationState.create:
        features = [{
          line: {
            line: opt.vertices,
            style: opt.editStyle
          }
        }];
        break;
      default:
        features = [{
          line: {
            line: opt.vertices,
            style: opt.style
          }
        }];
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
      this.options('vertices', coordinates);
    }
    return this.options('vertices');
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt The mouse move event.
   * @returns {boolean} Truthy to update the annotation, falsy to not
   *    update anything.
   */
  this.mouseMove = function (evt) {
    if (this.state() !== annotationState.create) {
      return;
    }
    var vertices = this.options('vertices');
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
    var layer = this.layer();
    if (this.state() !== annotationState.create || !layer) {
      return;
    }
    var end = !!evt.buttonsDown.right, skip;
    if (!evt.buttonsDown.left && !evt.buttonsDown.right) {
      return;
    }
    var vertices = this.options('vertices');
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
      this.options('style').closed = end === 'close';
      this.state(annotationState.done);
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
      state = this.state();
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
        return [];
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
    var layer = this.layer();
    if (this.state() !== annotationState.create || !layer ||
        evt.state.action !== geo_action.annotation_line) {
      return;
    }
    var cpp = layer.options('continuousPointProximity');
    var cpc = layer.options('continuousPointColinearity');
    if (cpp || cpp === 0) {
      var vertices = this.options('vertices');
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
    var src = this.coordinates(gcs);
    if (!src || src.length < 2 || this.state() === annotationState.create) {
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
 * @param {object} [args.editStyle] The style to apply to a line in edit
 *    mode.  This uses styles for lines.
 */
var pointAnnotation = function (args) {
  'use strict';
  if (!(this instanceof pointAnnotation)) {
    return new pointAnnotation(args);
  }
  var m_this = this;

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
    }
  }, args || {});
  args.position = args.position || (args.coordinates ? args.coordinates[0] : undefined);
  delete args.coordinates;
  annotation.call(this, 'point', args);

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} An array of features.
   */
  this.features = function () {
    var opt = this.options(),
        state = this.state(),
        features, style, scaleOnZoom;
    switch (state) {
      case annotationState.create:
        features = [];
        break;
      default:
        style = opt.style;
        if (opt.style.scaled || opt.style.scaled === 0) {
          if (opt.style.scaled === true) {
            opt.style.scaled = this.layer().map().zoom();
          }
          style = $.extend({}, style, {
            radius: function () {
              var radius = opt.style.radius,
                  zoom = m_this.layer().map().zoom();
              if (util.isFunction(radius)) {
                radius = radius.apply(this, arguments);
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
      this.options('position', coordinates[0]);
    }
    if (this.state() === annotationState.create) {
      return [];
    }
    return [this.options('position')];
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
    if (this.state() !== annotationState.create) {
      return;
    }
    if (!evt.buttonsDown.left) {
      return;
    }
    evt.handled = true;
    this.options('position', evt.mapgcs);
    this.state(annotationState.done);
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
    var src = this.coordinates(gcs);
    if (!src || this.state() === annotationState.create || src.length < 1 || src[0] === undefined) {
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
  rectangleAnnotation: rectangleAnnotation
};
