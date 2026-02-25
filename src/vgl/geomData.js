var vgl = require('./vgl');
var inherit = require('../inherit');
var timestamp = require('../timestamp');

/**
 * Create a new instance of class primitive.
 *
 * @class
 * @alias vgl.primitive
 * @returns {vgl.primitive}
 */
vgl.primitive = function () {
  'use strict';

  if (!(this instanceof vgl.primitive)) {
    return new vgl.primitive();
  }

  var m_primitiveType = 0,
      m_indicesValueType = 0,
      m_indices = null;

  /**
   * Get indices of the primitive.
   *
   * @returns {Uint16Array}
   */
  this.indices = function () {
    return m_indices;
  };

  /**
   * Return the number of indices.
   *
   * @returns {number} The number of indices.
   */
  this.numberOfIndices = function () {
    return m_indices === null ? 0 : m_indices.length;
  };

  /*
   * Return primitive type.
   *
   * @returns {number}
   */
  this.primitiveType = function () {
    return m_primitiveType;
  };

  /**
   * Set primitive type.
   *
   * @param {number} type The new type.
   */
  this.setPrimitiveType = function (type) {
    m_primitiveType = type;
  };

  /**
   * Return indices value type.
   *
   * @returns {number}
   */
  this.indicesValueType = function () {
    return m_indicesValueType;
  };

  /**
   * Set indices value type.
   *
   * @param {number} type
   */
  this.setIndicesValueType = function (type) {
    m_indicesValueType = type;
  };

  /**
   * Set indices from a array.
   *
   * @param {Array} indicesArray The array of new indices.
   */
  this.setIndices = function (indicesArray) {
    // TODO Check for the type
    m_indices = new Uint16Array(indicesArray);
  };

  return this;
};

/**
 * Create a new instance of class triangles.
 *
 * @class
 * @alias vgl.triangles
 * @returns {vgl.triangles}
 */
vgl.triangles = function () {
  'use strict';

  if (!(this instanceof vgl.triangles)) {
    return new vgl.triangles();
  }
  vgl.primitive.call(this);

  this.setPrimitiveType(vgl.GL.TRIANGLES);
  this.setIndicesValueType(vgl.GL.UNSIGNED_SHORT);

  return this;
};

inherit(vgl.triangles, vgl.primitive);

/**
 * Create a new instance of class points.
 *
 * @class
 * @alias vgl.points
 * @returns {vgl.points}
 */
vgl.points = function () {
  'use strict';

  if (!(this instanceof vgl.points)) {
    return new vgl.points();
  }
  vgl.primitive.call(this);

  this.setPrimitiveType(vgl.GL.POINTS);
  this.setIndicesValueType(vgl.GL.UNSIGNED_SHORT);

  return this;
};

inherit(vgl.points, vgl.primitive);

/**
 * Create a new instance of class sourceData.
 *
 * @class
 * @alias vgl.sourceData
 * @param {object} arg
 * @param {string?} arg.name Name of the source
 * @returns {vgl.sourceData}
 */
