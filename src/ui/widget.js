//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class widget
 *
 * @class
 * @extends {geo.sceneObject}
 * @returns {geo.gui.widget}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gui.widget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.widget)) {
    return new geo.gui.widget(arg);
  }
  geo.sceneObject.call(this, arg);

  var m_this = this,
      s_exit = this._exit,
      m_layer = arg.layer,
      m_canvas = null;

  arg.position = arg.position === undefined ? { left: 0, top: 0 } : arg.position;

  if (arg.parent !== undefined && !(arg.parent instanceof geo.gui.widget)) {
    throw 'Parent must be of type geo.gui.widget';
  }

  this._init = function () {
    m_this.modified();
  };

  this._exit = function () {
    m_this.children().forEach(function (child) {
      m_this._deleteFeature(child);
    });

    m_this.layer().geoOff(geo.event.pan, m_this.repositionEvent);
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

    var newFeature = geo.createFeature(
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
    throw 'Must be defined in derived classes';
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
        top: position.y
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
        m_this.canvas().style[cssAttr] = position[cssAttr] + 'px';
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
    this.layer().geoOn(geo.event.pan, m_this.repositionEvent);
  }
};
inherit(geo.gui.widget, geo.sceneObject);
