//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class planeSource
 *
 * @class
 * @returns {vglModule.planeSource}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.planeSource = function() {
  'use strict';

  if (!(this instanceof vglModule.planeSource)) {
    return new vglModule.planeSource();
  }
  vglModule.source.call(this);

  var m_origin = [ 0.0, 0.0, 0.0 ],
      m_point1 = [ 1.0, 0.0, 0.0 ],
      m_point2 = [ 0.0, 1.0, 0.0 ],
      m_normal = [ 0.0, 0.0, 1.0 ],
      m_xresolution = 1,
      m_yresolution = 1,
      m_geom = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set origin of the plane
   *
   * @param x
   * @param y
   * @param z
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setOrigin = function(x, y, z) {
    m_origin[0] = x;
    m_origin[1] = y;
    m_origin[2] = z;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set point that defines the first axis of the plane
   *
   * @param x
   * @param y
   * @param z
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPoint1 = function(x, y, z) {
    m_point1[0] = x;
    m_point1[1] = y;
    m_point1[2] = z;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set point that defines the first axis of the plane
   *
   * @param x
   * @param y
   * @param z
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPoint2 = function(x, y, z) {
    m_point2[0] = x;
    m_point2[1] = y;
    m_point2[2] = z;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a plane geometry given input parameters
   *
   * @returns {null}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.create = function() {
    m_geom = new vglModule.geometryData();

    var x = [], tc = [], v1 = [], v2 = [],
        pts = [], i, j, k, ii, numPts, numPolys,
        posIndex = 0, normIndex = 0, colorIndex = 0, texCoordIndex = 0,
        positions = [], normals = [], colors = [],
        texCoords = [], indices = [], tristrip = null,
        sourcePositions = null, sourceColors = null, sourceTexCoords;

    x.length = 3, tc.length = 2, v1.length = 3, v2.length = 3;
    pts.length = 3;

    // Check input
    for (i = 0; i < 3; i++) {
      v1[i] = m_point1[i] - m_origin[i];
      v2[i] = m_point2[i] - m_origin[i];
    }

    // TODO Compute center and normal
    // Set things up; allocate memory
    numPts = (m_xresolution + 1) * (m_yresolution + 1);
    numPolys = m_xresolution * m_yresolution * 2;
    positions.length = 3 * numPts;
    normals.length = 3 * numPts;
    texCoords.length = 2 * numPts;
    indices.length = numPts;

    for (k = 0, i = 0; i < (m_yresolution + 1); i++) {
      tc[1] = i / m_yresolution;

      for (j = 0; j < (m_xresolution + 1); j++) {
        tc[0] = j / m_xresolution;

        for (ii = 0; ii < 3; ii++) {
          x[ii] = m_origin[ii] + tc[0] * v1[ii] + tc[1] * v2[ii];
        }

        positions[posIndex++] = x[0];
        positions[posIndex++] = x[1];
        positions[posIndex++] = x[2];

        colors[colorIndex++] = 1.0;
        colors[colorIndex++] = 1.0;
        colors[colorIndex++] = 1.0;

        normals[normIndex++] = m_normal[0];
        normals[normIndex++] = m_normal[1];
        normals[normIndex++] = m_normal[2];

        texCoords[texCoordIndex++] = tc[0];
        texCoords[texCoordIndex++] = tc[1];
      }
    }

    /// Generate polygon connectivity
    for (i = 0; i < m_yresolution; i++) {
      for (j = 0; j < m_xresolution; j++) {
        pts[0] = j + i * (m_xresolution + 1);
        pts[1] = pts[0] + 1;
        pts[2] = pts[0] + m_xresolution + 2;
        pts[3] = pts[0] + m_xresolution + 1;
      }
    }

    for (i = 0; i < numPts; ++i) {
      indices[i] = i;
    }

    tristrip = new vglModule.triangleStrip();
    tristrip.setIndices(indices);

    sourcePositions = vglModule.sourceDataP3fv();
    sourcePositions.pushBack(positions);

    sourceColors = vglModule.sourceDataC3fv();
    sourceColors.pushBack(colors);

    sourceTexCoords = vglModule.sourceDataT2fv();
    sourceTexCoords.pushBack(texCoords);

    m_geom.addSource(sourcePositions);
    m_geom.addSource(sourceColors);
    m_geom.addSource(sourceTexCoords);
    m_geom.addPrimitive(tristrip);

    return m_geom;
  };
};

inherit(vglModule.planeSource, vglModule.source);
