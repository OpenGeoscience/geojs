var inherit = require('./inherit');
var featureLayer = require('./featureLayer');
var geo_action = require('./action');
var geo_annotation = require('./annotation');
var geo_event = require('./event');
var registry = require('./registry');
var $ = require('jquery');
var Mousetrap = require('mousetrap');

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
      m_mode = null,
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
        this.addAnnotation(geo_annotation.rectangleAnnotation(params));
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
      m_options = $.extend(true, m_options, arg1);
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
    var pos = $.inArray(annotation, m_annotations);
    if (pos < 0) {
      m_this.geoTrigger(geo_event.annotation.add_before, {
        annotation: annotation
      });
      m_annotations.push(annotation);
      this.modified();
      this._update();
      this.draw();
      m_this.geoTrigger(geo_event.annotation.add, {
        annotation: annotation
      });
    }
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
      annotation = m_annotations[pos];
      if (skipCreating && annotation.state() === geo_annotation.state.create) {
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
      var createAnnotation, mapNode = m_this.map().node(), oldMode = m_mode;
      m_mode = arg;
      mapNode.css('cursor', m_mode ? 'crosshair' : '');
      if (m_mode) {
        Mousetrap(mapNode[0]).bind('esc', function () { m_this.mode(null); });
      } else {
        Mousetrap(mapNode[0]).unbind('esc');
      }
      if (this.currentAnnotation) {
        switch (this.currentAnnotation.state()) {
          case geo_annotation.state.create:
            this.removeAnnotation(this.currentAnnotation);
            break;
        }
        this.currentAnnotation = null;
      }
      switch (m_mode) {
        case 'point':
          createAnnotation = geo_annotation.pointAnnotation;
          break;
        case 'polygon':
          createAnnotation = geo_annotation.polygonAnnotation;
          break;
        case 'rectangle':
          m_this.map().interactor().addAction(m_actions.rectangle);
          break;
      }
      if (createAnnotation) {
        this.currentAnnotation = createAnnotation({
          state: geo_annotation.state.create,
          layer: this
        });
        this.addAnnotation(m_this.currentAnnotation);
      }
      if (m_mode !== 'rectangle') {
        m_this.map().interactor().removeAction(m_actions.rectangle);
      }
      m_this.geoTrigger(geo_event.annotation.mode, {
        mode: m_mode, oldMode: oldMode});
    }
    return this;
  };

  /**
   * Return the current set of annotations as a geojson object.  Alternately,
   * add a set of annotations from a geojson object.
   *
   * @param {object} geojson: if present, add annotations based on the given
   *    geojson object.  If undefined, return the current annotations as
   *    geojson.  This may bei either a JSON string or a javascript object.
   * @param {boolean} clear: if true, when adding objects, first remove all
   *    existing objects.
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @param {boolean} includeCrs: if true, include the coordinate system in the
   *    output.
   * @return {object} the current annotations as a javascript object that
   *    can be converted to geojson using JSON.stringify.
   */
  this.geojson = function (geojson, clear, gcs, includeCrs) {
    if (geojson !== undefined) {
      if (clear) {
        this.removeAllAnnotations();
      }
      //DWM::
    }
    geojson = null;
    var features = [];
    $.each(m_annotations, function (annotation_idx, annotation) {
      var obj = annotation.geojson(gcs, includeCrs);
      if (obj) {
        features.push(obj);
      }
    });
    if (features.length) {
      geojson = {
        type: 'FeatureCollection',
        features: features
      };
    }
    return geojson;
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
                  console.warn('Cannot create a ' + type + ' feature for ' +
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
