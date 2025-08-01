var vgl = require('./vgl');
var inherit = require('../inherit');
var timestamp = require('../timestamp');

/**
 * Create a new instance of class texture.
 *
 * @class
 * @alias vgl.texture
 * @returns {vgl.texture}
 */
vgl.texture = function () {
  'use strict';

  if (!(this instanceof vgl.texture)) {
    return new vgl.texture();
  }
  vgl.materialAttribute.call(this, vgl.materialAttributeType.Texture);

  this.m_width = 0;
  this.m_height = 0;
  this.m_depth = 0;

  this.m_textureHandle = null;
  this.m_textureUnit = 0;

  this.m_pixelFormat = vgl.GL.RGBA;
  this.m_pixelDataType = vgl.GL.UNSIGNED_BYTE;
  this.m_internalFormat = vgl.GL.RGBA;
  this.m_nearestPixel = false;

  this.m_image = null;
  this.m_texture = null;

  var m_setupTimestamp = timestamp(),
      m_that = this;

  function activateTextureUnit(renderState) {
    if (m_that.m_textureUnit >= 0 && m_that.m_textureUnit < 32) {
      renderState.m_context.activeTexture(vgl.GL.TEXTURE0 + m_that.m_textureUnit);
    } else {
      throw '[error] Texture unit ' + m_that.m_textureUnit + ' is not supported';
    }
  }

  /**
   * Create texture, update parameters, and bind data.
   *
   * @param {vgl.renderState} renderState
   */
  this.setup = function (renderState) {
    // Activate the texture unit first
    activateTextureUnit(renderState);

    renderState.m_context.deleteTexture(this.m_textureHandle);
    this.m_textureHandle = renderState.m_context.createTexture();
    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, this.m_textureHandle);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D,
                                        vgl.GL.TEXTURE_MIN_FILTER,
                                        this.m_nearestPixel ? vgl.GL.NEAREST : vgl.GL.LINEAR);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D,
                                        vgl.GL.TEXTURE_MAG_FILTER,
                                        this.m_nearestPixel ? vgl.GL.NEAREST : vgl.GL.LINEAR);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D,
                                        vgl.GL.TEXTURE_WRAP_S, vgl.GL.CLAMP_TO_EDGE);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D,
                                        vgl.GL.TEXTURE_WRAP_T, vgl.GL.CLAMP_TO_EDGE);

    if (this.m_image !== null) {
      renderState.m_context.pixelStorei(vgl.GL.UNPACK_ALIGNMENT, 1);
      renderState.m_context.pixelStorei(vgl.GL.UNPACK_FLIP_Y_WEBGL, true);

      this.updateDimensions();
      this.computeInternalFormatUsingImage();

      // FOR now support only 2D textures
      renderState.m_context.texImage2D(vgl.GL.TEXTURE_2D, 0, this.m_internalFormat,
                                       this.m_pixelFormat, this.m_pixelDataType, this.m_image);
    } else if (this.m_texture !== null) {
      // Custom texture data object
      renderState.m_context.pixelStorei(vgl.GL.UNPACK_ALIGNMENT, 1);
      renderState.m_context.pixelStorei(vgl.GL.UNPACK_FLIP_Y_WEBGL, true);

      this.updateDimensions();
      this.computeInternalFormatUsingImage();
      renderState.m_context.texImage2D(vgl.GL.TEXTURE_2D, 0, this.m_internalFormat,
                                       this.m_texture.width, this.m_texture.height, 0,
                                       this.m_pixelFormat, this.m_pixelDataType, this.m_texture.data);
    } else {
      renderState.m_context.texImage2D(vgl.GL.TEXTURE_2D, 0, this.m_internalFormat,
                                       this.m_width, this.m_height, 0, this.m_pixelFormat, this.m_pixelDataType, null);
    }

    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, null);
    m_setupTimestamp.modified();
  };

  /**
   * Create texture and if already created use it.
   *
   * @param {vgl.renderState} renderState
   */
  this.bind = function (renderState) {
    // TODO Call setup via material setup
    if (this.getMTime() > m_setupTimestamp.getMTime()) {
      this.setup(renderState);
    }

    activateTextureUnit(renderState);
    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, this.m_textureHandle);
  };

  /**
   * Turn off the use of this texture.
   *
   * @param {vgl.renderState} renderState
   */
  this.undoBind = function (renderState) {
    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, null);
  };

  /**
   * Get image used by the texture.
   *
   * @returns {vgl.image}
   */
  this.image = function () {
    return this.m_image;
  };

  /**
   * Get image used by the texture.
   *
   * @returns {vgl.image}
   */
  this.texture = function () {
    return this.m_texture;
  };

  /**
   * Set image for the texture.
   *
   * @param {vgl.image} image
   * @returns {boolean}
   */
  this.setImage = function (image) {
    if (image !== null) {
      this.m_image = image;
      this.updateDimensions();
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Set Raw Texture data using Uint8Array
   *
   * @param {object} texture texture object to load.
   *   type: 'RGB' | 'RGBA' | 'Luminance' | 'LuminanceAlpha'.
   *   texture: Uint8Array representing the format based on the type
   *   width: width of the texture
   *   height: height of the texture
   * @returns {boolean}
  */
  this.setTexture = function (texture) {
    if (texture !== null) {
      this.m_texture = texture;
      if (texture.type === 'Luminance') {
        this.m_internalFormat = vgl.GL.LUMINANCE;
        this.m_pixelFormat = vgl.GL.LUMINANCE;
      } else if (texture.type === 'LuminanceAlpha') {
        this.m_internalFormat = vgl.GL.LUMINANCE_ALPHA;
        this.m_pixelFormat = vgl.GL.LUMINANCE_ALPHA;
      } else {
        this.m_internalFormat = vgl.GL.RGBA;
        this.m_pixelFormat = vgl.GL.RGBA;
      }
      this.updateDimensions();
      this.modified();
      return true;
    }

    return false;
  };
  /**
   * Get nearest pixel flag for the texture.
   *
   * @returns {boolean}
   */
  this.nearestPixel = function () {
    return this.m_nearestPixel;
  };

  /**
   * Set nearest pixel flag for the texture.
   *
   * @param {boolean} nearest pixel flag
   * @returns {boolean}
   */
  this.setNearestPixel = function (nearest) {
    nearest = nearest ? true : false;
    if (nearest !== this.m_nearestPixel) {
      this.m_nearestPixel = nearest;
      this.modified();
      return true;
    }
    return false;
  };

  /**
   * Get texture unit of the texture.
   *
   * @returns {number}
   */
  this.textureUnit = function () {
    return this.m_textureUnit;
  };

  /**
   * Set texture unit of the texture. Default is 0.
   *
   * @param {number} unit
   * @returns {boolean}
   */
  this.setTextureUnit = function (unit) {
    if (this.m_textureUnit === unit) {
      return false;
    }

    this.m_textureUnit = unit;
    this.modified();
    return true;
  };

  /**
   * Compute internal format of the texture.
   */
  this.computeInternalFormatUsingImage = function () {
    // Currently image does not define internal format
    // and hence it's pixel format is the only way to query
    // information on how color has been stored.
    // switch (this.m_image.pixelFormat()) {
    // case vgl.GL.RGB:
    // this.m_internalFormat = vgl.GL.RGB;
    // break;
    // case vgl.GL.RGBA:
    // this.m_internalFormat = vgl.GL.RGBA;
    // break;
    // case vgl.GL.Luminance:
    // this.m_internalFormat = vgl.GL.Luminance;
    // break;
    // case vgl.GL.LuminanceAlpha:
    // this.m_internalFormat = vgl.GL.LuminanceAlpha;
    // break;
    // // Do nothing when image pixel format is none or undefined.
    // default:
    // break;
    // };

    // TODO Fix this
    if (!this.m_internalFormat || !this.m_pixelFormat || !this.m_pixelDataType) {
      this.m_internalFormat = vgl.GL.RGBA;
      this.m_pixelFormat = vgl.GL.RGBA;
      this.m_pixelDataType = vgl.GL.UNSIGNED_BYTE;
    }
  };

  /**
   * Update texture dimensions.
   */
  this.updateDimensions = function () {
    if (this.m_image !== null) {
      this.m_width = this.m_image.width;
      this.m_height = this.m_image.height;
      this.m_depth = 0; // Only 2D images are supported now
    }
    if (this.m_texture !== null) {
      this.m_width = this.m_texture.width;
      this.m_height = this.m_texture.height;
      this.m_depth = 0; // Only 2D images are supported now
    }
  };

  /**
   * Return the texture handle.
   *
   * @returns {number}
   */
  this.textureHandle = function () {
    return this.m_textureHandle;
  };

  return this;
};

inherit(vgl.texture, vgl.materialAttribute);

/**
 * Create a new instance of class lookupTable.
 *
 * @class
 * @alias vgl.lookupTable
 * @returns {vgl.lookupTable}
 */
vgl.lookupTable = function () {
  'use strict';

  if (!(this instanceof vgl.lookupTable)) {
    return new vgl.lookupTable();
  }
  vgl.texture.call(this);

  var m_setupTimestamp = timestamp();

  this.m_colorTable = // paraview bwr colortable
    [0.07514311, 0.468049805, 1, 1,
      0.247872569, 0.498782363, 1, 1,
      0.339526309, 0.528909511, 1, 1,
      0.409505078, 0.558608486, 1, 1,
      0.468487184, 0.588057293, 1, 1,
      0.520796675, 0.617435078, 1, 1,
      0.568724526, 0.646924167, 1, 1,
      0.613686735, 0.676713218, 1, 1,
      0.656658579, 0.707001303, 1, 1,
      0.698372844, 0.738002964, 1, 1,
      0.739424025, 0.769954435, 1, 1,
      0.780330104, 0.803121429, 1, 1,
      0.821573924, 0.837809045, 1, 1,
      0.863634967, 0.874374691, 1, 1,
      0.907017747, 0.913245283, 1, 1,
      0.936129275, 0.938743558, 0.983038586, 1,
      0.943467973, 0.943498599, 0.943398095, 1,
      0.990146732, 0.928791426, 0.917447482, 1,
      1, 0.88332677, 0.861943246, 1,
      1, 0.833985467, 0.803839606, 1,
      1, 0.788626485, 0.750707739, 1,
      1, 0.746206642, 0.701389973, 1,
      1, 0.70590052, 0.654994046, 1,
      1, 0.667019783, 0.610806959, 1,
      1, 0.6289553, 0.568237474, 1,
      1, 0.591130233, 0.526775617, 1,
      1, 0.552955184, 0.485962266, 1,
      1, 0.513776083, 0.445364274, 1,
      1, 0.472800903, 0.404551679, 1,
      1, 0.428977855, 0.363073592, 1,
      1, 0.380759558, 0.320428137, 1,
      0.961891484, 0.313155629, 0.265499262, 1,
      0.916482116, 0.236630659, 0.209939162, 1].map(
      function (x) { return x * 255; });

  /**
   * Create lookup table, initialize parameters, and bind data to it.
   *
   * @param {vgl.renderState} renderState
   */
  this.setup = function (renderState) {
    if (this.textureUnit() === 0) {
      renderState.m_context.activeTexture(vgl.GL.TEXTURE0);
    } else if (this.textureUnit() === 1) {
      renderState.m_context.activeTexture(vgl.GL.TEXTURE1);
    }

    renderState.m_context.deleteTexture(this.m_textureHandle);
    this.m_textureHandle = renderState.m_context.createTexture();
    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, this.m_textureHandle);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D,
                                        vgl.GL.TEXTURE_MIN_FILTER, vgl.GL.LINEAR);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D,
                                        vgl.GL.TEXTURE_MAG_FILTER, vgl.GL.LINEAR);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D,
                                        vgl.GL.TEXTURE_WRAP_S, vgl.GL.CLAMP_TO_EDGE);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D,
                                        vgl.GL.TEXTURE_WRAP_T, vgl.GL.CLAMP_TO_EDGE);
    renderState.m_context.pixelStorei(vgl.GL.UNPACK_ALIGNMENT, 1);

    this.m_width = this.m_colorTable.length / 4;
    this.m_height = 1;
    this.m_depth = 0;
    renderState.m_context.texImage2D(vgl.GL.TEXTURE_2D,
                                     0, vgl.GL.RGBA, this.m_width, this.m_height, this.m_depth,
                                     vgl.GL.RGBA, vgl.GL.UNSIGNED_BYTE, new Uint8Array(this.m_colorTable));

    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, null);
    m_setupTimestamp.modified();
  };

  /**
   * Get color table used by the lookup table.
   *
   * @returns {number[]}
   */
  this.colorTable = function () {
    return this.m_colorTable;
  };

  /**
   * Set color table used by the lookup table.
   *
   * @param {number[]} colors
   * @returns {boolean}
   */
  this.setColorTable = function (colors) {
    if (this.m_colorTable === colors) {
      return false;
    }

    this.m_colorTable = colors;
    this.modified();
    return true;
  };

  return this;
};

inherit(vgl.lookupTable, vgl.texture);
