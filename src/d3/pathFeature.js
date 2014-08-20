//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pathFeature
 *
 * @class
 * @returns {gd3.pathFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.pathFeature = function (arg) {
  'use strict';
  if (!(this instanceof gd3.pathFeature)) {
    return new gd3.pathFeature(arg);
  }
  arg = arg || {};
  geo.pathFeature.call(this, arg);
  gd3.object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      m_buildTime = geo.timestamp(),
      s_update = this._update,
      m_style = {};

  m_style.style = {};

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
    var data = m_this.positions() || [],
        s_style = m_this.style(),
        m_renderer = m_this.renderer(),
        tmp, diag;
    s_update.call(m_this);

    diag = function (d) {
        var p = {
          source: d.source,
          target: d.target
        };
        return d3.svg.diagonal()(p);
      };
    tmp = [];
    data.forEach(function (d, i) {
      var src, trg;
      if (i < data.length - 1) {
        src = d;
        trg = data[i + 1];
        tmp.push({
          source: m_renderer.worldToDisplay(src),
          target: m_renderer.worldToDisplay(trg)
        });
      }
    });
    m_style.data = tmp;
    m_style.attributes = {
      d: diag
    };

    m_style.id = m_this._d3id();
    m_style.append = 'path';
    m_style.classes = [ 'd3PathFeature' ];
    m_style.style = {
      fill: 'none',
      stroke: d3.rgb(
        s_style.color[0] * 255,
        s_style.color[1] * 255,
        s_style.color[2] * 255
      ),
      'stroke-width': function () {
        var m_scale = m_renderer.scaleFactor();
        return (s_style.width[0] / m_scale).toString() + 'px';
      },
      'stroke-opacity': s_style.opacity
    };

    m_this.renderer()._drawFeatures(m_style);

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

    if (m_this.dataTime().getMTime() >= m_buildTime.getMTime()) {
      m_this._build();
    }

    return m_this;
  };

  // attach to geo.event.d3Rescale to scale line width on resize
  m_this.on(geo.event.d3Rescale, function () {
    m_this.renderer()
      .select(m_this._d3id())
        .style('stroke-width', m_style.style['stroke-width']);
  });

  this._init(arg);
  return this;
};

inherit(gd3.pathFeature, geo.pathFeature);

geo.registerFeature('d3', 'path', gd3.pathFeature);
