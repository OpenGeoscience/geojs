/**
 * Vtk.js specific subclass of object which rerenders when the object is drawn.
 *
 * @class
 * @alias geo.vtkjs.object
 * @extends geo.sceneObject
 * @param {object} arg Options for the object.
 * @returns {geo.vtkjs.object}
 */
var vtkjs_object = function (arg) {
  'use strict';

  var object = require('../object');

  // this is used to extend other geojs classes, so only generate
  // a new object when that is not the case... like if this === window
  if (!(this instanceof object)) {
    return new vtkjs_object(arg);
  }

  var m_this = this,
      s_draw = this.draw;

  /**
   * Redraw the object.
   *
   * @returns {this}
   */
  this.draw = function () {
    if (m_this.ready) {
      m_this._update();
      m_this.renderer()._render();
      s_draw();
    }
    return m_this;
  };

  return this;
};

module.exports = vtkjs_object;
