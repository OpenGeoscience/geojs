var $ = require('jquery');
var inherit = require('./inherit');
var geo_event = require('./event');
var transform = require('./transform');
var registerAnnotation = require('./registry').registerAnnotation;

var annotationId = 0;

var annotationState = {
  create: 'create',
  done: 'done',
  edit: 'edit'
};

/////////////////////////////////////////////////////////////////////////////
/**
 * Base annotation class
 *
 * @class geo.annotation
 * @param {string} type the type of annotation.  These should be registered
 *    with utils.registerAnnotation and can be listed with same function.
 * @param {object?} options Inidividual annotations have additional options.
 * @param {string} [options.name] A name for the annotation.  This defaults to
 *    the type with a unique ID suffixed to it.
 * @param {geo.annotationLayer} [options.layer] a reference to the controlling
 *    layer.  This is used for coordinate transforms.
 * @param {string} [options.state] initial annotation state.  One of the
 *    annotation.state values.
 * @returns {geo.annotation}
 */
/////////////////////////////////////////////////////////////////////////////
var annotation = function (type, args) {
  'use strict';
  if (!(this instanceof annotation)) {
    return new annotation(type, args);
  }

  annotationId += 1;
  var m_options = $.extend({}, args || {}),
      m_id = annotationId,
      m_name = m_options.name || (
        type.charAt(0).toUpperCase() + type.substr(1) + ' ' + annotationId),
      m_type = type,
      m_layer = m_options.layer,
      /* one of annotationState.* */
      m_state = m_options.state || annotationState.done;
  delete m_options.state;
  delete m_options.layer;
  delete m_options.name;

  /**
   * Clean up any resources that the annotation is using.
   */
  this._exit = function () {
  };

  /**
   * Get a unique annotation id.
   *
   * @returns {number} the annotation id.
   */
  this.id = function () {
    return m_id;
  };

  /**
   * Get or set the name of this annotation.
   *
   * @param {string|undefined} arg if undefined, return the name, otherwise
   *    change it.
   * @returns {this|string} the current name or this annotation.
   */
  this.name = function (arg) {
    if (arg === undefined) {
      return m_name;
    }
    if (arg !== null && ('' + arg).trim()) {
      m_name = ('' + arg).trim();
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
   * @param {string|undefined} arg if undefined, return the state, otherwise
   *    change it.
   * @returns {this|string} the current state or this annotation.
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
   * Set or get options.
   *
   * @param {string|object} arg1 if undefined, return the options object.  If
   *    a string, either set or return the option of that name.  If an object,
   *    update the options with the object's values.
   * @param {object} arg2 if arg1 is a string and this is defined, set the
   *    option to this value.
   * @returns {object|this} if options are set, return the layer, otherwise
   *    return the requested option or the set of options.
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
    } else {
      m_options[arg1] = arg2;
    }
    this.modified();
    return this;
  };

  /**
   * Get the type of this annotation.
   *
   * @returns {string} the annotation type.
   */
  this.type = function () {
    return m_type;
  };

  /**
   * Get a list of renderable features for this annotation.  The list index is
   * functionally a z-index for the feature.  Each entry is a dictionary with
   * the key as the feature name (such as line, quad, or polygon), and the
   * value a dictionary of values to pass to the feature constructor, such as
   * style and coordinates.
   *
   * @returns {array} an array of features.
   */
  this.features = function () {
    return [];
  };

  /**
   * Handle a mouse click on this annotation.  If the event is processed,
   * evt.handled should be set to true to prevent further processing.
   *
   * @param {geo.event} evt the mouse click event.
   * @returns {boolean|string} true to update the annotation, 'done' if the
   *    annotation was completed (changed from create to done state), 'remove'
   *    if the annotation should be removed, falsy to not update anything.
   */
  this.mouseClick = function (evt) {
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt the mouse move event.
   * @returns {boolean|string} true to update the annotation, falsy to not
   *    update anything.
   */
  this.mouseMove = function (evt) {
  };

  /**
   * Get coordinates associated with this annotation in the map gcs coordinate
   * system.
   *
   * @returns {array} an array of coordinates.
   */
  this._coordinates = function () {
    return [];
  };

  /**
   * Get coordinates associated with this annotation.
   *
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @returns {array} an array of coordinates.
   */
  this.coordinates = function (gcs) {
    var coord = this._coordinates();
    if (this.layer()) {
      var map = this.layer().map();
      gcs = (gcs === null ? map.gcs() : (
             gcs === undefined ? map.ingcs() : gcs));
      if (gcs !== map.gcs()) {
        coord = transform.transformCoordinates(map.gcs(), gcs, coord);
      }
      return coord;
    }
  };

  /**
   * Mark this annotation as modified.  This just marks the parent layer as
   * modified.
   */
  this.modified = function () {
    if (this.layer()) {
      this.layer().modified();
    }
    return this;
  };

  /**
   * Draw this annotation.  This just updates and draws the parent layer.
   */
  this.draw = function () {
    if (this.layer()) {
      this.layer()._update();
      this.layer().draw();
    }
    return this;
  };

  /**
   * TODO: return the annotation as a geojson object
   */
  this.geojson = function () {
    return 'not implemented';
  };
};

/////////////////////////////////////////////////////////////////////////////
/**
 * Rectangle annotation class
 *
 * Rectangles are always rendered as polygons.  This could be changed -- if no
 * stroke is specified, the quad feature would be sufficient and work on more
 * renderers.
 *
 * Must specify:
 *   corners: a list of four corners {x: x, y: y} in map gcs coordinates.
 * May specify:
 *   style.
 *     fill, fillColor, fillOpacity, stroke, strokeWidth, strokeColor,
 *     strokeOpacity
 */
/////////////////////////////////////////////////////////////////////////////
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
    }
  }, args || {});
  annotation.call(this, 'rectangle', args);

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} an array of features.
   */
  this.features = function () {
    var opt = this.options();
    return [{
      polygon: {
        polygon: opt.corners,
        style: opt.style
      }
    }];
  };

  /**
   * Get coordinates associated with this annotation in the map gcs coordinate
   * system.
   *
   * @returns {array} an array of coordinates.
   */
  this._coordinates = function () {
    return this.options('corners');
  };
};
inherit(rectangleAnnotation, annotation);

