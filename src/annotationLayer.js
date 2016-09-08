var inherit = require('./inherit');
var featureLayer = require('./featureLayer');
var geo_action = require('./action');
var geo_event = require('./event');
var registry = require('./registry');
var transform = require('./transform');
var $ = require('jquery');

var annotationId = 0;

/////////////////////////////////////////////////////////////////////////////
/**
 * Layer to handle direct interactions with different features.  Annotations
 * (features) can be created by calling mode(<name of feature>) or cancelled
 * with mode(null).
 *
 * @class geo.annotationLayer
 * @extends geo.featureLayer
 * @param {object?} options
 * @param {number} [options.dblClickTime=300]  The delay in milliseconds that
 *    is treated as a double-click when working with annotations.
 * @param {number} [options.adjacentPointProximity=5]  The minimum distance in
 *    display coordinates (pixels) between two adjacent points when creating a
 *    polygon.  A value of 0 requires an exact match.
 * @param {number} [options.finalPointProximity=10]  The maximum distance in
 *    display coordinates (pixels) between the starting point and the mouse
 *    coordinates to signal closing a polygon.  A value of 0 requires an exact
 *    match.  A negative value disables closing a polygon by clicking on the
 *    start point.
 * @returns {geo.annotationLayer}
 */
/////////////////////////////////////////////////////////////////////////////
var annotationLayer = function (args) {
  'use strict';
  if (!(this instanceof annotationLayer)) {
    return new annotationLayer(args);
  }
  featureLayer.call(this, args);

  var mapInteractor = require('./mapInteractor');
  var timestamp = require('./timestamp');
  var util = require('./util');

  var m_this = this,
      s_init = this._init,
      s_exit = this._exit,
      s_update = this._update,
      m_buildTime = timestamp(),
      m_options,
      m_actions,
      m_mode,
      m_annotations = [],
      m_features = [];

  m_options = $.extend(true, {}, {
    dblClickTime: 300,
    adjacentPointProximity: 5,  // in pixels, 0 is exact
    finalPointProximity: 10  // in pixels, 0 is exact
  }, args);

  m_actions = {
    rectangle: {
      action: geo_action.annotation_rectangle,
      owner: 'annotationLayer',
      input: 'left',
      modifiers: {shift: false, ctrl: false},
      selectionRectangle: true
    }
  };

  /**
   * Process a selection event.  If we are in rectangle-creation mode, this
   * creates a rectangle.
   *
   * @param {geo.event} evt the selection event.
   */
  this._processSelection = function (evt) {
    if (m_this.mode() === 'rectangle') {
      m_this.mode(null);
      if (evt.state.action === geo_action.annotation_rectangle) {
        var map = m_this.map();
        var params = {
          corners: [
            /* Keep in map gcs, not interface gcs to avoid wrapping issues */
            map.displayToGcs({x: evt.lowerLeft.x, y: evt.lowerLeft.y}, null),
            map.displayToGcs({x: evt.lowerLeft.x, y: evt.upperRight.y}, null),
            map.displayToGcs({x: evt.upperRight.x, y: evt.upperRight.y}, null),
            map.displayToGcs({x: evt.upperRight.x, y: evt.lowerLeft.y}, null)
          ],
          layer: this
        };
        this.addAnnotation(rectangleAnnotation(params));
      }
    }
  };

  /**
   * Handle mouse movement.  If there is a current annotation, the movement
   * event is sent to it.
   *
   * @param {geo.event} evt the mouse move event.
   */
  this._handleMouseMove = function (evt) {
    if (this.mode() && this.currentAnnotation) {
      var update = this.currentAnnotation.mouseMove(evt);
      if (update) {
        m_this.modified();
        m_this._update();
        m_this.draw();
      }
    }
  };

  /**
   * Handle mouse clicks.  If there is a current annotation, the click event is
   * sent to it.
   *
   * @param {geo.event} evt the mouse click event.
   */
  this._handleMouseClick = function (evt) {
    if (this.mode() && this.currentAnnotation) {
      var update = this.currentAnnotation.mouseClick(evt);
      switch (update) {
        case 'remove':
          m_this.removeAnnotation(m_this.currentAnnotation, false);
          m_this.mode(null);
          break;
        case 'done':
          m_this.mode(null);
          break;
      }
      if (update) {
        m_this.modified();
        m_this._update();
        m_this.draw();
      }
    }
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
      m_options = $.extend(m_options, arg1);
    } else {
      m_options[arg1] = arg2;
    }
    this.modified();
    return this;
  };

  /**
   * Calculate the display distance for two coordinate in the current map.
   *
   * @param {object} coord1 the first coordinates.
   * @param {string|geo.transform} [gcs1] undefined to use the interface gcs,
   *    null to use the map gcs, 'display' if the coordinates are already in
   *    display coordinates, or any other transform.
   * @param {object} coord2 the second coordinates.
   * @param {string|geo.transform} [gcs2] undefined to use the interface gcs,
   *    null to use the map gcs, 'display' if the coordinates are already in
   *    display coordinates, or any other transform.
   * @returns {number} the Euclidian distance between the two coordinates.
   */
  this.displayDistance = function (coord1, gcs1, coord2, gcs2) {
    var map = this.map();
    if (gcs1 !== 'display') {
      gcs1 = (gcs1 === null ? map.gcs() : (
              gcs1 === undefined ? map.ingcs() : gcs1));
      coord1 = map.gcsToDisplay(coord1, gcs1);
    }
    if (gcs2 !== 'display') {
      gcs2 = (gcs2 === null ? map.gcs() : (
              gcs2 === undefined ? map.ingcs() : gcs2));
      coord2 = map.gcsToDisplay(coord2, gcs2);
    }
    var dist = Math.sqrt(Math.pow(coord1.x - coord2.x, 2) +
                         Math.pow(coord1.y - coord2.y, 2));
    return dist;
  };

  /**
   * Add an annotation to the layer.  The annotation could be in any state.
   *
   * @param {object} annotation the annotation to add.
   */
  this.addAnnotation = function (annotation) {
    m_this.geoTrigger(geo_event.annotation.add.before, {
      annotation: annotation
    });
    m_annotations.push(annotation);
    this.modified();
    this._update();
    this.draw();
    m_this.geoTrigger(geo_event.annotation.add, {
      annotation: annotation
    });
    return this;
  };

  /**
   * Remove an annotation from the layer.
   *
   * @param {object} annotation the annotation to remove.
   * @param {boolean} update if false, don't update the layer after removing
   *    the annotation.
   * @returns {boolean} true if an annotation was removed.
   */
  this.removeAnnotation = function (annotation, update) {
    var pos = $.inArray(annotation, m_annotations);
    if (pos >= 0) {
      if (annotation === this.currentAnnotation) {
        this.currentAnnotation = null;
      }
      annotation._exit();
      m_annotations.splice(pos, 1);
      if (update !== false) {
        this.modified();
        this._update();
        this.draw();
      }
      m_this.geoTrigger(geo_event.annotation.remove, {
        annotation: annotation
      });
    }
    return pos >= 0;
  };

  /**
   * Remove all annotations from the layer.
   *
   * @param {boolean} skipCreating: if true, don't remove annotations that are
   *    in the create state.
   * @returns {number} the number of annotations that were removed.
   */
  this.removeAllAnnotations = function (skipCreating) {
    var removed = 0, annotation, pos = 0;
    while (pos < m_annotations.length) {
      annotation = m_annotations[0];
      if (skipCreating && annotation.state() === 'create') {
        pos += 1;
        continue;
      }
      this.removeAnnotation(annotation, false);
      removed += 1;
    }
    if (removed) {
      this.modified();
      this._update();
      this.draw();
    }
    return removed;
  };

  /**
   * Get the list of annotations on the layer.
   *
   * @returns {array} An array of annotations.
   */
  this.annotations = function () {
    return m_annotations.slice();
  };

  /**
   * Get an annotation by its id.
   *
   * @returns {geo.annotation} The selected annotation or undefined.
   */
  this.annotationById = function (id) {
    if (id !== undefined && id !== null) {
      id = +id;  /* Cast to int */
    }
    var annotations = m_annotations.filter(function (annotation) {
      return annotation.id() === id;
    });
    if (annotations.length) {
      return annotations[0];
    }
  };

  /**
   * Get or set the current mode.  The mode is either null for nothing being
   * created, or the name of the type of annotation that is being created.
   *
   * @param {string|null} arg the new mode or undefined to get the current
   *    mode.
   * @returns {string|null|this} The current mode or the layer.
   */
  this.mode = function (arg) {
    if (arg === undefined) {
      return m_mode;
    }
    if (arg !== m_mode) {
      var createAnnotation;
      m_mode = arg;
      m_this.map().node().css('cursor', m_mode ? 'crosshair' : '');
      if (this.currentAnnotation) {
        switch (this.currentAnnotation.state()) {
          case 'create':
            this.removeAnnotation(this.currentAnnotation);
            break;
        }
        this.currentAnnotation = null;
      }
      switch (m_mode) {
        case 'point':
          createAnnotation = pointAnnotation;
          break;
        case 'polygon':
          createAnnotation = polygonAnnotation;
          break;
        case 'rectangle':
          m_this.map().interactor().addAction(m_actions.rectangle);
          break;
      }
      if (createAnnotation) {
        this.currentAnnotation = createAnnotation({
          state: 'create',
          layer: this
        });
        this.addAnnotation(m_this.currentAnnotation);
      }
      if (m_mode !== 'rectangle') {
        m_this.map().interactor().removeAction(m_actions.rectangle);
      }
      m_this.geoTrigger(geo_event.annotation.mode, {mode: m_mode});
    }
    return this;
  };

  ///////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ///////////////////////////////////////////////////////////////////////////
  this._update = function (request) {
    if (m_this.getMTime() > m_buildTime.getMTime()) {
      /* Interally, we have a set of feature levels (to provide z-index
       * support), each of which can have data from multiple annotations.  We
       * clear the data on each of these features, then build it up from each
       * annotation.  Eventually, it may be necessary to optimize this and
       * only update the features that are changed.
       */
      $.each(m_features, function (idx, featureLevel) {
        $.each(featureLevel, function (type, feature) {
          feature.data = [];
        });
      });
      $.each(m_annotations, function (annotation_idx, annotation) {
        var features = annotation.features();
        $.each(features, function (idx, featureLevel) {
          if (m_features[idx] === undefined) {
            m_features[idx] = {};
          }
          $.each(featureLevel, function (type, featureSpec) {
            /* Create features as needed */
            if (!m_features[idx][type]) {
              try {
                var feature = m_this.createFeature(type, {
                  gcs: m_this.map().gcs()
                });
              } catch (err) {
                /* We can't create the desired feature, porbably because of the
                 * selected renderer.  Issue one warning only. */
                var key = 'error_feature_' + type;
                if (!m_this[key]) {
                  console.warning('Cannot create a ' + type + ' feature for ' +
                                  'annotations.');
                  m_this[key] = true;
                }
                return;
              }
              /* Since each annotation can have separate styles, the styles are
               * combined together with a meta-style function.  Any style that
               * could be used should be in this list.  Color styles may be
               * restricted to {r, g, b} objects for efficiency, but this
               * hasn't been tested.
               */
              var style = {};
              $.each(['fill', 'fillColor', 'fillOpacity', 'line', 'polygon',
                      'position', 'radius', 'stroke', 'strokeColor',
                      'strokeOpacity', 'strokeWidth', 'uniformPolygon'
                  ], function (keyidx, key) {
                var origFunc;
                if (feature.style()[key] !== undefined) {
                  origFunc = feature.style.get(key);
                }
                style[key] = function (d, i, d2, i2) {
                  var style = (
                    (d && d.style) ? d.style : (d && d[2] && d[2].style) ?
                    d[2].style : d2.style);
                  var result = style ? style[key] : d;
                  if (util.isFunction(result)) {
                    result = result(d, i, d2, i2);
                  }
                  if (result === undefined && origFunc) {
                    result = origFunc(d, i, d2, i2);
                  }
                  return result;
                };
              });
              feature.style(style);
              m_features[idx][type] = {
                feature: feature,
                style: style,
                data: []
              };
            }
            /* Collect the data for each feature */
            m_features[idx][type].data.push(featureSpec.data || featureSpec);
          });
        });
      });
      /* Update the data for each feature */
      $.each(m_features, function (idx, featureLevel) {
        $.each(featureLevel, function (type, feature) {
          feature.feature.data(feature.data);
        });
      });
      m_buildTime.modified();
    }
    s_update.call(m_this, request);
  };

  ///////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ///////////////////////////////////////////////////////////////////////////
  this._init = function () {
    /// Call super class init
    s_init.call(m_this);

    if (!m_this.map().interactor()) {
      m_this.map().interactor(mapInteractor({actions: []}));
    }
    m_this.geoOn(geo_event.actionselection, m_this._processSelection);

    m_this.geoOn(geo_event.mouseclick, m_this._handleMouseClick);
    m_this.geoOn(geo_event.mousemove, m_this._handleMouseMove);

    return m_this;
  };

  ///////////////////////////////////////////////////////////////////////////
  /**
   * Free all resources
   */
  ///////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    /// Call super class exit
    s_exit.call(m_this);
    m_annotations = [];
    m_features = [];
    return m_this;
  };

  return m_this;
};

