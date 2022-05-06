const $ = require('jquery');
const inherit = require('../inherit');
const geo_event = require('../event');
const geo_action = require('../action');
const registerAnnotation = require('../registry').registerAnnotation;
const polygonFeature = require('../polygonFeature');

const annotation = require('./annotation').annotation;
const annotationState = require('./annotation').state;
const annotationActionOwner = require('./annotation').annotationActionOwner;

/**
 * Rectangle annotation specification.  Extends {@link geo.annotation.spec}.
 *
 * @typedef {object} geo.rectangleAnnotation.spec
 * @extends geo.annotation.spec
 * @property {geo.geoPosition[]} [corners] A list of four corners in map gcs
 *    coordinates.  These must be in order around the perimeter of the
 *    rectangle (in either direction).
 * @property {geo.geoPosition[]} [coordinates] An alternate name for `corners`.
 * @property {geo.polygonFeature.styleSpec} [style] The style to apply to a
 *    finished rectangle.  This uses styles for {@link geo.polygonFeature}.
 * @property {geo.polygonFeature.styleSpec} [editStyle] The style to apply to a
 *    rectangle in edit mode.
 * @property {number|number[]|function} [constraint] If specified, an aspect
 *    ratio or list of aspect ratios to constraint the rectangle to.  If a
 *    function, a selection constraint function to call to adjust the
 *    rectangle.
 */

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
 * @param {geo.rectangleAnnotation.spec?} [args] Options for the annotation.
 * @param {string} [annotationName='rectangle'] Override the annotation name.
 */
var rectangleAnnotation = function (args, annotationName) {
  'use strict';
  if (!(this instanceof rectangleAnnotation)) {
    return new rectangleAnnotation(args, annotationName);
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
  annotation.call(this, annotationName || 'rectangle', args);

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
          selectionRectangle: true,
          selectionConstraint: this._selectionConstraint
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
    if (this._selectionConstraint && evt.mouse && evt.state.origin) {
      this._selectionConstraint(evt.mouse.mapgcs, evt.state.origin.mapgcs, corners);
    }
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
    features = [];
    if (opt.corners && opt.corners.length >= 4) {
      features = [{
        polygon: {
          polygon: opt.corners,
          style: m_this.styleForState(state)
        }
      }];
    }
    if (state === annotationState.edit) {
      m_this._addEditHandles(features, opt.corners);
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
    if (m_this._coordinates().length < 3) {
      return [];
    }
    return [[m_this._coordinates().map((pt) => [pt.x, pt.y])]];
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
    if (coordinates && coordinates.length >= 4) {
      m_this.options('corners', coordinates.slice(0, 4));
      /* Should we ensure that the four points form a rectangle in the current
       * projection, though this might not be rectangular in another gcs? */
    }
    return m_this.options('corners');
  };

  this._coordinateOption = 'corners';

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
    var coord = [];
    for (var i = 0; i < 4; i += 1) {
      coord.push([src[i].x, src[i].y]);
    }
    coord.push([src[0].x, src[0].y]);
    return [coord];
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
    if (this._selectionConstraint) {
      this._selectionConstraint(evt.mapgcs, corners[0], corners);
    }
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
        if (this._selectionConstraint) {
          corners = this._selectionConstraint(evt.mouse.mapgcs, evt.state.origin.mapgcs, corners, 'vertex', ang, index).corners;
        }
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
        if (this._selectionConstraint) {
          corners = this._selectionConstraint(evt.mouse.mapgcs, evt.state.origin.mapgcs, corners, 'edge', ang, index).corners;
        }
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

module.exports = rectangleAnnotation;
