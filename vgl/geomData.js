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

//////////////////////////////////////////////////////////////////////////////
//
// Data types
//
//////////////////////////////////////////////////////////////////////////////

var vertexAttributeKeys = {
  "Position"            : 0,
  "Normal"              : 1,
  "TextureCoordinate"   : 2,
  "Color"               : 3,
  "Scalar"              : 4
};

// TODO Need to figure out how to initialize these values properly
var vglDataType = {
  "Float"       : gl.FLOAT,
  "FloatVec2"   : gl.FLOAT_VEC2,
  "FloatVec3"   : gl.FLOAT_VEC3,
  "FloatVec4"   : gl.FLOAT_VEC4,
  "Int"         : gl.INT,
  "IntVec2"     : gl.INT_VEC2,
  "IntVec3"     : gl.INT_VEC3,
  "IntVec4"     : gl.INT_VEC4,
  "Bool"        : gl.BOOL,
  "BoolVec2"    : gl.BOOL_VEC2,
  "BoolVec3"    : gl.BOOL_VEC3,
  "BoolVec4"    : gl.BOOL_VEC4,
  "FloatMat2"   : gl.FLOAT_MAT2,
  "FloatMat3"  : gl.FLOAT_MAT3,
  "FloatMat4"   : gl.FLOAT_MAT4,
  "Sampler1D"   : gl.SAMPLER_1D,
  "Sampler2D"   : gl.SAMPLER_2D,
  "Sampler3D"   : gl.SAMPLER_3D,
  "SamplerCube" : gl.SAMPLER_CUBE,

  "Sampler1DShadow" : gl.SAMPLER_1D_SHADOW,
  "Sampler2DShadow" : gl.SAMPLER_2D_SHADOW,

  "Undefined" : 0x0
};

var vglPrimitiveRenderType = {
  "Points"        : gl.POINTS,
  "LineStrip"     : gl.LINE_STRIP,
  "LineLoop"      : gl.LINE_LOOP,
  "Lines"         : gl.LINES,
  "TriangleStrip" : gl.TRIANGLE_STRIP,
  "TriangleFan"   : gl.TRIANGLE_FAN,
  "Triangles"     : gl.TRIANGLES
};

var vesPrimitiveIndicesValueType = {
  "UnsignedShort" : gl.UNSIGNED_SHORT,
  "UnsignedInt" : gl.UNSIGNED_INT
};

//////////////////////////////////////////////////////////////////////////////
//
// vglPrimitive
//
//////////////////////////////////////////////////////////////////////////////

vglModule.primitive = function() {
  this.m_indexCount = 0;
  this.m_primitiveType = 0;
  this.m_indicesValueType = 0;
  this.m_indices = 0;
};

/// Data
vglModule.primitive.prototype.indices = function() {
  return this.m_indices;
};

///
vglModule.primitive.prototype.createIndices = function(type) {
  // TODO Check for the type
  this.m_indices = new Uint16Array();
};

/// Return the number of indices
vglModule.primitive.prototype.numberOfIndices = function() {
  return this.m_indices.length;
};

/// Return size of indices in bytes
vglModule.primitive.prototype.sizeInBytes = function() {
  return this.m_indices.length * Uint16Array.BYTES_PER_ELEMENT;
};

/// Return primitive type
vglModule.primitive.prototype.primitiveType = function() {
  return this.m_primitiveType;
};
/// Set primitive type
vglModule.primitive.prototype.setPrimitiveType = function(type) {
  this.m_primitiveType = type;
};

///
vglModule.primitive.prototype.indexCount = function() {
  return this.m_indexCount;
};
/// Set index count (how many indices form a primitive)
vglModule.primitive.prototype.setIndexCount = function(count) {
  this.m_indexCount = count;
};

/// Return indices value type
vglModule.primitive.prototype.indicesValueType = function() {
  return this.m_indicesValueType;
};
/// Set indices value type
vglModule.primitive.prototype.setIndicesValueType = function(type) {
  this.m_indicesValueType  = type;
};

/// Set indices from a array
vglModule.primitive.prototype.setIndices = function(indicesArray) {
  // TODO Check for the type
  this.m_indices = new Uint16Array(indicesArray);
};

//////////////////////////////////////////////////////////////////////////////
//
// TriangleStrip
//
//////////////////////////////////////////////////////////////////////////////

vglModule.triangleStrip = function() {
  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.TRIANGLE_STRIP);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndexCount(3);
};

inherit(vglModule.triangleStrip, vglModule.primitive);

