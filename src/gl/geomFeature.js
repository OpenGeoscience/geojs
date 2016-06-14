var inherit = require('../inherit');
var geomFeature = require('../geomFeature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geomFeature
 *
 * @class geo.gl.geomFeature
 * @extends geo.geomFeature
 * @param {vgl.geometryData} arg
 * @returns {geo.gl.geomFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var gl_geomFeature = function (arg) {
  'use strict';
  if (!(this instanceof gl_geomFeature)) {
    return new gl_geomFeature(arg);
  }

  var vgl = require('vgl');

  arg = arg || {};
  geomFeature.call(this, arg);
  var object = require('./object');

  object.call(this);

  // Initialize
  var m_this = this,
      m_geom = arg.geom || null,
      m_actor = vgl.actor(),
      m_mapper = vgl.mapper(),
      m_material = null,
      m_scalar = null,
      m_color = arg.color || [1.0, 1.0, 1.0],
      m_buildTime = null,
      m_noOfPrimitives = 0;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var style = m_this.style();

    // Vertex color gets the preference
    if (m_geom !== null) {
      m_scalar = m_geom.sourceData(vgl.vertexAttributeKeys.Scalar);
      m_color = m_geom.sourceData(vgl.vertexAttributeKeys.Color);
      m_mapper.setGeometryData(m_geom);
    }

    m_this.setMapper(m_mapper);

    if (style.point_sprites !== undefined && style.point_sprites &&
        style.point_sprites_image !== undefined &&
        style.point_sprites_image !== null &&
        m_noOfPrimitives === 1 &&
        m_geom.primitive(0).primitiveType() === vgl.GL.POINTS) {
      m_material = vgl.utils.createPointSpritesMaterial(
                     style.point_sprites_image);
    } else if (m_scalar) {
      if (m_color instanceof vgl.lookupTable) {
        m_color.updateRange(m_scalar.scalarRange());
        m_material = vgl.utils.createColorMappedMaterial(m_color);
      } else {
        m_color = vgl.lookupTable();
        m_color.updateRange(m_scalar.scalarRange());
        m_material = vgl.utils.createColorMappedMaterial(m_color);
      }
    } else if (m_color) {
      m_material = vgl.utils.createColorMaterial();
    } else {
      m_material = vgl.utils.createSolidColorMaterial();
    }
    m_actor.setMaterial(m_material);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @private
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    if (m_buildTime &&
        m_buildTime.getMTime() < m_this.getMTime()) {
      if (m_color instanceof vgl.lookupTable) {
        vgl.utils.updateColorMappedMaterial(m_this.material(),
          m_this.style.color);
      }/* else {
        // TODO
      }*/
    } else {
      m_buildTime = vgl.timestamp();
      m_buildTime.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set geometry
   *
   * @returns {geo.gl.geomFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometry = function (val) {
    if (val === undefined) {
      return m_geom;
    } else {
      m_geom = val;
      m_this.modified();
      return m_this;
    }
  };

  return this;
};

inherit(gl_geomFeature, geomFeature);
module.exports = gl_geomFeature;
