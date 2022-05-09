const $ = require('jquery');
const inherit = require('../inherit');
const registerAnnotation = require('../registry').registerAnnotation;
const lineFeature = require('../lineFeature');
const polygonFeature = require('../polygonFeature');

const annotation = require('./annotation').annotation;
const annotationState = require('./annotation').state;
const continuousVerticesActions = require('./annotation').continuousVerticesActions;
const continuousVerticesProcessAction = require('./annotation').continuousVerticesProcessAction;

/**
 * Polygon annotation specification.  Extends {@link geo.annotation.spec}.
 *
 * @typedef {object} geo.polygonAnnotation.spec
 * @extends geo.annotation.spec
 * @property {geo.geoPosition[]} [vertices] A list of vertices in map gcs
 *    coordinates.  These must be in order around the perimeter of the polygon
 *    (in either direction).
 * @property {geo.geoPosition[]} [coordinates] An alternate name for
 *    `vertices`.
 * @property {geo.polygonFeature.styleSpec} [style] The style to apply to a
 *    finished polygon.  This uses styles for {@link geo.polygonFeature}.
 * @property {geo.polygonFeature.styleSpec} [editStyle] The style to apply to ai
 *    polygon in edit mode.
 */

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
 * @param {geo.polygonAnnotation.spec?} [args] Options for the annotation.
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
        const coord = m_this._coordinates();
        /* Return an array that has the same number of items as we have
         * vertices. */
        return Array.apply(null, Array((coord.outer || coord).length)).map(
          function () { return d; });
      },
      position: function (d, i) {
        if (d.x !== undefined) {
          return d.x;
        }
        return m_this.options('vertices')[i];
      },
      stroke: false,
      strokeColor: {r: 0, g: 0, b: 1}
    },
    allowBooleanOperations: true
  }, args || {});
  args.vertices = args.vertices || args.coordinates || [];
  delete args.coordinates;
  annotation.call(this, 'polygon', args);

  var m_this = this,
      s_actions = this.actions;

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
        if (opt.vertices && (opt.vertices.outer || opt.vertices.length >= 3)) {
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
   * Return this annotation as a polygon list.
   *
   * @param {geo.util.polyop.spec} [opts] Ignored.
   * @returns {geo.polygonList} A list of polygons.
   */
  this.toPolygonList = function (opts) {
    const coord = m_this._coordinates();
    if (coord.outer) {
      const result = [[coord.outer.map((pt) => [pt.x, pt.y])]];
      (coord.inner || []).forEach((h) => result[0].push(h.map((pt) => [pt.x, pt.y])));
      return result;
    }
    if (coord.length < 3) {
      return [];
    }
    return [[coord.map((pt) => [pt.x, pt.y])]];
  };

  /**
   * Get and optionally set coordinates associated with this annotation in the
   * map gcs coordinate system.
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
      m_this._lastClickVertexCount = vertices.length;
    }
    if (end) {
      if (vertices.length < 4) {
        return 'remove';
      }
      vertices.pop();
      m_this.state(annotationState.done);
      return 'done';
    }
    return !skip;
  };

  /**
   * Return actions needed for the specified state of this annotation.
   *
   * @param {string} [state] The state to return actions for.  Defaults to
   *    the current state.
   * @returns {geo.actionRecord[]} A list of actions.
   */
  this.actions = function (state) {
    return continuousVerticesActions(m_this, s_actions, state, 'polygon', arguments);
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
    return continuousVerticesProcessAction(m_this, evt, 'polygon');
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
    if (!src || (!src.outer && src.length < 3) || m_this.state() === annotationState.create) {
      return;
    }
    var coord = [];
    if (!src.outer) {
      coord = [src.map((pt) => [pt.x, pt.y])];
      coord[0].push(coord[0][0].slice());
    } else {
      coord = [src.outer.map((pt) => [pt.x, pt.y])];
      coord[0].push(coord[0][0].slice());
      (src.inner || []).forEach((h) => {
        const poly = h.map((pt) => [pt.x, pt.y]);
        poly.push(poly[0].slice());
        coord.push(poly);
      });
    }
    return coord;
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

module.exports = polygonAnnotation;
