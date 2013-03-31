/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of geojson reader
 *
 * This contains code that reads a geoJSON file and produces rendering
 * primitives from it.
 *
 * @class
 * @returns {this}
 */
vglModule.geojsonReader = function() {
  if (!(this instanceof vglModule.geojsonReader)) {
    return new vglModule.geojsonReader();
  }

  /**
   *
   */
  this.readPoint = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglpoints = new vglModule.points();
    var vglcoords = new vglModule.sourceDataP3fv();
    geom.addSource(vglcoords);
    var colorarray;
    var indices = new Uint16Array(1);

    for (var i = 0; i < 1; i++) {
      indices[i] = i;

      var x = coordinates[0];
      var y = coordinates[1];
      var z = 0.0;
      if (coordinates.length>2) {
        z = coordinates[2];
      }

      //console.log("read " + x + "," + y + "," + z);
      vglcoords.pushBack([x,y,z]);

     //attributes
     //TODO: Learn and follow a convention for this.
      if (coordinates.length==6) {
        var r = coordinates[3];
        var g = coordinates[4];
        var b = coordinates[5];
        //console.log("readc " + r + "," + g + "," + b);
        //if (i == 0)
        //{
        colorarray = new vglModule.sourceDataC3fv();
        geom.addSource(colorarray);
        //}
        colorarray.pushBack([r,g,b]);
      }
    }

    vglpoints.setIndices(indices);
    geom.addPrimitive(vglpoints);
    geom.setName("aPoint");
    return geom;
  }

  /**
   *
   */
  this.readMultiPoint = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglpoints = new vglModule.points();
    var vglcoords = new vglModule.sourceDataP3fv();
    var colorarray;
    var indices = new Uint16Array(coordinates.length);

    for (var i = 0; i < coordinates.length; i++) {
      indices[i] = i;

      var x = coordinates[i][0];
      var y = coordinates[i][1];
      var z = 0.0;
      if (coordinates[i].length>2) {
        z = coordinates[i][2];
      }

      //console.log("read " + x + "," + y + "," + z);
      vglcoords.pushBack([x,y,z]);

      //attributes
      //TODO: Learn and follow a convention for this.
      if (coordinates[i].length==6) {
        var r = coordinates[i][3];
        var g = coordinates[i][4];
        var b = coordinates[i][5];
        if (i == 0) {
          colorarray = new vglModule.sourceDataC3fv();
          geom.addSource(colorarray);
        }
        colorarray.pushBack([r,g,b]);
      }
    }

    vglpoints.setIndices(indices);
    geom.addPrimitive(vglpoints);
    geom.addSource(vglcoords);
    geom.setName("manyPoints");
    return geom;
  }

  /**
   *
   */
  this.readLineString = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglline = new vglModule.lines();
    vglline.setIndexCount(coordinates.length);
    var vglcoords = new vglModule.sourceDataP3fv();
    var colorarray;
    var indices = [];

    for (var i = 0; i < coordinates.length; i++) {
      indices.push(i);
      var x = coordinates[i][0];
      var y = coordinates[i][1];
      var z = 0.0;
      if (coordinates[i].length>2) {
        z = coordinates[i][2];
      }

      //console.log("read " + x + "," + y + "," + z);
      vglcoords.pushBack([x,y,z]);

      //attributes
      //TODO: Learn and follow a convention for this.
      if (coordinates[i].length==6) {
        var r = coordinates[i][3];
        var g = coordinates[i][4];
        var b = coordinates[i][5];
        if (i == 0) {
          colorarray = new vglModule.sourceDataC3fv();
          geom.addSource(colorarray);
        }
        colorarray.pushBack([r,g,b]);
      }
    }

    vglline.setIndices(indices);

    geom.setName("aLineString");
    geom.addPrimitive(vglline);
    geom.addSource(vglcoords);
    return geom;
  }

  /**
   *
   */
  this.readMultiLineString = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglcoords = new vglModule.sourceDataP3fv();
    var colorarray;
    var ccount = 0;
    for (var j = 0; j < coordinates.length; j++) {
      var indices = [];
      //console.log("getting line " + j);
      var vglline = new vglModule.lines();
      var thisLineLength = coordinates[j].length;
      vglline.setIndexCount(thisLineLength);
      for (var i = 0; i < thisLineLength; i++) {
        indices.push(ccount++);
        var x = coordinates[j][i][0];
        var y = coordinates[j][i][1];
        var z = 0.0;
        if (coordinates[j][i].length>2) {
          z = coordinates[j][i][2];
        }

        //console.log("read " + x + "," + y + "," + z);
        vglcoords.pushBack([x,y,z]);

        //attributes
        //TODO: Learn and follow a convention for this.
        if (coordinates[j][i].length==6) {
          var r = coordinates[j][i][3];
          var g = coordinates[j][i][4];
          var b = coordinates[j][i][5];
          if (j == 0 && i == 0) {
            colorarray = new vglModule.sourceDataC3fv();
            geom.addSource(colorarray);
          }
          //console.log("readc " + r + "," + g + "," + b);
          colorarray.pushBack([r,g,b]);
        }
      }

      vglline.setIndices(indices);
      geom.addPrimitive(vglline);
    }

    geom.setName("aMultiLineString");
    geom.addSource(vglcoords);
    return geom;
  }

  /**
   *
   */
  this.readPolygon = function(coordinates) {
    //TODO: ignoring holes given in coordinates[1...]
    //TODO: ignoring convex
    //TODO: implement ear clipping in VGL instead of this to handle both
    var geom = new vglModule.geometryData();
    var vglcoords = new vglModule.sourceDataP3fv();
    var colorarray;

    var thisPolyLength = coordinates[0].length;
    var vl = 1;
    for (var i = 0; i < thisPolyLength; i++) {
      var x = coordinates[0][i][0];
      var y = coordinates[0][i][1];
      var z = 0.0;
      if (coordinates[0][i].length>2) {
        z = coordinates[0][i][2];
      }

      //console.log("read " + x + "," + y + "," + z);
      vglcoords.pushBack([x,y,z]);

      //attributes
      //TODO: Learn and follow a convention for this.
      if (coordinates[0][i].length==6) {
        var r = coordinates[0][i][3];
        var g = coordinates[0][i][4];
        var b = coordinates[0][i][5];
        if (i == 0) {
          colorarray = new vglModule.sourceDataC3fv();
          geom.addSource(colorarray);
        }
        colorarray.pushBack([r,g,b]);
      }

      if (i > 1) {
        //console.log("Cutting new triangle 0,"+ vl+ ","+ i);
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

  /**
   *
   */
  this.readMultiPolygon = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglcoords = new vglModule.sourceDataP3fv();
    var colorarray;

    var ccount = 0;
    var numPolys = coordinates.length;
    //console.log("NUMPOLYS " + numPolys);
    for (var j = 0; j < numPolys; j++) {
      //console.log("getting poly " + j);

      var thisPolyLength = coordinates[j][0].length;
      var vf = ccount;
      var vl = ccount+1;
      for (var i = 0; i < thisPolyLength; i++) {
        var x = coordinates[j][0][i][0];
        var y = coordinates[j][0][i][1];
        var z = 0.0;
        if (coordinates[j][0][i].length>2) {
          z = coordinates[j][0][i][2];
        }

        //console.log("read " + x + "," + y + "," + z);
        vglcoords.pushBack([x,y,z]);

        //attributes
        //TODO: Learn and follow a convention for this.
        if (coordinates[j][0][i].length==6) {
          var r = coordinates[j][0][i][3];
          var g = coordinates[j][0][i][4];
          var b = coordinates[j][0][i][5];
          if (j == 0 && i == 0) {
            colorarray = new vglModule.sourceDataC3fv();
            geom.addSource(colorarray);
          }
          colorarray.pushBack([r,g,b]);
        }

        if (i > 1) {
          //console.log("Cutting new triangle "+ vf + "," + vl + "," + ccount);
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

  /**
   *
   */
  this.readGJObject = function(object) {
    //TODO: ignoring "crs" and "bbox" and misc meta data on all of these,
    //best to handle as references into original probably
    if (!object.hasOwnProperty('type')) {
      //console.log("uh oh, not a geojson object");
    }
    var type = object.type;
    switch (type) {
      case "Point":
        //console.log("parsed Point");
        return this.readPoint(object.coordinates);
      case "MultiPoint":
        //console.log("parsed MultiPoint");
        return this.readMultiPoint(object.coordinates);
        break;
      case "LineString":
        //console.log("parsed LineString");
        return this.readLineString(object.coordinates);
        break;
      case "MultiLineString":
        //console.log("parsed MultiLineString");
        return this.readMultiLineString(object.coordinates);
        break;
      case "Polygon":
        //console.log("parsed Polygon");
        return this.readPolygon(object.coordinates);
        break;
      case "MultiPolygon":
        //console.log("parsed MultiPolygon");
        return this.readMultiPolygon(object.coordinates);
        break;
      case "GeometryCollection":
        //console.log("parsed GeometryCollection");
        var nextset = [];
        for (var i = 0; i < object.geometries.length; i++) {
          next = this.readGJObject(object.geometries[i]);
          nextset.push(next);
        }
        console.log(nextset);
        return nextset;
        break;
      case "Feature":
        //console.log("parsed Feature");
        //TODO: object.properties, object.ids
        next = this.readGJObject(object.geometry);
        return next;
      case "FeatureCollection":
        //console.log("parsed FeatureCollection");
        var nextset = [];
        for (var i = 0; i < object.features.length; i++) {
          next = this.readGJObject(object.features[i]);
          nextset.push(next)
        }
        return nextset;
      default:
        console.log("Don't understand type " + type);
      break;
    }
  }

  /**
   *
   */
  this.linearizeGeoms = function(geoms, geom) {
    if( Object.prototype.toString.call( geom ) === '[object Array]' ) {
      for (var i = 0; i < geom.length; i++) {
        this.linearizeGeoms(geoms, geom[i]);
      }
    }
    else {
     geoms.push(geom);
   }
 }

  /**
   *
   */
  this.getPrimitives = function(buffer) {
    //console.log("PARSING GEOJSON");
    if (!buffer) return [];

    var obj = JSON.parse(buffer);
    var geom = this.readGJObject(obj);
    var geoms = [];
    this.linearizeGeoms(geoms, geom);
    return geoms;
  }

  return this;
}
