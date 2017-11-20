var inherit = require('../inherit');
var sceneObject = require('../sceneObject');

/**
 * @typedef {object} geo.gui.widget.position
 * @property {string|number} [top] The position to the top of the container.
 * A string css position or a number. If a number is used, it will be treated as px value.
 * @property {string|number} [right] The position to the right of the container.
 * Value is used similarly to the top property.
 * @property {string|number} [bottom] The position to the bottom of the container.
 * Value is used similarly to the top property.
 * @property {string|number} [left] The position to the left of the container.
 * Value is used similarly to the top property.
 * @property {*} [...] Additional css properties that affect position are
  allowed.  See the css specification for details.
 */

/**
 * Create a new instance of class widget.
 *
 * @class
 * @alias geo.gui.widget
 * @param {object} [arg] Options for the widget.
 * @param {geo.layer} [arg.layer] Layer associated with the widget.
 * @param {geo.gui.widget.position} [arg.position] Location of the widget.
 * @param {geo.gui.widget} [arg.parent] Optional parent widget.
 * @extends {geo.sceneObject}
 * @returns {geo.gui.widget}
 */
var widget = function (arg) {
  'use strict';
  if (!(this instanceof widget)) {
    return new widget(arg);
  }
  sceneObject.call(this, arg);

  var geo_event = require('../event');
  var createFeature = require('../registry').createFeature;

  var m_this = this,
      s_exit = this._exit,
      m_layer = arg.layer,
      m_canvas = null,
      m_position = arg.position === undefined ? { left: 0, top: 0 } : arg.position;

  if (arg.parent !== undefined && !(arg.parent instanceof widget)) {
    throw new Error('Parent must be of type geo.gui.widget');
  }

  /**
   * Initialize the widget.
   *
   * @returns {this}
   */
  this._init = function () {
    m_this.modified();
    return m_this;
  };

  /**
   * Clean up the widget.
   *
   */
  this._exit = function () {
    m_this.children().forEach(function (child) {
      m_this._deleteFeature(child);
    });

    m_this.layer().geoOff(geo_event.pan, m_this.repositionEvent);
    m_this.parentCanvas().removeChild(m_this.canvas());
    s_exit();
  };

  /**
   * Create a new feature.
   *
   * @param {string} featureName Name of the feature to create.
   * @param {object} arg Options for the new feature.
   * @returns {geo.feature} The new feature.
   */
  this._createFeature = function (featureName, arg) {

    var newFeature = createFeature(
      featureName, m_this, m_this.renderer(), arg);

    m_this.addChild(newFeature);
    m_this.modified();
    return newFeature;
  };

  /**
   * Delete feature.
   *
   * @param {geo.feature} feature The feature to delete.
   * @returns {this}
   */
  this._deleteFeature = function (feature) {
    m_this.removeChild(feature);
    feature._exit();
    return m_this;
  };

  /**
   * Return the layer associated with this widget.
   *
   * @returns {geo.layer}
   */
  this.layer = function () {
    return m_layer;
  };

  /**
   * Create the canvas this widget will operate on.
   */
  this._createCanvas = function () {
    throw new Error('Must be defined in derived classes');
  };

  /**
   * Get/Set the canvas for the widget.
   *
   * @param {HTMLElement} [val] If specified, set the canvas, otherwise get
   *    the canvas.
   * @returns {HTMLElement|this} If getting the canvas, return the current
   *    value; otherwise, return this widget.
   */
  this.canvas = function (val) {
    if (val === undefined) {
      return m_canvas;
    }
    m_canvas = val;
    return m_this;
  };

  /**
   * Appends a child to the widget.
   * The widget determines how to append itself to a parent, the parent can
   * either be another widget, or the UI Layer.
   */
  this._appendChild = function () {
    m_this.parentCanvas().appendChild(m_this.canvas());
  };

  /**
   * Get the parent canvas (top level widgets define their layer as their
   * parent canvas).
   *
   * @returns {HTMLElement} The canvas of the widget's parent.
   */
  this.parentCanvas = function () {
    if (m_this.parent === undefined) {
      return m_this.layer().canvas();
    }
    return m_this.parent().canvas();
  };

  /**
   * Get or set the CSS positioning that a widget should be placed at.
   *
   * @param {geo.gui.widget.position} [pos] If unspecified, return the current
   *    position.  Otherwise, set the current position.
   * @param {boolean} [actualValue] If getting the position, if this is truthy,
   *    always return the stored value, not a value adjusted for display.
   * @returns {geo.gui.widget.position|this} Either the position or the widget
   *    instance.  If this is the position and `actualValue` is falsy,
   *    positions that specify an explicit `x` and `y` parameter will be
   *    converted to a value that can be used by the display css.
   */
  this.position = function (pos, actualValue) {
    if (pos !== undefined) {
      this.layer().geoOff(geo_event.pan, m_this.repositionEvent);
      m_position = pos;
      if (m_position.hasOwnProperty('x') && m_position.hasOwnProperty('y')) {
        this.layer().geoOn(geo_event.pan, m_this.repositionEvent);
      }
      this.reposition();
      return this;
    }
    if (m_position.hasOwnProperty('x') && m_position.hasOwnProperty('y') && !actualValue) {
      var position = m_this.layer().map().gcsToDisplay(m_position);

      return {
        left: position.x,
        top: position.y,
        right: null,
        bottom: null
      };
    }

    return m_position;
  };

  /**
   * Repositions a widget.
   *
   * @param {geo.gui.widget.position} [position] The new position for the
   *    widget.  `undefined` uses the stored position value.
   * @returns {this}
   */
  this.reposition = function (position) {
    position = position || m_this.position();
    m_this.canvas().style.position = 'absolute';

    for (var cssAttr in position) {
      if (position.hasOwnProperty(cssAttr)) {
        // if the property is a number, add px to it, otherwise set it to the
        // specified value.  Setting a property to null clears it.  Setting to
        // undefined doesn't alter it.
        if (/^\s*(-|\+)?(\d+(\.\d*)?|\d*\.\d+)([eE](-|\+)?\d+)?\s*$/.test(position[cssAttr])) {
          m_this.canvas().style[cssAttr] = ('' + position[cssAttr]).trim() + 'px';
        } else {
          m_this.canvas().style[cssAttr] = position[cssAttr];
        }
      }
    }
    return m_this;
  };

  /**
   * If the position is based on map coordinates, this gets called when the
   * map is panned to resposition the widget.
   *
   * @returns {this}
   */
  this.repositionEvent = function () {
    return m_this.reposition();
  };

  /**
   * Report if the widget is completely within the viewport.
   *
   * @returns {boolean} True if the widget is completely within the viewport.
   */
  this.isInViewport = function () {
    var position = m_this.position();
    var layer = m_this.layer();

    return ((position.left >= 0 && position.top >= 0) &&
            (position.left <= layer.width() && position.top <= layer.height()));
  };

  if (m_position.hasOwnProperty('x') && m_position.hasOwnProperty('y')) {
    this.layer().geoOn(geo_event.pan, m_this.repositionEvent);
  }
};
inherit(widget, sceneObject);
module.exports = widget;
