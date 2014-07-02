//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lineFeature
 *
 * @class
 * @returns {gd3.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof gd3.lineFeature)) {
    return new gd3.lineFeature(arg);
  }
  arg = arg || {};
  geo.lineFeature.call(this, arg);
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
        line = d3.svg.line()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; });
    s_update.call(m_this);

    // georeference the data
    data = m_renderer.worldToDisplay(data);

    // set the style object for the renderer
    m_style.data = [data];
    m_style.attributes = {
      d: line
    };

    m_style.id = m_this._d3id();
    m_style.append = 'path';
    m_style.classes = [ 'd3LineFeature' ];
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

    m_renderer.drawFeatures(m_style);

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

inherit(gd3.lineFeature, geo.lineFeature);

geo.registerFeature('d3', 'line', gd3.lineFeature);
