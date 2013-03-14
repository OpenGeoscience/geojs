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
// vbgModule.vtkUnpack class
// This contains code that unpack a json base64 encoded vtkdataset,
// such as those produced by ParaView's webGL exporter (where much
// of the code originated from) and convert it to VGL representation.
//
//////////////////////////////////////////////////////////////////////////////

vglModule.vtkUnpack = function() {
  this.reverseBase64Chars = [];
  for (var i=0; i < this.base64Chars.length; i++) {
    this.reverseBase64Chars[this.base64Chars[i]] = i;
  };
}

vglModule.vtkUnpack.prototype.base64Chars =
  ['A','B','C','D','E','F','G','H','I','J','K','L','M',
   'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
   'a','b','c','d','e','f','g','h','i','j','k','l','m',
   'n','o','p','q','r','s','t','u','v','w','x','y','z',
   '0','1','2','3','4','5','6','7','8','9','+','/'];

vglModule.vtkUnpack.prototype.END_OF_INPUT = -1;

vglModule.vtkUnpack.prototype.base64Str = "";

vglModule.vtkUnpack.prototype.base64Count = 0;

vglModule.vtkUnpack.prototype.pos = 0;

//--------------------------------------------------------------------------
vglModule.vtkUnpack.prototype.ntos = function (n) {
  n=n.toString(16);
  if (n.length == 1) n='0'+n;
  n='%'+n;
  return unescape(n);
}

//--------------------------------------------------------------------------
vglModule.vtkUnpack.prototype.readReverseBase64 = function () {
  if (!this.base64Str) return this.END_OF_INPUT;
    while (true) {
      if (this.base64Count >= this.base64Str.length) return this.END_OF_INPUT;
      var nextCharacter = this.base64Str.charAt(this.base64Count);
      this.base64Count++;
      //console.log("C=" + this.base64Count + " " + this.reverseBase64Chars);
      if (this.reverseBase64Chars[nextCharacter]) {
        return this.reverseBase64Chars[nextCharacter];
      }
      if (nextCharacter == 'A') return 0;
    }
    return this.END_OF_INPUT;
  }

//--------------------------------------------------------------------------
vglModule.vtkUnpack.prototype.decode64 = function(str) {
  this.base64Str = str;
  this.base64Count = 0;

  var result = '';
  var inBuffer = new Array(4);
  var done = false;
  while (!done &&
          (inBuffer[0] = this.readReverseBase64()) != this.END_OF_INPUT &&
          (inBuffer[1] = this.readReverseBase64()) != this.END_OF_INPUT) {
    inBuffer[2] = this.readReverseBase64();
    inBuffer[3] = this.readReverseBase64();
    result += this.ntos((((inBuffer[0] << 2) & 0xff)| inBuffer[1] >> 4));
    if (inBuffer[2] != this.END_OF_INPUT) {
      result +=  this.ntos((((inBuffer[1] << 4) & 0xff)| inBuffer[2] >> 2));
      if (inBuffer[3] != this.END_OF_INPUT) {
        result +=  this.ntos((((inBuffer[2] << 6)  & 0xff) | inBuffer[3]));
      } else {
        done = true;
      }
    } else {
      done = true;
    }
  }
  return result;
}

//--------------------------------------------------------------------------
vglModule.vtkUnpack.prototype.readNumber = function (ss) {
	var v = ((ss[this.pos++]) +
			(ss[this.pos++] << 8) +
			(ss[this.pos++] << 16) +
			(ss[this.pos++] << 24));
	return v;
}

//--------------------------------------------------------------------------
vglModule.vtkUnpack.prototype.readF3Array =
	function (numberOfPoints, ss) {

  var i;
  var test = new Int8Array(numberOfPoints*4*3);

  for(i=0; i<numberOfPoints*4*3; i++)
    test[i] = ss[this.pos++];

  var points = new Float32Array(test.buffer);
  return points;
}

//--------------------------------------------------------------------------
vglModule.vtkUnpack.prototype.readColorArray =
	function (numberOfPoints, ss, vglcolors) {

  var i, r,g,b;
  for(i=0; i<numberOfPoints; i++)
    {
    r = ss[this.pos++]/255.0;
    g = ss[this.pos++]/255.0;
    b = ss[this.pos++]/255.0;
    this.pos++;
    vglcolors.pushBack([r,g,b]);
  }
}

