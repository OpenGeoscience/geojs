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
//
// utils class
//
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

/**
 * Helper function to create default fragment shader with sampler
 *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createTextureFragmentShader = function(context) {
  var fragmentShaderSource = [
                              'varying highp vec3 iTextureCoord;',
                              'uniform sampler2D sampler2d;',
                              'uniform mediump float opacity;',
                              'void main(void) {',
                              'gl_FragColor = vec4(texture2D(sampler2d, vec2(iTextureCoord.s, iTextureCoord.t)).xyz, opacity);',
                              '}' ].join('\n');

  var shader = new vglModule.shader(gl.FRAGMENT_SHADER);
  shader.setShaderSource(fragmentShaderSource);
  return shader;
};

/**
 * Helper function to create default fragment shader
 *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createFragmentShader = function(context) {
  var fragmentShaderSource = [ 'varying mediump vec3 iVertexColor;',
                              'uniform mediump float opacity;',
                              'void main(void) {',
                              'gl_FragColor = vec4(iVertexColor, opacity);',
                              '}' ].join('\n');

  var shader = new vglModule.shader(gl.FRAGMENT_SHADER);
  shader.setShaderSource(fragmentShaderSource);
  return shader;
};

/**
 * Helper function to create default vertex shader (
 *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createTextureVertexShader = function(context) {
  var vertexShaderSource = [
                            'attribute vec3 vertexPosition;',
                            'attribute vec3 textureCoord;',
                            'uniform mat4 modelViewMatrix;',
                            'uniform mat4 projectionMatrix;',
                            'varying highp vec3 iTextureCoord;',
                            'void main(void)',
                            '{',
                            'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
                            ' iTextureCoord = textureCoord;', '}' ].join('\n');

  var shader = new vglModule.shader(gl.VERTEX_SHADER);
  shader.setShaderSource(vertexShaderSource);
  return shader;
};

/**
 * Helper function to create default vertex shader
 *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createVertexShader = function(context) {
  var vertexShaderSource = [
                            'attribute vec3 vertexPosition;',
                            'attribute vec3 textureCoord;',
                            'attribute vec3 vertexColor;',
                            'uniform mat4 modelViewMatrix;',
                            'uniform mat4 projectionMatrix;',
                            'varying mediump vec3 iVertexColor;',
                            'varying highp vec3 iTextureCoord;',
                            'void main(void)',
                            '{',
                            'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
                            ' iTextureCoord = textureCoord;',
                            ' iVertexColor = vertexColor;', '}' ].join('\n');

  var shader = new vglModule.shader(gl.VERTEX_SHADER);
  shader.setShaderSource(vertexShaderSource);
  return shader;
};

/**
 * Helper function to create a plane node
 *
 * This method will create a plane actor with texture coordinates,
 * eventually normal, and plane material.
 *
 * @returns actor
 *
 */
vglModule.utils.createPlane = function(originX, originY, originZ, point1X,
                                       point1Y, point1Z, point2X, point2Y,
                                       point2Z) {
  var mapper = new vglModule.mapper();
  var planeSource = new vglModule.planeSource();
  planeSource.setOrigin(originX, originY, originZ);
  planeSource.setPoint1(point1X, point1Y, point1Z);
  planeSource.setPoint2(point2X, point2Y, point2Z);
  mapper.setGeometryData(planeSource.create());

  var mat = new vglModule.material();
  var blend = new vglModule.blend();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createVertexShader(gl);
  var fragmentShader = vglModule.utils.createFragmentShader(gl);
  var posVertAttr = new vglModule.vertexAttribute("vertexPosition");
  var texCoordVertAttr = new vglModule.vertexAttribute("textureCoord");
  var colorVertAttr = new vglModule.vertexAttribute("vertexColor");
  var opacityUniform = new vglModule.floatUniform("opacity");
  opacityUniform.set(0.5);
  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");

  prog.addVertexAttribute(posVertAttr, vglModule.vertexAttributeKeys.Position);
  prog.addVertexAttribute(colorVertAttr, vglModule.vertexAttributeKeys.Color);
  prog.addVertexAttribute(texCoordVertAttr,
                          vglModule.vertexAttributeKeys.TextureCoordinate);
  prog.addUniform(opacityUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  var actor = new vglModule.actor();
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

/**
 * Helper function to create a plane textured node
 *
 * This method will create a plane actor with texture coordinates,
 * eventually normal, and plane material.
 *
 * @returns actor
 *
 */
vglModule.utils.createTexturePlane = function(originX, originY, originZ,
                                              point1X, point1Y, point1Z,
                                              point2X, point2Y, point2Z) {

  var mapper = new vglModule.mapper();
  var planeSource = new vglModule.planeSource();
  planeSource.setOrigin(originX, originY, originZ);
  planeSource.setPoint1(point1X, point1Y, point1Z);
  planeSource.setPoint2(point2X, point2Y, point2Z);
  mapper.setGeometryData(planeSource.create());

  var mat = new vglModule.material();
  var blend = new vglModule.blend();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createTextureVertexShader(gl);
  var fragmentShader = vglModule.utils.createTextureFragmentShader(gl);
  var posVertAttr = new vglModule.vertexAttribute("vertexPosition");
  var texCoordVertAttr = new vglModule.vertexAttribute("textureCoord");
  var opacityUniform = new vglModule.floatUniform("opacity");
  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");
  var samplerUniform = new vglModule.uniform(gl.INT, "sampler2d");
  samplerUniform.set(0);

  prog.addVertexAttribute(posVertAttr, vglModule.vertexAttributeKeys.Position);
  prog.addVertexAttribute(texCoordVertAttr,
                          vglModule.vertexAttributeKeys.TextureCoordinate);
  prog.addUniform(opacityUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addUniform(samplerUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);

  mat.addAttribute(prog);
  mat.addAttribute(blend);

  var actor = new vglModule.actor();
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};
