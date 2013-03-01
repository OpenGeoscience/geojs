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
// blendFunction class
//
//////////////////////////////////////////////////////////////////////////////

vglModule.blendFunction = function(source, destination) {

  if (!(this instanceof vglModule.blendFunction)) {
    return new vglModule.blendFunction(source, destination);
  }

  /// Private variables
  var m_source = source;
  var m_destination = destination;

  /**
   * Apply blend function to the current state
   *
   */
  this.apply = function(renderState) {
    gl.blendFunc(m_source, m_destination);
  };

  return this;
}

//////////////////////////////////////////////////////////////////////////////
//
// blend class
//
//////////////////////////////////////////////////////////////////////////////

vglModule.blend = function() {

  if (!(this instanceof vglModule.blend)) {
    return new vglModule.blend();
  }
  vglModule.materialAttribute.call(this, materialAttributeType.Blend);

  /// Private member variables
  var m_wasEnabled  = false;
  var m_blendFunction =
    vglModule.blendFunction(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  /**
   * Bind blend attribute
   *
   */
  this.bind  = function(renderState) {
    m_wasEnabled = gl.isEnabled(gl.BLEND);

    if (this.enabled()) {
      gl.enable(gl.BLEND);
      m_blendFunction.apply(renderState);
    } else {
      gl.disable(gl.BLEND);
    }

    return true;
  };

  /**
   * Undo blend attribute
   *
   */
  this.undoBind = function(renderState) {
    if (m_wasEnabled) {
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }
    return true;
  };

  return this;
};

inherit(vglModule.blend, vglModule.materialAttribute);
