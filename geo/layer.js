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
// Layer base class
//
//////////////////////////////////////////////////////////////////////////////

/**
 *
 */
geoModule.layerOptions = function() {

  // Check against no use of new()
  if (!(this instanceof geoModule.layerOptions)) {
    return new geoModule.layerOptions();
  }

  this.opacity  = 1;
  this.showAttribution = true;
  this.visible = true;

  return this;
};

/**
 *
 */
geoModule.layer = function(options) {

  if (!(this instanceof geoModule.layer)) {
    return new geoModule.layer(options);
  }

  // Register with base class
  vgl.actor.call(this);

  /// Members initialization
  var m_opacity = options.opacity || 1.0;

  // Check
  if (m_opacity > 1.0) {
    m_opacity = 1.0;
    console.log("[warning] Opacity cannot be greater than 1.0");
  }
  else if (m_opacity < 0.0) {
    console.log("[warning] Opacity cannot be less than 1.0");
  }

  var m_showAttribution = options.showAttribution || true;
  var m_visible = options.visible || true;

  return this;
};

inherit(geoModule.layer, vglModule.object);
