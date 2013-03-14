/**
 * @module ogs.vgl
 */

/**
 * @desc Vertex attribute keys
 */
var vertexAttributeKeys = {
  "Position" : 0,
  "Normal" : 1,
  "TextureCoordinate" : 2,
  "Color" : 3,
  "Scalar" : 4
};

/**
 * Create a new instance of class primitive
 *
 * @class
 * @return {vglModule.primitive}
 */
vglModule.primitive = function() {

  if (!(this instanceof vglModule.primitive)) {
    return new vglModule.primitive();
  }

  /** @private */
  var m_indexCount = 0;

  /** @private */
  var m_primitiveType = 0;

  /** @private */
  var m_indicesValueType = 0;

  /** @private */
  var m_indices = 0;

  this.indices = function() {
    return m_indices;
  };

  this.createIndices = function(type) {
    // TODO Check for the type
    m_indices = new Uint16Array();
  };

  /**
   * Return the number of indices
   */
  this.numberOfIndices = function() {
    return m_indices.length;
  };

  /**
   * Return size of indices in bytes
   */
  this.sizeInBytes = function() {
    return m_indices.length * Uint16Array.BYTES_PER_ELEMENT;
  };

  /*
   * Return primitive type g
   */
  this.primitiveType = function() {
    return m_primitiveType;
  };

  /**
   * Set primitive type
   */
  this.setPrimitiveType = function(type) {
    m_primitiveType = type;
  };

  /**
   * Return index count ((how many indices form a primitive) of the primitive
   */
  this.indexCount = function() {
    return m_indexCount;
  };

  /**
   * Set index count (how many indices form a primitive)
   */
  this.setIndexCount = function(count) {
    m_indexCount = count;
  };

  /**
   * Return indices value type
   */
  this.indicesValueType = function() {
    return m_indicesValueType;
  };
  /*
   * Set indices value type g
   */
  this.setIndicesValueType = function(type) {
    m_indicesValueType = type;
  };

  /**
   * Set indices from a array
   */
  this.setIndices = function(indicesArray) {
    // TODO Check for the type
    m_indices = new Uint16Array(indicesArray);
  };

  return this;
};

/**
 * Create a new instance of class triangleStrip
 *
 * @class
 * @returns {vglModule.triangleStrip}
 */
vglModule.triangleStrip = function() {

  if (!(this instanceof vglModule.triangleStrip)) {
    return new vglModule.triangleStrip();
  }

  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.TRIANGLE_STRIP);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndexCount(3);

  return this;
};

inherit(vglModule.triangleStrip, vglModule.primitive);

/**
 * Create a new instance of class triangles
 *
 * @class
 * @returns {vglModule.triangles}
 */
vglModule.triangles = function() {

  if (!(this instanceof vglModule.triangles)) {
    return new vglModule.triangles();
  }
  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.TRIANGLES);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndexCount(3);

  return this;
};

inherit(vglModule.triangles, vglModule.primitive);

/**
 * Create a new instance of class points
 *
 * @class
 * @returns {vglModule.points}
 */
vglModule.points = function() {

  if (!(this instanceof vglModule.points)) {
    return new vglModule.points();
  }
  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.POINTS);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndexCount(1);

  return this;
};

inherit(vglModule.points, vglModule.primitive);

/**
 * Create a new instance of class vertexDataP3f
 *
 * @class
 * @returns {vglModule.vertexDataP3f}
 */
vglModule.vertexDataP3f = function() {
  if (!(this instanceof vglModule.vertexDataP3f)) {
    return new vglModule.vertexDataP3f();
  }

  this.m_position = [];
};

/**
 * Create a new instance of class vertexDataP3N3f
 *
 * @class
 * @returns {vglModule.vertexDataP3N3f}
 */
vglModule.vertexDataP3N3f = function() {

  if (!(this instanceof vglModule.vertexDataP3N3f)) {
    return new vglModule.vertexDataP3N3f();
  }

  this.m_position = [];
  this.m_normal = [];
};

/**
 * Create a new instance of class vertexDataP3T3f
 *
 * @class
 * @returns {vglModule.vertexDataP3T3f}
 */
