//////////////////////////////////////////////////////////////////////////////
/**
 * Create a plane feature given a lower left corner point geo.latlng
 * and and upper right corner point geo.latlng
 *
 * @class
 * @param lowerleft
 * @param upperright
 * @returns {geo.planeFeature}
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
      m_style = {},
      s_update = this._update,
      s_init = this._init,
      m_buildTime = geo.timestamp();

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Normalize a coordinate as an object {x: ..., y: ...}
   *
   * @private
   * @returns {Object}
   */
  //////////////////////////////////////////////////////////////////////////////
  function normalize(pt) {
    if (Array.isArray(pt)) {
      return {
        x: pt[0],
        y: pt[1]
      };
    } else if (pt instanceof geo.latlng) {
      return {
        x: pt.x(),
        y: pt.y()
      };
    }
    return pt;
  }

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Build the feature object and pass to the renderer for drawing.
   *
   * @private
   * @returns {geo.d3.planeFeature}
   */
  //////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var origin = normalize(m_this.origin()),
        ul = normalize(m_this.upperLeft()),
        lr = normalize(m_this.lowerRight()),
        renderer = m_this.renderer(),
        s = m_this.style();

    delete s.fill_color;
    delete s.color;
    delete s.opacity;
    if (!s.screenCoordinates) {
      origin = renderer.worldToDisplay(origin);
      ul = renderer.worldToDisplay(ul);
      lr = renderer.worldToDisplay(lr);
    }
    m_style.id = m_this._d3id();
    m_style.style = s;
    m_style.attributes = {
      x: ul.x,
      y: ul.y,
      width: lr.x - origin.x,
      height: origin.y - ul.y
    };
    m_style.append = 'rect';
    m_style.data = [0];
    m_style.classes = ['d3PlaneFeature'];

    renderer._drawFeatures(m_style);
    m_buildTime.modified();
    return m_this;
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
