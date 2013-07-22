/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of class utils
 *
 * @class
 * @decs Utility class provides helper functions such as functions to create
 * shaders, geometry etc.
 * @returns {vglModule.utils}
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
 * Create a new instance of default vertex shader that uses a texture
 *
 * @desc Helper function to create default vertex shader
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createTextureVertexShader = function(context) {
  var vertexShaderSource = [
                            'attribute vec3 vertexPosition;',
                            'attribute vec3 textureCoord;',
                            'uniform mediump float pointSize;',
                            'uniform mat4 modelViewMatrix;',
                            'uniform mat4 projectionMatrix;',
                            'varying highp vec3 iTextureCoord;',
                            'void main(void)',
                            '{',
                            'gl_PointSize = pointSize;',
                            'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
                            ' iTextureCoord = textureCoord;', '}' ].join('\n');

  var shader = new vglModule.shader(gl.VERTEX_SHADER);
  shader.setShaderSource(vertexShaderSource);
  return shader;
};


/**
 * Create a new instance of default fragment shader that uses a texture
 *
 * @desc Helper function to create default fragment shader with sampler *
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
 * Create variation of createTextureFragmentShader which uses texture alpha
 *
 * @desc Helper function to create default fragment shader with sampler *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createRgbaTextureFragmentShader = function(context) {
  var fragmentShaderSource = [
    'varying highp vec3 iTextureCoord;',
    'uniform sampler2D sampler2d;',
    'void main(void) {',
    'gl_FragColor = vec4(texture2D(sampler2d, vec2(iTextureCoord.s, iTextureCoord.t)).xyzw);',
    '}' ].join('\n');

  var shader = new vglModule.shader(gl.FRAGMENT_SHADER);
  shader.setShaderSource(fragmentShaderSource);
  return shader;
};

/**
 * Create a new instance of default vertex shader
 *
 * @desc Helper function to create default vertex shader *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createVertexShader = function(context) {
  var vertexShaderSource = [
                            'attribute vec3 vertexPosition;',
                            'attribute vec3 vertexColor;',
                            'uniform mediump float pointSize;',
                            'uniform mat4 modelViewMatrix;',
                            'uniform mat4 projectionMatrix;',
                            'varying mediump vec3 iVertexColor;',
                            'varying highp vec3 iTextureCoord;',
                            'void main(void)',
                            '{',
                            'gl_PointSize = pointSize;',
                            'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
                            ' iVertexColor = vertexColor;', '}' ].join('\n');

  var shader = new vglModule.shader(gl.VERTEX_SHADER);
  shader.setShaderSource(vertexShaderSource);
  return shader;
};

/**
 * Create a new instance of vertex shader with a solid color
 *
 * @desc Helper function to create default vertex shader *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createVertexShaderSolidColor = function(context) {
  var vertexShaderSource = [
                            'attribute vec3 vertexPosition;',
                            'uniform mediump float pointSize;',
                            'uniform mat4 modelViewMatrix;',
                            'uniform mat4 projectionMatrix;',
                            'void main(void)',
                            '{',
                            'gl_PointSize = pointSize;',
                            'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
                            '}' ].join('\n');

  var shader = new vglModule.shader(gl.VERTEX_SHADER);
  shader.setShaderSource(vertexShaderSource);
  return shader;
};

/**
 * Create a new instance of vertex shader that passes values through for color mapping
 *
 * @desc Helper function to create default vertex shader *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createVertexShaderColorMap = function(context, min, max) {
  var vertexShaderSource = [
                            'attribute vec3 vertexPosition;',
                            'attribute float vertexScalar;',
                            'uniform mediump float pointSize;',
                            'uniform mat4 modelViewMatrix;',
                            'uniform mat4 projectionMatrix;',
                            'uniform float lutMin;',
                            'uniform float lutMax;',
                            'varying mediump float iVertexScalar;',
                            'void main(void)',
                            '{',
                            'gl_PointSize = pointSize;',
                            'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
                            'iVertexScalar = (vertexScalar-lutMin)/(lutMax-lutMin);',
                            '}' ].join('\n');

  var shader = new vglModule.shader(gl.VERTEX_SHADER);
  shader.setShaderSource(vertexShaderSource);
  return shader;
};


/**
 * Create a new instance of default fragment shader
 *
 * @desc Helper function to create default fragment shader *
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
 * Create a new instance of fragment shader with an assigned constant color.
 *
 * @desc Helper function to create default fragment shader *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createFragmentShaderSolidColor = function(context, color) {
  var fragmentShaderSource = ['uniform mediump float opacity;',
                              'void main(void) {',
                              'gl_FragColor = vec4(' + color[0] + ',' + color[1] + ',' + color[2] + ', opacity);',
                              '}' ].join('\n');

  var shader = new vglModule.shader(gl.FRAGMENT_SHADER);
  shader.setShaderSource(fragmentShaderSource);
  return shader;
};

/**
 * Create a new instance of fragment shader that maps values into colors bia lookup table
 *
 * @desc Helper function to create default fragment shader *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createFragmentShaderColorMap = function(context) {
  var fragmentShaderSource = [ 'varying mediump float iVertexScalar;',
                              'uniform sampler2D sampler2d;',
                              'uniform mediump float opacity;',
                              'void main(void) {',
                              'gl_FragColor = vec4(texture2D(sampler2d, vec2(iVertexScalar, 0.0)).xyz, opacity);',
                              '}' ].join('\n');

  var shader = new vglModule.shader(gl.FRAGMENT_SHADER);
  shader.setShaderSource(fragmentShaderSource);
  return shader;
};

/**
 * Create a new instance of vertex shader for point sprites
 *
 * @desc Helper function to create default point sprites vertex shader *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createPointSpritesVertexShader = function(context) {
  var vertexShaderSource = [
                            'attribute vec3 vertexPosition;',
                            'attribute vec3 vertexColor;',
                            'uniform mediump float pointSize;',
                            'uniform mat4 modelViewMatrix;',
                            'uniform mat4 projectionMatrix;',
                            'varying mediump vec3 iVertexColor;',
                            'void main(void)',
                            '{',
                            'gl_PointSize = pointSize;',
                            'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
                            ' iVertexColor = vertexColor;', '}' ].join('\n');

  var shader = new vglModule.shader(gl.VERTEX_SHADER);
  shader.setShaderSource(vertexShaderSource);
  return shader;
};

/**
 * Create a new instance of fragment shader for point sprites
 *
 * @desc Helper function to create default point sprites fragment shader *
 * @param context
 * @returns {vglModule.shader}
 */
