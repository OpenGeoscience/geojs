var inherit = require('../inherit');
var sceneObject = require('../sceneObject');

/**
 * D3 specific subclass of object which adds an id property for d3 selections
 * on groups of objects by class id.
 *
 * @class
 * @alias geo.d3.object
 * @extends geo.sceneObject
 * @param {object} arg Options for the object.
 * @returns {geo.d3.object}
 */
var d3_object = function (arg) {
  'use strict';

  var object = require('../object');
  var uniqueID = require('./uniqueID');

  // this is used to extend other geojs classes, so only generate
  // a new object when that is not the case... like if this === window
  if (!(this instanceof object)) {
    return new d3_object(arg);
  }
  sceneObject.call(this);

  var m_id = 'd3-' + uniqueID(),
      s_exit = this._exit,
      m_this = this,
      s_draw = this.draw;

  this._d3id = function () {
    return m_id;
  };

  /**
   * Returns a d3 selection for the feature elements.
   *
   * @returns {d3.selector} A d3 selector of the features in this object.
   */
  this.select = function () {
    return m_this.renderer().select(m_this._d3id());
  };

  /**
   * Redraw the object.
   *
   * @returns {this}
   */
  this.draw = function () {
    m_this._update();
    s_draw();
    return m_this;
  };

  /**
   * Removes the element from the svg and the renderer.
   */
  this._exit = function () {
    m_this.renderer()._removeFeature(m_this._d3id());
    s_exit();
  };

  return this;
};

inherit(d3_object, sceneObject);
module.exports = d3_object;
