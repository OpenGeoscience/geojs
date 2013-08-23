//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

/**
 * Create a new instance of class lineSource
 *
 * @class
 * @returns {vglModule.lineSource}
 */
vglModule.lineSource = function(positions, colors) {

  if (!(this instanceof vglModule.lineSource)) {
    return new vglModule.lineSource();
  }
  vglModule.source.call(this);

  var m_positions = positions,
      m_colors = colors,
      m_height = null,
      m_geom = null;

  /**
   * Set start positions for the lines
   *
   * @param positions
   */
  this.setPositions = function(positions) {
    if (positions instanceof Array) {
      m_positions = positions;
      this.modified();
      return true;
    }
    else {
      console
        .log("[ERROR] Invalid data type for positions. Array is required.");
    }
    return false;
  };

  /**
   * Set colors for the lines
   *
   * @param colors
   */
  this.setColors = function(colors) {
    if (colors instanceof Array) {
      m_colors = colors;
      this.modified();
      return true;
    }
    else {
      console.log("[ERROR] Invalid data type for colors. Array is required.");
    }

    return false;
  };

  /**
   * Create a point geometry given input parameters
   */
  this.create = function() {
    if (!m_positions) {
      console.log("[error] Invalid positions");
      return;
    }

    if (m_positions.length % 3 !== 0) {
      console.log("[error] Line source requires 3d points");
      return;
    }

    if (m_positions.length % 3 !== 0) {
      console.log("[ERROR] Invalid length of the points array");
      return;
    }

    var m_geom = new vglModule.geometryData(),
        numPts = m_positions.length / 3,
        i = 0,
        indices = [];

    indices.length = numPts;

    for (; i < numPts; ++i) {
      indices[i] = i;
    }

    var linesPrimitive = new vglModule.lines();
    linesPrimitive.setIndices(indices);

    var sourcePositions = vglModule.sourceDataP3fv();
    sourcePositions.pushBack(m_positions);
    m_geom.addSource(sourcePositions);

    if ( m_colors && (m_colors.length > 0) &&
         m_colors.length === m_positions.length) {
      var sourceColors = vglModule.sourceDataC3fv();
      sourceColors.pushBack(m_colors);
      m_geom.addSource(sourceColors);
    }
    else if (m_colors && (m_colors.length > 0) &&
             m_colors.length !== m_positions.length) {
      console
        .log("[error] Number of colors are different than number of points");
    }

    m_geom.addPrimitive(linesPrimitive);

    return m_geom;
  };
};

inherit(vglModule.lineSource, vglModule.source);
