var vgl = require('./vgl');
var inherit = require('../inherit');
var timestamp = require('../timestamp');

/**
 * Create a new instance of class mapper.
 *
 * @class
 * @alias vgl.mapper
 * @param {object} arg
 * @param {boolean} arg.dynamicDraw true if the dynamic draw flag should be
 *      set.
 * @returns {vgl.mapper}
 */
vgl.mapper = function (arg) {
  'use strict';

  if (!(this instanceof vgl.mapper)) {
    return new vgl.mapper(arg);
  }
  vgl.boundingObject.call(this);

  arg = arg || {};

  var m_color = [0.0, 1.0, 1.0],
      m_geomData = null,
      m_buffers = [],
      m_bufferVertexAttributeMap = {},
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      m_glCompileTimestamp = timestamp(),
      m_context = null,
      m_this = this;

  /**
   * Delete cached VBO.
   *
   * @param {vgl.renderState} renderState
   */
  this.deleteVertexBufferObjects = function (renderState) {
    var i;
    var context = m_context;
    if (renderState) {
      context = renderState.m_context;
    }
    if (context) {
      for (i = 0; i < m_buffers.length; i += 1) {
        context.deleteBuffer(m_buffers[i]);
      }
    }
  };

  /**
   * Cleanup mapper.
   *
   * @param {vgl.renderState} renderState
   */
  this._cleanup = function (renderState) {
    m_this.deleteVertexBufferObjects(renderState);
    cleanUpDrawObjects(renderState);
    m_this.modified();
  };

  /**
   * Create new VBO for all its geometryData sources and primitives.
   *
   * @param {vgl.renderState} renderState
   */
  function createVertexBufferObjects(renderState) {
    if (m_geomData) {
      if (renderState) {
        m_context = renderState.m_context;
      }
      var numberOfSources = m_geomData.numberOfSources(),
          i, j, k, bufferId = null, keys, ks, numberOfPrimitives, data;

      for (i = 0; i < numberOfSources; i += 1) {
        bufferId = m_context.createBuffer();
        m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, bufferId);
        data = m_geomData.source(i).data();
        if (!(data instanceof Float32Array)) {
          data = new Float32Array(data);
        }
        m_context.bufferData(vgl.GL.ARRAY_BUFFER, data,
                             m_dynamicDraw ? vgl.GL.DYNAMIC_DRAW :
                               vgl.GL.STATIC_DRAW);

        keys = m_geomData.source(i).keys();
        ks = [];

        for (j = 0; j < keys.length; j += 1) {
          ks.push(keys[j]);
        }

        m_bufferVertexAttributeMap[i] = ks;
        m_buffers[i] = bufferId;
      }

      numberOfPrimitives = m_geomData.numberOfPrimitives();
      for (k = 0; k < numberOfPrimitives; k += 1) {
        bufferId = m_context.createBuffer();
        m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, bufferId);
        m_context.bufferData(vgl.GL.ARRAY_BUFFER,
                             m_geomData.primitive(k).indices(), vgl.GL.STATIC_DRAW);
        m_buffers[i] = bufferId;
        i += 1;
      }

      m_glCompileTimestamp.modified();
    }
  }

  /**
   * Clear cache related to buffers.
   *
   * @param {vgl.renderState} renderState
   */
  function cleanUpDrawObjects(renderState) {
    m_bufferVertexAttributeMap = {};
    m_buffers = [];
  }

  /**
   * Setup draw objects; Delete old ones and create new ones.
   *
   * @param {vgl.renderState} renderState
   */
  function setupDrawObjects(renderState) {
    // Delete buffer objects from past if any.
    m_this.deleteVertexBufferObjects(renderState);

    // Clear any cache related to buffers
    cleanUpDrawObjects(renderState);

    // Now construct the new ones.
    createVertexBufferObjects(renderState);
  }

  /**
   * Compute bounds of the data.
   */
  this.computeBounds = function () {
    if (m_geomData === null || typeof m_geomData === 'undefined') {
      this.resetBounds();
      return;
    }

    var computeBoundsTimestamp = this.computeBoundsTimestamp(),
        boundsDirtyTimestamp = this.boundsDirtyTimestamp(),
        geomBounds = null;

    if (boundsDirtyTimestamp.getMTime() > computeBoundsTimestamp.getMTime()) {
      geomBounds = m_geomData.bounds();

      this.setBounds(geomBounds[0], geomBounds[1], geomBounds[2],
                     geomBounds[3], geomBounds[4], geomBounds[5]);

      computeBoundsTimestamp.modified();
    }
  };

  /**
   * Get solid color of the geometry.
   *
   * @returns {number[]}
   */
  this.color = function () {
    return m_color;
  };

  /**
   * Return stored geometry data.
   *
   * @returns {number[]}
   */
  this.geometryData = function () {
    return m_geomData;
  };

  /**
   * Connect mapper to its geometry data.
   *
   * @param {number[]} geom
   */
  this.setGeometryData = function (geom) {
    if (m_geomData !== geom) {
      m_geomData = geom;

      this.modified();
      this.boundsDirtyTimestamp().modified();
    }
  };

  /**
   * Update the buffer used for a named source.
   *
   * @param {string} sourceName The name of the source to update.
   * @param {object[]|Float32Array} values The values to use for the source.
   *    If not specified, use the source's own buffer.
   * @param {vgl.renderState} renderState
   * @returns {boolean} true if there was a context to update.
   */
  this.updateSourceBuffer = function (sourceName, values, renderState) {
    if (renderState) {
      m_context = renderState.m_context;
    }
    if (!m_context) {
      return false;
    }
    var bufferIndex = -1;
    for (var i = 0; i < m_geomData.numberOfSources(); i += 1) {
      if (m_geomData.source(i).name() === sourceName) {
        bufferIndex = i;
        break;
      }
    }
    if (bufferIndex < 0 || bufferIndex >= m_buffers.length) {
      return false;
    }
    if (!values) {
      values = m_geomData.source(i).dataToFloat32Array();
    }
    m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_buffers[bufferIndex]);
    if (values instanceof Float32Array) {
      m_context.bufferSubData(vgl.GL.ARRAY_BUFFER, 0, values);
    } else {
      m_context.bufferSubData(vgl.GL.ARRAY_BUFFER, 0,
                              new Float32Array(values));
    }
    return true;
  };

  /**
   * Get the buffer used for a named source.  If the current buffer isn't a
   * Float32Array, it is converted to one.  This array can then be modified
   * directly, after which updateSourceBuffer can be called to update the
   * GL array.
   *
   * @param {string} sourceName The name of the source to update.
   * @returns {Float32Array} An array used for this source.
   */
  this.getSourceBuffer = function (sourceName) {
    var source = m_geomData.sourceByName(sourceName);
    if (!source) {
      return new Float32Array();
    }
    return source.dataToFloat32Array();
  };

  /**
   * Render the mapper.
   *
   * @param {vgl.renderState} renderState The current rendering state object.
   * @param {boolean} noUndoBindVertexData If true, do not unbind vertex data.
   *    This may be desirable if the render function is subclassed.
   */
  this.render = function (renderState, noUndoBindVertexData) {
    if (this.getMTime() > m_glCompileTimestamp.getMTime() ||
        renderState.m_contextChanged) {
      setupDrawObjects(renderState);
    }
    m_context = renderState.m_context;

    // Fixed vertex color
    m_context.vertexAttrib3fv(vgl.vertexAttributeKeys.Color, this.color());

    var bufferIndex = 0,
        j = 0, i, noOfPrimitives = null, primitive = null;

    for (i in m_bufferVertexAttributeMap) {
      if (m_bufferVertexAttributeMap.hasOwnProperty(i)) {
        m_context.bindBuffer(vgl.GL.ARRAY_BUFFER,
                             m_buffers[bufferIndex]);
        for (j = 0; j < m_bufferVertexAttributeMap[i].length; j += 1) {
          renderState.m_material
              .bindVertexData(renderState, m_bufferVertexAttributeMap[i][j]);
        }
        bufferIndex += 1;
      }
    }

    noOfPrimitives = m_geomData.numberOfPrimitives();
    for (j = 0; j < noOfPrimitives; j += 1, bufferIndex += 1) {
      primitive = m_geomData.primitive(j);
      if (!primitive.numberOfIndices()) {
        continue;
      }
      m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_buffers[bufferIndex]);
      switch (primitive.primitiveType()) {
        case vgl.GL.POINTS:
          m_context.drawArrays(vgl.GL.POINTS, 0, primitive.numberOfIndices());
          break;
        case vgl.GL.LINES:
          m_context.drawArrays(vgl.GL.LINES, 0, primitive.numberOfIndices());
          break;
        case vgl.GL.LINE_STRIP:
          m_context.drawArrays(vgl.GL.LINE_STRIP, 0, primitive.numberOfIndices());
          break;
        case vgl.GL.TRIANGLES:
          m_context.drawArrays(vgl.GL.TRIANGLES, 0, primitive.numberOfIndices());
          break;
        case vgl.GL.TRIANGLE_STRIP:
          m_context.drawArrays(vgl.GL.TRIANGLE_STRIP, 0, primitive.numberOfIndices());
          break;
      }
      m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, null);
    }

    /* If we are rendering multiple features in the same context, we must
     * unbind the vertex data to make sure the next feature has a known state.
     * This is optional.
     */
    if (!noUndoBindVertexData) {
      this.undoBindVertexData(renderState);
    }
  };

  /**
   * Unbind the vertex data.
   *
   * @param {vgl.renderState} renderState
   */
  this.undoBindVertexData = function (renderState) {
    var i, j;

    for (i in m_bufferVertexAttributeMap) {
      if (m_bufferVertexAttributeMap.hasOwnProperty(i)) {
        for (j = 0; j < m_bufferVertexAttributeMap[i].length; j += 1) {
          renderState.m_material
              .undoBindVertexData(renderState, m_bufferVertexAttributeMap[i][j]);
        }
      }
    }
  };

  return this;
};

inherit(vgl.mapper, vgl.boundingObject);
