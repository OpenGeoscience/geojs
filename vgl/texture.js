//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class texture
 *
 * @class
 * @returns {vglModule.texture}
 */
///////////////////////////////////////////////////////////////////////////////
vglModule.texture = function() {
  'use strict';

  if (!(this instanceof vglModule.texture)) {
    return new vglModule.texture();
  }
  vglModule.materialAttribute.call(this, materialAttributeType.Texture);

  this.m_width = 0;
  this.m_height = 0;
  this.m_depth = 0;

  this.m_textureHandle = null;
  this.m_textureUnit = 0;

  this.m_pixelFormat = null;
  this.m_pixelDataType = null;

  this.m_internalFormat = null;

  this.m_image = null;

  var m_setupTimestamp = vglModule.timestamp();

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Create texture, update parameters, and bind data
   *
   * @param renderState
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setup = function(renderState) {
    gl.deleteTexture(this.m_textureHandle);
    this.m_textureHandle = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.m_textureHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    if (this.m_image !== null) {
      this.updateDimensions();
      this.computeInternalFormatUsingImage();

      // console.log("m_internalFormat " + this.m_internalFormat);
      // console.log("m_pixelFormat " + this.m_pixelFormat);
      // console.log("m_pixelDataType " + this.m_pixelDataType);

      // FOR now support only 2D textures
      gl.texImage2D(gl.TEXTURE_2D, 0, this.m_internalFormat,
                    this.m_pixelFormat, this.m_pixelDataType, this.m_image);
    }
    else {
      gl.texImage2D(gl.TEXTURE_2D, 0, this.m_internalFormat,
                    this.m_pixelFormat, this.m_pixelDataType, null);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
    m_setupTimestamp.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Create texture and if already created use it
   *
   * @param renderState
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bind = function(renderState) {
    // TODO Call setup via material setup
    if (this.getMTime() > m_setupTimestamp.getMTime()) {
      this.setup(renderState);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.m_textureHandle);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Turn off the use of this texture
   *
   * @param renderState
   */
  /////////////////////////////////////////////////////////////////////////////
  this.undoBind = function(renderState) {
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get image used by the texture
   *
   * @returns {vglModule.image}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.image = function() {
    return this.m_image;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set image for the texture
   *
   * @param {vglModule.image} image
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setImage = function(image) {
    if (image !== null) {
      this.m_image = image;
      this.updateDimensions();
      this.modified();
      return true;
    }

    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get texture unit of the texture
   *
   * @returns {number}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.textureUnit = function() {
    return this.m_textureUnit;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set texture unit of the texture. Default is 0.
   *
   * @param {number} unit
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setTextureUnit = function(unit) {
    if (this.m_textureUnit === unit) {
      return false;
    }

    this.m_textureUnit = unit;
    this.modified();
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get width of the texture
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.width = function() {
    return this.m_width;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set width of the texture
   *
   * @param {number} width
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setWidth = function(width) {
    if (this.m_image === null) {
      return false;
    }

    this.m_width = width;
    this.modified();

    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get depth of the texture
   *
   * @returns {number}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.depth = function() {
    return this.m_depth;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set depth of the texture
   *
   * @param {number} depth
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setDepth = function(depth) {
    if (this.m_image === null) {
      return false;
    }

    this.m_depth = depth;
    this.modified();
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get the texture handle (id) of the texture
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.textureHandle = function() {
    return this.m_textureHandle;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get internal format of the texture
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.internalFormat = function() {
    return this.m_internalFormat;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set internal format of the texture
   *
   * @param internalFormat
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setInternalFormat = function(internalFormat) {
    if (this.m_internalFormat !== internalFormat) {
      this.m_internalFormat = internalFormat;
      this.modified();
      return true;
    }

    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get pixel format of the texture
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.pixelFormat = function() {
    return this.m_pixelFormat;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set pixel format of the texture
   *
   * @param pixelFormat
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setPixelFormat = function(pixelFormat) {
    if (this.m_image === null) {
      return false;
    }

    this.m_pixelFormat = pixelFormat;
    this.modified();
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get pixel data type
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.pixelDataType = function() {
    return this.m_pixelDataType;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set pixel data type
   *
   * @param pixelDataType
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setPixelDataType = function(pixelDataType) {
    if (this.m_image === null) {
      return false;
    }

    this.m_pixelDataType = pixelDataType;

    this.modified();

    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Compute internal format of the texture
   */
  /////////////////////////////////////////////////////////////////////////////
  this.computeInternalFormatUsingImage = function() {
    // Currently image does not define internal format
    // and hence it's pixel format is the only way to query
    // information on how color has been stored.
    // switch (this.m_image.pixelFormat()) {
    // case gl.RGB:
    // this.m_internalFormat = gl.RGB;
    // break;
    // case gl.RGBA:
    // this.m_internalFormat = gl.RGBA;
    // break;
    // case gl.Luminance:
    // this.m_internalFormat = gl.Luminance;
    // break;
    // case gl.LuminanceAlpha:
    // this.m_internalFormat = gl.LuminanceAlpha;
    // break;
    // // Do nothing when image pixel format is none or undefined.
    // default:
    // break;
    // };

    // TODO Fix this
    this.m_internalFormat = gl.RGBA;
    this.m_pixelFormat = gl.RGBA;
    this.m_pixelDataType = gl.UNSIGNED_BYTE;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update texture dimensions
   */
  /////////////////////////////////////////////////////////////////////////////
  this.updateDimensions = function() {
    if (this.m_image !== null) {
      this.m_width = this.m_image.width;
      this.m_height = this.m_image.height;
      this.m_depth = 0; // Only 2D images are supported now
    }
  };

  return this;
};

inherit(vglModule.texture, vglModule.materialAttribute);

///////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lookupTable
 *
 * @class
 * @returns {vglModule.lookupTable}
 */
///////////////////////////////////////////////////////////////////////////////
vglModule.lookupTable = function() {

  if (!(this instanceof vglModule.lookupTable)) {
    return new vglModule.lookupTable();
  }
  vglModule.texture.call(this);

  var m_setupTimestamp = vglModule.timestamp();
  var m_range = [0,0];

  this.m_colorTable = //paraview bwr colortable
	  [0.07514311,0.468049805,1,1,
	   0.247872569,0.498782363,1,1,
	   0.339526309,0.528909511,1,1,
	   0.409505078,0.558608486,1,1,
	   0.468487184,0.588057293,1,1,
	   0.520796675,0.617435078,1,1,
	   0.568724526,0.646924167,1,1,
	   0.613686735,0.676713218,1,1,
	   0.656658579,0.707001303,1,1,
	   0.698372844,0.738002964,1,1,
	   0.739424025,0.769954435,1,1,
	   0.780330104,0.803121429,1,1,
	   0.821573924,0.837809045,1,1,
	   0.863634967,0.874374691,1,1,
	   0.907017747,0.913245283,1,1,
	   0.936129275,0.938743558,0.983038586,1,
	   0.943467973,0.943498599,0.943398095,1,
	   0.990146732,0.928791426,0.917447482,1,
	   1,0.88332677,0.861943246,1,
	   1,0.833985467,0.803839606,1,
	   1,0.788626485,0.750707739,1,
	   1,0.746206642,0.701389973,1,
	   1,0.70590052,0.654994046,1,
	   1,0.667019783,0.610806959,1,
	   1,0.6289553,0.568237474,1,
	   1,0.591130233,0.526775617,1,
	   1,0.552955184,0.485962266,1,
	   1,0.513776083,0.445364274,1,
	   1,0.472800903,0.404551679,1,
	   1,0.428977855,0.363073592,1,
	   1,0.380759558,0.320428137,1,
	   0.961891484,0.313155629,0.265499262,1,
	   0.916482116,0.236630659,0.209939162,1].map(
             function(x) {return x*255;});

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Create lookup table, initialize parameters, and bind data to it
   *
   * @param {vglModule.renderState} renderState
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setup = function(renderState) {
    gl.deleteTexture(this.m_textureHandle);
    this.m_textureHandle = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.m_textureHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    this.m_width = this.m_colorTable.length/4;
    this.m_height = 1;
    this.m_depth = 0;
    gl.texImage2D(gl.TEXTURE_2D,
                  0, gl.RGBA, this.m_width, this.m_height, this.m_depth,
                  gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(this.m_colorTable));

    gl.bindTexture(gl.TEXTURE_2D, null);
    m_setupTimestamp.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get color table used by the lookup table
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.colorTable = function() {
    return this.m_colorTable;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set color table used by the lookup table
   *
   * @param colors
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setColorTable = function(colors) {
    if (this.m_colorTable === colors) {
      return false;
    }

    this.m_colorTable = colors;
    this.modified();
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get scalar range
   *
   * @returns {Array}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.range = function() {
    return m_range;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set scalar range for the lookup table
   *
   * @param range
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setRange = function(range) {
    if (m_range === range) {
      return false;
    }
    m_range = range;
    this.modified();
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Given a [min,max] range update the lookup table range
   *
   * @param range
   */
  /////////////////////////////////////////////////////////////////////////////
  this.updateRange = function(range) {
    if (!(range instanceof Array)) {
      console.log('[error] Invalid data type for range. Requires array [min,max]');
    }

    if (range[0] < m_range[0]) {
      m_range[0] = range[0];
      this.modified();
    }

    if (range[1] > m_range[1]) {
      m_range[1] = range[1];
      this.modified();
    }
  };

  return this;
};

inherit(vglModule.lookupTable, vglModule.texture);