//////////////////////////////////////////////////////////////////////////////
//
// Triangle
//
//////////////////////////////////////////////////////////////////////////////

vglModule.triangles = function() {
  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.TRIANGLES);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndexCount(3);
};

inherit(vglModule.triangles, vglModule.primitive);

//////////////////////////////////////////////////////////////////////////////
//
// vglVertexData
//
//////////////////////////////////////////////////////////////////////////////

vglModule.vertexDataP3f = function() {
    this.m_position = [];
};

vglModule.vertexDataP3N3f = function() {
    this.m_position = [];
    this.m_normal = [];
};

vglModule.vertexDataP3T3f = function() {
    this.m_position = [];
    this.m_texCoordinate = [];
};

//////////////////////////////////////////////////////////////////////////////
//
// sourceData
//
//////////////////////////////////////////////////////////////////////////////

vglModule.sourceData = function() {

  /**
   * Check against no use of new()
   */
  if (!(this instanceof vglModule.sourceData)) {
    return new vglModule.sourceData();
  }

  /**
   * Private variables
   */
  var m_attributesMap = {};
  var m_data = [];
  var m_glData = null;

  var vglAttributeData = function() {
    /// Number of components per group
    this.m_numberOfComponents = 0;

    /// Type of data type (GL_FLOAT etc)
    m_dataType = 0;

    /// Size of data type
    m_dataTypeSize = 0;

    /// Specifies whether fixed-point data values should be normalized
    /// (true) or converted directly as fixed-point values (false)
    /// when they are accessed.
    this.m_normalized = false;

    /// Strides for each attribute.
    this.m_stride = 0;

    /// Offset
    this.m_offset = 0;
  };

  /// Return data
  this.data = function() {
    this.m_glData = new Float32Array(m_data);
    return this.m_glData;
  };

  /**
   *
   */
  this.addAttribute =
    function(key, dataType, sizeOfDataType, offset, stride,
           noOfComponents, normalized) {
    if ( (key in m_attributesMap) === false ) {
      var newAttr = new vglAttributeData();
      newAttr.m_dataType = dataType;
      newAttr.m_dataTypeSize = sizeOfDataType;
      newAttr.m_offset = offset;
      newAttr.m_stride = stride;
      newAttr.m_numberOfComponents  = noOfComponents;
      newAttr.m_normalized = normalized;

      m_attributesMap[key] = newAttr;
    }
  };

  /**
   * Return size of the data
   */
  this.sizeOfArray = function() {
    return Object.size(m_data);
  };

  /**
   * Return size of the data in bytes
   */
  this.sizeInBytes = function() {
    var sizeInBytes = 0;
    var keys = this.keys();

    for (var i = 0; i < keys.length(); ++i) {
      sizeInBytes += this.numberOfComponents(keys[i]) *
                     this.sizeOfAttributeDataType(keys[i]);
    }

    sizeInBytes *= this.sizeOfArray();

    return sizeInBytes;
  };

  /**
   * Check if there is attribute exists of a given key type
   */
  this.hasKey = function(key) {
    return (key in m_attributesMap);
  };

  /**
   * Return keys of all attributes
   */
  this.keys = function() {
    return Object.keys(m_attributesMap);
  };

  /**
   *
   */
  this.numberOfAttributes = function() {
    return Object.size(m_attributesMap);
  };

  /**
   *
   */
  this.attributeNumberOfComponents = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_numberOfComponents;
    }

    return 0;
  };

  /**
   *
   */
  this.normalized = function(key) {
    if (key in m_attributesMap) {
    return m_attributesMap[key].m_normalized;
    }

    return false;
  };

  /**
   *
   */
  this.sizeOfAttributeDataType = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_dataTypeSize;
    }

    return 0;
  };

  /**
   *
   */
  this.attributeDataType = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_dataType;
    }

    return vglDataType.Undefined;
  };

  /**
   *
   */
  this.attributeOffset = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_offset;
    }

    return 0;
  };

  /**
   *
   */
  this.attributeStride = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_stride;
    }

    return 0;
  };

  /**
   *
   */
  this.pushBack = function(vertexData) {
    // Should be implemented by the base class
  };

  /**
   *
   */
  this.insert = function(data) {
    m_data = m_data.concat(data);
  };

  return this;
};

//////////////////////////////////////////////////////////////////////////////
//
// sourceDataP3T3f
//
//////////////////////////////////////////////////////////////////////////////

