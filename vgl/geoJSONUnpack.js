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
// geoJSONUnpack class
// This contains code that reads a geoJSON file and produces rendering
// primitives from it.
//
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////

vglModule.geoJSONUnpack = function() {
	this.Coordinates = [];
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.ExtractCoordinates = function (obj) {
  // I'm just recursively getting all the points out into a flat list.
  // Once we demonstrate data delivery to rendering, we need to pull out
  // the connectivity to draw lines and polygons instead of just this.
  var appender = function(element, index, array) {
    this.Coordinates = this.Coordinates.concat(element)
  }

  if (obj.hasOwnProperty('coordinates')) {
    console.log("found coords");
    obj['coordinates'].forEach(appender, this);
  }
  else
    {
      for (var x in obj) {
        if (obj.hasOwnProperty(x) && typeof(obj[x])=="object" &&
            obj[x] !== null) {
          console.log(x + " recurse")
          this.ExtractCoordinates(obj[x]);
        } else {
          console.log(obj[x] + " dead end")
        }
      }
    }
  return;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.parseObject = function(buffer) {
  console.log("PARSING GEOJSON");
  //console.log(buffer);
  if (!buffer) return;

  var obj = JSON.parse(buffer);
  console.log("PARSED");
  console.log(obj);

  this.ExtractCoordinates(obj);
  console.log(this.Coordinates);

  var geom = new vglModule.geometryData();
  geom.setName("FOO");

  var points = new vglModule.points();
  geom.addPrimitive(points);
  var indices = new Uint16Array(this.Coordinates.length);

  var coords = new vglModule.sourceDataP3fv();
  geom.addSource(coords);

  for (var i = 0; i < this.Coordinates.length; i++) {
    indices[i] = i;

    var v1 = new vglModule.vertexDataP3f();
    var x = this.Coordinates[i][0];
    var y = this.Coordinates[i][1];
    var z = 0.0;
    if (this.Coordinates[i].length>2)
      {
      z = this.Coordinates[i][2];
      }
    v1 = new Array(x,y,z);
    coords.pushBack(v1);
  }
  points.setIndices(indices);
  console.log("coords ARE");
  console.log(coords);
  console.log("points ARE ");
  console.log(points);
  console.log(points.indices());

  return geom;
}
