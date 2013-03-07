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
/// \class mapper
/// \ingroup vgl
/// \brief Mapper contains a geometry data and has the responsibility of rendering
/// the geometry appropriately.
///
/// Actor and mapper works in pair where mapper takes the responsibility of
/// rendering a geometry using OpenGL ES 2.0 API. mapper defines
/// a light weight polydata rendering entity that works in conjunction with a
/// actor.
///
/// \see boundingObject actor vglGeometryData
//////////////////////////////////////////////////////////////////////////////
//
// mapper class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.mapper = function() {

  if (!(this instanceof vglModule.mapper)) {
    return new vglModule.mapper();
  }
  vglModule.boundingObject.call(this);

  var m_dirty = true;
  var m_geomData = 0;
  var m_buffers = [];
  var m_bufferVertexAttributeMap = {};

  /**
   * Compute bounds of the data
   *
   */
  this.computeBounds = function() {
  };

  /**
   * Return stored geometry data if any
   *
   */
  this.geometryData = function() {
    return m_geomData;
  };

  /**
   * Connect mapper to its geometry data
   *
   */
  this.setGeometryData = function(geom) {
    if (m_geomData !== geom) {
      m_geomData = geom;

      // TODO we need
      m_dirty = true;
    }
  };

  /**
   * Render the mapper
   *
   */
  this.render = function(renderState) {
    if (m_dirty) {
      setupDrawObjects(renderState);
    }

    // TODO Use renderState
    var bufferIndex = 0;
    var i = null;
    var j = 0;
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

  /**
   * Delete cached VBO if any
   *
   */
  function deleteVertexBufferObjects() {
    for ( var i = 0; i < m_buffers.length; ++i) {
      gl.deleteBuffer(m_buffers[i]);
    }
  }

  /**
   * Create new VBO for all its geometryData sources and primitives
   *
   */
  function createVertexBufferObjects() {
    if (m_geomData) {
      var numberOfSources = m_geomData.numberOfSources();
      var i = 0;
      var bufferId = null;
      for (; i < numberOfSources; ++i) {
        bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, m_geomData.source(i).data(),
                      gl.STATIC_DRAW);

        keys = m_geomData.source(i).keys();
        ks = [];
        for ( var j = 0; j < keys.length; ++j) {
          ks.push(keys[j]);
        }

        m_bufferVertexAttributeMap[i] = ks;
        m_buffers[i] = bufferId;
      }

      var numberOfPrimitives = m_geomData.numberOfPrimitives();
      for ( var k = 0; k < numberOfPrimitives; ++k) {
        bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m_geomData.primitive(k)
            .indices(), gl.STATIC_DRAW);
        m_buffers[i++] = bufferId;
      }
    }
  }

  /**
   * Clear cache related to buffers
   *
   */
  function cleanUpDrawObjects() {
    m_bufferVertexAttributeMap = {};
    m_buffers = [];
  }

  /**
   * Internal methods
   */

  /**
   * Setup draw objects; Delete old ones and create new ones
   *
   */
  function setupDrawObjects(renderState) {
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