vglModule.utils.createPointSpritesFragmentShader = function(context) {
  var fragmentShaderSource = [
    'varying mediump vec3 iVertexColor;',
    'uniform sampler2D sampler2d;',
    'uniform mediump float opacity;',
    'uniform mediump float vertexColorWeight;',
    'void main(void) {',
    'highp vec4 texColor = texture2D(sampler2d, gl_PointCoord);',
    'highp vec3 finalColor = iVertexColor * vertexColorWeight + (1.0 - vertexColorWeight) * texColor.xyz;',
    'gl_FragColor = vec4(finalColor, opacity * texColor.w);',
    '}' ].join('\n');

  var shader = new vglModule.shader(gl.FRAGMENT_SHADER);
  shader.setShaderSource(fragmentShaderSource);
  return shader;
};

/**
 * Create a new instance of texture material
 *
 * @desc Helper function to create a texture material
 * @returns {vglModule.material}
 */
vglModule.utils.createTextureMaterial = function(isRgba) {
  var mat = new vglModule.material();
  var blend = new vglModule.blend();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createTextureVertexShader(gl);
  var fragmentShader = null;

  var posVertAttr = new vglModule.vertexAttribute("vertexPosition");
  var texCoordVertAttr = new vglModule.vertexAttribute("textureCoord");
  var colorVertAttr = new vglModule.vertexAttribute("vertexColor");
  var pointsizeUniform = new vglModule.floatUniform("pointSize", 5.0);

  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");
  var samplerUniform = new vglModule.uniform(gl.INT, "sampler2d");
  samplerUniform.set(0);

  prog.addVertexAttribute(posVertAttr, vglModule.vertexAttributeKeys.Position);
  prog.addVertexAttribute(colorVertAttr, vglModule.vertexAttributeKeys.Color);
  prog.addVertexAttribute(texCoordVertAttr,
                          vglModule.vertexAttributeKeys.TextureCoordinate);
  prog.addUniform(pointsizeUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);

  if (isRgba) {
    fragmentShader = vglModule.utils.createRgbaTextureFragmentShader(gl);
  } else {
    fragmentShader = vglModule.utils.createTextureFragmentShader(gl);
    var opacityUniform = new vglModule.floatUniform("opacity", 1.0);
    prog.addUniform(opacityUniform);
  }

  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  return mat;
};

