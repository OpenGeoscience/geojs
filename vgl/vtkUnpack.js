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
// vtkVTKUnpack class
// This contains code that unpack a json base64 encoded vtkdataset,
// such as those produce by ParaView's webGL exporter (where much
// of the code originated from).
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
vglModule.vtkUnpack.prototype.parseObject = function(buffer) {
  console.log("PARSING OBJECT")
  obj = {};
  obj.coded = buffer;
  obj.data = this.decode64(obj.coded);

  var geom = new vglModule.geometryData();
  geom.setName("World");

  var points = new vglModule.sourceDataP3N3f();
  var triangles = new vglModule.triangles();

  geom.addSource(points);
  geom.addPrimitive(triangles);

  var ss = []; pos = 0;
  for(i=0; i<obj.data.length; i++) ss[i] = obj.data.charCodeAt(i) & 0xff;

  size = (ss[pos++]) + (ss[pos++] << 8) + (ss[pos++] << 16) + (ss[pos++] << 24);
  type = String.fromCharCode(ss[pos++]);
  obj.type = type;
  obj.father = this;

  if (type == 'L'){
    console.log("THIS IS UNTESTED")

    obj.numberOfPoints = (ss[pos++]) + (ss[pos++] << 8) + (ss[pos++] << 16) + (ss[pos++] << 24);
    //Getting Points
    test = new Int8Array(obj.numberOfPoints*4*3);
    for(i=0; i<obj.numberOfPoints*4*3; i++)
      test[i] = ss[pos++];
    obj.points = new Float32Array(test.buffer);
    //Generating Normals
    test = new Array(obj.numberOfPoints*3);
    for(i=0; i<obj.numberOfPoints*3; i++)
      test[i] = 0.0;
    obj.normals = new Float32Array(test);
    //Getting Colors
    test = [];
    for(i=0; i<obj.numberOfPoints*4; i++)
      test[i] = ss[pos++]/255.0;
    obj.colors = new Float32Array(test);

    obj.numberOfIndex = (ss[pos++]) + (ss[pos++] << 8) + (ss[pos++] << 16) + (ss[pos++] << 24);
    console.log("Lines " + obj.numberOfIndex)

    //Getting Index
    test = new Int8Array(obj.numberOfIndex*2);
    for(i=0; i<obj.numberOfIndex*2; i++)
      test[i] = ss[pos++];
    obj.index = new Uint16Array(test.buffer);
    //Getting Matrix
    test = new Int8Array(16*4);
    for(i=0; i<16*4; i++)
      test[i] = ss[pos++];
    obj.matrix = new Float32Array(test.buffer);
  }

  //-=-=-=-=-=[ MESH ]=-=-=-=-=-
  else if (type == 'M'){
    obj.numberOfVertices = (ss[pos++]) + (ss[pos++] << 8) + (ss[pos++] << 16) + (ss[pos++] << 24);
    console.log("Surface " + obj.numberOfVertices)

    //Getting Vertices
    test = new Int8Array(obj.numberOfVertices*4*3);
    for(i=0; i<obj.numberOfVertices*4*3; i++)
      test[i] = ss[pos++];
    obj.vertices = new Float32Array(test.buffer);

    //Getting Normals
    test = new Int8Array(obj.numberOfVertices*4*3);
    for(i=0; i<obj.numberOfVertices*4*3; i++)
      test[i] = ss[pos++];
    obj.normals = new Float32Array(test.buffer);

    for(i=0; i<obj.numberOfVertices; i++) {
      var v1 = new vglModule.vertexDataP3N3f();
      v1.m_position = new Array(obj.vertices[i*3+0], obj.vertices[i*3+1], obj.vertices[i*3+2]);
      v1.m_normal = new Array(obj.normals[i*3+0], obj.normals[i*3+1], obj.normals[i*3+2]);
      //if (i<10) console.log(v1.m_position + " " + v1.m_normal);
      //v1.m_texCoordinate = new Array(obj.normals[i*3+0], obj.normals[i*3+1], obj.normals[i*3+2]);
      points.pushBack(v1);
    }

    //TODO: renderer is not doing anything with this yet
    //Getting Colors
    test = [];
    for(i=0; i<obj.numberOfVertices*4; i++)
      test[i] = ss[pos++]/255.0;
    obj.colors = new Float32Array(test);

    //TODO: renderer is not doing anything with this yet
    obj.numberOfIndex = (ss[pos++]) + (ss[pos++] << 8) + (ss[pos++] << 16) + (ss[pos++] << 24);
    //Getting Index
    test = new Int8Array(obj.numberOfIndex*2);
    for(i=0; i<obj.numberOfIndex*2; i++)
      test[i] = ss[pos++];
    obj.index = new Uint16Array(test.buffer);
    triangles.setIndices(obj.index);

    //TODO: renderer is not doing anything with this yet
    //Getting Matrix
    test = new Int8Array(16*4);
    for(i=0; i<16*4; i++)
      test[i] = ss[pos++];
    obj.matrix = new Float32Array(test.buffer);

    //TODO: renderer is not doing anything with this yet
    //Getting TCoord
    obj.tcoord = null;
  }

  // ColorMap Widget
  else if (type == 'C'){
    console.log("THIS IS UNTESTED")

    obj.numOfColors = size;
    console.log("colormap " + obj.numOfColors)

    //Getting Position
    test = new Int8Array(2*4);
    for(i=0; i<2*4; i++)
      test[i] = ss[pos++];
    obj.position = new Float32Array(test.buffer);

    //Getting Size
    test = new Int8Array(2*4);
    for(i=0; i<2*4; i++)
      test[i] = ss[pos++];
    obj.size = new Float32Array(test.buffer);

    //Getting Colors
    obj.colors = [];
    for(c=0; c<obj.numOfColors; c++){
      test = new Int8Array(4);
      for(i=0; i<4; i++)
        test[i] = ss[pos++];
      v = new Float32Array(test.buffer);
      xrgb = [v[0], ss[pos++], ss[pos++], ss[pos++]];
      obj.colors[c] = xrgb;
    }

    obj.orientation = ss[pos++];
    obj.numOfLabels = ss[pos++];
    tt = "";
    for(jj=0; jj<(ss.length-pos); jj++)
      tt = tt + String.fromCharCode(ss[pos+jj]);
    obj.title = tt;

  }

  // Points
  else if (type == 'P'){
    console.log("THIS IS UNTESTED")
    obj.numberOfPoints = (ss[pos++]) + (ss[pos++] << 8) + (ss[pos++] << 16) + (ss[pos++] << 24);
    console.log("POINTS " + obj.numberOfPoints)
    //Getting Points
    test = new Int8Array(obj.numberOfPoints*4*3);
    for(i=0; i<obj.numberOfPoints*4*3; i++)
      test[i] = ss[pos++];
    obj.points = new Float32Array(test.buffer);

    //Getting Colors
    test = [];
    for(i=0; i<obj.numberOfPoints*4; i++)
      test[i] = ss[pos++]/255.0;
    obj.colors = new Float32Array(test);

    //Getting Matrix //Wendel
    test = new Int8Array(16*4);
    for(i=0; i<16*4; i++)
      test[i] = ss[pos++];
    obj.matrix = new Float32Array(test.buffer);
  }
  return geom;
}
