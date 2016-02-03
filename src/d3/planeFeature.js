var inherit = require('../util').inherit;
var registerFeature = require('../util').registerFeature;
var planeFeature = require('../core/planeFeature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a plane feature given a lower left corner point
 * and and upper right corner point
 *
 * @class geo.d3.planeFeature
 * @extends geo.planeFeature
* @param lowerleft
 * @param upperright
 * @returns {geo.d3.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var d3_planeFeature = function (arg) {
  'use strict';
  if (!(this instanceof d3_planeFeature)) {
    return new d3_planeFeature(arg);
  }

  var object = require('./object');
  var timestamp = require('../core/timestamp');

  planeFeature.call(this, arg);
  object.call(this);

  var m_this = this,
      m_style = {},
      s_update = this._update,
      s_init = this._init,
      m_buildTime = timestamp();

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
    var ul = normalize(m_this.upperLeft()),
        lr = normalize(m_this.lowerRight()),
        renderer = m_this.renderer(),
        s = m_this.style();

    delete s.fill_color;
    delete s.color;
    delete s.opacity;
    /*
    if (!s.screenCoordinates) {
      origin = renderer.layer().map().worldToDisplay(origin);
      ul = renderer.layer().map().worldToDisplay(ul);
      lr = renderer.layer().map().worldToDisplay(lr);
    }
    */
    m_style.id = m_this._d3id();
    m_style.style = s;
    m_style.attributes = {
      x: ul.x,
      y: ul.y,
      width: Math.abs(lr.x - ul.x),
      height: Math.abs(lr.y - ul.y),
      reference: s.reference
    };
    if (s.image) {
      m_style.append = 'image';
      m_style.attributes['xlink:href'] = s.image;
    } else {
      m_style.append = 'rect';
    }
    m_style.data = [0];
    m_style.classes = ['d3PlaneFeature'];
    if (s.parentId) {
      m_style.parentId = s.parentId;
    }

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

inherit(d3_planeFeature, planeFeature);

registerFeature('d3', 'plane', d3_planeFeature);
