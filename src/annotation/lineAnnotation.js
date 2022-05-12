const $ = require('jquery');
const inherit = require('../inherit');
const registerAnnotation = require('../registry').registerAnnotation;
const lineFeature = require('../lineFeature');

const annotation = require('./annotation').annotation;
const annotationState = require('./annotation').state;
const continuousVerticesActions = require('./annotation').continuousVerticesActions;
const continuousVerticesProcessAction = require('./annotation').continuousVerticesProcessAction;

/**
 * Line annotation specification.  Extends {@link geo.annotation.spec}.
 *
 * @typedef {object} geo.lineAnnotation.spec
 * @extends geo.annotation.spec
 * @property {geo.geoPosition[]} [vertices] A list of vertices in map gcs
 *    coordinates.
 * @property {geo.geoPosition[]} [coordinates] An alternate name for
 *    `vertices`.
 * @property {geo.lineFeature.styleSpec} [style] The style to apply to a
 *    finished line.  This uses styles for {@link geo.lineFeature}.
 * @property {geo.lineFeature.styleSpec} [editStyle] The style to apply to a
 *    line in edit mode.
 */

/**
 * Line annotation class.
 *
 * @class
 * @alias geo.lineAnnotation
 * @extends geo.annotation
 *
 * @param {geo.lineAnnotation.spec?} [args] Options for the annotation.
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
    return continuousVerticesActions(m_this, s_actions, state, 'line', arguments);
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
    return continuousVerticesProcessAction(m_this, evt, 'line');
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
    var coord = [];
    for (var i = 0; i < src.length; i += 1) {
      coord.push([src[i].x, src[i].y]);
    }
    return coord;
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

module.exports = lineAnnotation;