registerAnnotation('rectangle', rectangleAnnotation, {polygon: true});

/////////////////////////////////////////////////////////////////////////////
/**
 * Polygon annotation class
 *
 * When complete, polygons are rendered as polygons.  During creation they are
 * rendered as lines and polygons.
 *
 * Must specify:
 *   vertices: a list of vertices {x: x, y: y} in map gcs coordinates.
 * May specify:
 *   style.
 *     fill, fillColor, fillOpacity, stroke, strokeWidth, strokeColor,
 *     strokeOpacity
 *   editstyle.
 *     fill, fillColor, fillOpacity, stroke, strokeWidth, strokeColor,
 *     strokeOpacity
 */
/////////////////////////////////////////////////////////////////////////////
var polygonAnnotation = function (args) {
  'use strict';
  if (!(this instanceof polygonAnnotation)) {
    return new polygonAnnotation(args);
  }

  var m_this = this;

  args = $.extend(true, {}, {
    vertices: [],
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
    editstyle: {
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
  annotation.call(this, 'polygon', args);

  /**
   * Get a list of renderable features for this annotation.  When the polygon
   * is done, this is just a single polygon.  During creation this can be a
   * polygon and line at z-levels 1 and 2.
   *
   * @returns {array} an array of features.
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
              style: opt.editstyle
            }
          };
        }
        if (opt.vertices && opt.vertices.length >= 2) {
          features[2] = {
            line: {
              line: opt.vertices,
              style: opt.editstyle
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
   * @returns {array} an array of coordinates.
   */
  this._coordinates = function () {
    return this.options('vertices');
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt the mouse move event.
   * @returns {boolean|string} true to update the annotation, falsy to not
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
   * evt.handled should be set to true to prevent further processing.
   *
   * @param {geo.event} evt the mouse click event.
   * @returns {boolean|string} true to update the annotation, 'done' if the
   *    annotation was completed (changed from create to done state), 'remove'
   *    if the annotation should be removed, falsy to not update anything.
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
          if (this.lastClick &&
              evt.time - this.lastClick < layer.options('dblClickTime')) {
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
      this.lastClick = evt.time;
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
};
inherit(polygonAnnotation, annotation);

registerAnnotation('polygon', polygonAnnotation, {
  polygon: true, 'line.basic': [annotationState.create]});

/////////////////////////////////////////////////////////////////////////////
/**
 * Point annotation class
 *
 * Must specify:
 *   position: {x: x, y: y} in map gcs coordinates.
 * May specify:
 *   style.
 *     radius, fill, fillColor, fillOpacity, stroke, strokeWidth, strokeColor,
 *     strokeOpacity
 */
/////////////////////////////////////////////////////////////////////////////
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
      stroke: true,
      strokeColor: {r: 0, g: 0, b: 0},
      strokeOpacity: 1,
      strokeWidth: 3
    }
  }, args || {});
  annotation.call(this, 'point', args);

  /**
   * Get a list of renderable features for this annotation.
   *
   * @returns {array} an array of features.
   */
  this.features = function () {
    var opt = this.options(),
        state = this.state(),
        features;
    switch (state) {
      case annotationState.create:
        features = [];
        break;
      default:
        features = [{
          point: {
            x: opt.position.x,
            y: opt.position.y,
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
   * @returns {array} an array of coordinates.
   */
  this._coordinates = function () {
    if (this.state() === annotationState.create) {
      return [];
    }
    return [this.options('position')];
  };

  /**
   * Handle a mouse click on this annotation.  If the event is processed,
   * evt.handled should be set to true to prevent further processing.
   *
   * @param {geo.event} evt the mouse click event.
   * @returns {boolean|string} true to update the annotation, 'done' if the
   *    annotation was completed (changed from create to done state), 'remove'
   *    if the annotation should be removed, falsy to not update anything.
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
};
inherit(pointAnnotation, annotation);

registerAnnotation('point', pointAnnotation, {point: true});

module.exports = {
  state: annotationState,
  annotation: annotation,
  pointAnnotation: pointAnnotation,
  polygonAnnotation: polygonAnnotation,
  rectangleAnnotation: rectangleAnnotation
};
