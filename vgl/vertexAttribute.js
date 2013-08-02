/**
 * @module ogs.vgl
 */

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

/**
 * Create a new instance of vertexAttribute
 *
 * @class
 * @param name
 * @returns {vglModule.vertexAttribute}
 */
vglModule.vertexAttribute = function(name) {

  if (!(this instanceof vglModule.vertexAttribute)) {
    return new vglModule.vertexAttribute(name);
  }

  // / Private member variables
  var m_name = name;

  // / Public member methods
  this.name = function() {
    return m_name;
  };

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

  this.undoBindVertexData = function(renderState, key) {
    var program = renderState.m_material.shaderProgram();

    gl.disableVertexAttribArray(program.attributeLocation(m_name));
  };
};
