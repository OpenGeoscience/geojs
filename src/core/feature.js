//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class feature
 *
 * @class
 * @returns {geo.feature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.feature = function() {
  "use strict";
  if (!(this instanceof geo.feature)) {
    return new geo.feature();
  }
  vgl.actor.call(this);

  /**
   * @private
   */
  var m_lookupTable = null,
      m_gcs = "EPSG:4326";

  /**
   * Get lookup table
   */
  this.lookupTable = function() {
    return m_lookupTable;
  };

  /**
   * Set lookup table
   */
  this.setLookupTable = function(lut) {
    if (lut !== m_lookupTable) {
      m_lookupTable = lut;
      this.updateColorMapping();
      this.modified();
      return true;
    }
    return false;
  };

  /**
   * Get projection
   */
  this.gcs = function() {
    return m_gcs;
  };

  /**
   * Set the projection
   */
  this.setGcs = function(gcs) {
    m_gcs = gcs;
  };

  /**
   * Update color mapping
   */
  this.updateColorMapping = function() {
    if (!m_lookupTable) {
      console.log('[warning] Invalid lookup table');
      return;
    }

    vgl.utils.updateColorMappedMaterial(this.material(), m_lookupTable);
  };

  return this;
};

inherit(geo.feature, vgl.actor);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of planeFeature
 *
 * @class
 * Create a plane feature given a lower left corner point {geo.latlng}
 * and and upper right corner point {geo.latlng}
 * @param lowerleft
 * @param upperright
 * @returns {geo.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.planeFeature = function(lowerleft, upperright, z) {
  "use strict";
  if (!(this instanceof geo.planeFeature)) {
    return new geo.planeFeature(lowerleft, upperright);
  }

  geo.feature.call(this);

  z = typeof z !== 'undefined' ? z : 0.0;

  // Initialize
  var origin, pt2, pt1, actor;
  origin = [ lowerleft.lng(), lowerleft.lat(), z ];
  pt2 = [ lowerleft.lng(), upperright.lat(), z ];
  pt1 = [ upperright.lng(), lowerleft.lat(), z ];

  actor = vgl.utils.createPlane(origin[0], origin[1], origin[2],
                                      pt1[0], pt1[1], pt1[2], pt2[0], pt2[1],
                                      pt2[2]);



  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets the coordinates for this plane
   *
   * @returns {Array} [lat1, lon1, lat2, lon2]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getCoords = function() {
    return [origin[1], origin[0], pt2[1], pt1[0]];
  };

  return this;
};

inherit(geo.planeFeature, geo.feature);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @param positions
 * @param colors
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointFeature = function(positions, colors) {
  "use strict";
  if (!(this instanceof geo.pointFeature)) {
    return new geo.pointFeature(positions, colors);
  }
  geo.feature.call(this);

  // Initialize
  var actor = vgl.utils.createPoints(positions, colors);
  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geo.pointFeature, geo.feature);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointSpritesFeature
 *
 * @class
 * @param positions
 * @param colors
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointSpritesFeature = function(image, positions, colors) {
  "use strict";
  if (!(this instanceof geo.pointSpritesFeature)) {
    return new geo.pointSpritesFeature(image, positions, colors);
  }

  geo.feature.call(this);

  // Initialize
  var actor = vgl.utils.createPointSprites(image, positions, colors);
  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geo.pointSpritesFeature, geo.feature);

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
  var mapper = vgl.mapper(),
      material = null,
      scalar = geom.sourceData(vgl.vertexAttributeKeys.Scalar),
      colors = geom.sourceData(vgl.vertexAttributeKeys.Color),
      lut = this.lookupTable();

  mapper.setGeometryData(geom);
  this.setMapper(mapper);

  if (scalar) {
    if (lut) {
      lut.updateRange(scalar.scalarRange());
      material = vgl.utils.createColorMappedMaterial(lut);
    } else {
      lut = vgl.lookupTable();
      lut.updateRange(scalar.scalarRange());
      material = vgl.utils.createColorMappedMaterial(lut);
    }
  } else if (colors) {
    material = vgl.utils.createColorMaterial();
  } else {
    material = vgl.utils.createSolidColorMaterial();
  }
  this.setMaterial(material);
  this.setLookupTable(lut);

  return this;
};

inherit(geo.geometryFeature, geo.feature);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of compositeGeometryFeature
 *
 * @class
 * Create a multi geometry feature given a array of geometry data {vgl.geometryData} *
 * @param {Array}
 * @returns {geo.compositeGeometryFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.compositeGeometryFeature = function(geoms, color) {
  "use strict";
  if (!(this instanceof geo.compositeGeometryFeature)) {
    return new geo.compositeGeometryFeature(geoms, color);
  }
  geo.feature.call(this);

  var m_that = this,
      m_mapper = vgl.groupMapper(),
      m_material = null,
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get geometries
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometries = function() {
    return m_mapper.geometryDataArray();
  };

  /**
   * Get projection
   */
  this.gcs = function() {
    return m_gcs;
  };

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

  return this;
};

inherit(geo.compositeGeometryFeature, geo.feature);
