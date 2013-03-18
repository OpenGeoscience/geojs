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
	    console.log("read " + x + "," + y + "," + z);
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
	    console.log("read " + x + "," + y + "," + z);
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
	  var vglline = new vglModule.lines();
	  vglline.setIndexCount(coordinates.length);

	  var vglcoords = new vglModule.sourceDataP3fv();
	  var indices = [];

	  for (var i = 0; i < coordinates.length; i++) {
		indices.push(i);
	    var x = coordinates[i][0];
	    var y = coordinates[i][1];
	    var z = 0.0;
	    if (coordinates[i].length>2)
	      {
	      z = coordinates[i][2];
	      }
	    console.log("read " + x + "," + y + "," + z);
	    //TODO: ignoring higher dimensions
	    vglcoords.pushBack([x,y,z]);
	  }
	  vglline.setIndices(indices);

	  geom.setName("aLineString");
	  geom.addPrimitive(vglline);
	  geom.addSource(vglcoords);
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readMultiLineString = function(coordinates) {
	  var geom = new vglModule.geometryData();
	  var vglcoords = new vglModule.sourceDataP3fv();
	  var ccount = 0;
	  for (var i = 0; i < coordinates.length; i++) {
		  var indices = [];
		  console.log("getting line " + i);
		  var vglline = new vglModule.lines();
		  var thisLineLength = coordinates[i].length;
		  vglline.setIndexCount(thisLineLength);
		  for (var j = 0; j < thisLineLength; j++) {
			indices.push(ccount++);
		    var x = coordinates[i][j][0];
		    var y = coordinates[i][j][1];
		    var z = 0.0;
		    if (coordinates[i][j].length>2)
		      {
		      z = coordinates[i][j][2];
		      }
		    console.log("read " + x + "," + y + "," + z);
		    //TODO: ignoring higher dimensions
		    vglcoords.pushBack([x,y,z]);
		  }
		  vglline.setIndices(indices);
		  geom.addPrimitive(vglline);
	  }

	  geom.setName("aMultiLineString");
	  geom.addSource(vglcoords);
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readPolygon = function(coordinates) {
	  //TODO: ignoring holes given in coordinates[1...]
	  //TODO: ignoring convex
	  //TODO: implement ear clipping in VGL instead of this to handle both
	  var geom = new vglModule.geometryData();
	  var vglcoords = new vglModule.sourceDataP3fv();

	  var thisPolyLength = coordinates[0].length;
      var vl = 1;
	  for (var i = 0; i < thisPolyLength; i++) {
		 var x = coordinates[0][i][0];
		 var y = coordinates[0][i][1];
		 var z = 0.0;
		 if (coordinates[0][i].length>2)
		   {
		   z = coordinates[0][i][2];
		   }
         console.log("read " + x + "," + y + "," + z);
		 //TODO: ignoring higher dimensions
		 vglcoords.pushBack([x,y,z]);
	     if (i > 1)
           {
	       console.log("Cutting new triangle 0,"+ vl+ ","+ i);
	       var indices = new Uint16Array([0,vl,i]);
		   var vgltriangle = new vglModule.triangles();
           vgltriangle.setIndices(indices);
		   geom.addPrimitive(vgltriangle);
		   vl = i;
		   }
	  }

	  geom.setName("POLY");
	  geom.addSource(vglcoords);
	  return geom;
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.readMultiPolygon = function(coordinates) {
	  var geom = new vglModule.geometryData();
	  var vglcoords = new vglModule.sourceDataP3fv();

	  var ccount = 0;
	  var numPolys = coordinates.length;
	  console.log("NUMPOLYS " + numPolys);
	  for (var j = 0; j < numPolys; j++) {
		  console.log("getting poly " + j);

		  var thisPolyLength = coordinates[j][0].length;
	      var vf = ccount;
	      var vl = ccount+1;
		  for (var i = 0; i < thisPolyLength; i++) {
			 var x = coordinates[j][0][i][0];
			 var y = coordinates[j][0][i][1];
			 var z = 0.0;
			 if (coordinates[j][0][i].length>2)
			   {
			   z = coordinates[j][0][i][2];
			   }
	         console.log("read " + x + "," + y + "," + z);
			 //TODO: ignoring higher dimensions
			 vglcoords.pushBack([x,y,z]);
		     if (i > 1)
	           {
		       console.log("Cutting new triangle "+ vf + "," + vl + "," + ccount);
		       var indices = new Uint16Array([vf,vl,ccount]);
			   var vgltriangle = new vglModule.triangles();
               vgltriangle.setIndices(indices);
			   geom.addPrimitive(vgltriangle);
			   vl = ccount;
			   }
			 ccount++;
		  }
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
		for (var i = 0; i < object.geometries.length; i++)
		  {
		  next = this.readGJObject(object.geometries[i]);
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
		geoms.push(geom);
	}
}

//--------------------------------------------------------------------------
vglModule.geoJSONUnpack.prototype.getPrimitives = function(buffer) {
  console.log("PARSING GEOJSON");
  if (!buffer) return [];

  var obj = JSON.parse(buffer);

  var geom = this.readGJObject(obj);

  var geoms = [];
  this.linearizeGeoms(geoms, geom);

  return geoms;
}
