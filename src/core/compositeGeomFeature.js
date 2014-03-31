//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of compositeGeomPolygon
 *
 * @class
 * Create a multi geometry feature given a array of geometry data {vgl.geometryData} *
 * @param {Array}
 * @returns {geo.compositeGeomPolygon}
 */
//////////////////////////////////////////////////////////////////////////////
geo.compositeGeomPolygon = function(geoms, color) {
  "use strict";
  if (!(this instanceof geo.compositeGeomPolygon)) {
    return new geo.compositeGeomPolygon(geoms, color);
  }
  geo.feature.call(this);

  var m_that = this,
      m_mapper = vgl.groupMapper(),
      m_material = null,
      m_lastModifiedTimestamp = null,
      m_gcs = "EPSG:4326";

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update material
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function updateMaterial(geoms) {
    var count = null,
        i = null,
        scalar = null,
        hasScalars = false,
        lut = m_that.lookupTable();

    if (geoms) {
      count  = geoms.length;
      for (i = 0; i < count; ++i) {
        scalar = geoms[i].sourceData(vgl.vertexAttributeKeys.Scalar);
        if (scalar) {
          if (!lut) {
            lut = vgl.lookupTable();
            m_that.setLookupTable(lut);
          }
          hasScalars = true;
          lut.updateRange(scalar.scalarRange());
        }
      }
    }

    if (hasScalars) {
      m_material = vgl.utils.createColorMappedMaterial(lut);
    } else {
      m_material = vgl.utils.createGeometryMaterial();
    }
    m_that.setMaterial(m_material);
  }

  // Initializations
  this.setMapper(m_mapper);

  if (geoms) {
    m_mapper.setGeometryDataArray(geoms);
  }

  if (!color) {
    updateMaterial(geoms);
  } else {
    m_material = vgl.utils.createSolidColorMaterial(color);
  }
  this.setMaterial(m_material);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get geometries
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometries = function() {
    return m_mapper.geometryDataArray();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this.update = function() {
    if (m_lastModifiedTimestamp &&
        m_lastModifiedTimestamp.getMTime() < this.getMTime()) {

      vgl.utils.updateColorMappedMaterial(this.material(), m_lookupTable);

    } else {

      m_lastModifiedTimestamp = vgl.timestamp();
      m_lastModifiedTimestamp.modified();

    }
  };

  return this;
};

inherit(geo.compositeGeomPolygon, geo.feature);