vglModule.sourceDataP3T3f = function() {
  /**
   * Check against no use of new()
   */
  if (!(this instanceof vglModule.sourceDataP3T3f)) {
    return new vglModule.sourceDataP3T3f();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.Position,
                    gl.FLOAT, 4,  0, 6 * 4, 3, false);
  this.addAttribute(vertexAttributeKeys.TextureCoordinate,
                    gl.FLOAT, 4, 12, 6 * 4, 3, false);

  /**
   *
   */
  this.pushBack = function(value) {
    this.insert(value.m_position);
    this.insert(value.m_texCoordinate);
  };

  return this;
};

inherit(vglModule.sourceDataP3T3f, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
//
// sourceDataP3N3f
//
//////////////////////////////////////////////////////////////////////////////

vglModule.sourceDataP3N3f = function() {
  /**
   * Check against no use of new()
   */
  if (!(this instanceof sourceDataP3N3f)) {
    return new sourceDataP3N3f();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.Position,
                    gl.FLOAT, 4,  0, 6 * 4, 3, false);
  this.addAttribute(vertexAttributeKeys.Normal,
                    gl.FLOAT, 4, 12, 6 * 4, 3, false);


  /**
   *
   */
  this.pushBack = function(value) {
    this.insert(value.m_position);
    this.insert(value.m_normal);
  };

  return this;
};

//////////////////////////////////////////////////////////////////////////////
//
// sourceDataP3fv
//
//////////////////////////////////////////////////////////////////////////////

vglModule.sourceDataP3fv = function() {
  /**
   * Check
   *
   */
  if (!(this instanceof vglModule.sourceDataP3fv)) {
    return new vglModule.sourceDataP3fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.Position,
                    gl.FLOAT, 4,  0, 3 * 4, 3, false);


  /**
   *
   *
   */
  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataP3fv, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
//
// sourceDataT2fv
//
//////////////////////////////////////////////////////////////////////////////

vglModule.sourceDataT2fv = function() {

  if (!(this instanceof vglModule.sourceDataT2fv)) {
    return new vglModule.sourceDataT2fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.TextureCoordinate,
                    gl.FLOAT, 4,  0, 2 * 4, 2, false);


  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataT2fv, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
//
// sourceDataC3fv
//
//////////////////////////////////////////////////////////////////////////////

vglModule.sourceDataC3fv = function() {

  if (!(this instanceof vglModule.sourceDataC3fv)) {
    return new vglModule.sourceDataC3fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.Color,
                    gl.FLOAT, 4,  0, 3 * 4, 3, false);

  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataC3fv, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
//
// geometryData
//
//////////////////////////////////////////////////////////////////////////////

vglModule.geometryData = function() {
    var m_name = "";
    var m_primitives = [];
    var m_sources = [];
    var m_bounds = [];
    var m_computeBounds = true;

    /// Return ID of the geometry data
    this.name = function()     {
      return m_name;
    };
    /// Set name of the geometry data
    this.setName = function(name) {
      m_name = name;
    };

    /// Add new source
    this.addSource = function(source) {
      // TODO Check if the incoming source has duplicate keys

      // NOTE This might not work on IE8 or lower
      if (m_sources.indexOf(source) == -1) {
        m_sources.push(source);
        return true;
      }

      return false;
    };
    /// Return source for a given index. Returns 0 if not found.
    this.source = function(index) {
      if (index < m_sources.length) {
        return m_sources[index];
      }

      return 0;
    };
    /// Return number of sources
    this.numberOfSources = function() {
      return m_sources.length;
    };
    /// Return source data given a key
    this.sourceData = function(key) {
      for (var i = 0; i < m_sources.length; ++i) {
        if (m_sources[i].hasKey(key)) {
          return m_sources[i];
        }
      }

      return null;
    };

    /// Add new primitive
    this.addPrimitive = function(primitive) {
      if (m_primitives.indexOf(primitive) == -1) {
        m_primitives.push(primitive);
        return true;
      }

      return false;
    };
    /// Return primitive for a given index. Returns 0 if not found.
    this.primitive = function(index) {
      if (index < m_primitives.length) {
        return m_primitives[index];
      }

      return null;
    };
    /// Return number of primitives
    this.numberOfPrimitives = function() {
      return m_primitives.length;
    };

    /// Return bounds [minX, maxX, minY, maxY, minZ, maxZ]
    this.bounds = function() {
      return m_bounds;
    };
    /// Set bounds
    this.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {
      m_bounds[0] = minX;
      m_bounds[1] = maxX;
      m_bounds[2] = minY;
      m_bounds[3] = maxY;
      m_bounds[4] = minZ;
      m_bounds[5] = maxZ;
    };
};