inherit(annotationLayer, featureLayer);
registry.registerLayer('annotation', annotationLayer);
module.exports = annotationLayer;

/////////////////////////////////////////////////////////////////////////////
/**
 * Base annotation class
 *
 * @class geo.annotation
 * @param {string} type the type of annotation.
 * @param {object?} options Inidividual annotations have additional options.
 * @param {string} [options.name] A name for the annotation.  This defaults to
 *    the type with a unique ID suffixed to it.
 * @param {geo.annotationLayer} [options.layer] a reference to the controlling
 *    layer.  This is used for coordinate transforms.
 * @param {string} [options.state] initial annotation state.  One of 'create',
 *    'done', or 'edit'.
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
      m_name = args.name || (
        type.charAt(0).toUpperCase() + type.substr(1) + ' ' + annotationId),
      m_type = type,
      m_layer = args.layer,
      m_state = args.state || 'done';  /* create, done, edit */

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
    m_name = arg;
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
      m_layer.geoTrigger(geo_event.annotation.state, {
        annotation: this
      });
    }
    return this;
  };

  /**
   * Get the options for this annotation.
   *
   * @returns {object} the current options.
   */
  this.options = function () {
    return m_options;
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
    var map = this.layer().map();
    gcs = (gcs === null ? map.gcs() : (
           gcs === undefined ? map.ingcs() : gcs));
    if (gcs !== map.gcs()) {
      coord = transform.transformCoordinates(map.gcs(), gcs, coord);
    }
    return coord;
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
    return this.options().corners;
  };
};
inherit(rectangleAnnotation, annotation);

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
        return Array.apply(null, Array(m_this.options().vertices.length)).map(
            function () { return d; });
      },
      polygon: function (d) { return d.polygon; },
      position: function (d, i) {
        return m_this.options().vertices[i];
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
      case 'create':
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
    return this.options().vertices;
  };

  /**
   * Handle a mouse move on this annotation.
   *
   * @param {geo.event} evt the mouse move event.
   * @returns {boolean|string} true to update the annotation, falsy to not
   *    update anything.
   */
  this.mouseMove = function (evt) {
    var vertices = this.options().vertices;
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
    if (this.state() !== 'create') {
      return;
    }
    var end = !!evt.buttonsDown.right, skip;
    if (!evt.buttonsDown.left && !evt.buttonsDown.right) {
      return;
    }
    var vertices = this.options().vertices;
    if (evt.buttonsDown.right && !vertices.length) {
      return;
    }
    var layer = this.layer();
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
      this.state('done');
      return 'done';
    }
    return (end || !skip);
  };
};
inherit(polygonAnnotation, annotation);

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
      case 'create':
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
    if (this.state() === 'create') {
      return [];
    }
    return [this.options().position];
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
    if (this.state() !== 'create') {
      return;
    }
    if (!evt.buttonsDown.left) {
      return;
    }
    evt.handled = true;
    this.options().position = evt.mapgcs;
    this.state('done');
    return 'done';
  };
};
inherit(pointAnnotation, annotation);