vgl.sourceData = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceData)) {
    return new vgl.sourceData(arg);
  }

  arg = arg || {};
  var m_attributesMap = {},
      m_data = [],
      m_name = arg.name || 'Source ' + new Date().toISOString(),

      /* Attribute data for the source */
      vglAttributeData = function () {
        // Number of components per group
        // Type of data type (GL_FLOAT etc)
        this.m_numberOfComponents = 0;
        // Size of data type
        this.m_dataType = 0;
        this.m_dataTypeSize = 0;
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
   * Return raw data for this source.
   *
   * @returns {Array|Float32Array}
   */
  this.data = function () {
    return m_data;
  };

  /**
   * Return raw data for this source.
   *
   * @returns {Array|Float32Array}
   */
  this.getData = function () {
    return this.data();
  };

  /**
   * If the raw data is not a Float32Array, convert it to one.  Then, return
   * raw data for this source.
   *
   * @returns {Float32Array}
   */
  this.dataToFloat32Array = function () {
    if (!(m_data instanceof Float32Array)) {
      m_data = new Float32Array(m_data);
    }
    return m_data;
  };

  /**
   * Set data for this source.
   *
   * @param {Array|Float32Array} data
   */
  this.setData = function (data) {
    if (!(data instanceof Array) && !(data instanceof Float32Array)) {
      console.log('[error] Requires array');  // eslint-disable-line no-console
      return;
    }
    if (data instanceof Float32Array) {
      m_data = data;
    } else {
      m_data = data.slice(0);
    }
  };

  /**
   * Add new attribute data to the source.
   *
   * @param {string} key Attribute key.
   * @param {number} dataType
   * @param {number} sizeOfDataType
   * @param {number} offset
   * @param {number} stride
   * @param {number} noOfComponents
   * @param {boolean} normalized
   */
  this.addAttribute = function (key, dataType, sizeOfDataType, offset, stride,
    noOfComponents, normalized) {

    if (!m_attributesMap.hasOwnProperty(key)) {
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
   * Check if there is attribute exists of a given key type.
   *
   * @param {string} key Attribute key.
   * @returns {boolean}
   */
  this.hasKey = function (key) {
    return m_attributesMap.hasOwnProperty(key);
  };

  /**
   * Return keys of all attributes.
   *
   * @returns {string[]}
   */
  this.keys = function () {
    return Object.keys(m_attributesMap);
  };

  /**
   * Return number of components of the attribute data.
   *
   * @param {string} key Attribute key.
   * @returns {number}
   */
  this.attributeNumberOfComponents = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_numberOfComponents;
    }

    return 0;
  };

  /**
   * Return if the attribute data is normalized.
   *
   * @param {string} key Attribute key.
   * @returns {boolean}
   */
  this.normalized = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_normalized;
    }

    return false;
  };

  /**
   * Return attribute data type.
   *
   * @param {string} key Attribute key.
   * @returns {number}
   */
  this.attributeDataType = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_dataType;
    }

    return undefined;
  };

  /**
   * Return attribute offset.
   *
   * @param {string} key Attribute key.
   * @returns {number}
   */
  this.attributeOffset = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_offset;
    }

    return 0;
  };

  /**
   * Return attribute stride.
   *
   * @param {string} key Attribute key.
   * @returns {number}
   */
  this.attributeStride = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_stride;
    }

    return 0;
  };

  /**
   * Virtual function to insert new vertex data at the end.
   *
   * @param {number|Array} vertexData
   */
  this.pushBack = function (vertexData) {
    // Should be implemented by the base class
  };

  /**
   * Insert new data block to the raw data.
   *
   * @param {number[]|Float32Array} data
   */
  this.insert = function (data) {
    var i;

    /* If we will are given a Float32Array and don't have any other data, use
     * it directly. */
    if (!m_data.length && data.length && data instanceof Float32Array) {
      m_data = data;
      return;
    }
    /* If our internal array is immutable and we will need to change it, create
     * a regular mutable array from it. */
    if (!m_data.slice && (m_data.length || !data.slice)) {
      m_data = Array.prototype.slice.call(m_data);
    }
    if (!data.length) {
      /* data is a singular value, so append it to our array */
      m_data[m_data.length] = data;
    } else {
      /* We don't have any data currently, so it is faster to copy the data
       * using slice. */
      if (!m_data.length && data.slice) {
        m_data = data.slice(0);
      } else {
        for (i = 0; i < data.length; i += 1) {
          m_data[m_data.length] = data[i];
        }
      }
    }
  };

  /**
   * Return name of the source data.
   *
   * @returns {string}
   */
  this.name = function () {
    return m_name;
  };

  return this;
};

/**
 * Create a new instance of class sourceDataP3fv.
 *
 * @class
 * @alias vgl.sourceDataAnyfv
 * @param {number} size Number of sets of 4 floats.
 * @param {string} key Attribute key.
 * @param {object} arg Argument to pass to parent class.
 * @returns {vgl.sourceDataAnyfv}
 */
vgl.sourceDataAnyfv = function (size, key, arg) {
  'use strict';
  if (!(this instanceof vgl.sourceDataAnyfv)) {
    return new vgl.sourceDataAnyfv(size, key, arg);
  }

  vgl.sourceData.call(this, arg);
  this.addAttribute(key, vgl.GL.FLOAT,
                    4, 0, size * 4, size, false);

  this.pushBack = function (value) {
    this.insert(value);
  };

  return this;
};

inherit(vgl.sourceDataAnyfv, vgl.sourceData);

/**
 * Create a new instance of class sourceDataP3fv.
 *
 * @class
 * @alias vgl.sourceDataP3fv
 * @param {object} arg Object to pass to parent class.
 * @returns {vgl.sourceDataP3fv}
 */
vgl.sourceDataP3fv = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataP3fv)) {
    return new vgl.sourceDataP3fv(arg);
  }

  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.Position, vgl.GL.FLOAT, 4, 0, 3 * 4, 3,
                    false);

  this.pushBack = function (value) {
    this.insert(value);
  };

  return this;
};

inherit(vgl.sourceDataP3fv, vgl.sourceData);

/**
 * Create a new instance of class sourceDataT2fv.
 *
 * @class
 * @alias vgl.sourceDataT2fv
 * @param {object} arg Object to pass to parent class.
 * @returns {vgl.sourceDataT2fv}
 */
