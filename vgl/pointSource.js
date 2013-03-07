/*========================================================================
  VGL --- VTK WebGL Rendering Toolkit

  Copyright 2013 Kitware, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ========================================================================*/

///////////////////////////////////////////////////////////////////////////////
//
// Point source class
//
///////////////////////////////////////////////////////////////////////////////
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
   *
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
   *
   */
  this.setColors = function(colors) {
    if (colors instanceof Array) {
      m_colors = colorscolors;
    }
    else {
      console.log("[ERROR] Invalid data type for colors. Array is required.");
    }
  };

  /**
   * Set texture coordinates for the points
   *
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
   *
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
    points.setIndices(indices);

    var sourcePositions = vglModule.sourceDataP3fv();
    sourcePositions.pushBack(m_positions);
    m_geom.addSource(sourcePositions);

    if (m_colors.length && m_colors.length === m_positions.length) {
      var sourceColors = vglModule.sourceDataC3fv();
      sourceColors.pushBack(colors);
      m_geom.addSource(sourceColors);
    }
    else if (m_colors.length && m_colors.length !== m_positions.length) {
      console
          .log("[ERROR] Number of colors are different than number of points");
    }

    if (m_textureCoords.length
        && m_textureCoords.length === m_textureCoords.length) {
      var sourceTexCoords = vglModule.sourceDataT2fv();
      sourceTexCoords.pushBack(texCoords);
      m_geom.addSource(sourceTexCoords);
    }
    else if (m_colors.length
             && (m_textureCoords.length / 2) !== (m_positions.length / 3)) {
      console
          .log("[ERROR] Number of texture coordinates are different than number of points");
    }

    m_geom.addPrimitive(pointsPrimitive);

    return m_geom;
  };
};

inherit(vglModule.pointSource, vglModule.source);
