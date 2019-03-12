var registerLayerAdjustment = require('../registry').registerLayerAdjustment;

var webgl_layer = function () {
  'use strict';

  var m_this = this,
      s_visible = this.visible,
      s_zIndex = this.zIndex;

  /**
   * Get/Set visibility of the layer.
   *
   * @param {boolean} [val] If specified, change the visibility.  Otherwise,
   *    get it.
   * @returns {boolean|this} either the visibility (if getting) or the layer
   *    (if setting).
   */
  this.visible = function (val) {
    if (val === undefined) {
      return s_visible();
    }
    var origVal = s_visible(),
        result = s_visible.apply(m_this, arguments);
    if (origVal !== val && m_this.initialized()) {
      m_this.map().scheduleAnimationFrame(m_this._update, true);
      m_this.renderer()._render();
    }
    return result;
  };

  /**
   * Get or set the z-index of the layer.  The z-index controls the display
   * order of the layers in much the same way as the CSS z-index property.
   *
   * @param {number} [zIndex] The new z-index, or undefined to return the
   *    current z-index.
   * @param {boolean} [allowDuplicate] When setting the z index, if this is
   *    truthy, allow other layers to have the same z-index.  Otherwise,
   *    ensure that other layers have distinct z-indices from this one.
   * @returns {number|this}
   */
  this.zIndex = function (zIndex, allowDuplicate) {
    var result = s_zIndex.apply(m_this, arguments);
    if (zIndex !== undefined && m_this.initialized()) {
      /* If the z-index has changed, schedule rerendering the layer. */
      m_this.map().scheduleAnimationFrame(m_this._update, true);
      m_this.renderer()._render();
    }
    return result;
  };
};

registerLayerAdjustment('webgl', 'all', webgl_layer);

module.exports = webgl_layer;
