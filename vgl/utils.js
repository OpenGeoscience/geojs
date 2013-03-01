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

///////////////////////////////////////////////////////////////////////////////
/**
 * Utility class provides helper functions to create geometry objects
 *
 */
vglModule.utils = function() {
  if (!(this instanceof vglModule.utils)) {
    return new vglModule.utils();
  }

  vglModule.object.call(this);

  return this;
};

inherit(vglModule.utils, vglModule.object);

///////////////////////////////////////////////////////////////////////////////
/**
 * Helper function to create default fragment shader
 *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createDefaultFragmentShader = function(context) {
 var fragmentShaderSource = [
   'varying highp vec3 vTextureCoord;',
   'uniform sampler2D uSampler;',
   'void main(void) {',
     'gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));',
   '}'
  ].join('\n');

 var shader = new vglModule.shader(gl.FRAGMENT_SHADER);
 shader.setShaderSource(fragmentShaderSource);
 return shader;
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Helper function to create default vertex shader
 *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createDefaultVertexShader = function(context) {
 var vertexShaderSource = [
   'attribute vec3 aVertexPosition;',
   'attribute vec3 aTextureCoord;',
   'uniform mat4 modelViewMatrix;',
   'uniform mat4 projectionMatrix;',
   'varying highp vec3 vTextureCoord;',
   'void main(void)',
   '{',
   'gl_Position = projectionMatrix * modelViewMatrix * vec4(aVertexPosition, 1.0);',
   ' vTextureCoord = aTextureCoord;',
   '}'
 ].join('\n');

 var shader = new vglModule.shader(gl.VERTEX_SHADER);
 shader.setShaderSource(vertexShaderSource);
 return shader;
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Helper function to create a plane node
 *
 * This method will create a plane actor with texture coordinates,
 * eventually normal, and plane material.
 *
 * @returns actor
 *
 */
vglModule.utils.createPlane = function(originX, originY, originZ,
                                        point1X, point1Y, point1Z,
                                        point2X, point2Y, point2Z) {
  var mapper = new vglModule.mapper();
  var planeSource = new vglModule.planeSource();
  planeSource.setOrigin(originX, originY, originZ);
  planeSource.setPoint1(point1X, point1Y, point1Z);
  planeSource.setPoint2(point2X, point2Y, point2Z);
  mapper.setGeometryData(planeSource.create());

  var mat = new vglModule.material();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createDefaultVertexShader(gl);
  var fragmentShader = vglModule.utils.createDefaultFragmentShader(gl);
  var posVertAttr = new vglModule.vertexAttribute("aVertexPosition");
  var texCoordVertAttr = new vglModule.vertexAttribute("aTextureCoord");
  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");
  var samplerUniform = new vglModule.uniform(gl.INT, "uSampler");
  samplerUniform.set(0);

  prog.addVertexAttribute(posVertAttr,
    vglModule.vertexAttributeKeys.Position);
  prog.addVertexAttribute(texCoordVertAttr,
    vglModule.vertexAttributeKeys.TextureCoordinate);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addUniform(samplerUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);

  var actor = new vglModule.actor();
  console.log(actor);
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};