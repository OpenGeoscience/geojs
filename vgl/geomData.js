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
 * Vertex attribute keys
 *
 * @type {{Position: number, Normal: number, TextureCoordinate: number,
 *         Color: number, Scalar: number}}
 */
//////////////////////////////////////////////////////////////////////////////
var vertexAttributeKeys = {
  "Position" : 0,
  "Normal" : 1,
  "TextureCoordinate" : 2,
  "Color" : 3,
  "Scalar" : 4
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class primitive
 *
 * @class
 * @return {vglModule.primitive}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.primitive = function() {
  'use strict';

  if (!(this instanceof vglModule.primitive)) {
    return new vglModule.primitive();
  }

  /** @private */
  var m_indicesPerPrimitive = 0,
      m_primitiveType = 0,
      m_indicesValueType = 0,
      m_indices = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get indices of the primitive
   *
   * @returns {null}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.indices = function() {
    return m_indices;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create indices array for the primitive
   * @param type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createIndices = function(type) {
    // TODO Check for the type
    m_indices = new Uint16Array();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the number of indices
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numberOfIndices = function() {
    return m_indices.length;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return size of indices in bytes
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sizeInBytes = function() {
    return m_indices.length * Uint16Array.BYTES_PER_ELEMENT;
  };

  ////////////////////////////////////////////////////////////////////////////
  /*
   * Return primitive type g
   */
  ////////////////////////////////////////////////////////////////////////////
  this.primitiveType = function() {
    return m_primitiveType;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set primitive type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPrimitiveType = function(type) {
    m_primitiveType = type;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return count of indices that form a primitives
   */
  ////////////////////////////////////////////////////////////////////////////
  this.indicesPerPrimitive = function() {
    return m_indicesPerPrimitive;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set count of indices that form a primitive
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setIndicesPerPrimitive = function(count) {
    m_indicesPerPrimitive = count;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return indices value type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.indicesValueType = function() {
    return m_indicesValueType;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set indices value type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setIndicesValueType = function(type) {
    m_indicesValueType = type;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set indices from a array
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setIndices = function(indicesArray) {
    // TODO Check for the type
    m_indices = new Uint16Array(indicesArray);
  };

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class triangleStrip
 *
 * @returns {vglModule.triangleStrip}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.triangleStrip = function() {
  'use strict';

  if (!(this instanceof vglModule.triangleStrip)) {
    return new vglModule.triangleStrip();
  }

  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.TRIANGLE_STRIP);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(3);

  return this;
};

inherit(vglModule.triangleStrip, vglModule.primitive);

////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class triangles
 *
 * @returns {vglModule.triangles}
 */
////////////////////////////////////////////////////////////////////////////
vglModule.triangles = function() {
  'use strict';

  if (!(this instanceof vglModule.triangles)) {
    return new vglModule.triangles();
  }
  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.TRIANGLES);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(3);

  return this;
};

inherit(vglModule.triangles, vglModule.primitive);

//////////////////////////////////////////////////////////////////////////////
/**
 * create a instance of lines primitive type
 *
 * @returns {vglModule.lines}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.lines = function() {
  'use strict';

  if (!(this instanceof vglModule.lines)) {
    return new vglModule.lines();
  }
  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.LINES);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(2);

  return this;
};
inherit(vglModule.lines, vglModule.primitive);

//////////////////////////////////////////////////////////////////////////////
/**
 * create a instance of line strip primitive type
 *
 * @returns {vglModule.lineStrip}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.lineStrip = function() {
  'use strict';

  if (!(this instanceof vglModule.lineStrip)) {
    return new vglModule.lineStrip();
  }
  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.LINE_STRIP);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(2);

  return this;
};
inherit(vglModule.lineStrip, vglModule.primitive);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class points
 *
 * @returns {vglModule.points}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.points = function() {
  'use strict';

  if (!(this instanceof vglModule.points)) {
    return new vglModule.points();
  }
  vglModule.primitive.call(this);

  this.setPrimitiveType(gl.POINTS);
  this.setIndicesValueType(gl.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(1);

  return this;
};

inherit(vglModule.points, vglModule.primitive);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vertexDataP3f
 *
 * @returns {vglModule.vertexDataP3f}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.vertexDataP3f = function() {
  'use strict';

  if (!(this instanceof vglModule.vertexDataP3f)) {
    return new vglModule.vertexDataP3f();
  }

  /** @private */
  this.m_position = [];

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vertexDataP3N3f
 *
 * @class
 * @returns {vglModule.vertexDataP3N3f}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.vertexDataP3N3f = function() {
  'use strict';

  if (!(this instanceof vglModule.vertexDataP3N3f)) {
    return new vglModule.vertexDataP3N3f();
  }

  /** @private */
  this.m_position = [],
       m_normal = [];

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vertexDataP3T3f
 *
 * @class
 * @returns {vglModule.vertexDataP3T3f}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.vertexDataP3T3f = function() {
  'use strict';

  if (!(this instanceof vglModule.vertexDataP3T3f)) {
    return new vglModule.vertexDataP3T3f();
  }

  /** @private */
  this.m_position = [],
      m_texCoordinate = [];

  return this
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceData
 * @class
 * @returns {vglModule.sourceData}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.sourceData = function() {
  'use strict';

  if (!(this instanceof vglModule.sourceData)) {
    return new vglModule.sourceData();
  }

  /** @private */
  var m_attributesMap = {},
      m_data = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Attribute data for the source
   */
  ////////////////////////////////////////////////////////////////////////////
  var vglAttributeData = function() {
        // Number of components per group
    var m_numberOfComponents = 0,
        // Type of data type (GL_FLOAT etc)
        m_dataType = 0,
        // Size of data type
        m_dataTypeSize = 0,
        // Specifies whether fixed-point data values should be normalized
        // (true) or converted directly as fixed-point values (false)
        // when they are accessed.
        m_normalized = false,
        // Strides for each attribute.
        m_stride = 0,
        // Offset
        m_offset = 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data for this source
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function() {
    return m_data;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add new attribute data to the source
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return size of the source data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sizeOfArray = function() {
    return Object.size(m_data);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return length of array
   */
  ////////////////////////////////////////////////////////////////////////////
  this.lengthOfArray = function() {
    return m_data.length;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return size of the source data in bytes
   */
  ////////////////////////////////////////////////////////////////////////////
  /*
    * TODO: code below is probably wrong.
    *   Example:
    *            format P3N3f
    *            m_data = [ 1, 2, 3, 4, 5, 6 ]; // contains one vertex, one normal, m_data.length == 6
    *
    *       The inner loop computes:
    *             sizeInBytes += 3 * 4; // for position
    *             sizeInBytes += 3 * 4; // for normal
    *
    *        Then sizeInBytes *= 6; // m_data.length == 6
    *        which gives sizeInBytes == 144 bytes when it should have been 4*6 = 24
    */
  this.sizeInBytes = function() {
    var sizeInBytes = 0,
        keys = this.keys();

    for ( var i = 0; i < keys.length(); ++i) {
      sizeInBytes += this.numberOfComponents(keys[i])
                     * this.sizeOfAttributeDataType(keys[i]);
    }

    sizeInBytes *= this.sizeOfArray();

    return sizeInBytes;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if there is attribute exists of a given key type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hasKey = function(key) {
    return (key in m_attributesMap);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return keys of all attributes
   */
  ////////////////////////////////////////////////////////////////////////////
  this.keys = function() {
    return Object.keys(m_attributesMap);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return number of attributes of source data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numberOfAttributes = function() {
    return Object.size(m_attributesMap);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return number of components of the attribute data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attributeNumberOfComponents = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_numberOfComponents;
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return if the attribute data is normalized
   */
  ////////////////////////////////////////////////////////////////////////////
  this.normalized = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_normalized;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return size of the attribute data type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sizeOfAttributeDataType = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_dataTypeSize;
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return attribute data type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attributeDataType = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_dataType;
    }

    // @note: where is this defined?
    return vglDataType.Undefined;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return attribute offset
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attributeOffset = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_offset;
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return attribute stride
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attributeStride = function(key) {
    if (key in m_attributesMap) {
      return m_attributesMap[key].m_stride;
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to insert new vertex data at the end
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pushBack = function(vertexData) {
    // Should be implemented by the base class
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Insert new data block to the raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.insert = function(data) {
    m_data = m_data.concat(data);
  };

  this.insertAt = function(index, data) {
    if (!data.length) {
      m_data[index] = data;
    } else {
      for (var i = 0; i < data.length; i++) {
        m_data[index*data.length+i] = data[i];
      }
    }
  };

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataP3T3f
 *
 * @returns {vglModule.sourceDataP3T3f}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.sourceDataP3T3f = function() {
  'use strict';

  if (!(this instanceof vglModule.sourceDataP3T3f)) {
    return new vglModule.sourceDataP3T3f();
  }
  vglModule.sourceData.call(this);

  this.addAttribute(vglModule.vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 6 * 4, 3,
                    false);
  this.addAttribute(vglModule.vertexAttributeKeys.TextureCoordinate, gl.FLOAT, 4, 12,
                    6 * 4, 3, false);

  this.pushBack = function(value) {
    this.insert(value.m_position);
    this.insert(value.m_texCoordinate);
  };

  return this;
};

inherit(vglModule.sourceDataP3T3f, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataP3N3f
 *
 * @returns {vglModule.sourceDataP3N3f}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.sourceDataP3N3f = function() {
  'use strict';

  if (!(this instanceof vglModule.sourceDataP3N3f)) {
    return new vglModule.sourceDataP3N3f();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vglModule.vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 6 * 4, 3,
                    false);
  this.addAttribute(vglModule.vertexAttributeKeys.Normal, gl.FLOAT, 4, 12, 6 * 4, 3,
                    false);

  this.pushBack = function(value) {
    this.insert(value.m_position);
    this.insert(value.m_normal);
  };

  return this;
};

inherit(vglModule.sourceDataP3N3f, vglModule.sourceData);

/////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataP3fv
 *
 * @returns {vglModule.sourceDataP3fv}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.sourceDataP3fv = function() {
  'use strict';

  if (!(this instanceof vglModule.sourceDataP3fv)) {
    return new vglModule.sourceDataP3fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vglModule.vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 3 * 4, 3,
                    false);

  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataP3fv, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataT2fv
 *
 * @returns {vglModule.sourceDataT2fv}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.sourceDataT2fv = function() {
  'use strict';

  if (!(this instanceof vglModule.sourceDataT2fv)) {
    return new vglModule.sourceDataT2fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vglModule.vertexAttributeKeys.TextureCoordinate, gl.FLOAT, 4, 0,
                    2 * 4, 2, false);

  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataT2fv, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataC3fv
 *
 * @returns {vglModule.sourceDataC3fv}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.sourceDataC3fv = function() {
  'use strict';

  if (!(this instanceof vglModule.sourceDataC3fv)) {
    return new vglModule.sourceDataC3fv();
  }

  vglModule.sourceData.call(this);

  this.addAttribute(vglModule.vertexAttributeKeys.Color, gl.FLOAT, 4, 0, 3 * 4, 3, false);

  this.pushBack = function(value) {
    this.insert(value);
  };

  return this;
};

inherit(vglModule.sourceDataC3fv, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataSf meant to hold scalar float values
 *
 * @class
 * @returns {vglModule.sourceDataSf}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.sourceDataSf = function() {
  'use strict';

  if (!(this instanceof vglModule.sourceDataSf)) {
    return new vglModule.sourceDataSf();
  }

  var m_min = null;
  var m_max = null;
  var m_fixedmin = null;
  var m_fixedmax = null;

  vglModule.sourceData.call(this);

  this.addAttribute(vglModule.vertexAttributeKeys.Scalar, gl.FLOAT, 4, 0, 4, 1, false);

  this.pushBack = function(value) {
    if (m_max == null || value > m_max) m_max = value;
    if (m_min == null || value < m_min) m_min = value;
    this.insert(value);
  };

  this.insertAt = function(index, value) {
    if (m_max == null || value > m_max) m_max = value;
    if (m_min == null || value < m_min) m_min = value;
    //call superclass ??
    //vglModule.sourceData.insertAt.call(this, index, value);
    this.data()[index] = value;
  };

  this.scalarRange = function() {
    if (m_fixedmin == null || m_fixedmax == null) {
      return [m_min, m_max]
    }
    else {
      return [m_fixedmin, m_fixedmax]
    }
  }

  this.setScalarRange = function(min, max) {
    m_fixedmin = min
    m_fixedmax = max
  }

  return this;
};

inherit(vglModule.sourceDataSf, vglModule.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class geometryData
 *
 * @class
 * @returns {vglModule.geometryData}
 */
 /////////////////////////////////////////////////////////////////////////////
vglModule.geometryData = function() {
  'use strict';

  if (!(this instanceof vglModule.geometryData)) {
    return vglModule.geometryData();
  }
  vglModule.data.call(this);

  /** @private */
  var m_name = "";

  /** @private */
  var m_primitives = [];

  /** @private */
  var m_sources = [];

  /** @private */
  var m_bounds = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

  /** @private */
  var m_computeBoundsTimestamp = vglModule.timestamp();

  /** @private */
  var m_boundsDirtyTimestamp = vglModule.timestamp();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.type = function() {
    return vglModule.data.geometry;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return ID of the geometry data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.name = function() {
    return m_name;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set name of the geometry data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setName = function(name) {
    m_name = name;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add new source
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addSource = function(source) {
    // @todo Check if the incoming source has duplicate keys

    // NOTE This might not work on IE8 or lower
    if (m_sources.indexOf(source) == -1) {
      m_sources.push(source);

      if (source.hasKey(vglModule.vertexAttributeKeys.Position)) {
        m_boundsDirtyTimestamp.modified();
      }
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return source for a given index. Returns 0 if not found.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.source = function(index) {
    if (index < m_sources.length) {
      return m_sources[index];
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return number of sources
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numberOfSources = function() {
    return m_sources.length;
  };

  /**
   * Return source data given a key
   */
  this.sourceData = function(key) {
    for ( var i = 0; i < m_sources.length; ++i) {
      if (m_sources[i].hasKey(key)) {
        return m_sources[i];
      }
    }

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add new primitive
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addPrimitive = function(primitive) {
    //if (m_primitives.indexOf(primitive) == -1) {
      m_primitives.push(primitive);
      return true;
    //}

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return primitive for a given index. Returns null if not found.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.primitive = function(index) {
    if (index < m_primitives.length) {
      return m_primitives[index];
    }

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return number of primitives
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numberOfPrimitives = function() {
    return m_primitives.length;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return bounds [minX, maxX, minY, maxY, minZ, maxZ]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bounds = function() {
    if (m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime()) {
      this.computeBounds();
    }
    return m_bounds;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset bounds
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resetBounds = function() {
    m_bounds[0] = 0.0;
    m_bounds[1] = 0.0;
    m_bounds[2] = 0.0;
    m_bounds[3] = 0.0;
    m_bounds[4] = 0.0;
    m_bounds[5] = 0.0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set bounds
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {
    m_bounds[0] = minX;
    m_bounds[1] = maxX;
    m_bounds[2] = minY;
    m_bounds[3] = maxY;
    m_bounds[4] = minZ;
    m_bounds[5] = maxZ;

    m_computeBoundsTimestamp.modified();

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute bounds
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function() {
    if (m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime()) {
      var attr = vglModule.vertexAttributeKeys.Position;
      var sourceData = this.sourceData(attr),
          data = sourceData.data(),
          numberOfComponents = sourceData.attributeNumberOfComponents(attr),
          stride = sourceData.attributeStride(attr),
          offset = sourceData.attributeOffset(attr),
          sizeOfDataType = sourceData.sizeOfAttributeDataType(attr),
          count = data.length,
          ib = 0,
          jb = 0,
          value = null,
          vertexIndex,
          j;

      // We advance by index, not by byte
      stride /= sizeOfDataType;
      offset /= sizeOfDataType;

      this.resetBounds();

      for (vertexIndex = offset; vertexIndex < count; vertexIndex += stride) {
        for (j = 0; j < numberOfComponents; ++j) {
          value = data[vertexIndex + j];
          ib = j * 2;
          jb = j * 2 + 1;

          if (vertexIndex == offset) {
            m_bounds[ib] = value;
            m_bounds[jb] = value;
          } else {
            if (value > m_bounds[jb]) {
              m_bounds[jb] = value;
            }
            if (value < m_bounds[ib]) {
              m_bounds[ib] = value;
            }
          }
        }
      }

      m_computeBoundsTimestamp.modified();
    }
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns the vertex closest to a given position
   */
  ////////////////////////////////////////////////////////////////////////////
  this.findClosestVertex = function(point) {
    var attr = vglModule.vertexAttributeKeys.Position;
        sourceData = this.sourceData(attr),
        sizeOfDataType = sourceData.sizeOfAttributeDataType(attr),
        numberOfComponents = sourceData.attributeNumberOfComponents(attr),
        data = sourceData.data(),
        stride = sourceData.attributeStride(attr) / sizeOfDataType,
        offset = sourceData.attributeOffset(attr) / sizeOfDataType,
        minDist = 1.0 / 0.0,
        minIndex = null,
        vi, vPos, dx, dy, dz, dist;

    // assume positions are always triplets
    if (numberOfComponents != 3)
      console.log("fix me");

    if (!point.z)
      point = {x:point.x, y:point.y, z:0};

    for (vi = offset, i=0; vi < data.length; vi += stride, i++) {
      vPos = [data[vi + 0],
                  data[vi + 1],
                  data[vi + 2]];
      dx = vPos[0] - point.x;
      dy = vPos[1] - point.y;
      dz = vPos[2] - point.z;
      dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }
    return minIndex;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns the requested vertex position
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getPosition = function(index) {
    var attr = vglModule.vertexAttributeKeys.Position,
        sourceData = this.sourceData(attr),
        sizeOfDataType = sourceData.sizeOfAttributeDataType(attr),
        numberOfComponents = sourceData.attributeNumberOfComponents(attr),
        data = sourceData.data(),
        stride = sourceData.attributeStride(attr) / sizeOfDataType,
        offset = sourceData.attributeOffset(attr) / sizeOfDataType;

    // assume positions are always triplets
    if (numberOfComponents != 3)
      console.log("fix me");

    return [ data[offset + index*stride + 0],
             data[offset + index*stride + 1],
             data[offset + index*stride + 2] ];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns the scalar corresponding to a given vertex index
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getScalar = function(index) {
    var attr = vglModule.vertexAttributeKeys.Scalar,
        sourceData = this.sourceData(attr),
        numberOfComponents, sizeOfDataType, data, stride, offset;


    if (!sourceData)
      return null;

    numberOfComponents = sourceData.attributeNumberOfComponents(attr);
    sizeOfDataType = sourceData.sizeOfAttributeDataType(attr);
    data = sourceData.data();
    stride = sourceData.attributeStride(attr) / sizeOfDataType;
    offset = sourceData.attributeOffset(attr) / sizeOfDataType;

    //console.log("index for scalar is " + index);
    //console.log("offset for scalar is " + offset);
    //console.log("stride for scalar is " + stride);

    //console.log("have " + data.length + " scalars");

    if (index * stride + offset >= data.length)
      console.log("access out of bounds in getScalar");

    return data[index * stride + offset];
  };

  return this;
};

inherit(ogs.vgl.geometryData, ogs.vgl.data);