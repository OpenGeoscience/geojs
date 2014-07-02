//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.d3
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @returns {gd3.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.pointFeature = function (arg) {
  'use strict';
  if (!(this instanceof gd3.pointFeature)) {
    return new gd3.pointFeature(arg);
  }
  arg = arg || {};
  geo.pointFeature.call(this, arg);
  gd3.object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      s_update = this._update,
      m_buildTime = geo.timestamp(),
      m_style = {},
      d_attr,
      d_style,
      m_sticky;

  // default attributes
  d_attr = {
    cx: function (d) { return d.x; },
    cy: function (d) { return d.y; },
    r: 1
  };

  // default style
  d_style = {
    fill: 'black',
    stroke: 'none'
  };

  m_style = {
    attributes: d_attr,
    style: d_style
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
    m_sticky = m_this.layer().sticky();
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
        m_renderer = m_this.renderer();

    // georeference the positions
    data = m_renderer.worldToDisplay(data);

    // call super-method
    s_update.call(m_this);

    // default to empty data array
    if (!data) { data = []; }

    // fill in d3 renderer style object defaults
    m_style.id = m_this._d3id();
    m_style.data = data;
    m_style.append = 'circle';
    m_style.style = $.extend({}, d_style);
    m_style.attributes = $.extend({}, d_attr);
    m_style.classes = [ 'd3PointFeature' ];

    // replace with user defined styles
    m_style.style.fill = d3.rgb(
      s_style.color[0] * 255,
      s_style.color[1] * 255,
      s_style.color[2] * 255
    );
    m_style.attributes.r = function () {
      var m_scale = m_renderer.scaleFactor();
      return (s_style.size / m_scale).toString() + 'px';
    };
    m_style.style['fill-opacity'] = s_style.opacity;

    // pass to renderer to draw
    m_this.renderer().drawFeatures(m_style);

    // update time stamps
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

  // attach to geo.event.d3Rescale to scale points on resize
  m_this.on(geo.event.d3Rescale, function () {
    m_this.renderer()
      .select(m_this._d3id())
        .attr('r', m_style.attributes.r);
  });

  this._init(arg);
  return this;
};

inherit(gd3.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature('d3', 'point', gd3.pointFeature);
