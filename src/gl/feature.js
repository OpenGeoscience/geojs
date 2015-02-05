//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class gl.feature
 *
 * @class
 * @extends geo.feature
 * @returns {geo.gl.feature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.feature = function (arg) {
  "use strict";
  if (!(this instanceof geo.gl.feature)) {
    return new geo.gl.feature(arg);
  }
  geo.feature.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_buffer = null,
      m_bufferStart = null,
      m_bufferSize = 0;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Allocate the buffer with the given size and attributes.
   * @param {number} size The size of each attribute data array
   * @param {object} attrs Mapping from attribute name -> attribute length
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._allocateBuffer = function (size, attrs) {
    var key;

    m_buffer = vgl.DataBuffers();
    m_bufferSize = size;

    for (key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        m_buffer.create(key, attrs[key]);
      }
    }

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
};

inherit(geo.gl.feature, geo.feature);
