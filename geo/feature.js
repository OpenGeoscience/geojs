//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class feature
 *
 * @class
 * @returns {geoModule.feature}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.feature = function() {
  "use strict";
  if (!(this instanceof geoModule.feature)) {
    return new geoModule.feature();
  }
  vglModule.actor.call(this);

  /**
   * @private
   */
  var m_lookupTable = null;

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
   * Update color mapping
   */
  this.updateColorMapping = function() {
    if (!m_lookupTable) {
      console.log('[warning] Invalid lookup table');
      return;
    }

    vglModule.utils.updateColorMappedMaterial(this.material(), m_lookupTable);
  };

  return this;
};

inherit(geoModule.feature, vglModule.actor);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of planeFeature
 *
 * @class
 * @desc Create a plane feature given a lower left corner point {ogs.geo.latlng}
 * and and upper right corner point {ogs.geo.latlng}
 * @param lowerleft
 * @param upperright
 * @returns {geoModule.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.planeFeature = function(lowerleft, upperright) {
  "use strict";
  if (!(this instanceof geoModule.planeFeature)) {
    return new geoModule.planeFeature(lowerleft, upperright);
  }

  vglModule.actor.call(this);

  // Initialize
  var origin, pt2, pt1, actor;
  origin = [ lowerleft.lng(), lowerleft.lat(), 0.0 ];
  pt2 = [ lowerleft.lng(), upperright.lat(), 0.0 ];
  pt1 = [ upperright.lng(), lowerleft.lat(), 0.0 ];

  actor = vglModule.utils.createPlane(origin[0], origin[1], origin[2],
                                        pt1[0], pt1[1], pt1[2], pt2[0], pt2[1],
                                        pt2[2]);



  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geoModule.planeFeature, geoModule.feature);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @param positions
 * @param colors
 * @returns {geoModule.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.pointFeature = function(positions, colors) {
  "use strict";
  if (!(this instanceof geoModule.pointFeature)) {
    return new geoModule.pointFeature(positions, colors);
  }

  vglModule.actor.call(this);

  // Initialize
  var actor = vglModule.utils.createPoints(positions, colors);
  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geoModule.pointFeature, geoModule.feature);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointSpritesFeature
 *
 * @class
 * @param positions
 * @param colors
 * @returns {geoModule.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.pointSpritesFeature = function(image, positions, colors) {
  "use strict";
  if (!(this instanceof geoModule.pointSpritesFeature)) {
    return new geoModule.pointSpritesFeature(image, positions, colors);
  }

  vglModule.actor.call(this);

  // Initialize
  var actor = vglModule.utils.createPointSprites(image, positions, colors);
  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geoModule.pointSpritesFeature, geoModule.feature);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geometryFeature
 *
 * @class
 * @desc Create a geometry feature given a geometry {vglModule.geometryData} *
 * @param geometry data {vglModule.geometryData} *
 * @returns {geoModule.geometryFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.geometryFeature = function(geom) {
  "use strict";
  if (!(this instanceof geoModule.geometryFeature)) {
    return new geoModule.geometryFeature(geom);
  }
  geoModule.feature.call(this);

  // Initialize
  var mapper = vglModule.mapper(),
      material = null,
      scalar = geom.sourceData(vglModule.vertexAttributeKeys.Scalar),
      colors = geom.sourceData(vglModule.vertexAttributeKeys.Color),
      lut = this.lookupTable();

  mapper.setGeometryData(geom);
  this.setMapper(mapper);

  if (scalar) {
    if (lut) {
      lut.updateRange(scalar.scalarRange());
      material = vglModule.utils.createColorMappedMaterial(lut);
    } else {
      lut = vglModule.lookupTable();
      lut.updateRange(scalar.scalarRange());
      this.setLookupTable(lut);
      material = vglModule.utils.createColorMappedMaterial(lut);
    }
  } else if (colors) {
    material = vglModule.utils.createColorMaterial();
  } else {
    material = vglModule.utils.createSolidColorMaterial();
  }
  this.setMaterial(material);

  return this;
};

inherit(geoModule.geometryFeature, geoModule.feature);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of compositeGeometryFeature
 *
 * @class
 * @desc Create a multi geometry feature given a array of geometry data {vglModule.geometryData} *
 * @param {Array}
 * @returns {geoModule.compositeGeometryFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.compositeGeometryFeature = function(geoms, color) {
  "use strict";
  if (!(this instanceof geoModule.compositeGeometryFeature)) {
    return new geoModule.compositeGeometryFeature(geoms, color);
  }
  vglModule.actor.call(this);

  var m_mapper = vglModule.groupMapper(),
      m_material = null;

  // Constructor
  this.setMapper(m_mapper);

  if (geoms) {
    m_mapper.setGeometryDataArray(geoms);
  }

  if (!color) {
    updateMaterial(geoms);
  } else {
    m_material = vglModule.utils.createSolidColorMaterial(color);
  }
  this.setMaterial(m_material);

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
        lut = this.lookupTable();

    if (geoms) {
      count  = geoms.length;
      for (i = 0; i < count; ++i) {
        scalar = geoms[i].sourceData(vglModule.vertexAttributeKeys.Scalar);
        if (scalar) {
          if (!lut) {
            lut = vglModule.lookupTable();
          }
          hasScalars = true;
          lut.updateRange(scalar.scalarRange());
        }
      }
    }

    if (hasScalars) {
      m_material = vglModule.utils.createColorMappedMaterial(lut);
    } else {
      m_material = vglModule.utils.createGeometryMaterial();
    }
    this.setMaterial(m_material);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get geometries
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometries = function() {
    return m_mapper.geometryDataArray();
  };

  return this;
};

inherit(geoModule.compositeGeometryFeature, geoModule.geometryFeature);
