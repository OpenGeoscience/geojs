//////////////////////////////////////////////////////////////////////////////
/**
 * Create a plane feature given a lower left corner point
 * and and upper right corner point
 *
 * @class
 * @extends geo.planeFeature
 * @param lowerleft
 * @param upperright
 * @returns {geo.d3.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.d3.planeFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.d3.planeFeature)) {
    return new geo.d3.planeFeature(arg);
  }
  geo.planeFeature.call(this, arg);
  geo.d3.object.call(this);

  var m_this = this,
      s_update = this._update,
      s_init = this._init,
      m_buildTime = geo.timestamp();

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Build the feature object and pass to the renderer for drawing.
   *
   * @private
   * @returns {geo.d3.planeFeature}
   */
  //////////////////////////////////////////////////////////////////////////////
  this._build = function () {
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Redraw the plane feature if necessary.
   *
   * @private
   * @returns {geo.d3.planeFeature}
   */
  //////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_buildTime.getMTime()) {
      m_this._build();
    }
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Initializes the plane feature style (over-riding the parent default).
   *
   * @private
   * @returns {geo.d3.planeFeature}
   */
  //////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg || {});
    m_this.style({
      stroke: function () { return false; },
      fill: function () { return true; },
      fillColor: function () { return {r: 0.3, g: 0.3, b: 0.3}; },
      fillOpacity: function () { return 0.5; }
    });
    return m_this;
  };

  this._init();
  return this;
};

inherit(geo.d3.planeFeature, geo.planeFeature);

geo.registerFeature('d3', 'plane', geo.d3.planeFeature);
