//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lineFeature
 *
 * @class
 * @extends geo.lineFeature
 * @extends geo.d3.object
 * @returns {geo.d3.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.d3.lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.d3.lineFeature)) {
    return new geo.d3.lineFeature(arg);
  }
  arg = arg || {};
  geo.lineFeature.call(this, arg);
  geo.d3.object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      m_buildTime = geo.timestamp(),
      s_update = this._update;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var data = m_this.data() || [],
        s_style = m_this.style(),
        m_renderer = m_this.renderer(),
        pos_func = m_this.position(),
        line = d3.svg.line()
                .x(function (d) { return m_this.featureGcsToDisplay(d).x; })
                .y(function (d) { return m_this.featureGcsToDisplay(d).y; });

    s_update.call(m_this);
    s_style.fill = function () { return false; };

    data.forEach(function (item, idx) {
      var m_style;
      var ln = m_this.line()(item, idx);

      var style = {}, key;
      function wrapStyle(func) {
        if (geo.util.isFunction(func)) {
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
        style: style
      };

      m_renderer._drawFeatures(m_style);
    });

    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
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

inherit(geo.d3.lineFeature, geo.lineFeature);

geo.registerFeature('d3', 'line', geo.d3.lineFeature);