vglModule.vertexDataP3T3f = function() {
  if (!(this instanceof vglModule.vertexDataP3T3f)) {
    return new vglModule.vertexDataP3T3f();
  }

  this.m_position = [];
  this.m_texCoordinate = [];
};

/**
 * Create a new instance of class sourceData
 *
 * @class
 * @returns {vglModule.sourceData}
 */
vglModule.sourceData = function() {

  if (!(this instanceof vglModule.sourceData)) {
    return new vglModule.sourceData();
  }

  // / Private member variables
  var m_attributesMap = {};
  var m_data = [];
  var m_glData = null;

  var vglAttributeData = function() {
    // Number of components per group
    this.m_numberOfComponents = 0;

    // Type of data type (GL_FLOAT etc)
    m_dataType = 0;

    // Size of data type
    m_dataTypeSize = 0;

    // Specifies whether fixed-point data values should be normalized
    // (true) or converted directly as fixed-point values (false)
    // when they are accessed.
    this.m_normalized = false;

    // Strides for each attribute.
    this.m_stride = 0;

    // Offset
    this.m_offset = 0;
  };

  /**
   * Return raw data for this source
   *
   * @returns {Float32Array}
   */
  this.data = function() {
    this.m_glData = new Float32Array(m_data);
    return this.m_glData;
  };

  /**
   * Add new attribute data to the source
   */
  this.addAttribute = function(key, dataType, sizeOfDataType, offset, stride,
                               noOfComponents, normalized) {
    if ((key in m_attributesMap) === false) {
      var newAttr = new vglAttributeData();
      newAttr.m_dataType = dataType;
      newAttr.m_dataTypeSize = sizeOfDataType;
      newAttr.m_offset = offset;
      newAttr.m_stride = stride;
      newAttr.m_numberOfComponents = noOfComponents;
      newAttr.m_normalized = normalized;

      m_attributesMap[key] = newAttr;
    }
  };

  /**
   * Return size of the source data
   */
  this.sizeOfArray = function() {
    return Object.size(m_data);
  };

  /**
   * Return size of the source data in bytes
   */
  this.sizeInBytes = function() {
    var sizeInBytes = 0;
    var keys = this.keys();

    for ( var i = 0; i < keys.length(); ++i) {
      sizeInBytes += this.numberOfComponents(keys[i])
                     * this.sizeOfAttributeDataType(keys[i]);
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
   * Return number of attributes of source data
   */
  this.numberOfAttributes = function() {
    return Object.size(m_attributesMap);
  };

  /**
   * Return number of components of the attribute data
   */
  this.attributeNumberOfComponents = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_numberOfComponents;
    }

    return 0;
  };

  /**
   * Return if the attribute data is normalized
   */
  this.normalized = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_normalized;
    }

    return false;
  };

  /**
   * Return size of the attribute data type
   */
  this.sizeOfAttributeDataType = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_dataTypeSize;
    }

    return 0;
  };

  /**
   * Return attribute data type
   */
  this.attributeDataType = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_dataType;
    }

    return vglDataType.Undefined;
  };

  /**
   * Return attribute offset
   */
  this.attributeOffset = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_offset;
    }

    return 0;
  };

  /**
   * Return attribute stride
   */
  this.attributeStride = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_stride;
    }

    return 0;
  };

  /**
   * Virtual function to insert new vertex data at the end
   */
  this.pushBack = function(vertexData) {
    // Should be implemented by the base class
  };

  /**
   * Insert new data block to the raw data
   */
  this.insert = function(data) {
    m_data = m_data.concat(data);
  };

  return this;
};

/**
 * Create a new instance of class sourceDataP3T3f
 *
 * @class
 * @returns {vglModule.sourceDataP3T3f}
 */
vglModule.sourceDataP3T3f = function() {

  if (!(this instanceof vglModule.sourceDataP3T3f)) {
    return new vglModule.sourceDataP3T3f();
  }
  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 6 * 4, 3,
                    false);
  this.addAttribute(vertexAttributeKeys.TextureCoordinate, gl.FLOAT, 4, 12,
                    6 * 4, 3, false);

  this.pushBack = function(value) {
    this.insert(value.m_position);
    this.insert(value.m_texCoordinate);
  };

  return this;
};

