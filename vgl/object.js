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
// vglObject class
//
//////////////////////////////////////////////////////////////////////////////

vglModule.object = function() {
  /// TODO Switch to time based modifications

  if (!(this instanceof vglModule.object)) {
    return new vglModule.object();
  }

  /// Private variables
  var m_modified = false;

  /// Public member methods
  this.modified = function() {
    return m_modified;
  };

  this.modifiedOn = function() {
    m_modified = true;
  };

  this.modifiedOff = function() {
    m_modified = false;
  };

  return this;
};