var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pointFeature = require('../pointFeature');

/**
 * Create a new instance of svg.pointFeature.
 *
 * @class
 * @alias geo.svg.pointFeature
 * @extends geo.pointFeature
 * @extends geo.svg.object
 * @param {geo.pointFeature.spec} arg
 * @returns {geo.svg.pointFeature}
 */
var svg_pointFeature = function (arg) {
  'use strict';
  if (!(this instanceof svg_pointFeature)) {
    return new svg_pointFeature(arg);
  }

  var svg_object = require('./object');
  var timestamp = require('../timestamp');

  arg = arg || {};
  pointFeature.call(this, arg);
  svg_object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init,
      s_update = this._update,
      m_buildTime = timestamp(),
      m_style = {};

  /**
   * Initialize.
   *
   * @param {geo.pointFeature.spec} arg The feature specification.
   * @returns {this}
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);
    return m_this;
  };

  /**
   * Build.  Create the necessary elements to render points.
   *
   * @returns {this}
   */
  this._build = function () {
    var data = m_this.data(),
        s_style = m_this.style.get(),
        m_renderer = m_this.renderer(),
        pos_func = m_this.position();

    // call super-method
    s_update.call(m_this);

    // default to empty data array
    if (!data) { data = []; }

    // fill in svg renderer style object defaults
    m_style.id = m_this._svgid();
    m_style.data = data;
    m_style.append = 'circle';
    m_style.attributes = {
      r: m_renderer._convertScale(s_style.radius),
      cx: function (d) {
        return m_this.featureGcsToDisplay(pos_func(d)).x;
      },
      cy: function (d) {
        return m_this.featureGcsToDisplay(pos_func(d)).y;
      }
    };
    m_style.style = s_style;
    m_style.classes = ['svgPointFeature'];
    m_style.visible = m_this.visible;

    // pass to renderer to draw
    m_this.renderer()._drawFeatures(m_style);

    // update time stamps
    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };
  /**
   * Update.  Rebuild if necessary.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.timestamp() >= m_buildTime.timestamp()) {
      m_this._build();
    }

    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(svg_pointFeature, pointFeature);

var capabilities = {};
capabilities[pointFeature.capabilities.stroke] = true;

// Now register it
registerFeature('svg', 'point', svg_pointFeature, capabilities);

module.exports = svg_pointFeature;
