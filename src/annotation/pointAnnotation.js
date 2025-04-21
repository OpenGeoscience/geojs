const inherit = require('../inherit');
const util = require('../util');
const registerAnnotation = require('../registry').registerAnnotation;
const pointFeature = require('../pointFeature');

const annotation = require('./annotation').annotation;
const annotationState = require('./annotation').state;

/**
 * Point annotation specification.  Extends {@link geo.annotation.spec}.
 *
 * @typedef {object} geo.pointAnnotation.spec
 * @extends geo.annotation.spec
 * @property {geo.geoPosition} [position] A coordinate in map gcs coordinates.
 * @property {geo.geoPosition[]} [coordinates] An array with one coordinate to
 *    use in place of `position`.
 * @property {geo.pointFeature.styleSpec} [style] The style to apply to a
 *    finished point.  This uses styles for {@link geo.pointFeature}.
 * @property {boolean|number} [style.scaled=false] If `false`, the point is not
 *    scaled with zoom level.  If `true`, the radius is based on the zoom level
 *    at first instantiation.  If a number, the radius is used at the `scaled`
 *    zoom level.
 * @property {geo.pointFeature.styleSpec} [editStyle] The style to apply to a
 *    point in edit mode.
 */

/**
 * Point annotation class.
 *
 * @class
 * @alias geo.pointAnnotation
 * @extends geo.annotation
 *
 * @param {geo.pointAnnotation.spec?} [args] Options for the annotation.
 */
var pointAnnotation = function (args) {
  'use strict';
  if (!(this instanceof pointAnnotation)) {
    return new pointAnnotation(args);
  }

  args = util.deepMerge({}, this.constructor.defaults, args);
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
          style = Object.assign({}, style, {
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
   * Get and optionally set coordinates associated with this annotation in the
   * map gcs coordinate system.
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

  this._coordinateOption = 'position';

  /**
   * Handle a mouse click on this annotation.  If the event is processed,
   * evt.handled should be set to `true` to prevent further processing.
   *
   * @param {geo.event} evt The mouse click event.
   * @returns {boolean|string|undefined} `true` to update the annotation,
   *    `'done'` if the annotation was completed (changed from create to done
   *    state), `'remove'` if the annotation should be removed, falsy to not
   *    update anything.
   */
  this.mouseClick = function (evt) {
    if (m_this.state() !== annotationState.create) {
      return undefined;
    }
    if (!evt.buttonsDown.left) {
      return undefined;
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
   * @returns {array?} An array of flattened coordinates in the interface gcs
   *    coordinate system.  `undefined` if this annotation is incomplete.
   */
  this._geojsonCoordinates = function (gcs) {
    var src = m_this.coordinates(gcs);
    if (!src || m_this.state() === annotationState.create || src.length < 1 || src[0] === undefined) {
      return undefined;
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

/**
 * This object contains the default options to initialize the class.
 */
pointAnnotation.defaults = Object.assign({}, annotation.defaults, {
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
});

var pointRequiredFeatures = {};
pointRequiredFeatures[pointFeature.capabilities.feature] = true;
registerAnnotation('point', pointAnnotation, pointRequiredFeatures);

module.exports = pointAnnotation;
