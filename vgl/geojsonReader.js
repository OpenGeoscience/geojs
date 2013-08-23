//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geojson reader
 *
 * This contains code that reads a geoJSON file and produces rendering
 * primitives from it.
 *
 * @class
 * @returns {this}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.geojsonReader = function() {
  "use strict";

  if (!(this instanceof vglModule.geojsonReader)) {
    return new vglModule.geojsonReader();
  }

  var m_scalarFormat = "none",
      m_scalarRange = null;

  /**
   * Read scalars
   *
   * @param coordinates
   * @param geom
   * @param size_estimate
   * @param idx
   */
  this.readScalars = function(coordinates, geom, size_estimate, idx) {
    if (this.m_scalarFormat == "values" && coordinates.length==4)
    {
      var s = coordinates[3];
      array = geom.sourceData(vertexAttributeKeys.Scalar);
      if (!array) {
        array = new vglModule.sourceDataSf();
        if (this.m_scalarRange)
          {
          array.setScalarRange(this.m_scalarRange[0],this.m_scalarRange[1]);
          }
        if (!(size_estimate === undefined)) {
          array.length = size_estimate
        }
        geom.addSource(array);
      }
      if (size_estimate === undefined) {
        array.pushBack(s);
      } else {
        array.insertAt(idx, s);
      }
    } else if (this.m_scalarFormat == "rgb" && coordinates.length==6) {
      array = geom.sourceData(vertexAttributeKeys.Color);
      if (!array) {
        array = new vglModule.sourceDataC3fv();
        if (!(size_estimate === undefined)) {
          array.length = size_estimate*3
        }
        geom.addSource(array);
      }
      var r = coordinates[3];
      var g = coordinates[4];
      var b = coordinates[5];
      if (size_estimate === undefined) {
        array.pushBack([r,g,b]);
      } else {
        array.insertAt(idx, [r,g,b]);
      }
    }
  }

  /**
   * Read point data
   *
   * @param coordinates
   * @returns {vglModule.geometryData}
   */
  this.readPoint = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglpoints = new vglModule.points();
    var vglcoords = new vglModule.sourceDataP3fv();
    geom.addSource(vglcoords);
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
      this.readScalars(coordinates, geom);
    }

    vglpoints.setIndices(indices);
    geom.addPrimitive(vglpoints);
    geom.setName("aPoint");
    return geom;
  };

  /**
   * Read multipoint data
   *
   * @param coordinates
   * @returns {vglModule.geometryData}
   */
  this.readMultiPoint = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglpoints = new vglModule.points();
    var vglcoords = new vglModule.sourceDataP3fv();
    var indices = new Uint16Array(coordinates.length);
    var pntcnt = 0;
    var estpntcnt = coordinates.length;

    //preallocate with size estimate
    vglcoords.data().length = estptcnt*3; //x,y,z

    for (var i = 0; i < coordinates.length; i++) {
      indices[i] = i;

      var x = coordinates[i][0];
      var y = coordinates[i][1];
      var z = 0.0;
      if (coordinates[i].length>2) {
        z = coordinates[i][2];
      }

      //console.log("read " + x + "," + y + "," + z);
      vglcoords.insertAt(pntcnt, [x,y,z]);

      //attributes
      this.readScalars(coordinates[i], geom, estpntcnt, pntcnt)

      pntcnt++;
    }

    vglpoints.setIndices(indices);
    geom.addPrimitive(vglpoints);
    geom.addSource(vglcoords);
    geom.setName("manyPoints");
    return geom;
  };

  /**
   * Read line string data
   *
   * @param coordinates
   * @returns {vglModule.geometryData}
   */
  this.readLineString = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglline = new vglModule.lineStrip();
    vglline.setIndicesPerPrimitive(coordinates.length);
    var vglcoords = new vglModule.sourceDataP3fv();
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
      this.readScalars(coordinates[i], geom)
    }

    vglline.setIndices(indices);
    geom.addPrimitive(vglline);
    geom.addSource(vglcoords);
    geom.setName("aLineString");
    return geom;
  };

  /**
   * Read multi line string
   *
   * @param coordinates
   * @returns {vglModule.geometryData}
   */
  this.readMultiLineString = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglcoords = new vglModule.sourceDataP3fv();
    var pntcnt = 0;
    var estpntcnt = coordinates.length*2; //lines should be at least 2 verts long, underest OK

    //preallocate with size estimate
    vglcoords.data().length = estpntcnt*3; //x,y,z

    for (var j = 0; j < coordinates.length; j++) {
      var indices = [];
      //console.log("getting line " + j);
      var vglline = new vglModule.lineStrip();
      var thisLineLength = coordinates[j].length;
      vglline.setIndicesPerPrimitive(thisLineLength);
      for (var i = 0; i < thisLineLength; i++) {
        indices.push(pntcnt);
        var x = coordinates[j][i][0];
        var y = coordinates[j][i][1];
        var z = 0.0;
        if (coordinates[j][i].length>2) {
          z = coordinates[j][i][2];
        }

        //console.log("read " + x + "," + y + "," + z);
        vglcoords.insertAt(pntcnt, [x,y,z]);

        //attributes
        this.readScalars(coordinates[j][i], geom, estpntcnt*2, pntcnt)

        pntcnt++;
      }

      vglline.setIndices(indices);
      geom.addPrimitive(vglline);
    }

    geom.setName("aMultiLineString");
    geom.addSource(vglcoords);
    return geom;
  };

  /**
   * Read polygon data
   *
   * @param coordinates
   * @returns {vglModule.geometryData}
   */
  this.readPolygon = function(coordinates) {
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
      if (coordinates[0][i].length>2) {
        z = coordinates[0][i][2];
      }

      //console.log("read " + x + "," + y + "," + z);
      vglcoords.pushBack([x,y,z]);

      //attributes
      this.readScalars(coordinates[0][i], geom)

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
  };

  /**
   * Read multi polygon data
   *
   * @param coordinates
   * @returns {vglModule.geometryData}
   */
  this.readMultiPolygon = function(coordinates) {
    var geom = new vglModule.geometryData();
    var vglcoords = new vglModule.sourceDataP3fv();
    var ccount = 0;
    var numPolys = coordinates.length;
    var pntcnt = 0;
    var estpntcnt = numPolys*3;// assume triangles, underest is fine

    //var time1 = new Date().getTime()
    //var a = 0;
    //var b = 0;
    //var c = 0;
    //var d = 0;

    //preallocate with size estimate
    vglcoords.data().length = numPolys*3; //x,y,z

    var vgltriangle = new vglModule.triangles();
    var indexes = []

    for (var j = 0; j < numPolys; j++) {
      //console.log("getting poly " + j);

      var thisPolyLength = coordinates[j][0].length;
      var vf = ccount;
      var vl = ccount+1;
      var flip = [false,false,false];
      for (var i = 0; i < thisPolyLength; i++) {
        //var timea = new Date().getTime()

        var x = coordinates[j][0][i][0];
        var y = coordinates[j][0][i][1];
        var z = 0.0;
        if (coordinates[j][0][i].length>2) {
          z = coordinates[j][0][i][2];
        }
        var flipped = false;
        if (x > 180) {
          flipped = true
          x = x - 360
        }
        if (i == 0) {
          flip[0] = flipped
        } else {
          flip[1+(i-1)%2] = flipped
        }
        //var timeb = new Date().getTime();
        //console.log("read " + x + "," + y + "," + z);

        vglcoords.insertAt(pntcnt, [x,y,z]);
        //var timec = new Date().getTime();

        //attributes
        this.readScalars(coordinates[j][0][i], geom, estpntcnt, pntcnt)
        pntcnt++;
        //var timed = new Date().getTime()

        if (i > 1) {
          //console.log("Cutting new triangle "+ vf + "," + vl + "," + ccount);
          if (flip[0] == flip[1] && flip[1] == flip[2]) {
            indexes = indexes.concat([vf,vl,ccount])
          } else {
            //TODO: duplicate triangles that straddle boundary on either side
          }
          vl = ccount;
        }
        ccount++;
        //var timee = new Date().getTime()
        //a = a + (timeb-timea)
        //b = b + (timec-timeb)
        //c = c + (timed-timec)
        //d = d + (timee-timed)
      }
    }
    vgltriangle.setIndices(indexes);
    geom.addPrimitive(vgltriangle);

    //console.log("NUMPOLYS " + pntcnt);
    //console.log("RMP: ", a, ",", b, ",", c, ",", d)
    //var time2 = new Date().getTime()

    geom.setName("aMultiPoly");
    geom.addSource(vglcoords);
    //var time3 = new Date().getTime()
    //console.log("RMP: ", time2-time1, ",", time3-time2)

    return geom;
  };

  /**
   * @param object
   * @returns {*}
   */
  this.readGJObjectInt = function(object) {
    if (!object.hasOwnProperty('type')) {
      //console.log("uh oh, not a geojson object");
    }

    //look for properties type annotation
    if (object.properties &&
        object.properties.ScalarFormat &&
        object.properties.ScalarFormat == "values") {
      this.m_scalarFormat = "values"
      if (object.properties.ScalarRange) {
        this.m_scalarRange = object.properties.ScalarRange
      }
    }
    if (object.properties &&
        object.properties.ScalarFormat &&
        object.properties.ScalarFormat == "rgb") {
      this.m_scalarFormat = "rgb";
    }

    var ret;
    //TODO: ignoring "crs" and "bbox" and misc meta data on all of these,
    //best to handle as references into original probably
    var type = object.type;
    switch (type) {
      case "Point":
        //console.log("parsed Point");
        ret = this.readPoint(object.coordinates);
        break;
      case "MultiPoint":
        //console.log("parsed MultiPoint");
        ret = this.readMultiPoint(object.coordinates);
        break;
      case "LineString":
        //console.log("parsed LineString");
        ret = this.readLineString(object.coordinates);
        break;
      case "MultiLineString":
        //console.log("parsed MultiLineString");
        ret = this.readMultiLineString(object.coordinates);
        break;
      case "Polygon":
        //console.log("parsed Polygon");
        ret = this.readPolygon(object.coordinates);
        break;
      case "MultiPolygon":
        //console.log("parsed MultiPolygon");
        ret = this.readMultiPolygon(object.coordinates);
        break;
      case "GeometryCollection":
        //console.log("parsed GeometryCollection");
        var nextset = [];
        for (var i = 0; i < object.geometries.length; i++) {
          next = this.readGJObject(object.geometries[i]);
          nextset.push(next);
        }
        ret = nextset;
        break;
      case "Feature":
        //console.log("parsed Feature");
        next = this.readGJObject(object.geometry);
        ret = next;
        break;
      case "FeatureCollection":
        //console.log("parsed FeatureCollection");
        var nextset = [];
        for (var i = 0; i < object.features.length; i++) {
          next = this.readGJObject(object.features[i]);
          nextset.push(next)
        }
        ret = nextset;
        break;
      default:
        console.log("Don't understand type " + type);
        ret = null;
      break;
    }
    return ret;
  }

  /**
   * @param object
   * @returns {*}
   */
  this.readGJObject = function(object) {
    //var time1, time2;
    var ret;
    //time1 = new Date().getTime()
    ret = this.readGJObjectInt(object)
    //time2 = new Date().getTime()
    //console.log("ELAPSED: ", time2-time1)
    return ret;
  };

  /**
   * Linearize geometries
   *
   * @param geoms
   * @param geom
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
 };

  /**
   * Read geometries from geojson object
   *
   * @param object
   * @returns {Array}
   */
 this.readGeomObject = function(object) {
    var geom;
    var geoms = [];
    geom = this.readGJObject(object);
    this.linearizeGeoms(geoms, geom);
    return geoms;
 }

  /**
   * Given a buffer get rendering primitives
   *
   * @param buffer
   * @returns {*}
   */
  this.getPrimitives = function(buffer) {
    //console.log("Parsing geoJSON");
    if (!buffer) return [];

    this.m_scalarFormat = "none";
    this.m_scalarRange = null;

    var obj = JSON.parse(buffer);
    var geom = this.readGJObject(obj);
    var geoms = [];
    this.linearizeGeoms(geoms, geom);

    return {"geoms":geoms,
            "scalarFormat":this.m_scalarFormat,
            "scalarRange":this.m_scalarRange};
  };

  return this;
};