vgl.sourceDataT2fv = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataT2fv)) {
    return new vgl.sourceDataT2fv(arg);
  }

  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.TextureCoordinate, vgl.GL.FLOAT, 4, 0,
                    2 * 4, 2, false);

  this.pushBack = function (value) {
    this.insert(value);
  };

  return this;
};

inherit(vgl.sourceDataT2fv, vgl.sourceData);

/**
 * Create a new instance of class geometryData.
 *
 * @class
 * @alias vgl.geometryData
 * @returns {vgl.geometryData}
 */
vgl.geometryData = function () {
  'use strict';

  if (!(this instanceof vgl.geometryData)) {
    return new vgl.geometryData();
  }
  vgl.data.call(this);

  var m_name = '',
      m_primitives = [],
      m_sources = [],
      m_bounds = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      m_computeBoundsTimestamp = timestamp(),
      m_boundsDirtyTimestamp = timestamp();

  /**
   * Return type.
   *
   * @returns {number}
   */
  this.type = function () {
    return vgl.data.geometry;
  };

  /**
   * Return ID of the geometry data.
   *
   * @returns {string}
   */
  this.name = function () {
    return m_name;
  };

  /**
   * Add new source.
   *
   * @param {vgl.sourceData} source
   * @returns {boolean} True is the source was added.
   */
  this.addSource = function (source) {
    if (m_sources.indexOf(source) === -1) {
      m_sources.push(source);

      if (source.hasKey(vgl.vertexAttributeKeys.Position)) {
        m_boundsDirtyTimestamp.modified();
      }
      return true;
    }

    return false;
  };

  /**
   * Return source for a given index. Returns 0 if not found.
   *
   * @param {number} index
   * @returns {vgl.sourceData|number}
   */
  this.source = function (index) {
    if (index < m_sources.length) {
      return m_sources[index];
    }

    return 0;
  };

  /**
   * Return source with a specified name.  Returns 0 if not found.
   *
   * @param {string} sourceName
   * @returns {vgl.sourceData|number}
   */
  this.sourceByName = function (sourceName) {
    for (var i = 0; i < m_sources.length; i += 1) {
      if (m_sources[i].name() === sourceName) {
        return m_sources[i];
      }
    }
    return 0;
  };

  /**
   * Return number of sources.
   *
   * @returns {number}
   */
  this.numberOfSources = function () {
    return m_sources.length;
  };

  /**
   * Return source data given a key.
   *
   * @param {string} key
   * @returns {vgl.sourceData|null}
   */
  this.sourceData = function (key) {
    var i;

    for (i = 0; i < m_sources.length; i += 1) {
      if (m_sources[i].hasKey(key)) {
        return m_sources[i];
      }
    }

    return null;
  };

  /**
   * Add new primitive.
   *
   * @param {vgl.primitive} primitive
   * @returns {boolean}
   */
  this.addPrimitive = function (primitive) {
    m_primitives.push(primitive);
    return true;
  };

  /**
   * Return primitive for a given index. Returns null if not found.
   *
   * @param {number} index
   * @returns {vgl.primitive|null}
   */
  this.primitive = function (index) {
    if (index < m_primitives.length) {
      return m_primitives[index];
    }

    return null;
  };

  /**
   * Return number of primitives.
   *
   * @returns {number}
   */
  this.numberOfPrimitives = function () {
    return m_primitives.length;
  };

  /**
   * Return bounds.
   *
   * @returns {number[]} Array of minX, maxX, minY, maxY, minZ, maxZ.
   */
  this.bounds = function () {
    if (m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime()) {
      this.computeBounds();
    }
    return m_bounds;
  };

  /**
   * Check if bounds are dirty or mark them as such.
   *
   * @param {boolean} dirty true to set bounds as dirty.
   * @returns {boolean} true if bounds are dirty.
   */
  this.boundsDirty = function (dirty) {
    if (dirty) {
      m_boundsDirtyTimestamp.modified();
    }
    return m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime();
  };

  /**
   * Set bounds.
   *
   * @param {number} minX
   * @param {number} maxX
   * @param {number} minY
   * @param {number} maxY
   * @param {number} minZ
   * @param {number} maxZ
   * @returns {boolean} True if set.
   */
  this.setBounds = function (minX, maxX, minY, maxY, minZ, maxZ) {
    m_bounds[0] = minX;
    m_bounds[1] = maxX;
    m_bounds[2] = minY;
    m_bounds[3] = maxY;
    m_bounds[4] = minZ;
    m_bounds[5] = maxZ;

    m_computeBoundsTimestamp.modified();

    return true;
  };

  return this;
};

inherit(vgl.geometryData, vgl.data);