inherit(vglModule.sourceDataP3T3f, vglModule.sourceData);

/**
 * Create a new instance of class sourceDataP3N3f
 *
 * @class
 * @returns {vglModule.sourceDataP3N3f}
 */
vglModule.sourceDataP3N3f = function() {

  if (!(this instanceof sourceDataP3N3f)) {
    return new sourceDataP3N3f();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 6 * 4, 3,
                    false);
  this.addAttribute(vertexAttributeKeys.Normal, gl.FLOAT, 4, 12, 6 * 4, 3,
                    false);

  this.pushBack = function(value) {
    this.insert(value.m_position);
    this.insert(value.m_normal);
  };

  return this;
};

/**
 * Create a new instance of class sourceDataP3fv
 *
 * @class
 * @returns {vglModule.sourceDataP3fv}
 */
vglModule.sourceDataP3fv = function() {

  if (!(this instanceof vglModule.sourceDataP3fv)) {
    return new vglModule.sourceDataP3fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 3 * 4, 3,
                    false);

  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataP3fv, vglModule.sourceData);

/**
 * Create a new instance of class sourceDataT2fv
 *
 * @class
 * @returns {vglModule.sourceDataT2fv}
 */
vglModule.sourceDataT2fv = function() {

  if (!(this instanceof vglModule.sourceDataT2fv)) {
    return new vglModule.sourceDataT2fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.TextureCoordinate, gl.FLOAT, 4, 0,
                    2 * 4, 2, false);

  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataT2fv, vglModule.sourceData);

/**
 * Create a new instance of class sourceDataC3fv
 *
 * @class
 * @returns {vglModule.sourceDataC3fv}
 */
vglModule.sourceDataC3fv = function() {

  if (!(this instanceof vglModule.sourceDataC3fv)) {
    return new vglModule.sourceDataC3fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vertexAttributeKeys.Color, gl.FLOAT, 4, 0, 3 * 4, 3, false);

  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataC3fv, vglModule.sourceData);

/**
 * Create a new instance of class geometryData
 *
 * @class
 * @returns {vglModule.geometryData}
 */
vglModule.geometryData = function() {
  var m_name = "";
  var m_primitives = [];
  var m_sources = [];
  var m_bounds = [];
  var m_computeBounds = true;

  // / Return ID of the geometry data
  this.name = function() {
    return m_name;
  };
  // / Set name of the geometry data
  this.setName = function(name) {
    m_name = name;
  };

  // / Add new source
  this.addSource = function(source) {
    // TODO Check if the incoming source has duplicate keys

    // NOTE This might not work on IE8 or lower
    if (m_sources.indexOf(source) == -1) {
      m_sources.push(source);
      return true;
    }

    return false;
  };
  // / Return source for a given index. Returns 0 if not found.
  this.source = function(index) {
    if (index < m_sources.length) {
      return m_sources[index];
    }

    return 0;
  };
  // / Return number of sources
  this.numberOfSources = function() {
    return m_sources.length;
  };
  // / Return source data given a key
  this.sourceData = function(key) {
    for ( var i = 0; i < m_sources.length; ++i) {
      if (m_sources[i].hasKey(key)) {
        return m_sources[i];
      }
    }

    return null;
  };

  // / Add new primitive
  this.addPrimitive = function(primitive) {
    if (m_primitives.indexOf(primitive) == -1) {
      m_primitives.push(primitive);
      return true;
    }

    return false;
  };
  // / Return primitive for a given index. Returns 0 if not found.
  this.primitive = function(index) {
    if (index < m_primitives.length) {
      return m_primitives[index];
    }

    return null;
  };
  // / Return number of primitives
  this.numberOfPrimitives = function() {
    return m_primitives.length;
  };

  // / Return bounds [minX, maxX, minY, maxY, minZ, maxZ]
  this.bounds = function() {
    return m_bounds;
  };
  // / Set bounds
  this.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {
    m_bounds[0] = minX;
    m_bounds[1] = maxX;
    m_bounds[2] = minY;
    m_bounds[3] = maxY;
    m_bounds[4] = minZ;
    m_bounds[5] = maxZ;
  };
};
