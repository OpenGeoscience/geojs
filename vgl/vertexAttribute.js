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
 * Keys to identify vertex attributes
 *
 * @type {{Position: number, Normal: number, TextureCoordinate: number,
 *         Color: number, Scalar: number, Scalar2: number, Scalar3: number,
 *         Scalar4: number, Scalar5: number, Scalar6: number, Scalar7: number,
 *         CountAttributeIndex: number}}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.vertexAttributeKeys = {
  "Position" : 0,
  "Normal" : 1,
  "TextureCoordinate" : 2,
  "Color" : 3,
  "Scalar" : 4,
  "Scalar2" : 5,
  "Scalar3" : 6,
  "Scalar4" : 7,
  "Scalar5" : 8,
  "Scalar6" : 9,
  "Scalar7" : 10,
  "CountAttributeIndex" : 11
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of vertexAttribute
 *
 * @param {string} name
 * @returns {vglModule.vertexAttribute}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.vertexAttribute = function(name) {
  'use strict';

  if (!(this instanceof vglModule.vertexAttribute)) {
    return new vglModule.vertexAttribute(name);
  }

  var m_name = name;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get name of the vertex attribute
   *
   * @returns {string}
   */
  //////////////////////////////////////////////////////////////////////////////
  this.name = function() {
    return m_name;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Bind vertex data to the given render state
   *
   * @param {vglModule.renderState} renderState
   * @param {vglModule.vertexAttributeKeys} key
   */
  //////////////////////////////////////////////////////////////////////////////
  this.bindVertexData = function(renderState, key) {
    var geometryData = renderState.m_mapper.geometryData();
    var sourceData = geometryData.sourceData(key);
    var program = renderState.m_material.shaderProgram();

    gl.vertexAttribPointer(program.attributeLocation(m_name), sourceData
        .attributeNumberOfComponents(key), sourceData.attributeDataType(key),
                           sourceData.normalized(key), sourceData
                               .attributeStride(key), sourceData
                               .attributeOffset(key));

    gl.enableVertexAttribArray(program.attributeLocation(m_name));
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind vertex data for a given render state
   *
   * @param {vglModule.renderState} renderState
   * @param {vglModule.vertexAttributeKeys} key
   */
  //////////////////////////////////////////////////////////////////////////////
  this.undoBindVertexData = function(renderState, key) {
    var program = renderState.m_material.shaderProgram();

    gl.disableVertexAttribArray(program.attributeLocation(m_name));
  };
};