/**
 * Create a new instance of geometry material
 *
 * @desc Helper function to create geometry material
 * @returns {vglModule.material}
 */
vglModule.utils.createGeometryMaterial = function() {
  var mat = new vglModule.material();
  var blend = new vglModule.blend();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createVertexShader(gl);
  var fragmentShader = vglModule.utils.createFragmentShader(gl);
  var posVertAttr = new vglModule.vertexAttribute("vertexPosition");
  var pointsizeUniform = new vglModule.floatUniform("pointSize", 5.0);
  var opacityUniform = new vglModule.floatUniform("opacity", 0.5);
  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");

  prog.addVertexAttribute(posVertAttr, vglModule.vertexAttributeKeys.Position);
  prog.addUniform(pointsizeUniform);
  prog.addUniform(opacityUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  return mat;
};

/**
 * Create a new instance of colored geometry material
 *
 * @desc Helper function to create color geometry material
 * @returns {vglModule.material}
 */
vglModule.utils.createColorMaterial = function() {
  var mat = new vglModule.material();
  var blend = new vglModule.blend();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createVertexShader(gl);
  var fragmentShader = vglModule.utils.createFragmentShader(gl);
  var posVertAttr = new vglModule.vertexAttribute("vertexPosition");
  var texCoordVertAttr = new vglModule.vertexAttribute("textureCoord");
  var colorVertAttr = new vglModule.vertexAttribute("vertexColor");
  var pointsizeUniform = new vglModule.floatUniform("pointSize", 5.0);
  var opacityUniform = new vglModule.floatUniform("opacity", 0.5);
  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");

  prog.addVertexAttribute(posVertAttr, vglModule.vertexAttributeKeys.Position);
  prog.addVertexAttribute(colorVertAttr, vglModule.vertexAttributeKeys.Color);
  prog.addVertexAttribute(texCoordVertAttr,
                          vglModule.vertexAttributeKeys.TextureCoordinate);
  prog.addUniform(pointsizeUniform);
  prog.addUniform(opacityUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  return mat;
};

/**
 * Create a new instance of geometry material
 *
 * @desc Helper function to create geometry material
 * @returns {vglModule.material}
 */
vglModule.utils.createColorMappedMaterial = function(scalarRange, lut) {
  if (!scalarRange) {
    scalarRange = [0.0,1.0];
  }
  var mat = new vglModule.material();
  var blend = new vglModule.blend();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createVertexShaderColorMap(gl,scalarRange[0],scalarRange[1]);
  var fragmentShader = vglModule.utils.createFragmentShaderColorMap(gl);
  var posVertAttr = new vglModule.vertexAttribute("vertexPosition");
  var scalarVertAttr = new vglModule.vertexAttribute("vertexScalar");
  var pointsizeUniform = new vglModule.floatUniform("pointSize", 5.0);
  var opacityUniform = new vglModule.floatUniform("opacity", 0.5);
  var lutMinUniform = new vglModule.floatUniform("lutMin", scalarRange[0]);
  var lutMaxUniform = new vglModule.floatUniform("lutMax", scalarRange[1]);
  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");
  var samplerUniform = new vglModule.uniform(gl.FLOAT, "sampler2d");
  var lookupTable = lut;
  samplerUniform.set(0);
  prog.addVertexAttribute(posVertAttr, vglModule.vertexAttributeKeys.Position);
  prog.addVertexAttribute(scalarVertAttr, vglModule.vertexAttributeKeys.Scalar);
  prog.addUniform(pointsizeUniform);
  prog.addUniform(opacityUniform);
  prog.addUniform(lutMinUniform);
  prog.addUniform(lutMaxUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);
  if (!lookupTable) {
    lookupTable = new ogs.vgl.lookupTable();
    mat.addAttribute(lookupTable);
  }
  return mat;
};

/**
 * Create a new instance of solid color material
 *
 * @desc Helper function to create geometry material
 * @returns {vglModule.material}
 */
vglModule.utils.createSolidColorMaterial = function(color) {
  if (!color) {
    color = [1.0,1.0,1.0];
  }

  var mat = new vglModule.material();
  var blend = new vglModule.blend();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createVertexShaderSolidColor(gl);
  var fragmentShader = vglModule.utils.createFragmentShaderSolidColor(gl, color);
  var posVertAttr = new vglModule.vertexAttribute("vertexPosition");
  var pointsizeUniform = new vglModule.floatUniform("pointSize", 5.0);
  var opacityUniform = new vglModule.floatUniform("opacity", 0.5);
  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");

  prog.addVertexAttribute(posVertAttr, vglModule.vertexAttributeKeys.Position);
  prog.addUniform(pointsizeUniform);
  prog.addUniform(opacityUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  return mat;
};

/**
 * Create a new instance of point sprites material
 *
 * @desc Helper function to create point sprites material
 * @returns {vglModule.material}
 */
vglModule.utils.createPointSpritesMaterial = function(image) {
  var mat = new vglModule.material();
  var blend = new vglModule.blend();
  var prog = new vglModule.shaderProgram();
  var vertexShader = vglModule.utils.createPointSpritesVertexShader(gl);
  var fragmentShader = vglModule.utils.createPointSpritesFragmentShader(gl);
  var posVertAttr = new vglModule.vertexAttribute("vertexPosition");
  var colorVertAttr = new vglModule.vertexAttribute("vertexColor");
  var pointsizeUniform = new vglModule.floatUniform("pointSize", 5.0);
  var opacityUniform = new vglModule.floatUniform("opacity", 1.0);
  var vertexColorWeightUniform = new vglModule.floatUniform(
                                                            "vertexColorWeight",
                                                            0.0);
  var modelViewUniform = new vglModule.modelViewUniform("modelViewMatrix");
  var projectionUniform = new vglModule.projectionUniform("projectionMatrix");
  var samplerUniform = new vglModule.uniform(gl.INT, "sampler2d");
  samplerUniform.set(0);
  prog.addVertexAttribute(posVertAttr, vglModule.vertexAttributeKeys.Position);
  prog.addVertexAttribute(colorVertAttr, vglModule.vertexAttributeKeys.Color);
  prog.addUniform(pointsizeUniform);
  prog.addUniform(opacityUniform);
  prog.addUniform(vertexColorWeightUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  // Create and set the texture
  var texture = new vglModule.texture();
  texture.setImage(image);
  mat.addAttribute(texture);
  return mat;
};

/**
 * Create a new instance of an actor that contains a plane geometry
 *
 * @Helper function to create a plane node This method will create a plane actor
 * with texture coordinates, eventually normal, and plane material. *
 * @returns {vglModule.actor}
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

  var mat = vglModule.utils.createGeometryMaterial();
  var actor = new vglModule.actor();
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

/**
 * Create a new instance of an actor that contains a texture plane geometry
 *
 * @desc Helper function to create a plane textured node This method will create
 * a plane actor with texture coordinates, eventually normal, and plane
 * material. *
 * @returns {vglModule.actor}
 */
vglModule.utils.createTexturePlane = function(originX, originY, originZ,
                                              point1X, point1Y, point1Z,
                                              point2X, point2Y, point2Z, isRgba) {
  var mapper = new vglModule.mapper(),
      planeSource = new vglModule.planeSource(),
      mat = vglModule.utils.createTextureMaterial(isRgba),
      actor = new vglModule.actor();

  planeSource.setOrigin(originX, originY, originZ);
  planeSource.setPoint1(point1X, point1Y, point1Z);
  planeSource.setPoint2(point2X, point2Y, point2Z);
  mapper.setGeometryData(planeSource.create());

  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

/**
 * Create a new instance of an actor that contains points
 *
 * @desc Helper function to create a point node This method will create a point
 * actor with texture coordinates, eventually normal, and plane material. *
 * @returns {vglModule.actor}
 */
vglModule.utils.createPoints = function(positions, colors, texcoords) {

  if (!positions) {
    console.log("[ERROR] Cannot create points without positions");
    return null;
  }

  var mapper = new vglModule.mapper();
  var pointSource = new vglModule.pointSource();

  pointSource.setPositions(positions);
  if (colors) {
    pointSource.setColors(colors);
  }

  if (texcoords) {
    pointSource.setTextureCoordinates(texcoords);
  }

  mapper.setGeometryData(pointSource.create());

  var mat = vglModule.utils.createGeometryMaterial();

  var actor = new vglModule.actor();
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

/**
 * Create a new instance of an actor that contains point sprites
 *
 * @desc Helper function to create a point sprites node This method will create
 * a point sprites actor with texture coordinates, normals, and a point sprites
 * material.
 * @returns {vglModule.actor}
 */
vglModule.utils.createPointSprites = function(image, positions, colors,
                                              texcoords) {
  if (!image) {
    console.log("[ERROR] Point sprites requires an image");
    return null;
  }

  if (!positions) {
    console.log("[ERROR] Cannot create points without positions");
    return null;
  }

  var mapper = new vglModule.mapper();
  var pointSource = new vglModule.pointSource();

  pointSource.setPositions(positions);
  if (colors) {
    pointSource.setColors(colors);
  }

  if (texcoords) {
    pointSource.setTextureCoordinates(texcoords);
  }

  mapper.setGeometryData(pointSource.create());

  var mat = vglModule.utils.createPointSpritesMaterial(image);
  var actor = new vglModule.actor();
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

/**
 * Create lines given positions, colors, and desired length
 *
 * @param positions
 * @param colors
 */
vglModule.utils.createLines = function(positions, colors) {
  if (!positions) {
    console.log("[ERROR] Cannot create points without positions");
    return null;
  }

  var mapper = new vglModule.mapper(),
      lineSource = new vglModule.lineSource(),
      mat = vglModule.utils.createGeometryMaterial(),
      actor = new vglModule.actor();

  lineSource.setPositions(positions);
  if (colors) {
    lineSource.setColors(colors);
  }

  mapper.setGeometryData(lineSource.create());
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

/**
 *
 * @param lookupTable
 * @param width
 * @param height
 * @param origin
 * @param divs
 * @returns {Array}
 */
vglModule.utils.createColorLegend = function(lookupTable, width,
                                             height, origin, countMajor, countMinor) {
  if (!lookupTable) {
    console.log('[error] Invalid lookup table');
    return;
  }

  // TODO Currently we assume that the ticks are laid on x-axis
  // and this is on a 2D plane (ignoring Z axis. For now lets
  // not draw minor ticks.
  /**
   *
   * @param originX
   * @param originY
   * @param originZ
   * @param pt1X
   * @param pt1Y
   * @param pt1Z
   * @param pt2X
   * @param pt2Y
   * @param pt2Z
   * @param divs
   * @param heightMajor
   * @param heightMinor
   * @returns {vglModule.actor}
   */
  function createTicksAndLabels(lut,
                        originX, originY, originZ,
                        pt1X, pt1Y, pt1Z,
                        pt2X, pt2Y, pt2Z,
                        countMajor, countMinor,
                        heightMajor, heightMinor) {

    var width = pt2X - pt1X,
        index = null,
        delta = width / countMajor,
        positions = [],
        actor = null,
        actors = [];

    for (index = 0; index <= countMajor; ++index) {
      positions.push(pt1X + delta * index);
      positions.push(pt1Y);
      positions.push(pt1Z);

      positions.push(pt1X + delta * index);
      positions.push(pt1Y + heightMajor);
      positions.push(pt1Z);
    }

    actor = vglModule.utils.createLines(positions, null);
    actor.setReferenceFrame(vglModule.boundingObject.ReferenceFrame.Absolute);
    actors.push(actor);

    actors = actors.concat(createLabels(positions, lut.range()));
    return actors;
  }

  /**
   * Create labels for the legend
   * @param ticks
   * @param range
   * @param divs
   */
  function createLabels(positions, range) {
    if (!positions) {
      console.log('[error] Create labels requires positions (x,y,z) array');
      return;
    }

    if (positions.length % 3 !== 0) {
      console.log('[error] Create labels require positions array contain 3d points');
      return;
    }

    if (!range) {
      console.log('[error] Create labels requires Valid range');
      return;
    }

    var actor = null,
        i = 0,
        index = 0,
        actors = [],
        origin = [],
        pt1 = [],
        pt2 = [],
        delta = (positions[6] - positions[0]);

    origin.length = 3;
    pt1.length = 3;
    pt2.length = 3;

    // For now just create labels for end points
    for (; i < 2; ++i) {
      index = i * (positions.length - 3);

      origin[0] = positions[index] - delta;
      origin[1] = positions[index + 1] - 2 * delta;
      origin[2] = positions[index + 2];

      pt1[0] = positions[index] + delta;
      pt1[1] = origin[1];
      pt1[2] = origin[2];

      pt2[0] = origin[0];
      pt2[1] = positions[1];
      pt2[2] = origin[2];

      actor = vglModule.utils.createTexturePlane(
        origin[0], origin[1], origin[2],
        pt1[0], pt1[1], pt1[2],
        pt2[0], pt2[1], pt2[2], true);

      actor.setReferenceFrame(vglModule.boundingObject.ReferenceFrame.Absolute);
      actor.material().addAttribute(vglModule.utils.renderText(range[i], 12));
      actors.push(actor);
    }

    return actors;
  }

  // TODO Currently we create only one type of legend
  var pt1X = origin[0] + width,
      pt1Y = origin[1],
      pt1Z = 0.0,
      pt2X = origin[0],
      pt2Y = origin[1] + height,
      pt2Z = 0.0,
      actors = [],
      actor = null,
      mapper = null,
      mat = null,
      group = vglModule.groupNode();

  actor = vglModule.utils.createTexturePlane(
    origin[0], origin[1], origin[2],
    pt1X, pt1Y, pt1Z,
    pt2X, pt2Y, pt2Z
  );

  mat = actor.material();
  mat.addAttribute(lookupTable);
  actor.setMaterial(mat);
  group.addChild(actor);
  actor.setReferenceFrame(vglModule.boundingObject.ReferenceFrame.Absolute);
  actors.push(actor);
  actors = actors.concat(createTicksAndLabels(
                          lookupTable,
                          origin[0], origin[1], origin[1],
                          pt2X, pt1Y, pt1Z,
                          pt1X, pt1Y, pt1Z,
                          countMajor, countMinor, 5, 3));

  // TODO This needs to change so that we can return a group node
  // which should get appended to the scene graph
  return actors;
};

/**
 *
 * @param textToWrite
 * @param textSize
 * @param color
 * @returns {*}
 */
vglModule.utils.renderText = function(textToWrite, textSize, color) {
  function getPowerOfTwo(value, pow) {
    var pow = pow || 1;
    while(pow<value) {
      pow *= 2;
    }
    return pow;
  }

  var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d'),
      texture = vglModule.texture();

  canvas.setAttribute('id', 'textRendering');
  canvas.style.display = 'none';

  canvas.width = getPowerOfTwo(ctx.measureText(textToWrite).width);
  canvas.height = getPowerOfTwo(2 * textSize);

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // This determines the text colour, it can take a hex value or rgba value (e.g. rgba(255,0,0,0.5))
  ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';

  // This determines the alignment of text, e.g. left, center, right
  ctx.textAlign = "left";

  // This determines the baseline of the text, e.g. top, middle, bottom
  ctx.textBaseline = "bottom";

  // This determines the size of the text and the font family used
  ctx.font = "12px monospace";


  ctx.fillText(textToWrite, canvas.width/8, canvas.height/2);

  texture.setImage(canvas)
  texture.updateDimensions();

  return texture;
};