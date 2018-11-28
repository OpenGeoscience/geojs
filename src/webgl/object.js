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

    /**
     * Get/Set bin of the feature.  The bin number is used to determine the
     * order of multiple features on the same layer.  It has no effect except
     * on the webgl renderer.  A negative value hides the feature without
     * stopping interaction with it.  Otherwise, features with higher bin
     * numbers are drawn above those with lower bin numbers.  If two features
     * have the same bin number, their order relative to one another is
     * indeterminate and may be unstable.
     *
     * @param {number} [val] The new bin number.  If `undefined`, return the
     *    current bin number.  If `null`, the bin is dynamically computed based
     *    on order within the parent.  If children are nested, this may not be
     *    what is desired.
     * @param {boolean} [actualValue] If truthy and `val` is undefined, return
     *    the actual value of bin, rather than the dynamically computed value.
     * @returns {number|this} The current bin number or a reference to `this`.
     */
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
