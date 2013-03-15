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

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readPoint = function(coordinates) {
	  var geom = new vglModule.geometryData();
	  var vglpoints = new vglModule.points();
	  var vglcoords = new vglModule.sourceDataP3fv();
	  var indices = new Uint16Array(1);

	  for (var i = 0; i < 1; i++) {
	    indices[i] = i;

	    var x = coordinates[0];
	    var y = coordinates[1];
	    var z = 0.0;
	    if (coordinates.length>2)
	      {
	      z = coordinates[2];
	      }
	    console.log("read " + x + "," + y + "," + z)
	    //TODO: ignoring higher dimensions
	    vglcoords.pushBack([x,y,z]);
	  }
	  vglpoints.setIndices(indices);

	  geom.addPrimitive(vglpoints);
	  geom.addSource(vglcoords);
	  geom.setName("aPoint");
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readMultiPoint = function(coordinates) {
	  var geom = new vglModule.geometryData();
	  var vglpoints = new vglModule.points();
	  var vglcoords = new vglModule.sourceDataP3fv();
	  var indices = new Uint16Array(coordinates.length);

	  for (var i = 0; i < coordinates.length; i++) {
	    indices[i] = i;

	    var x = coordinates[i][0];
	    var y = coordinates[i][1];
	    var z = 0.0;
	    if (coordinates[i].length>2)
	      {
	      z = coordinates[i][2];
	      }
	    console.log("read " + x + "," + y + "," + z)
	    //TODO: ignoring higher dimensions
	    vglcoords.pushBack([x,y,z]);
	  }
	  vglpoints.setIndices(indices);

	  geom.addPrimitive(vglpoints);
	  geom.addSource(vglcoords);
	  geom.setName("manyPoints");
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readLineString = function(coordinates) {
	  var geom = new vglModule.geometryData();
	  var vglines = new vglModule.lines();
	  lines.setIndexCount(coordinates.length);

	  var vglcoords = new vglModule.sourceDataP3fv();
	  var indices = new Uint16Array(coordinates.length);

	  for (var i = 0; i < coordinates.length; i++) {
		indices[i] = i;
	    var x = coordinates[i][0];
	    var y = coordinates[i][1];
	    var z = 0.0;
	    if (coordinates[i].length>2)
	      {
	      z = coordinates[i][2];
	      }
	    //TODO: ignoring higher dimensions
	    vglcoords.pushBack([x,y,z]);
	  }

	  vgllines.setIndices(indices);

	  geom.setName("aLineString");
	  geom.addPrimitive(vgllines);
	  geom.addSource(vglcoords);
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readMultiLineString = function(coordinates) {
	  var geom = new vglModule.geometryData();
	  var vglcoords = new vglModule.sourceDataP3fv();
	  var indices = new Uint16Array();

	  var ccount = 0;
	  for (var i = 0; i < coordinates.length; i++) {
		  var vglline = new vglModule.lines();
		  var thisLineLength = coordinates[i].length;
		  lines.setIndexCount(thisLineLength);
		  for (var j = 0; j < thisLineLength; j++) {
			indices.pushBack(ccount++);
		    var x = coordinates[i][j][0];
		    var y = coordinates[i][j][1];
		    var z = 0.0;
		    if (coordinates[i][j].length>2)
		      {
		      z = coordinates[i][j][2];
		      }
		    //TODO: ignoring higher dimensions
		    vglcoords.pushBack([x,y,z]);
		  }
		  geom.addPrimitive(vglline);
	  }

	  geom.setName("aMultiLineString");
	  geom.addSource(vglcoords);
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readPolygon = function(coordinates) {
	  var geom = new vglModule.geometryData();

	  //TODO: handle concave
	  var vgltriangle = new vglModule.triangles();
	  //TODO: no gl.POLYGON
	  var thisPolyLength = coordinates[0].length;
	  vgltriangle.setIndexCount(thisPolyLength);

	  var vglcoords = new vglModule.sourceDataP3fv();

	  //TODO: ignoring holes given in coordinates[1...]
	  var indices = new Uint16Array(thisPolyLength);
	  for (var i = 0; i < thisPolyLength; i++) {
	    indices[i] = i;

	    var x = coordinates[0][i][0];
	    var y = coordinates[0][i][1];
	    var z = 0.0;
	    if (coordinates[0][i].length>2)
	      {
	      z = coordinates[0][i][2];
	      }
	    //TODO: ignoring higher dimensions
	    vglcoords.pushBack([x,y,z]);
	  }
	  vgltriangle.setIndices(indices);

	  geom.setName("POLY");
	  geom.addPrimitive(vgltriangle);
	  geom.addSource(vglcoords);
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readMultiPolygon = function(coordinates) {
	  var geom = new vglModule.geometryData();
	  var vglcoords = new vglModule.sourceDataP3fv();
	  var indices = new Uint16Array();

	  var ccount = 0;
	  var numPolys = coordinates.length;
	  for (var i = 0; i < numPolys; i++) {
		  var triangle = new vglModule.triangles();
		  var thisPolyLength = coordinates[i][0].length;
		  triangle.setIndexCount(thisPolyLength);
		  for (var j = 0; j < thisPolyLength; j++) {
			indices.pushBack(ccount++);
		    var x = coordinates[i][j][0][0];
		    var y = coordinates[i][j][0][1];
		    var z = 0.0;
		    if (coordinates[i][j][0].length>2)
		      {
		      z = coordinates[i][j][0][2];
		      }
		    //TODO: ignoring higher dimensions
		    vglcoords.pushBack([x,y,z]);
		  }
		  geom.addPrimitive(vgltriangle);
	  }

	  geom.setName("aMultiPoly");
	  geom.addSource(vglcoords);
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readGJObject = function(object) {
	//TODO: ignoring "crs" and "bbox" and misc meta data on all of these,
	//best to handle as references into original probably
    if (!object.hasOwnProperty('type')) {
	console.log("uh oh, not a geojson object");
    }
	var type = object.type;
	switch (type) {
	case "Point":
		console.log("parsed Point");
		return this.readPoint(object.coordinates);
	case "MultiPoint":
		console.log("parsed MultiPoint");
		return this.readMultiPoint(object.coordinates);
		break;
	case "LineString":
		console.log("parsed LineString");
		return this.readLineString(object.coordinates);
		break;
	case "MultiLineString":
		console.log("parsed MultiLineString");
		return this.readMultiLineString(object.coordinates);
		break;
	case "Polygon":
		console.log("parsed Polygon");
		return this.readPolygon(object.coordinates);
		break;
	case "MultiPolygon":
		console.log("parsed MultiPolygon");
		return this.readMultiPolygon(object.coordinates);
		break;
	case "GeometryCollection":
	    console.log("parsed GeometryCollection");
		var nextset = [];
		for (var i = 0; i < object.features.length; i++)
		  {
		  next = this.readGJObject(object.features[i]);
		  nextset.push(next);
		  }
	    return nextset;
		break;
	case "Feature":
		console.log("parsed Feature");
		//TODO: object.properties, object.ids
		next = this.readGJObject(object.geometry);
		return next;
	case "FeatureCollection":
	    console.log("parsed FeatureCollection");
		var nextset = [];
		for (var i = 0; i < object.features.length; i++)
		  {
		  next = this.readGJObject(object.features[i]);
		  nextset.push(next)
		  }
		return nextset;
	default:
		console.log("Don't understand type " + type);
		break;
	}
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.linearizeGeoms = function(geoms, geom) {
	if( Object.prototype.toString.call( geom ) === '[object Array]' ) {
		for (var i = 0; i < geom.length; i++)
		  {
		  this.linearizeGeoms(geoms, geom[i]);
		  }
	} else {
		console.log("appending ");
		console.log(geom);
		console.log("to");
		console.log(geoms);
		geoms.push(geom);
		console.log("results in");
		console.log(geoms);
	}
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.getPrimitives = function(buffer) {
  console.log("PARSING GEOJSON");
  if (!buffer) return [];

  var obj = JSON.parse(buffer);
  console.log("OBJ IS");
  console.log(obj);

  var geom = this.readGJObject(obj);
  console.log("GEOM IS");
  console.log(geom);

  var geoms = [];
  this.linearizeGeoms(geoms, geom);
  console.log("GEOMS ARE");
  console.log(geoms);

  return geoms;
}
