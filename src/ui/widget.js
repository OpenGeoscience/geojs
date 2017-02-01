var inherit = require('../inherit');
var sceneObject = require('../sceneObject');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class widget
 *
 * @class geo.gui.widget
 * @extends {geo.sceneObject}
 * @returns {geo.gui.widget}
 */
//////////////////////////////////////////////////////////////////////////////
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
      m_canvas = null;

  arg.position = arg.position === undefined ? { left: 0, top: 0 } : arg.position;

  if (arg.parent !== undefined && !(arg.parent instanceof widget)) {
    throw new Error('Parent must be of type geo.gui.widget');
  }

  this._init = function () {
    m_this.modified();
  };

  this._exit = function () {
    m_this.children().forEach(function (child) {
      m_this._deleteFeature(child);
    });

    m_this.layer().geoOff(geo_event.pan, m_this.repositionEvent);
    m_this.parentCanvas().removeChild(m_this.canvas());
    s_exit();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create feature give a name
   *
   * @returns {geo.Feature} Will return a new feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._createFeature = function (featureName, arg) {

    var newFeature = createFeature(
      featureName, m_this, m_this.renderer(), arg);

    m_this.addChild(newFeature);
    m_this.modified();
    return newFeature;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._deleteFeature = function (feature) {
    m_this.removeChild(feature);
    feature._exit();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the layer associated with this widget.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.layer = function () {
    return m_layer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create the canvas this widget will operate on.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._createCanvas = function () {
    throw new Error('Must be defined in derived classes');
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set the canvas for the widget
   */
  ////////////////////////////////////////////////////////////////////////////
  this.canvas = function (val) {
    if (val === undefined) {
      return m_canvas;
    } else {
      m_canvas = val;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Appends a child to the widget
   * The widget determines how to append itself to a parent, the parent can either
   * be another widget, or the UI Layer.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._appendChild = function () {
    m_this.parentCanvas().appendChild(m_this.canvas());
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the parent canvas (top level widgets define their layer as their parent canvas)
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parentCanvas = function () {
    if (m_this.parent === undefined) {
      return m_this.layer().canvas();
    } else {
      return m_this.parent().canvas();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets the CSS positioning that a widget should be placed at.
   * { top: 0, left: 0 } by default.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.position = function (pos) {
    if (pos !== undefined) {
      arg.position = pos;
      this.reposition();
      return this;
    }
    var position;

    if (arg &&
        arg.hasOwnProperty('position') &&
        arg.position.hasOwnProperty('x') &&
        arg.position.hasOwnProperty('y')) {

      position = m_this.layer().map().gcsToDisplay(arg.position);

      return {
        left: position.x,
        top: position.y,
        right: null,
        bottom: null
      };
    }

    return arg.position;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Repositions a widget based on the argument passed, or calling position on
   * the widget itself.
   * @param {object} position A position with the form:
   * { top: m, left: n }
   */
  ////////////////////////////////////////////////////////////////////////////
  this.reposition = function (position) {
    position = position || m_this.position();
    m_this.canvas().style.position = 'absolute';

    for (var cssAttr in position) {
      if (position.hasOwnProperty(cssAttr)) {
        // if the property is a number, add px to it, otherwise set it to the
        // specified value.  Setting a property to null clears it.  Setting to
        // undefined doesn't alter it.
        if (/^\s*(\-|\+)?(\d+(\.\d*)?|\d*\.\d+)([eE](\-|\+)?\d+)?\s*$/.test(position[cssAttr])) {
          m_this.canvas().style[cssAttr] = ('' + position[cssAttr]).trim() + 'px';
        } else {
          m_this.canvas().style[cssAttr] = position[cssAttr];
        }
      }
    }
  };

  this.repositionEvent = function () {
    return m_this.reposition();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Determines whether or not the widget is completely within the viewport.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.isInViewport = function () {
    var position = m_this.position();
    var layer = m_this.layer();

    return ((position.left >= 0 && position.top >= 0) &&
            (position.left <= layer.width() && position.top <= layer.height()));
  };

  if (arg &&
      arg.hasOwnProperty('position') &&
      arg.position.hasOwnProperty('x') &&
      arg.position.hasOwnProperty('y')) {
    this.layer().geoOn(geo_event.pan, m_this.repositionEvent);
  }
};
inherit(widget, sceneObject);
module.exports = widget;
