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
 * Create a new instance of class mapper
 *
 * @class
 * @returns {vglModule.mapper}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.mapper = function() {
  'use strict';

  if (!(this instanceof vglModule.mapper)) {
    return new vglModule.mapper();
  }
  vglModule.boundingObject.call(this);

  /** @private */
  var m_dirty = true,
      m_color = [ 0.0, 1.0, 1.0 ],
      m_geomData = null,
      m_buffers = [],
      m_bufferVertexAttributeMap = {},
      m_glCompileTimestamp = vglModule.timestamp();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute bounds of the data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function() {
    if (m_geomData === null || typeof m_geomData === 'undefined') {
      this.resetBounds();
      return;
    }

    var computeBoundsTimestamp = this.computeBoundsTimestamp(),
        boundsDirtyTimestamp = this.boundsDirtyTimestamp();

    if (boundsDirtyTimestamp.getMTime() > computeBoundsTimestamp.getMTime()) {
      var geomBounds = m_geomData.bounds();

      this.setBounds(geomBounds[0], geomBounds[1], geomBounds[2],
        geomBounds[3], geomBounds[4], geomBounds[5]) ;

      computeBoundsTimestamp.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get solid color of the geometry
   */
  ////////////////////////////////////////////////////////////////////////////
  this.color = function() {
    return m_color;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set solid color of the geometry. Default is white [1.0, 1.0, 1.0]
   *
   * @param r Red component of the color [0.0 - 1.0]
   * @param g Green component of the color [0.0 - 1.0]
   * @param b Blue component of the color [0.0 - 1.0]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setColor = function(r, g, b) {
    m_color[0] = r;
    m_color[1] = g;
    m_color[2] = b;

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return stored geometry data if any
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometryData = function() {
    return m_geomData;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect mapper to its geometry data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setGeometryData = function(geom) {
    if (m_geomData !== geom) {
      m_geomData = geom;

      this.modified();
      this.boundsDirtyTimestamp().modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render the mapper
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function(renderState) {
    if (this.getMTime() > m_glCompileTimestamp.getMTime()) {
      setupDrawObjects(renderState);
    }

    // Fixed vertex color
    gl.vertexAttrib3fv(vglModule.vertexAttributeKeys.Color, this.color());

    // TODO Use renderState
    var bufferIndex = 0,
        j = 0, i;

    for (i in m_bufferVertexAttributeMap) {
      if (m_bufferVertexAttributeMap.hasOwnProperty(i)) {
        gl.bindBuffer(gl.ARRAY_BUFFER, m_buffers[bufferIndex]);
        for (j = 0; j < m_bufferVertexAttributeMap[i].length; ++j) {
          renderState.m_material
              .bindVertexData(renderState, m_bufferVertexAttributeMap[i][j]);
        }
        ++bufferIndex;
      }
    }

    var noOfPrimitives = m_geomData.numberOfPrimitives();
    for (j = 0; j < noOfPrimitives; ++j) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m_buffers[bufferIndex++]);
      var primitive = m_geomData.primitive(j);//
      gl.drawElements(primitive.primitiveType(), primitive.numberOfIndices(),
                      primitive.indicesValueType(), 0);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete cached VBO if any
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function deleteVertexBufferObjects() {
    var i;
    for (i = 0; i < m_buffers.length; ++i) {
      gl.deleteBuffer(m_buffers[i]);
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create new VBO for all its geometryData sources and primitives
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function createVertexBufferObjects() {
    if (m_geomData) {
      var numberOfSources = m_geomData.numberOfSources(),
          i, j, k, bufferId = null, keys, ks, numberOfPrimitives;

      for (i = 0; i < numberOfSources; ++i) {
        bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER,
          new Float32Array(m_geomData.source(i).data()), gl.STATIC_DRAW);

        keys = m_geomData.source(i).keys();
        ks = [];

        for (j = 0; j < keys.length; ++j) {
          ks.push(keys[j]);
        }

        m_bufferVertexAttributeMap[i] = ks;
        m_buffers[i] = bufferId;
      }

      numberOfPrimitives = m_geomData.numberOfPrimitives();
      for (k = 0; k < numberOfPrimitives; ++k) {
        bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m_geomData.primitive(k)
            .indices(), gl.STATIC_DRAW);
        m_buffers[i++] = bufferId;
      }

      m_glCompileTimestamp.modified();
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear cache related to buffers
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function cleanUpDrawObjects() {
    m_bufferVertexAttributeMap = {};
    m_buffers = [];
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Setup draw objects; Delete old ones and create new ones
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function setupDrawObjects() {
    // Delete buffer objects from past if any.
    deleteVertexBufferObjects();

    // Clear any cache related to buffers
    cleanUpDrawObjects();

    // Now construct the new ones.
    createVertexBufferObjects();

    m_dirty = false;
  }

  return this;
};

inherit(vglModule.mapper, vglModule.boundingObject);
