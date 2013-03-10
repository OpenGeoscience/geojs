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
// boundingObject class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.boundingObject = function() {

  if (!(this instanceof vglModule.boundingObject)) {
    return new vglModule.boundingObject();
  }
  vglModule.object.call(this);

  var m_boundsDirty = true;
  var m_bounds = new Array(6);

  /**
   * Return true if bounds are dirty otherwise false
   *
   */
  this.boundsDirty = function() {
    return m_boundsDirty;
  };

  /**
   * Mark bounds dirty for the object
   *
   */
  this.setBoundsDirty = function(flag) {
    if (m_boundsDirty !== flag) {
      m_boundsDirty = flag;
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Get current bounds of the object
   *
   */
  this.bounds = function() {
    return m_bounds;
  };

  /**
   * Set current bounds of the object
   *
   */
  this.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {
    m_bounds[0] = minX;
    m_bounds[1] = maxX;
    m_bounds[2] = minY;
    m_bounds[3] = maxY;
    m_bounds[4] = minZ;
    m_bounds[5] = maxZ;

    this.modified();

    return true;
  };

  // / Request computing bounds. Should be implemented by the concrete class
  this.computeBounds = function() {
  };

  return this;
};

inherit(vglModule.boundingObject, vglModule.object);
