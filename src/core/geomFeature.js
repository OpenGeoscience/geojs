//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geometryFeature
 *
 * @class
 * Create a geometry feature given a geometry {vgl.geometryData} *
 * @param geometry data {vgl.geometryData} *
 * @returns {geo.geometryFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.geometryFeature = function(geom) {
  "use strict";
  if (!(this instanceof geo.geometryFeature)) {
    return new geo.geometryFeature(geom);
  }
  geo.feature.call(this);

  // Initialize
  var m_mapper = vgl.mapper(),
      m_material = null,
      m_scalar = geom.sourceData(vgl.vertexAttributeKeys.Scalar),
      m_colors = geom.sourceData(vgl.vertexAttributeKeys.Color),
      m_noOfPrimitives = geom.numberOfPrimitives(),
      m_lut = this.lookupTable(),
      m_usePointSprites = false,
      m_pointSpritesImage = null;

  m_mapper.setGeometryData(geom);
  this.setMapper(m_mapper);

  if (m_usePointSprites && m_pointSpritesImage !== null &&
      m_noOfPrimitives === 1 && geom.source(j).primitiveType() === gl.POINTS) {
    m_material = vgl.utils.createPointSpritesMaterial(m_usePointSpritesImage);
  }
  else if (m_scalar) {
    if (m_lut) {
      m_lut.updateRange(m_scalar.scalarRange());
      m_material = vgl.utils.createColorMappedMaterial(m_lut);
    } else {
      m_lut = vgl.lookupTable();
      m_lut.updateRange(m_scalar.scalarRange());
      m_material = vgl.utils.createColorMappedMaterial(m_lut);
    }
  } else if (m_colors) {
    m_material = vgl.utils.createColorMaterial();
  } else {
    m_material = vgl.utils.createSolidColorMaterial();
  }
  this.setMaterial(m_material);
  this.setLookupTable(m_lut);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return if using point sprites for rendering points
   */
  ////////////////////////////////////////////////////////////////////////////
  this.isUsingPointSprites = function() {
    return m_usePointSprites;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set use point sprites for geometries that only has points
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setUsePointSprites = function(val) {
    if (val !== m_usePointSprites) {
      m_usePointSprites = val;
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return image for the point sprites
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pointSpritesImage = function() {
    return m_pointSpritesImage;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set use point sprites for geometries that only has points
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPointSpritesImage = function(psimage) {
    if (psimage !== m_pointSpritesImage) {
      m_pointSpritesImage = psimage;
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update color mapping
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateColorMapping = function() {
  if (!m_lookupTable) {
      console.log('[warning] Invalid lookup table');
      return;
    }

    vgl.utils.updateColorMappedMaterial(this.material(), m_lookupTable);
  };

  return this;
};

inherit(geo.geometryFeature, geo.feature);