/**
 * WebGL specific subclass of object which rerenders when the object is drawn.
 *
 * @class
 * @alias geo.webgl.object
 * @extends geo.sceneObject
 * @param {object} arg Options for the object.
 * @returns {geo.webgl.object}
 */
var webgl_object = function (arg) {
  'use strict';

  var object = require('../object');

  // this is used to extend other geojs classes, so only generate
  // a new object when that is not the case... like if this === window
  if (!(this instanceof object)) {
    return new webgl_object(arg);
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
      m_this._update({mayDelay: true});
      m_this.renderer()._render();
      s_draw();
    }
    return m_this;
  };

  if (this.bin) {
    var s_bin = this.bin;

    this.bin = function (val, actualValue) {

      if (val === undefined && !actualValue && s_bin(undefined, true) === null) {
        var layer = m_this.layer && m_this.layer(),
            map = layer && layer.map && layer.map(),
            objectList = (map && map.listSceneObjects()) || [],
            pos = objectList.indexOf(m_this);
        if (pos >= 0) {
          return pos;
        }
      }
      return s_bin.apply(m_this, arguments);
    };
  }

  return this;
};

module.exports = webgl_object;
