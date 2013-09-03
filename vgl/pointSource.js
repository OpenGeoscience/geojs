//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

/**
 * Create a new instance of class pointSource
 *
 * @class
 * @returns {vglModule.pointSource}
 */
vglModule.pointSource = function() {

  if (!(this instanceof vglModule.pointSource)) {
    return new vglModule.pointSource();
  }
  vglModule.source.call(this);

  var m_positions = [];
  var m_colors = [];
  var m_textureCoords = [];
  var m_geom = null;

  /**
   * Set positions for the source
   */
  this.setPositions = function(positions) {
    if (positions instanceof Array) {
      m_positions = positions;
    }
    else {
      console
          .log("[ERROR] Invalid data type for positions. Array is required.");
    }
  };

  /**
   * Set colors for the points
   */
  this.setColors = function(colors) {
    if (colors instanceof Array) {
      m_colors = colors;
    }
    else {
      console.log("[ERROR] Invalid data type for colors. Array is required.");
    }
  };

  /**
   * Set texture coordinates for the points
   */
  this.setTextureCoordinates = function(texcoords) {
    if (texcoords instanceof Array) {
      m_textureCoords = texcoords;
    }
    else {
      console.log("[ERROR] Invalid data type for "
                  + "texture coordinates. Array is required.");
    }
  };

  /**
   * Create a point geometry given input parameters
   */
  this.create = function() {
    m_geom = new vglModule.geometryData();

    if (m_positions.length % 3 !== 0) {
      console.log("[ERROR] Invalid length of the points array");
      return;
    }

    var numPts = m_positions.length / 3;
    var i = 0;
    var indices = [];
    indices.length = numPts;

    for (i = 0; i < numPts; ++i) {
      indices[i] = i;
    }

    var pointsPrimitive = new vglModule.points();
    pointsPrimitive.setIndices(indices);

    var sourcePositions = vglModule.sourceDataP3fv();
    sourcePositions.pushBack(m_positions);
    m_geom.addSource(sourcePositions);

    if ((m_colors.length > 0) && m_colors.length === m_positions.length) {
      var sourceColors = vglModule.sourceDataC3fv();
      sourceColors.pushBack(m_colors);
      m_geom.addSource(sourceColors);
    }
    else if ((m_colors.length > 0) && m_colors.length !== m_positions.length) {
      console
          .log("[ERROR] Number of colors are different than number of points");
    }

    if ((m_textureCoords.length > 0)
        && m_textureCoords.length === m_textureCoords.length) {
      var sourceTexCoords = vglModule.sourceDataT2fv();
      sourceTexCoords.pushBack(texCoords);
      m_geom.addSource(sourceTexCoords);
    }
    else if ((m_textureCoords.length > 0)
             && (m_textureCoords.length / 2) !== (m_positions.length / 3)) {
      console
          .log("[ERROR] Number of texture coordinates are different than number of points");
    }

    m_geom.addPrimitive(pointsPrimitive);

    return m_geom;
  };
};

inherit(vglModule.pointSource, vglModule.source);
