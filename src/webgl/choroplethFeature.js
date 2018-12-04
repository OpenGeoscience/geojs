var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var choroplethFeature = require('../choroplethFeature');

/**
 * Create a new instance of choroplethFeature.
 *
 * @class
 * @alias geo.webgl.choroplethFeature
 * @extends geo.choroplethFeature
 * @param {geo.choroplethFeature.spec} arg
 * @returns {geo.webgl.choroplethFeature}
 */
var webgl_choroplethFeature = function (arg) {
  'use strict';

  if (!(this instanceof webgl_choroplethFeature)) {
    return new webgl_choroplethFeature(arg);
  }
  arg = arg || {};
  choroplethFeature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      m_polygons = null,
      s_exit = this._exit,
      s_draw = this.draw,
      s_update = this._update;

  /**
   * Draw each of the polygons associated with this feature.
   *
   * @returns {this}
   */
  this.draw = function () {
    m_this._update();
    if (m_polygons) {
      for (var idx = 0; idx < m_polygons.length; idx += 1) {
        m_polygons[idx].draw();
      }
    }
    s_draw();
    return m_this;
  };

  /**
   * Build.
   *
   * @returns {geo.featurePolygon[]}
   */
  this._build = function () {
    m_this.buildTime().modified();
    m_polygons = m_this.createChoropleth();
    return m_polygons;
  };

  /**
   * Update the choropleth if the data was updated since the last build or the
   * feature was updated.
   */
  this._update = function () {
    s_update.call(m_this);
    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp() ||
        m_this.updateTime().timestamp() <= m_this.timestamp()) {
      m_this._wipePolygons();
      m_this._build();
    }
    m_this.updateTime().modified();
  };

  /**
   * Destroy polygon sub-features.
   */
  this._wipePolygons = function () {
    if (m_polygons) {
      m_polygons.map(function (polygon) {
        return polygon._exit();
      });
    }
    m_polygons = null;
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    m_this._wipePolygons();
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(webgl_choroplethFeature, choroplethFeature);

// Now register it
registerFeature('webgl', 'choropleth', webgl_choroplethFeature);
module.exports = webgl_choroplethFeature;
