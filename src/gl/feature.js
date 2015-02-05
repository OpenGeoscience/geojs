//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class gl.feature
 *
 * @class
 * @returns {geo.gl.feature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.feature = function () {
  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_buffer = null,
      m_bufferStart = null,
      m_bufferSize = 0,
      m_sources = [],
      m_primitives = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @typedef geo.gl.source
   * @protected
   * @type {object}
   * @property {string} name Unique attribute name
   * @property {number} size The number of 4 byte words allocated in cache
   * @property {vgl.sourceData} source The vgl data source object
   */
  /**
   * @typedef geo.gl.primitive
   * @protected
   * @type {object}
   * @property {string} indices Buffer name for the indices
   * @property {vgl.primitive} primitive The vgl primitive
   */
  /**
   * Allocate the buffer with the given size and attributes.
   * @param {number} size The size of each attribute data array
   * @param {geo.gl.source[]} sources Mapping from source name -> sourceData type
   * @param {geo.gl.primitive[]} primitives Mapping from primitive name -> primitive type
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._allocateBuffer = function (size, sources, primitives) {

    m_buffer = vgl.DataBuffers();
    m_bufferSize = size;

    m_sources = sources.map(function (s) {
      m_buffer.create(s.name, s.size);
      return s;
    });
    m_primitives = primitives.map(function (p) {
      if (p.indices) {
        m_buffer.create(p.indices, 1);
      }
      return p;
    });

    m_bufferStart = m_buffer.alloc(size);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Write data into the buffer.
   * @protected
   * @param {string} attr The buffer name to write into
   * @param {object[]} data The data array to write
   * @param {number} [repeat=1] The number of times to repeat each datum
   * @param {function} [accessor] A function returning an array of numbers
   */
  ////////////////////////////////////////////////////////////////////////////
  this._writeBuffer = function (attr, data, repeat, accessor) {
    repeat = repeat || 1;
    accessor = accessor || function (d) { return [d]; };

    data.forEach(function (d, i) {
      m_buffer.repeat(
        attr,
        accessor(d, i),
        m_bufferStart + i * repeat,
        repeat
      );
    });

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Write position data into the buffer.
   * @protected
   * @param {string} attr The buffer name to write into
   * @param {object[]} data The data array to write
   * @param {number} [repeat=1] The number of times to repeat each datum
   */
  ////////////////////////////////////////////////////////////////////////////
  this._writePositions = function (attr, data, repeat) {
    return m_this._writeBuffer(
      attr,
      geo.transform.transformCoordinates(
        m_this.gcs(),
        m_this.layer().map().gcs(),
        data
      ),
      repeat,
      function (d) { return [d.x, d.y, d.z]; }
    );
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Write color data into the buffer.
   * @protected
   * @param {string} attr The buffer name to write into
   * @param {object[]} data The data array to write
   * @param {number} [repeat=1] The number of times to repeat each datum
   */
  ////////////////////////////////////////////////////////////////////////////
  this._writeColors = function (attr, data, repeat) {
    return m_this._writeBuffer(
      attr,
      data,
      repeat,
      function (d) { return [d.r / 255, d.g / 255, d.b / 255]; }
    );
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Write boolean data into the buffer.
   * @protected
   * @param {string} attr The buffer name to write into
   * @param {object[]} data The data array to write
   * @param {number} [repeat=1] The number of times to repeat each datum
   */
  ////////////////////////////////////////////////////////////////////////////
  this._writeBools = function (attr, data, repeat) {
    return m_this._writeBuffer(
      attr,
      data,
      repeat,
      function (d) { return [d ? 1 : 0]; }
    );
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get an attribute from the internal buffer.
   * @protected
   * @param {string} name The attribute name
   * @returns {number[]}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._readBuffer = function (attr) {
    return m_buffer.get(attr);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create geometry data from the source buffers.
   * @todo Generalize this for features with multiple geometries.
   * @protected
   * @returns {vgl.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._buildGeometry = function () {
    var geom = vgl.geometryData();

    m_sources.forEach(function (spec) {
      spec.source.pushBack(
        m_this._readBuffer(spec.name)
      );
      geom.addSource(spec.source);
    });

    m_primitives.forEach(function (spec) {
      if (spec.indices) {
        spec.primitive.setIndices(
          m_this._readBuffer(spec.indices)
        );
      }
      geom.addPrimitive(spec.primitive);
    });

    return geom;
  };
};
