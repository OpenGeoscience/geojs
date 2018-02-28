var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var lineFeature = require('../lineFeature');

/**
 * Create a new instance of class lineFeature.
 *
 * @class geo.d3.lineFeature
 * @extends geo.lineFeature
 * @param {geo.lineFeature.spec} arg
 * @returns {geo.d3.lineFeature}
 */
var d3_lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof d3_lineFeature)) {
    return new d3_lineFeature(arg);
  }

  var d3 = require('./d3Renderer').d3;
  var object = require('./object');
  var timestamp = require('../timestamp');
  var util = require('../util');

  arg = arg || {};
  lineFeature.call(this, arg);
  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init,
      m_buildTime = timestamp(),
      m_maxIdx = 0,
      s_update = this._update;

  /**
   * Initialize.
   *
   * @param {geo.lineFeature.spec} arg The feature specification.
   * @returns {this}
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);
    return m_this;
  };

  /**
   * Build.  Create the necessary elements to render lines.
   *
   * @returns {this}
   */
  this._build = function () {
    var data = m_this.data() || [],
        s_style = m_this.style(),
        m_renderer = m_this.renderer(),
        pos_func = m_this.position(),
        line, i;

    s_update.call(m_this);
    s_style.fill = function () { return false; };

    data.forEach(function (item, idx) {
      var m_style;
      var ln = m_this.line()(item, idx);

      var style = {}, key;
      function wrapStyle(func) {
        if (util.isFunction(func)) {
          return function () {
            return func(ln[0], 0, item, idx);
          };
        } else {
          return func;
        }
      }
      for (key in s_style) {
        if (s_style.hasOwnProperty(key)) {
          style[key] = wrapStyle(s_style[key]);
        }
      }

      line = d3.svg.line()
          .x(function (d) { return m_this.featureGcsToDisplay(d).x; })
          .y(function (d) { return m_this.featureGcsToDisplay(d).y; })
          .interpolate(m_this.style.get('closed')(item, idx) && ln.length > 2 ?
                       'linear-closed' : 'linear');
      // item is an object representing a single line
      // m_this.line()(item) is an array of coordinates
      m_style = {
        data: [ln.map(function (d, i) { return pos_func(d, i, item, idx); })],
        append: 'path',
        attributes: {
          d: line
        },
        id: m_this._d3id() + idx,
        classes: ['d3LineFeature', 'd3SubLine-' + idx],
        visible: m_this.visible,
        style: style
      };

      m_renderer._drawFeatures(m_style);
    });
    for (i = data.length; i < m_maxIdx; i += 1) {
      m_renderer._removeFeature(m_this._d3id() + i);
    }
    m_maxIdx = data.length;

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

    if (m_this.getMTime() >= m_buildTime.getMTime()) {
      m_this._build();
    }

    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(d3_lineFeature, lineFeature);

// Now register it
var capabilities = {};
capabilities[lineFeature.capabilities.basic] = true;
capabilities[lineFeature.capabilities.multicolor] = false;

registerFeature('d3', 'line', d3_lineFeature, capabilities);

module.exports = d3_lineFeature;
