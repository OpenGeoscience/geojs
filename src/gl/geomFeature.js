//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geomFeature
 *
 * @class
 * Create a geometry feature given a geometry {vgl.geometryData}
 *
 * @param arg {"geom": vgl.geometryData}
 * @returns {ggl.geomFeature}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.geomFeature = function(arg) {
  "use strict";
  if (!(this instanceof ggl.geomFeature)) {
    return new ggl.geomFeature(arg);
  }
  arg = arg || {};
  geo.geomFeature.call(this, arg);

  // Initialize
  var m_style = this.style(),
      m_geom = args.geom || null,
      m_actor = vgl.actor(),
      m_mapper = vgl.mapper(),
      m_material = null,
      m_scalar = null,
      m_color = arg.color || [1.0, 1.0, 1.0],
      m_buildTime = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function() {
    // Vertex color gets the preference
    if (m_geom !== null) {
      m_scalar = m_geom.sourceData(vgl.vertexAttributeKeys.Scalar),
      m_color = m_geom.sourceData(vgl.vertexAttributeKeys.Color);
      m_mapper.setGeometryData(m_geom);
    }

    this.setMapper(m_mapper);

    if (style.point_sprites !== undefined && style.point_sprites &&
        style.point_sprites_image !== undefined &&
        style.point_sprites_image !== null &&
        m_noOfPrimitives === 1 &&
        m_geom.primitive(0).primitiveType() === gl.POINTS) {
      m_material = vgl.utils.createPointSpritesMaterial(
                     style.point_sprites_image);
    }
    else if (m_scalar) {
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
  this._update = function() {
    if (m_buildTime &&
        m_buildTime.getMTime() < this.getMTime()) {
      if (m_color instanceof vgl.lookupTable) {
        vgl.utils.updateColorMappedMaterial(this.material(),
          this.style.color);
      } else {
        // TODO
      }
    } else {
      m_buildTime = vgl.timestamp();
      m_buildTime.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set geometry
   *
   * @returns {ggl.geomFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometry = function(val) {
    if (val === undefined ) {
      return m_geom;
    } else {
      m_geom = val;
      this.modified();
      return this;
    }
  };

  return this;
};

inherit(ggl.geomFeature, geo.geomFeature);