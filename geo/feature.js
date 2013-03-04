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
// Feature base class
//
//////////////////////////////////////////////////////////////////////////////

geoModule.feature = function() {

  if (!(this instanceof geoModule.feature)) {
    return new geoModule.feature();
  }

  /// Register with base class
  ogs.vgl.actor.call(this);


  return this;
};

inherit(geoModule.feature, ogs.vgl.actor);

//////////////////////////////////////////////////////////////////////////////
//
// Plane feature class
//
// Create a plane feature given a lower left corner point {ogs.geo.latlng} and
// and upper right corner point {ogs.geo.latlng}
//
//////////////////////////////////////////////////////////////////////////////

geoModule.planeFeature = function(lowerleft, upperright) {

  if (!(this instanceof geoModule.planeFeature)) {
    return new geoModule.planeFeature(lowerleft, upperright);
  }

  ogs.vgl.actor.call(this);

  /// Initialize
  var origin = [lowerleft.lng(), lowerleft.lat(), 0.0];
  var pt2 = [lowerleft.lng(), upperright.lat(), 0.0];
  var pt1 = [upperright.lng(), lowerleft.lat(), 0.0];

  var actor = ogs.vgl.utils.createPlane(origin[0], origin[1], origin[2],
                                         pt1[0], pt1[1], pt1[2],
                                         pt2[0], pt2[1], pt2[2]);


  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geoModule.planeFeature, geoModule.feature);
