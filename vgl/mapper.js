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
  vglModule.boundingObject.call(this);

  this.m_dirty = true;
  this.m_geomData = 0;
  this.m_buffers = [];
  this.m_bufferVertexAttributeMap = {};
};

inherit(vglModule.mapper, vglModule.boundingObject);

/// Compute bounds of the data
//----------------------------------------------------------------------------
vglModule.mapper.prototype.computeBounds = function() {
};

/// Return stored geometry data if any
//----------------------------------------------------------------------------
vglModule.mapper.prototype.geometryData = function() {
  return this.m_geomData;
};
/// Set geometry data for the mapper
//----------------------------------------------------------------------------
vglModule.mapper.prototype.setGeometryData = function(geom) {
  if (this.m_geomData !== geom )   {
    this.m_geomData = geom;

    // TODO we need
    this.m_dirty = true;
  }
};

/// Render
//----------------------------------------------------------------------------
vglModule.mapper.prototype.render = function(renderState) {
  // Bind material

  if (this.m_dirty) {
    this.setupDrawObjects(renderState);
  }

  // TODO Use renderState
  var bufferIndex = 0;
  var i = null;
  var j = 0;
  for (i in this.m_bufferVertexAttributeMap) {
    if (this.m_bufferVertexAttributeMap.hasOwnProperty(i)) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.m_buffers[bufferIndex]);
      for (j = 0; j < this.m_bufferVertexAttributeMap[i].length; ++j) {
        renderState.m_material.bindVertexData(
          renderState, this.m_bufferVertexAttributeMap[i][j]);
      }
      ++bufferIndex;
    }
  }

  var noOfPrimitives = this.m_geomData.numberOfPrimitives();
  for (j = 0; j < noOfPrimitives; ++j) {

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.m_buffers[bufferIndex++]);
    var primitive = this.m_geomData.primitive(j);//
    gl.drawElements(primitive.primitiveType(), primitive.numberOfIndices(),
                    primitive.indicesValueType(),  0);
  }

  // Unbind material
};

///
/// Internal methods
//
///////////////////////////////////////////////////////////////////////////////

/// Delete previously created buffers
//----------------------------------------------------------------------------
vglModule.mapper.prototype.deleteVertexBufferObjects = function() {
  for (var i = 0 ; i < this.m_buffers.length; ++i)   {
    gl.deleteBuffer(this.m_buffers[i]);
  }
};

/// Create new buffers
//----------------------------------------------------------------------------
vglModule.mapper.prototype.createVertexBufferObjects = function() {
  if (this.m_geomData) {
    var numberOfSources = this.m_geomData.numberOfSources();
    var i = 0;
    var bufferId = null;
    for (; i < numberOfSources; ++i) {
      bufferId = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
      gl.bufferData(gl.ARRAY_BUFFER, this.m_geomData.source(i).data(),
                    gl.STATIC_DRAW);

      keys = this.m_geomData.source(i).keys();
      ks = [];
      for (var j = 0; j < keys.length; ++j) {
        ks.push(keys[j]);
      }

      this.m_bufferVertexAttributeMap[i] = ks;
      this.m_buffers[i] = bufferId;
    }

    var numberOfPrimitives = this.m_geomData.numberOfPrimitives();
    for (var k = 0; k < numberOfPrimitives; ++k) {
      bufferId = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferId);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.m_geomData.primitive(k).indices(),
                   gl.STATIC_DRAW);
      this.m_buffers[i++] = bufferId;
    }
  }
};

/// Clear cache related to buffers
//----------------------------------------------------------------------------
vglModule.mapper.prototype.cleanUpDrawObjects = function() {
  this.m_bufferVertexAttributeMap = {};
  this.m_buffers = [];
};

/// Setup draw objects; Delete old ones and create new ones
//----------------------------------------------------------------------------
vglModule.mapper.prototype.setupDrawObjects = function(renderState) {
  // Delete buffer objects from past if any.
  this.deleteVertexBufferObjects();

  // Clear any cache related to buffers
  this.cleanUpDrawObjects();

  // Now construct the new ones.
  this.createVertexBufferObjects();

  this.m_dirty = false;
};