//--------------------------------------------------------------------------
vglModule.vtkUnpack.prototype.parseObject = function(buffer) {
  var ss = [];
  var test;
  var i;
  var size, type;
  var numberOfPoints, numberOfIndex;
  var points, normals, colors, index, tcoord;

  //create the VGL data structure that we populate
  var geom = new vglModule.geometryData();
  geom.setName("World");

  //dehexlify
  var data = this.decode64(buffer);
  for(i=0; i<data.length; i++) ss[i] = data.charCodeAt(i) & 0xff;

  this.pos = 0;
  size = this.readNumber(ss);
  type = String.fromCharCode(ss[this.pos++]);

  //-=-=-=-=-=[ LINES ]=-=-=-=-=-
  if (type == 'L'){
    numberOfPoints = this.readNumber(ss);
    console.log("LINES " + numberOfPoints)

    //Getting Points
    var vglpoints = new vglModule.sourceDataP3fv();
    points = this.readF3Array(numberOfPoints, ss);
    for(i=0; i<numberOfPoints; i++) {
        vglpoints.pushBack([points[i*3+0], points[i*3+1], points[i*3+2]]);
    }
	geom.addSource(vglpoints);

    //Getting Colors
    var vglcolors = new vglModule.sourceDataC3fv();
    this.readColorArray(numberOfPoints, ss, vglcolors);
    geom.addSource(vglcolors);

    //Getting connectivity
	var vgllines = new vglModule.lines();
	geom.addPrimitive(vgllines);
	numberOfIndex = this.readNumber(ss);
    test = new Int8Array(numberOfIndex*2);
    for(i=0; i<numberOfIndex*2; i++)
      test[i] = ss[this.pos++];
    index = new Uint16Array(test.buffer);
    vgllines.setIndices(index);

    /*
    //Getting Matrix
    //TODO: renderer is not doing anything with this yet
    test = new Int8Array(16*4);
    for(i=0; i<16*4; i++)
      test[i] = ss[this.pos++];
    matrix = new Float32Array(test.buffer);
    */
  }

  //-=-=-=-=-=[ MESH ]=-=-=-=-=-
  else if (type == 'M'){

    numberOfPoints = this.readNumber(ss);
    //console.log("MESH " + numberOfPoints)

    //Getting Points
    var vglpoints = new vglModule.sourceDataP3N3f();
    points = this.readF3Array(numberOfPoints, ss);

    //Getting Normals
    normals = this.readF3Array(numberOfPoints, ss);

    for(i=0; i<numberOfPoints; i++) {
      var v1 = new vglModule.vertexDataP3N3f();
      v1.m_position = new Array(points[i*3+0], points[i*3+1], points[i*3+2]);
      v1.m_normal = new Array(normals[i*3+0], normals[i*3+1], normals[i*3+2]);
      vglpoints.pushBack(v1);
    }
	geom.addSource(vglpoints);

    //Getting Colors
    var vglcolors = new vglModule.sourceDataC3fv();
    this.readColorArray(numberOfPoints, ss, vglcolors);
    geom.addSource(vglcolors);

	//Getting connectivity
    test = [];
	var vgltriangles = new vglModule.triangles();
	geom.addPrimitive(vgltriangles);
	numberOfIndex = this.readNumber(ss);
	test = new Int8Array(numberOfIndex*2);
    for(i=0; i<numberOfIndex*2; i++)
      test[i] = ss[this.pos++];
    index = new Uint16Array(test.buffer);
    vgltriangles.setIndices(index);

    /*
    //Getting Matrix
    //TODO: renderer is not doing anything with this yet
    test = new Int8Array(16*4);
    for(i=0; i<16*4; i++)
      test[i] = ss[this.pos++];
    matrix = new Float32Array(test.buffer);

    //Getting TCoord
    //TODO: renderer is not doing anything with this yet
    tcoord = null;
    */
  }

  // Points
  else if (type == 'P'){
    numberOfPoints = this.readNumber(ss);
    //console.log("POINTS " + numberOfPoints);

    //Getting Points and creating 1:1 connectivity
    var vglpoints = new vglModule.sourceDataP3fv();
    points = this.readF3Array(numberOfPoints, ss);
    var indices = new Uint16Array(numberOfPoints);
    for (i = 0; i < numberOfPoints; i++) {
      indices[i] = i;
      vglpoints.pushBack([points[i*3+0],points[i*3+1],points[i*3+2]]);
    }
    geom.addSource(vglpoints);

    //Getting Colors
    var vglcolors = new vglModule.sourceDataC3fv();
    this.readColorArray(numberOfPoints, ss, vglcolors);
    geom.addSource(vglcolors);

    //Getting connectivity
    var vglVertexes = new vglModule.points();
    vglVertexes.setIndices(indices);
	geom.addPrimitive(vglVertexes);

    /*
    //Getting Matrix
    //TODO: not used yet
    test = new Int8Array(16*4);
    for(i=0; i<16*4; i++)
      test[i] = ss[this.pos++];
    matrix = new Float32Array(test.buffer);
    */
  }

  // Unknown
  else {
	  console.log("Ignoring unrecognized encoded data type " + type)
  }

  return geom;
}
