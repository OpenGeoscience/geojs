(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define('vgl', [], function () {
      return (root['vgl'] = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['vgl'] = factory();
  }
}(this, function () {

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl: true, ogs: true, inherit*/
/*exported vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

if (typeof ogs === 'undefined') {
  var ogs = {};
}

//////////////////////////////////////////////////////////////////////////////
/**
 * Create namespace for the given name
 *
 * @param ns_string
 * @returns {*|{}}
 */
//////////////////////////////////////////////////////////////////////////////
ogs.namespace = function (ns_string) {
  'use strict';

  var parts = ns_string.split('.'), parent = ogs, i;

  // strip redundant leading global
  if (parts[0] === 'ogs') {
    parts = parts.slice(1);
  }
  for (i = 0; i < parts.length; i += 1) {
    // create a property if it doesn't exist
    if (typeof parent[parts[i]] === 'undefined') {
      parent[parts[i]] = {};
    }
    parent = parent[parts[i]];
  }
  return parent;
};

/** vgl namespace */
var vgl = ogs.namespace('gl');

//////////////////////////////////////////////////////////////////////////////
/**
 * Convenient function to define JS inheritance
 *
 * @param C
 * @param P
 */
//////////////////////////////////////////////////////////////////////////////
function inherit(C, P) {
  'use strict';

  var F = function () {
  };
  F.prototype = P.prototype;
  C.prototype = new F();
  C.uber = P.prototype;
  C.prototype.constructor = C;
}

//////////////////////////////////////////////////////////////////////////////
/**
 * Convenient function to get size of an object
 *
 * @param obj
 * @returns {number} *
 */
//////////////////////////////////////////////////////////////////////////////
Object.size = function (obj) {
  'use strict';

  var size = 0, key = null;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      size += 1;
    }
  }
  return size;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Wrap GL enums. Currently to get values of the enums we need to create
 * or access the context.
 *
 * Using enums from here:
 * https://github.com/toji/dart-gl-enums/blob/master/lib/gl_enums.dart
 *
 * @class
 */
//////////////////////////////////////////////////////////////////////////////
vgl.GL = {
  ACTIVE_ATTRIBUTES : 0x8B89,
  ACTIVE_TEXTURE : 0x84E0,
  ACTIVE_UNIFORMS : 0x8B86,
  ALIASED_LINE_WIDTH_RANGE : 0x846E,
  ALIASED_POINT_SIZE_RANGE : 0x846D,
  ALPHA : 0x1906,
  ALPHA_BITS : 0x0D55,
  ALWAYS : 0x0207,
  ARRAY_BUFFER : 0x8892,
  ARRAY_BUFFER_BINDING : 0x8894,
  ATTACHED_SHADERS : 0x8B85,
  BACK : 0x0405,
  BLEND : 0x0BE2,
  BLEND_COLOR : 0x8005,
  BLEND_DST_ALPHA : 0x80CA,
  BLEND_DST_RGB : 0x80C8,
  BLEND_EQUATION : 0x8009,
  BLEND_EQUATION_ALPHA : 0x883D,
  BLEND_EQUATION_RGB : 0x8009,
  BLEND_SRC_ALPHA : 0x80CB,
  BLEND_SRC_RGB : 0x80C9,
  BLUE_BITS : 0x0D54,
  BOOL : 0x8B56,
  BOOL_VEC2 : 0x8B57,
  BOOL_VEC3 : 0x8B58,
  BOOL_VEC4 : 0x8B59,
  BROWSER_DEFAULT_WEBGL : 0x9244,
  BUFFER_SIZE : 0x8764,
  BUFFER_USAGE : 0x8765,
  BYTE : 0x1400,
  CCW : 0x0901,
  CLAMP_TO_EDGE : 0x812F,
  COLOR_ATTACHMENT0 : 0x8CE0,
  COLOR_BUFFER_BIT : 0x00004000,
  COLOR_CLEAR_VALUE : 0x0C22,
  COLOR_WRITEMASK : 0x0C23,
  COMPILE_STATUS : 0x8B81,
  COMPRESSED_TEXTURE_FORMATS : 0x86A3,
  CONSTANT_ALPHA : 0x8003,
  CONSTANT_COLOR : 0x8001,
  CONTEXT_LOST_WEBGL : 0x9242,
  CULL_FACE : 0x0B44,
  CULL_FACE_MODE : 0x0B45,
  CURRENT_PROGRAM : 0x8B8D,
  CURRENT_VERTEX_ATTRIB : 0x8626,
  CW : 0x0900,
  DECR : 0x1E03,
  DECR_WRAP : 0x8508,
  DELETE_STATUS : 0x8B80,
  DEPTH_ATTACHMENT : 0x8D00,
  DEPTH_BITS : 0x0D56,
  DEPTH_BUFFER_BIT : 0x00000100,
  DEPTH_CLEAR_VALUE : 0x0B73,
  DEPTH_COMPONENT : 0x1902,
  DEPTH_COMPONENT16 : 0x81A5,
  DEPTH_FUNC : 0x0B74,
  DEPTH_RANGE : 0x0B70,
  DEPTH_STENCIL : 0x84F9,
  DEPTH_STENCIL_ATTACHMENT : 0x821A,
  DEPTH_TEST : 0x0B71,
  DEPTH_WRITEMASK : 0x0B72,
  DITHER : 0x0BD0,
  DONT_CARE : 0x1100,
  DST_ALPHA : 0x0304,
  DST_COLOR : 0x0306,
  DYNAMIC_DRAW : 0x88E8,
  ELEMENT_ARRAY_BUFFER : 0x8893,
  ELEMENT_ARRAY_BUFFER_BINDING : 0x8895,
  EQUAL : 0x0202,
  FASTEST : 0x1101,
  FLOAT : 0x1406,
  FLOAT_MAT2 : 0x8B5A,
  FLOAT_MAT3 : 0x8B5B,
  FLOAT_MAT4 : 0x8B5C,
  FLOAT_VEC2 : 0x8B50,
  FLOAT_VEC3 : 0x8B51,
  FLOAT_VEC4 : 0x8B52,
  FRAGMENT_SHADER : 0x8B30,
  FRAMEBUFFER : 0x8D40,
  FRAMEBUFFER_ATTACHMENT_OBJECT_NAME : 0x8CD1,
  FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE : 0x8CD0,
  FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE : 0x8CD3,
  FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL : 0x8CD2,
  FRAMEBUFFER_BINDING : 0x8CA6,
  FRAMEBUFFER_COMPLETE : 0x8CD5,
  FRAMEBUFFER_INCOMPLETE_ATTACHMENT : 0x8CD6,
  FRAMEBUFFER_INCOMPLETE_DIMENSIONS : 0x8CD9,
  FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT : 0x8CD7,
  FRAMEBUFFER_UNSUPPORTED : 0x8CDD,
  FRONT : 0x0404,
  FRONT_AND_BACK : 0x0408,
  FRONT_FACE : 0x0B46,
  FUNC_ADD : 0x8006,
  FUNC_REVERSE_SUBTRACT : 0x800B,
  FUNC_SUBTRACT : 0x800A,
  GENERATE_MIPMAP_HINT : 0x8192,
  GEQUAL : 0x0206,
  GREATER : 0x0204,
  GREEN_BITS : 0x0D53,
  HIGH_FLOAT : 0x8DF2,
  HIGH_INT : 0x8DF5,
  INCR : 0x1E02,
  INCR_WRAP : 0x8507,
  INT : 0x1404,
  INT_VEC2 : 0x8B53,
  INT_VEC3 : 0x8B54,
  INT_VEC4 : 0x8B55,
  INVALID_ENUM : 0x0500,
  INVALID_FRAMEBUFFER_OPERATION : 0x0506,
  INVALID_OPERATION : 0x0502,
  INVALID_VALUE : 0x0501,
  INVERT : 0x150A,
  KEEP : 0x1E00,
  LEQUAL : 0x0203,
  LESS : 0x0201,
  LINEAR : 0x2601,
  LINEAR_MIPMAP_LINEAR : 0x2703,
  LINEAR_MIPMAP_NEAREST : 0x2701,
  LINES : 0x0001,
  LINE_LOOP : 0x0002,
  LINE_STRIP : 0x0003,
  LINE_WIDTH : 0x0B21,
  LINK_STATUS : 0x8B82,
  LOW_FLOAT : 0x8DF0,
  LOW_INT : 0x8DF3,
  LUMINANCE : 0x1909,
  LUMINANCE_ALPHA : 0x190A,
  MAX_COMBINED_TEXTURE_IMAGE_UNITS : 0x8B4D,
  MAX_CUBE_MAP_TEXTURE_SIZE : 0x851C,
  MAX_FRAGMENT_UNIFORM_VECTORS : 0x8DFD,
  MAX_RENDERBUFFER_SIZE : 0x84E8,
  MAX_TEXTURE_IMAGE_UNITS : 0x8872,
  MAX_TEXTURE_SIZE : 0x0D33,
  MAX_VARYING_VECTORS : 0x8DFC,
  MAX_VERTEX_ATTRIBS : 0x8869,
  MAX_VERTEX_TEXTURE_IMAGE_UNITS : 0x8B4C,
  MAX_VERTEX_UNIFORM_VECTORS : 0x8DFB,
  MAX_VIEWPORT_DIMS : 0x0D3A,
  MEDIUM_FLOAT : 0x8DF1,
  MEDIUM_INT : 0x8DF4,
  MIRRORED_REPEAT : 0x8370,
  NEAREST : 0x2600,
  NEAREST_MIPMAP_LINEAR : 0x2702,
  NEAREST_MIPMAP_NEAREST : 0x2700,
  NEVER : 0x0200,
  NICEST : 0x1102,
  NONE : 0,
  NOTEQUAL : 0x0205,
  NO_ERROR : 0,
  ONE : 1,
  ONE_MINUS_CONSTANT_ALPHA : 0x8004,
  ONE_MINUS_CONSTANT_COLOR : 0x8002,
  ONE_MINUS_DST_ALPHA : 0x0305,
  ONE_MINUS_DST_COLOR : 0x0307,
  ONE_MINUS_SRC_ALPHA : 0x0303,
  ONE_MINUS_SRC_COLOR : 0x0301,
  OUT_OF_MEMORY : 0x0505,
  PACK_ALIGNMENT : 0x0D05,
  POINTS : 0x0000,
  POLYGON_OFFSET_FACTOR : 0x8038,
  POLYGON_OFFSET_FILL : 0x8037,
  POLYGON_OFFSET_UNITS : 0x2A00,
  RED_BITS : 0x0D52,
  RENDERBUFFER : 0x8D41,
  RENDERBUFFER_ALPHA_SIZE : 0x8D53,
  RENDERBUFFER_BINDING : 0x8CA7,
  RENDERBUFFER_BLUE_SIZE : 0x8D52,
  RENDERBUFFER_DEPTH_SIZE : 0x8D54,
  RENDERBUFFER_GREEN_SIZE : 0x8D51,
  RENDERBUFFER_HEIGHT : 0x8D43,
  RENDERBUFFER_INTERNAL_FORMAT : 0x8D44,
  RENDERBUFFER_RED_SIZE : 0x8D50,
  RENDERBUFFER_STENCIL_SIZE : 0x8D55,
  RENDERBUFFER_WIDTH : 0x8D42,
  RENDERER : 0x1F01,
  REPEAT : 0x2901,
  REPLACE : 0x1E01,
  RGB : 0x1907,
  RGB565 : 0x8D62,
  RGB5_A1 : 0x8057,
  RGBA : 0x1908,
  RGBA4 : 0x8056,
  SAMPLER_2D : 0x8B5E,
  SAMPLER_CUBE : 0x8B60,
  SAMPLES : 0x80A9,
  SAMPLE_ALPHA_TO_COVERAGE : 0x809E,
  SAMPLE_BUFFERS : 0x80A8,
  SAMPLE_COVERAGE : 0x80A0,
  SAMPLE_COVERAGE_INVERT : 0x80AB,
  SAMPLE_COVERAGE_VALUE : 0x80AA,
  SCISSOR_BOX : 0x0C10,
  SCISSOR_TEST : 0x0C11,
  SHADER_TYPE : 0x8B4F,
  SHADING_LANGUAGE_VERSION : 0x8B8C,
  SHORT : 0x1402,
  SRC_ALPHA : 0x0302,
  SRC_ALPHA_SATURATE : 0x0308,
  SRC_COLOR : 0x0300,
  STATIC_DRAW : 0x88E4,
  STENCIL_ATTACHMENT : 0x8D20,
  STENCIL_BACK_FAIL : 0x8801,
  STENCIL_BACK_FUNC : 0x8800,
  STENCIL_BACK_PASS_DEPTH_FAIL : 0x8802,
  STENCIL_BACK_PASS_DEPTH_PASS : 0x8803,
  STENCIL_BACK_REF : 0x8CA3,
  STENCIL_BACK_VALUE_MASK : 0x8CA4,
  STENCIL_BACK_WRITEMASK : 0x8CA5,
  STENCIL_BITS : 0x0D57,
  STENCIL_BUFFER_BIT : 0x00000400,
  STENCIL_CLEAR_VALUE : 0x0B91,
  STENCIL_FAIL : 0x0B94,
  STENCIL_FUNC : 0x0B92,
  STENCIL_INDEX : 0x1901,
  STENCIL_INDEX8 : 0x8D48,
  STENCIL_PASS_DEPTH_FAIL : 0x0B95,
  STENCIL_PASS_DEPTH_PASS : 0x0B96,
  STENCIL_REF : 0x0B97,
  STENCIL_TEST : 0x0B90,
  STENCIL_VALUE_MASK : 0x0B93,
  STENCIL_WRITEMASK : 0x0B98,
  STREAM_DRAW : 0x88E0,
  SUBPIXEL_BITS : 0x0D50,
  TEXTURE : 0x1702,
  TEXTURE0 : 0x84C0,
  TEXTURE1 : 0x84C1,
  TEXTURE10 : 0x84CA,
  TEXTURE11 : 0x84CB,
  TEXTURE12 : 0x84CC,
  TEXTURE13 : 0x84CD,
  TEXTURE14 : 0x84CE,
  TEXTURE15 : 0x84CF,
  TEXTURE16 : 0x84D0,
  TEXTURE17 : 0x84D1,
  TEXTURE18 : 0x84D2,
  TEXTURE19 : 0x84D3,
  TEXTURE2 : 0x84C2,
  TEXTURE20 : 0x84D4,
  TEXTURE21 : 0x84D5,
  TEXTURE22 : 0x84D6,
  TEXTURE23 : 0x84D7,
  TEXTURE24 : 0x84D8,
  TEXTURE25 : 0x84D9,
  TEXTURE26 : 0x84DA,
  TEXTURE27 : 0x84DB,
  TEXTURE28 : 0x84DC,
  TEXTURE29 : 0x84DD,
  TEXTURE3 : 0x84C3,
  TEXTURE30 : 0x84DE,
  TEXTURE31 : 0x84DF,
  TEXTURE4 : 0x84C4,
  TEXTURE5 : 0x84C5,
  TEXTURE6 : 0x84C6,
  TEXTURE7 : 0x84C7,
  TEXTURE8 : 0x84C8,
  TEXTURE9 : 0x84C9,
  TEXTURE_2D : 0x0DE1,
  TEXTURE_BINDING_2D : 0x8069,
  TEXTURE_BINDING_CUBE_MAP : 0x8514,
  TEXTURE_CUBE_MAP : 0x8513,
  TEXTURE_CUBE_MAP_NEGATIVE_X : 0x8516,
  TEXTURE_CUBE_MAP_NEGATIVE_Y : 0x8518,
  TEXTURE_CUBE_MAP_NEGATIVE_Z : 0x851A,
  TEXTURE_CUBE_MAP_POSITIVE_X : 0x8515,
  TEXTURE_CUBE_MAP_POSITIVE_Y : 0x8517,
  TEXTURE_CUBE_MAP_POSITIVE_Z : 0x8519,
  TEXTURE_MAG_FILTER : 0x2800,
  TEXTURE_MIN_FILTER : 0x2801,
  TEXTURE_WRAP_S : 0x2802,
  TEXTURE_WRAP_T : 0x2803,
  TRIANGLES : 0x0004,
  TRIANGLE_FAN : 0x0006,
  TRIANGLE_STRIP : 0x0005,
  UNPACK_ALIGNMENT : 0x0CF5,
  UNPACK_COLORSPACE_CONVERSION_WEBGL : 0x9243,
  UNPACK_FLIP_Y_WEBGL : 0x9240,
  UNPACK_PREMULTIPLY_ALPHA_WEBGL : 0x9241,
  UNSIGNED_BYTE : 0x1401,
  UNSIGNED_INT : 0x1405,
  UNSIGNED_SHORT : 0x1403,
  UNSIGNED_SHORT_4_4_4_4 : 0x8033,
  UNSIGNED_SHORT_5_5_5_1 : 0x8034,
  UNSIGNED_SHORT_5_6_5 : 0x8363,
  VALIDATE_STATUS : 0x8B83,
  VENDOR : 0x1F00,
  VERSION : 0x1F02,
  VERTEX_ATTRIB_ARRAY_BUFFER_BINDING : 0x889F,
  VERTEX_ATTRIB_ARRAY_ENABLED : 0x8622,
  VERTEX_ATTRIB_ARRAY_NORMALIZED : 0x886A,
  VERTEX_ATTRIB_ARRAY_POINTER : 0x8645,
  VERTEX_ATTRIB_ARRAY_SIZE : 0x8623,
  VERTEX_ATTRIB_ARRAY_STRIDE : 0x8624,
  VERTEX_ATTRIB_ARRAY_TYPE : 0x8625,
  VERTEX_SHADER : 0x8B31,
  VIEWPORT : 0x0BA2,
  ZERO : 0
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class timestamp
 *
 * @class
 * @returns {vgl.timestamp}
 */
//////////////////////////////////////////////////////////////////////////////
var m_globalModifiedTime = 0;

vgl.timestamp = function () {
  'use strict';

  if (!(this instanceof vgl.timestamp)) {
    return new vgl.timestamp();
  }

  var m_modifiedTime = 0;

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update modified time
   */
  /////////////////////////////////////////////////////////////////////////////
  this.modified = function () {
    m_globalModifiedTime += 1;
    m_modifiedTime = m_globalModifiedTime;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get modified time
   *
   * @returns {number}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.getMTime = function () {
    return m_modifiedTime;
  };
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class object
 *
 * @class
 * @returns {vgl.object}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.object = function () {
  'use strict';

  if (!(this instanceof vgl.object)) {
    return new vgl.object();
  }

  /** @private */
  var m_modifiedTime = vgl.timestamp();
  m_modifiedTime.modified();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Mark the object modified
   */
  ////////////////////////////////////////////////////////////////////////////
  this.modified = function () {
    m_modifiedTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return modified time of the object
   *
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getMTime = function () {
    return m_modifiedTime.getMTime();
  };

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class event
 *
 * @class event
 * @returns {vgl.event}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.event = function () {
  'use strict';

  if (!(this instanceof vgl.event)) {
    return new vgl.event();
  }
  vgl.object.call(this);

  return this;
};

inherit(vgl.event, vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 *  types
 */
//////////////////////////////////////////////////////////////////////////////
vgl.event.keyPress = 'vgl.event.keyPress';
vgl.event.mousePress = 'vgl.event.mousePress';
vgl.event.mouseRelease = 'vgl.event.mouseRelease';
vgl.event.contextMenu = 'vgl.event.contextMenu';
vgl.event.configure = 'vgl.event.configure';
vgl.event.enable = 'vgl.event.enable';
vgl.event.mouseWheel = 'vgl.event.mouseWheel';
vgl.event.keyRelease = 'vgl.event.keyRelease';
vgl.event.middleButtonPress = 'vgl.event.middleButtonPress';
vgl.event.startInteraction = 'vgl.event.startInteraction';
vgl.event.enter = 'vgl.event.enter';
vgl.event.rightButtonPress = 'vgl.event.rightButtonPress';
vgl.event.middleButtonRelease = 'vgl.event.middleButtonRelease';
vgl.event.char = 'vgl.event.char';
vgl.event.disable = 'vgl.event.disable';
vgl.event.endInteraction = 'vgl.event.endInteraction';
vgl.event.mouseMove = 'vgl.event.mouseMove';
vgl.event.mouseOut = 'vgl.event.mouseOut';
vgl.event.expose = 'vgl.event.expose';
vgl.event.timer = 'vgl.event.timer';
vgl.event.leftButtonPress = 'vgl.event.leftButtonPress';
vgl.event.leave = 'vgl.event.leave';
vgl.event.rightButtonRelease = 'vgl.event.rightButtonRelease';
vgl.event.leftButtonRelease = 'vgl.event.leftButtonRelease';
vgl.event.click = 'vgl.event.click';
vgl.event.dblClick = 'vgl.event.dblClick';

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class boundingObject
 *
 * @class
 * @return {vgl.boundingObject}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.boundingObject = function () {
  'use strict';

  if (!(this instanceof vgl.boundingObject)) {
    return new vgl.boundingObject();
  }
  vgl.object.call(this);

  /** @private */
  var m_bounds = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      m_computeBoundsTimestamp = vgl.timestamp(),
      m_boundsDirtyTimestamp = vgl.timestamp();

  m_computeBoundsTimestamp.modified();
  m_boundsDirtyTimestamp.modified();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get current bounds of the object
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bounds = function () {
    return m_bounds;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if bounds are valid
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hasValidBounds = function (bounds) {
    if (bounds[0] === Number.MAX_VALUE ||
        bounds[1] === -Number.MAX_VALUE ||
        bounds[2] === Number.MAX_VALUE ||
        bounds[3] === -Number.MAX_VALUE ||
        bounds[4] === Number.MAX_VALUE ||
        bounds[5] === -Number.MAX_VALUE) {
      return false;
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set current bounds of the object
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setBounds = function (minX, maxX, minY, maxY, minZ, maxZ) {
    if (!this.hasValidBounds([minX, maxX, minY, maxY, minZ, maxZ])) {
      return;
    }

    m_bounds[0] = minX;
    m_bounds[1] = maxX;
    m_bounds[2] = minY;
    m_bounds[3] = maxY;
    m_bounds[4] = minZ;
    m_bounds[5] = maxZ;

    this.modified();
    m_computeBoundsTimestamp.modified();

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset bounds to default values
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resetBounds = function () {
    m_bounds[0] = Number.MAX_VALUE;
    m_bounds[1] = -Number.MAX_VALUE;
    m_bounds[2] = Number.MAX_VALUE;
    m_bounds[3] = -Number.MAX_VALUE;
    m_bounds[4] = Number.MAX_VALUE;
    m_bounds[5] = -Number.MAX_VALUE;

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute bounds of the object
   *
   * Should be implemented by the concrete class
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function () {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return bounds computation modification time
   *
   * @returns {vgl.timestamp}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBoundsTimestamp = function () {
    return m_computeBoundsTimestamp;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return bounds dirty timestamp
   *
   * @returns {vgl.timestamp}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.boundsDirtyTimestamp = function () {
    return m_boundsDirtyTimestamp;
  };

  this.resetBounds();

  return this;
};

vgl.boundingObject.ReferenceFrame = {
  'Relative' : 0,
  'Absolute' : 1
};

inherit(vgl.boundingObject, vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class node
 *
 * @class
 * @returns {vgl.node}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.node = function () {
  'use strict';

  if (!(this instanceof vgl.node)) {
    return new vgl.node();
  }
  vgl.boundingObject.call(this);

  /** @private */
  var m_parent = null,
      m_material = null,
      m_visible = true,
      m_overlay = false;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Accept visitor for scene traversal
   */
  ////////////////////////////////////////////////////////////////////////////
  this.accept = function (visitor) {
    visitor.visit(this);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return active material used by the node
   */
  ////////////////////////////////////////////////////////////////////////////
  this.material = function () {
    return m_material;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set material to be used the node
   *
   * @param material
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setMaterial = function (material) {
    if (material !== m_material) {
      m_material = material;
      this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if the node is visible or node
   *
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.visible = function () {
    return m_visible;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Turn ON/OFF visibility of the node
   *
   * @param flag
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setVisible = function (flag) {
    if (flag !== m_visible) {
      m_visible = flag;
      this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return current parent of the node
   *
   * @returns {null}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parent = function () {
    return m_parent;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set parent of the node
   *
   * @param parent
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setParent = function (parent) {
    if (parent !== m_parent) {
      if (m_parent !== null) {
        m_parent.removeChild(this);
      }
      m_parent = parent;
      this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if the node is an overlay node
   *
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.overlay = function () {
    return m_overlay;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set if the node is an overlay node or not
   *
   * @param flag
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setOverlay = function (flag) {
    if (m_overlay !== flag) {
      m_overlay = flag;
      this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /*
   * Traverse parent and their parent and so on
   */
  ////////////////////////////////////////////////////////////////////////////
  this.ascend = function (visitor) {
    visitor = visitor; /* unused parameter */
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Traverse children
   */
  ////////////////////////////////////////////////////////////////////////////
  this.traverse = function (visitor) {
    visitor = visitor; /* unused parameter */
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Mark that the bounds are modified
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.boundsModified = function () {
    // @todo Implement this
    this.boundsDirtyTimestamp().modified();

    if (m_parent !== null) {
      m_parent.boundsModified();
    }
  };

  return this;
};

inherit(vgl.node, vgl.boundingObject);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class groupNode
 *
 * @class
 * @returns {vgl.groupNode}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.groupNode = function () {
  'use strict';

  if (!(this instanceof vgl.groupNode)) {
    return new vgl.groupNode();
  }
  vgl.node.call(this);

  var m_children = [];

  // Reference to base class methods
  this.b_setVisible = this.setVisible;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Turn on / off visibility
   *
   * @param flag
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setVisible = function (flag) {
    var i;

    if (this.b_setVisible(flag) !== true) {
      return false;
    }

    for (i = 0; i < m_children.length; i += 1) {
      m_children[i].setVisible(flag);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Make the incoming node as child of the group node
   *
   * @param childNode
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addChild = function (childNode) {
    if (childNode instanceof vgl.node) {
      if (m_children.indexOf(childNode) === -1) {
        childNode.setParent(this);
        m_children.push(childNode);
        this.boundsDirtyTimestamp().modified();
        return true;
      }
      return false;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove parent-child relationship between the group and incoming node
   *
   * @param childNode
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeChild = function (childNode) {
    if (childNode.parent() === this) {
      var index = m_children.indexOf(childNode);
      m_children.splice(index, 1);
      this.boundsDirtyTimestamp().modified();
      return true;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove parent-child relationship between child nodes and the group node
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeChildren = function () {
    var i;
    for (i = 0; i < m_children.length; i += 1) {
      this.removeChild(m_children[i]);
    }

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return children of this group node
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.children = function () {
    return m_children;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return true if this group node has node as a child, false otherwise.
   *
   * @param node
   * @returns {bool}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hasChild = function (node) {
    var i = 0, child = false;

    for (i = 0; i < m_children.length; i += 1) {
      if (m_children[i] === node) {
        child = true;
        break;
      }
    }

    return child;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Accept a visitor and traverse the scene tree
   *
   * @param visitor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.accept = function (visitor) {
    visitor.visit(this);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Traverse the scene
   *
   * @param visitor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.traverse = function (visitor) {
    switch (visitor.type()) {
      case visitor.UpdateVisitor:
        this.traverseChildrenAndUpdateBounds(visitor);
        break;
      case visitor.CullVisitor:
        this.traverseChildren(visitor);
        break;
      default:
        break;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Traverse all of the children and update the bounds for each
   *
   * @param visitor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.traverseChildrenAndUpdateBounds = function (visitor) {
    var i;

    if (this.m_parent && this.boundsDirtyTimestamp().getMTime() >
      this.computeBoundsTimestamp().getMTime()) {
      // Flag parents bounds dirty.
      this.m_parent.boundsDirtyTimestamp.modified();
    }

    this.computeBounds();

    if (visitor.mode() === visitor.TraverseAllChildren) {
      for (i = 0; i < m_children.length(); i += 1) {
        m_children[i].accept(visitor);
        this.updateBounds(m_children[i]);
      }
    }

    this.computeBoundsTimestamp().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Traverse children of the group node
   *
   * @param visitor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.traverseChildren = function (visitor) {
    var i;

    if (visitor.mode() === vgl.vesVisitor.TraverseAllChildren) {
      for (i = 0; i < m_children.length(); i += 1) {
        m_children[i].accept(visitor);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute bounds for the group node
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function () {
    var i = 0;

    if (this.computeBoundsTimestamp().getMTime() >
        this.boundsDirtyTimestamp().getMTime()) {
      return;
    }

    for (i = 0; i < m_children.length; i += 1) {
      this.updateBounds(m_children[i]);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update bounds for the group node
   *
   * This method is used internally to update bounds of the group node by
   * traversing each of its child.
   *
   * @param child
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateBounds = function (child) {
    // FIXME: This check should not be required and possibly is incorrect
    if (child.overlay()) {
      return;
    }

    // Make sure that child bounds are upto date
    child.computeBounds();

    var bounds = this.bounds(),
        childBounds = child.bounds(),
        istep = 0,
        jstep = 0,
        i;

    for (i = 0; i < 3; i += 1) {
      istep = i * 2;
      jstep = i * 2 + 1;
      if (childBounds[istep] < bounds[istep]) {
        bounds[istep] = childBounds[istep];
      }
      if (childBounds[jstep] > bounds[jstep]) {
        bounds[jstep] = childBounds[jstep];
      }
    }

    this.setBounds(bounds[0], bounds[1], bounds[2], bounds[3],
                   bounds[4], bounds[5]);
  };

  return this;
};

inherit(vgl.groupNode, vgl.node);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, vec3, mat4, inherit*/
//////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class actor
 *
 * @class
 * @returns {vgl.actor}
 */
////////////////////////////////////////////////////////////////////////////
vgl.actor = function () {
  'use strict';

  if (!(this instanceof vgl.actor)) {
    return new vgl.actor();
  }
  vgl.node.call(this);

  /** @private */
  var m_this = this,
      m_transformMatrix = mat4.create(),
      m_referenceFrame = vgl.boundingObject.ReferenceFrame.Relative,
      m_mapper = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get transformation matrix used by the actor
   *
   * @returns {mat4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.matrix = function () {
    return m_transformMatrix;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set transformation matrix for the actor
   *
   * @param {mat4} 4X4 transformation matrix
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setMatrix = function (tmatrix) {
    if (tmatrix !== m_transformMatrix) {
      m_transformMatrix = tmatrix;
      m_this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get reference frame for the transformations
   *
   * @returns {String} Possible values are Absolute or Relative
   */
  ////////////////////////////////////////////////////////////////////////////
  this.referenceFrame = function () {
    return m_referenceFrame;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set reference frame for the transformations
   *
   * @param {vgl.boundingObject.ReferenceFrame}
   * referenceFrame Possible values are (Absolute | Relative)
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setReferenceFrame = function (referenceFrame) {
    if (referenceFrame !== m_referenceFrame) {
      m_referenceFrame = referenceFrame;
      m_this.modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return mapper where actor gets it behavior and data
   *
   * @returns {vgl.mapper}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mapper = function () {
    return m_mapper;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect an actor to its data source
   *
   * @param {vgl.mapper}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setMapper = function (mapper) {
    if (mapper !== m_mapper) {
      m_mapper = mapper;
      m_this.boundsModified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @todo
   */
  ////////////////////////////////////////////////////////////////////////////
  this.accept = function (visitor) {
    visitor = visitor; /* ignore this parameter */
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @todo
   */
  ////////////////////////////////////////////////////////////////////////////
  this.ascend = function (visitor) {
    visitor = visitor; /* ignore this parameter */
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute object space to world space matrix
   * @todo
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeLocalToWorldMatrix = function (matrix, visitor) {
    matrix = matrix; /* ignore this parameter */
    visitor = visitor; /* ignore this parameter */
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute world space to object space matrix
   * @todo
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeWorldToLocalMatrix = function (matrix, visitor) {
    matrix = matrix; /* ignore this parameter */
    visitor = visitor; /* ignore this parameter */
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute actor bounds
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function () {
    if (m_mapper === null || m_mapper === undefined) {
      m_this.resetBounds();
      return;
    }

    var computeBoundsTimestamp = m_this.computeBoundsTimestamp(),
        mapperBounds, minPt, maxPt, newBounds;

    if (m_this.boundsDirtyTimestamp().getMTime() > computeBoundsTimestamp.getMTime() ||
      m_mapper.boundsDirtyTimestamp().getMTime() > computeBoundsTimestamp.getMTime()) {

      m_mapper.computeBounds();
      mapperBounds = m_mapper.bounds();

      minPt = [mapperBounds[0], mapperBounds[2], mapperBounds[4]];
      maxPt = [mapperBounds[1], mapperBounds[3], mapperBounds[5]];

      vec3.transformMat4(minPt, minPt, m_transformMatrix);
      vec3.transformMat4(maxPt, maxPt, m_transformMatrix);

      newBounds = [
        minPt[0] > maxPt[0] ? maxPt[0] : minPt[0],
        minPt[0] > maxPt[0] ? minPt[0] : maxPt[0],
        minPt[1] > maxPt[1] ? maxPt[1] : minPt[1],
        minPt[1] > maxPt[1] ? minPt[1] : maxPt[1],
        minPt[2] > maxPt[2] ? maxPt[2] : minPt[2],
        minPt[2] > maxPt[2] ? minPt[2] : maxPt[2]
      ];

      m_this.setBounds(newBounds[0], newBounds[1],
                     newBounds[2], newBounds[3],
                     newBounds[4], newBounds[5]);

      computeBoundsTimestamp.modified();
    }
  };

  return m_this;
};

inherit(vgl.actor, vgl.node);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Freeze javascript object
 *
 * @param obj
 */
//////////////////////////////////////////////////////////////////////////////
vgl.freezeObject = function (obj) {
  'use strict';

  /**
   * Freezes an object, using Object.freeze if available, otherwise returns
   * the object unchanged.  This function should be used in setup code to prevent
   * errors from completely halting JavaScript execution in legacy browsers.
   *
   * @exports freezeObject
   */
  var freezedObject = Object.freeze(obj);
  if (typeof freezedObject === 'undefined') {
    freezedObject = function (o) {
      return o;
    };
  }

  return freezedObject;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Returns the first parameter if not undefined,
 * otherwise the second parameter.
 *
 * @class
 * @returns {vgl.defaultValue}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.defaultValue = function (a, b) {
  'use strict';

  if (typeof a !== 'undefined') {
    return a;
  }
  return b;
};

vgl.defaultValue.EMPTY_OBJECT = vgl.freezeObject({});

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class graphicsObject
 *
 * @class
 * @param type
 * @returns {vgl.graphicsObject}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.graphicsObject = function (type) {
  'use strict';

  type = type; /* unused parameter */
  if (!(this instanceof vgl.graphicsObject)) {
    return new vgl.graphicsObject();
  }
  vgl.object.call(this);

  var m_this = this;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Setup (initialize) the object
   *
   * @param renderState
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._setup = function (renderState) {
    renderState = renderState; /* unused parameter */
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove any resources acquired before deletion
   *
   * @param renderState
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._cleanup = function (renderState) {
    renderState = renderState; /* unused parameter */
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bind and activate
   *
   * @param renderState
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bind = function (renderState) {
    renderState = renderState; /* unused parameter */
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind and deactivate
   *
   * @param renderState
   * @returns {boolean}
   *
   * TODO: Change it to unbind (simple)
   */
  ////////////////////////////////////////////////////////////////////////////
  this.undoBind = function (renderState) {
    renderState = renderState; /* unused parameter */
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render the object
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function (renderState) {
    renderState = renderState; /* unused parameter */
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove the object and release its graphics resources
   */
  ////////////////////////////////////////////////////////////////////////////
  this.remove = function (renderState) {
    m_this._cleanup(renderState);
  };

  return m_this;
};

inherit(vgl.graphicsObject, vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, Uint16Array*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geojson reader
 *
 * This contains code that reads a geoJSON file and produces rendering
 * primitives from it.
 *
 * @class
 * @returns {vgl.geojsonReader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.geojsonReader = function () {
  'use strict';

  if (!(this instanceof vgl.geojsonReader)) {
    return new vgl.geojsonReader();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read scalars
   *
   * @param coordinates
   * @param geom
   * @param size_estimate
   * @param idx
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readScalars = function (coordinates, geom, size_estimate, idx) {
    var array = null,
        s = null,
        r  = null,
        g = null,
        b = null;

    if (this.m_scalarFormat === 'values' && coordinates.length === 4) {
      s = coordinates[3];
      array = geom.sourceData(vgl.vertexAttributeKeys.Scalar);

      if (!array) {
        array = new vgl.sourceDataSf();
        if (this.m_scalarRange) {
          array.setScalarRange(this.m_scalarRange[0], this.m_scalarRange[1]);
        }
        if (size_estimate !== undefined) {
          //array.length = size_estimate; //no, slow on Safari
          array.data().length = size_estimate;
        }
        geom.addSource(array);
      }
      if (size_estimate === undefined) {
        array.pushBack(s);
      } else {
        array.insertAt(idx, s);
      }
    } else if (this.m_scalarFormat === 'rgb' && coordinates.length === 6) {
      array = geom.sourceData(vgl.vertexAttributeKeys.Color);
      if (!array) {
        array = new vgl.sourceDataC3fv();
        if (size_estimate !== undefined) {
          array.length = size_estimate * 3;
        }
        geom.addSource(array);
      }
      r = coordinates[3];
      g = coordinates[4];
      b = coordinates[5];
      if (size_estimate === undefined) {
        array.pushBack([r, g, b]);
      } else {
        array.insertAt(idx, [r, g, b]);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read point data
   *
   * @param coordinates
   * @returns {vgl.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readPoint = function (coordinates) {
    var geom = new vgl.geometryData(),
        vglpoints = new vgl.points(),
        vglcoords = new vgl.sourceDataP3fv(),
        indices = new Uint16Array(1),
        x = null,
        y = null,
        z = null,
        i = null;

    geom.addSource(vglcoords);
    for (i = 0; i < 1; i += 1) {
      indices[i] = i;

      x = coordinates[0];
      y = coordinates[1];
      z = 0.0;
      if (coordinates.length > 2) {
        z = coordinates[2];
      }

      //console.log('read ' + x + ',' + y + ',' + z);
      vglcoords.pushBack([x, y, z]);

      //attributes
      this.readScalars(coordinates, geom);
    }

    vglpoints.setIndices(indices);
    geom.addPrimitive(vglpoints);
    geom.setName('aPoint');
    return geom;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read multipoint data
   *
   * @param coordinates
   * @returns {vgl.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readMultiPoint = function (coordinates) {
    var geom = new vgl.geometryData(),
        vglpoints = new vgl.points(),
        vglcoords = new vgl.sourceDataP3fv(),
        indices = new Uint16Array(coordinates.length),
        pntcnt = 0,
        estpntcnt = coordinates.length,
        x = null,
        y = null,
        z = null,
        i;

    //preallocate with size estimate
    vglcoords.data().length = estpntcnt * 3; //x,y,z

    for (i = 0; i < coordinates.length; i += 1) {
      indices[i] = i;
      x = coordinates[i][0];
      y = coordinates[i][1];
      z = 0.0;
      if (coordinates[i].length > 2) {
        z = coordinates[i][2];
      }

      //console.log('read ' + x + ',' + y + ',' + z);
      vglcoords.insertAt(pntcnt, [x, y, z]);

      //attributes
      this.readScalars(coordinates[i], geom, estpntcnt, pntcnt);

      pntcnt += 1;
    }

    vglpoints.setIndices(indices);
    geom.addPrimitive(vglpoints);
    geom.addSource(vglcoords);
    geom.setName('manyPoints');
    return geom;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read line string data
   *
   * @param coordinates
   * @returns {vgl.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readLineString = function (coordinates) {
    var geom = new vgl.geometryData(),
        vglline = new vgl.lineStrip(),
        vglcoords = new vgl.sourceDataP3fv(),
        indices = [],
        i = null,
        x = null,
        y = null,
        z = null;

    vglline.setIndicesPerPrimitive(coordinates.length);

    for (i = 0; i < coordinates.length; i += 1) {
      indices.push(i);
      x = coordinates[i][0];
      y = coordinates[i][1];
      z = 0.0;
      if (coordinates[i].length > 2) {
        z = coordinates[i][2];
      }

      //console.log('read ' + x + ',' + y + ',' + z);
      vglcoords.pushBack([x, y, z]);

      //attributes
      this.readScalars(coordinates[i], geom);
    }

    vglline.setIndices(indices);
    geom.addPrimitive(vglline);
    geom.addSource(vglcoords);
    geom.setName('aLineString');
    return geom;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read multi line string
   *
   * @param coordinates
   * @returns {vgl.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readMultiLineString = function (coordinates) {
    var geom = new vgl.geometryData(),
        vglcoords = new vgl.sourceDataP3fv(),
        pntcnt = 0,
        //lines should be at least 2 verts long, underest OK
        estpntcnt = coordinates.length * 2,
        i = null,
        j = null,
        x = null,
        y = null,
        z = null,
        indices = null,
        vglline = null,
        thisLineLength = null;

    // Preallocate with size estimate
    vglcoords.data().length = estpntcnt * 3; //x,y,z

    for (j = 0; j < coordinates.length; j += 1) {
      indices = [];
      //console.log('getting line ' + j);
      vglline = new vgl.lineStrip();
      thisLineLength = coordinates[j].length;
      vglline.setIndicesPerPrimitive(thisLineLength);
      for (i = 0; i < thisLineLength; i += 1) {
        indices.push(pntcnt);
        x = coordinates[j][i][0];
        y = coordinates[j][i][1];
        z = 0.0;
        if (coordinates[j][i].length > 2) {
          z = coordinates[j][i][2];
        }

        //console.log('read ' + x + ',' + y + ',' + z);
        vglcoords.insertAt(pntcnt, [x, y, z]);

        //attributes
        this.readScalars(coordinates[j][i], geom, estpntcnt * 2, pntcnt);

        pntcnt += 1;
      }

      vglline.setIndices(indices);
      geom.addPrimitive(vglline);
    }

    geom.setName('aMultiLineString');
    geom.addSource(vglcoords);
    return geom;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read polygon data
   *
   * @param coordinates
   * @returns {vgl.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readPolygon = function (coordinates) {
    //TODO: ignoring holes given in coordinates[1...]
    //TODO: ignoring convex
    //TODO: implement ear clipping in VGL instead of this to handle both
    var geom = new vgl.geometryData(),
        vglcoords = new vgl.sourceDataP3fv(),
        x = null,
        y = null,
        z  = null,
        thisPolyLength = coordinates[0].length,
        vl = 1,
        i = null,
        indices = null,
        vgltriangle = null;


    for (i = 0; i < thisPolyLength; i += 1) {
      x = coordinates[0][i][0];
      y = coordinates[0][i][1];
      z = 0.0;
      if (coordinates[0][i].length > 2) {
        z = coordinates[0][i][2];
      }

      //console.log('read ' + x + ',' + y + ',' + z);
      vglcoords.pushBack([x, y, z]);

      //attributes
      this.readScalars(coordinates[0][i], geom);

      if (i > 1) {
        //console.log('Cutting new triangle 0,'+ vl+ ','+ i);
        indices = new Uint16Array([0, vl, i]);
        vgltriangle = new vgl.triangles();
        vgltriangle.setIndices(indices);
        geom.addPrimitive(vgltriangle);
        vl = i;
      }
    }

    geom.setName('POLY');
    geom.addSource(vglcoords);
    return geom;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read multi polygon data
   *
   * @param coordinates
   * @returns {vgl.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readMultiPolygon = function (coordinates) {
    var geom = new vgl.geometryData(),
        vglcoords = new vgl.sourceDataP3fv(),
        ccount = 0,
        numPolys = coordinates.length,
        pntcnt = 0,
        estpntcnt = numPolys * 3, // assume triangles, underest is fine
        vgltriangle = new vgl.triangles(),
        indexes = [],
        i = null,
        j = null,
        x = null,
        y = null,
        z  = null,
        thisPolyLength = null,
        vf = null,
        vl = null,
        flip = null,
        flipped = false,
        tcount = 0;


    //var time1 = new Date().getTime()
    //var a = 0;
    //var b = 0;
    //var c = 0;
    //var d = 0;

    //preallocate with size estimate
    vglcoords.data().length = numPolys * 3; //x,y,z
    for (j = 0; j < numPolys; j += 1) {
      //console.log('getting poly ' + j);

      thisPolyLength = coordinates[j][0].length;
      vf = ccount;
      vl = ccount + 1;
      flip = [false, false, false];
      for (i = 0; i < thisPolyLength; i += 1) {
        //var timea = new Date().getTime()

        x = coordinates[j][0][i][0];
        y = coordinates[j][0][i][1];
        z = 0.0;
        if (coordinates[j][0][i].length > 2) {
          z = coordinates[j][0][i][2];
        }
        flipped = false;
        if (x > 180) {
          flipped = true;
          x = x - 360;
        }
        if (i === 0) {
          flip[0] = flipped;
        } else {
          flip[1 + (i - 1) % 2] = flipped;
        }
        //var timeb = new Date().getTime();
        //console.log('read ' + x + ',' + y + ',' + z);

        vglcoords.insertAt(pntcnt, [x, y, z]);
        //var timec = new Date().getTime();

        //attributes
        this.readScalars(coordinates[j][0][i], geom, estpntcnt, pntcnt);
        pntcnt += 1;
        //var timed = new Date().getTime()

        if (i > 1) {
          //if (vl < 50) {
          //console.log('Cutting new triangle ' + tcount + ':' + vf + ',' +
          //            vl + ',' + ccount);
          //console.log(indexes);
          //}
          if (flip[0] === flip[1] && flip[1] === flip[2]) {
            //indexes = indexes.concat([vf,vl,ccount]); //no, very slow in Safari
            indexes[tcount * 3 + 0] = vf;
            indexes[tcount * 3 + 1] = vl;
            indexes[tcount * 3 + 2] = ccount;
            tcount += 1;
          }
          //else {
          //  //TODO: duplicate triangles that straddle boundary on either side
          //}

          vl = ccount;
        }
        ccount += 1;
        //var timee = new Date().getTime()
        //a = a + (timeb-timea)
        //b = b + (timec-timeb)
        //c = c + (timed-timec)
        //d = d + (timee-timed)
      }
    }
    vgltriangle.setIndices(indexes);
    geom.addPrimitive(vgltriangle);

    //console.log('NUMPOLYS ' + pntcnt);
    //console.log('RMP: ', a, ',', b, ',', c, ',', d)
    //var time2 = new Date().getTime()

    geom.setName('aMultiPoly');
    geom.addSource(vglcoords);
    //var time3 = new Date().getTime()
    //console.log('RMP: ', time2-time1, ',', time3-time2)

    return geom;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @param object
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readGJObjectInt = function (object) {
    if (!object.hasOwnProperty('type')) {
      //console.log('uh oh, not a geojson object');
      return null;
    }

    //look for properties type annotation
    if (object.properties &&
        object.properties.ScalarFormat &&
        object.properties.ScalarFormat === 'values') {
      this.m_scalarFormat = 'values';
      if (object.properties.ScalarRange) {
        this.m_scalarRange = object.properties.ScalarRange;
      }
    }
    if (object.properties &&
        object.properties.ScalarFormat &&
        object.properties.ScalarFormat === 'rgb') {
      this.m_scalarFormat = 'rgb';
    }

    //TODO: ignoring 'crs' and 'bbox' and misc meta data on all of these,
    //best to handle as references into original probably
    var ret,
        type = object.type,
        next = null,
        nextset = null,
        i = null;

    switch (type) {
      case 'Point':
        //console.log('parsed Point');
        ret = this.readPoint(object.coordinates);
        break;
      case 'MultiPoint':
        //console.log('parsed MultiPoint');
        ret = this.readMultiPoint(object.coordinates);
        break;
      case 'LineString':
        //console.log('parsed LineString');
        ret = this.readLineString(object.coordinates);
        break;
      case 'MultiLineString':
        //console.log('parsed MultiLineString');
        ret = this.readMultiLineString(object.coordinates);
        break;
      case 'Polygon':
        //console.log('parsed Polygon');
        ret = this.readPolygon(object.coordinates);
        break;
      case 'MultiPolygon':
        //console.log('parsed MultiPolygon');
        ret = this.readMultiPolygon(object.coordinates);
        break;
      case 'GeometryCollection':
        //console.log('parsed GeometryCollection');
        nextset = [];
        for (i = 0; i < object.geometries.length; i += 1) {
          next = this.readGJObject(object.geometries[i]);
          nextset.push(next);
        }
        ret = nextset;
        break;
      case 'Feature':
        //console.log('parsed Feature');
        next = this.readGJObject(object.geometry);
        ret = next;
        break;
      case 'FeatureCollection':
        //console.log('parsed FeatureCollection');
        nextset = [];
        for (i = 0; i < object.features.length; i += 1) {
          next = this.readGJObject(object.features[i]);
          nextset.push(next);
        }
        ret = nextset;
        break;
      default:
        console.log('Don\'t understand type ' + type);
        ret = null;
        break;
    }
    return ret;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @param object
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readGJObject = function (object) {
    //var time1, time2;
    var ret;
    //time1 = new Date().getTime()
    ret = this.readGJObjectInt(object);
    //time2 = new Date().getTime()
    //console.log('ELAPSED: ', time2-time1)
    return ret;
  };

  /**
   * Linearize geometries
   *
   * @param geoms
   * @param geom
   */
  this.linearizeGeoms = function (geoms, geom) {
    var i = null;

    if (Object.prototype.toString.call(geom) === '[object Array]') {
      for (i = 0; i < geom.length; i += 1) {
        this.linearizeGeoms(geoms, geom[i]);
      }
    } else {
      geoms.push(geom);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read geometries from geojson object
   *
   * @param object
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readGeomObject = function (object) {
    var geom,
        geoms = [];

    geom = this.readGJObject(object);
    this.linearizeGeoms(geoms, geom);
    return geoms;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Given a buffer get rendering primitives
   *
   * @param buffer
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getPrimitives = function (buffer) {
    //console.log('Parsing geoJSON');
    if (!buffer) {
      return [];
    }

    var obj = JSON.parse(buffer),
      geom = this.readGJObject(obj),
      geoms = [];

    this.m_scalarFormat = 'none';
    this.m_scalarRange = null;

    this.linearizeGeoms(geoms, geom);

    return { 'geoms': geoms,
             'scalarFormat': this.m_scalarFormat,
             'scalarRange': this.m_scalarRange };
  };

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl*/
//////////////////////////////////////////////////////////////////////////////

vgl.data = function () {
  'use strict';

  if (!(this instanceof vgl.data)) {
    return new vgl.data();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return data type. Should be implemented by the derived class
   */
  ////////////////////////////////////////////////////////////////////////////
  this.type = function () {
  };
};

vgl.data.raster = 0;
vgl.data.point = 1;
vgl.data.lineString = 2;
vgl.data.polygon = 3;
vgl.data.geometry = 10;

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, Uint16Array, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class primitive
 *
 * @class
 * @return {vgl.primitive}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.primitive = function () {
  'use strict';

  if (!(this instanceof vgl.primitive)) {
    return new vgl.primitive();
  }

  /** @private */
  var m_indicesPerPrimitive = 0,
      m_primitiveType = 0,
      m_indicesValueType = 0,
      m_indices = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get indices of the primitive
   *
   * @returns {null}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.indices = function () {
    return m_indices;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create indices array for the primitive
   * @param type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createIndices = function (type) {
    type = type; /* unused parameters */
    // TODO Check for the type
    m_indices = new Uint16Array();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the number of indices
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numberOfIndices = function () {
    return m_indices.length;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return size of indices in bytes
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sizeInBytes = function () {
    return m_indices.length * Uint16Array.BYTES_PER_ELEMENT;
  };

  ////////////////////////////////////////////////////////////////////////////
  /*
   * Return primitive type g
   */
  ////////////////////////////////////////////////////////////////////////////
  this.primitiveType = function () {
    return m_primitiveType;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set primitive type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPrimitiveType = function (type) {
    m_primitiveType = type;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return count of indices that form a primitives
   */
  ////////////////////////////////////////////////////////////////////////////
  this.indicesPerPrimitive = function () {
    return m_indicesPerPrimitive;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set count of indices that form a primitive
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setIndicesPerPrimitive = function (count) {
    m_indicesPerPrimitive = count;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return indices value type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.indicesValueType = function () {
    return m_indicesValueType;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set indices value type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setIndicesValueType = function (type) {
    m_indicesValueType = type;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set indices from a array
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setIndices = function (indicesArray) {
    // TODO Check for the type
    m_indices = new Uint16Array(indicesArray);
  };

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class triangleStrip
 *
 * @returns {vgl.triangleStrip}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.triangleStrip = function () {
  'use strict';

  if (!(this instanceof vgl.triangleStrip)) {
    return new vgl.triangleStrip();
  }

  vgl.primitive.call(this);

  this.setPrimitiveType(vgl.GL.TRIANGLE_STRIP);
  this.setIndicesValueType(vgl.GL.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(3);

  return this;
};

inherit(vgl.triangleStrip, vgl.primitive);

////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class triangles
 *
 * @returns {vgl.triangles}
 */
////////////////////////////////////////////////////////////////////////////
vgl.triangles = function () {
  'use strict';

  if (!(this instanceof vgl.triangles)) {
    return new vgl.triangles();
  }
  vgl.primitive.call(this);

  this.setPrimitiveType(vgl.GL.TRIANGLES);
  this.setIndicesValueType(vgl.GL.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(3);

  return this;
};

inherit(vgl.triangles, vgl.primitive);

//////////////////////////////////////////////////////////////////////////////
/**
 * create a instance of lines primitive type
 *
 * @returns {vgl.lines}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.lines = function () {
  'use strict';

  if (!(this instanceof vgl.lines)) {
    return new vgl.lines();
  }
  vgl.primitive.call(this);

  this.setPrimitiveType(vgl.GL.LINES);
  this.setIndicesValueType(vgl.GL.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(2);

  return this;
};
inherit(vgl.lines, vgl.primitive);

//////////////////////////////////////////////////////////////////////////////
/**
 * create a instance of line strip primitive type
 *
 * @returns {vgl.lineStrip}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.lineStrip = function () {
  'use strict';

  if (!(this instanceof vgl.lineStrip)) {
    return new vgl.lineStrip();
  }
  vgl.primitive.call(this);

  this.setPrimitiveType(vgl.GL.LINE_STRIP);
  this.setIndicesValueType(vgl.GL.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(2);

  return this;
};
inherit(vgl.lineStrip, vgl.primitive);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class points
 *
 * @returns {vgl.points}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.points = function () {
  'use strict';

  if (!(this instanceof vgl.points)) {
    return new vgl.points();
  }
  vgl.primitive.call(this);

  this.setPrimitiveType(vgl.GL.POINTS);
  this.setIndicesValueType(vgl.GL.UNSIGNED_SHORT);
  this.setIndicesPerPrimitive(1);

  return this;
};

inherit(vgl.points, vgl.primitive);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vertexDataP3f
 *
 * @returns {vgl.vertexDataP3f}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.vertexDataP3f = function () {
  'use strict';

  if (!(this instanceof vgl.vertexDataP3f)) {
    return new vgl.vertexDataP3f();
  }

  /** @private */
  this.m_position = [];

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vertexDataP3N3f
 *
 * @class
 * @returns {vgl.vertexDataP3N3f}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.vertexDataP3N3f = function () {
  'use strict';

  if (!(this instanceof vgl.vertexDataP3N3f)) {
    return new vgl.vertexDataP3N3f();
  }

  this.m_position = [];
  this.m_normal = [];

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vertexDataP3T3f
 *
 * @class
 * @returns {vgl.vertexDataP3T3f}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.vertexDataP3T3f = function () {
  'use strict';

  if (!(this instanceof vgl.vertexDataP3T3f)) {
    return new vgl.vertexDataP3T3f();
  }

  this.m_position = [];
  this.m_texCoordinate = [];

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceData
 * @class
 * @returns {vgl.sourceData}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.sourceData = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceData)) {
    return new vgl.sourceData(arg);
  }

  arg = arg || {};
  var m_attributesMap = {},
      m_data = [],
      m_name = arg.name || 'Source ' + new Date().toISOString(),

      ////////////////////////////////////////////////////////////////////////////
      /**
       * Attribute data for the source
       */
      ////////////////////////////////////////////////////////////////////////////
      vglAttributeData = function () {
        // Number of components per group
        // Type of data type (GL_FLOAT etc)
        this.m_numberOfComponents = 0;
        // Size of data type
        this.m_dataType = 0;
        this.m_dataTypeSize = 0;
        // Specifies whether fixed-point data values should be normalized
        // (true) or converted directly as fixed-point values (false)
        // when they are accessed.
        this.m_normalized = false;
        // Strides for each attribute.
        this.m_stride = 0;
        // Offset
        this.m_offset = 0;
      };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data for this source
   *
   * @returns {Array or Float32Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function () {
    return m_data;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data for this source
   *
   * @returns {Array or Float32Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function () {
    return this.data();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * If the raw data is not a Float32Array, convert it to one.  Then, return
   * raw data for this source
   *
   * @returns {Float32Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.dataToFloat32Array = function () {
    if (!(m_data instanceof Float32Array)) {
      m_data = new Float32Array(m_data);
    }
    return m_data;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set data for this source
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setData = function (data) {
    if (!(data instanceof Array) && !(data instanceof Float32Array)) {
      console.log('[error] Requires array');
      return;
    }
    if (data instanceof Float32Array) {
      m_data = data;
    } else {
      m_data = data.slice(0);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add new attribute data to the source
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addAttribute = function (key, dataType, sizeOfDataType, offset, stride,
                               noOfComponents, normalized) {

    if (!m_attributesMap.hasOwnProperty(key)) {
      /* jshint newcap: false */
      //jscs:disable requireCapitalizedConstructors
      var newAttr = new vglAttributeData();
      //jscs:enable requireCapitalizedConstructors
      /* jshint newcap: true */
      newAttr.m_dataType = dataType;
      newAttr.m_dataTypeSize = sizeOfDataType;
      newAttr.m_offset = offset;
      newAttr.m_stride = stride;
      newAttr.m_numberOfComponents = noOfComponents;
      newAttr.m_normalized = normalized;
      m_attributesMap[key] = newAttr;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return size of the source data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sizeOfArray = function () {
    return Object.size(m_data);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return length of array
   */
  ////////////////////////////////////////////////////////////////////////////
  this.lengthOfArray = function () {
    return m_data.length;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return size of the source data in bytes
   */
  ////////////////////////////////////////////////////////////////////////////
  /*
    * TODO: code below is probably wrong.
    *   Example:
    *            format P3N3f
    *            m_data = [ 1, 2, 3, 4, 5, 6 ]; // contains one vertex,
    *                                    // one normal, m_data.length == 6
    *
    *       The inner loop computes:
    *             sizeInBytes += 3 * 4; // for position
    *             sizeInBytes += 3 * 4; // for normal
    *
    *        Then sizeInBytes *= 6; // m_data.length == 6
    *        which gives sizeInBytes == 144 bytes when it should have been 4*6 = 24
    */
  this.sizeInBytes = function () {
    var sizeInBytes = 0,
        keys = this.keys(), i;

    for (i = 0; i < keys.length(); i += 1) {
      sizeInBytes += this.numberOfComponents(keys[i]) *
                     this.sizeOfAttributeDataType(keys[i]);
    }

    sizeInBytes *= this.sizeOfArray();

    return sizeInBytes;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if there is attribute exists of a given key type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hasKey = function (key) {
    return m_attributesMap.hasOwnProperty(key);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return keys of all attributes
   */
  ////////////////////////////////////////////////////////////////////////////
  this.keys = function () {
    return Object.keys(m_attributesMap);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return number of attributes of source data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numberOfAttributes = function () {
    return Object.size(m_attributesMap);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return number of components of the attribute data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attributeNumberOfComponents = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_numberOfComponents;
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return if the attribute data is normalized
   */
  ////////////////////////////////////////////////////////////////////////////
  this.normalized = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_normalized;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return size of the attribute data type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sizeOfAttributeDataType = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_dataTypeSize;
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return attribute data type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attributeDataType = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_dataType;
    }

    return undefined;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return attribute offset
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attributeOffset = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_offset;
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return attribute stride
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attributeStride = function (key) {
    if (m_attributesMap.hasOwnProperty(key)) {
      return m_attributesMap[key].m_stride;
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to insert new vertex data at the end
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pushBack = function (vertexData) {
    vertexData = vertexData; /* unused parameter */
    // Should be implemented by the base class
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Insert new data block to the raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.insert = function (data) {
    var i;

    //m_data = m_data.concat(data); //no, slow on Safari
    /* If we will are given a Float32Array and don't have any other data, use
     * it directly. */
    if (!m_data.length && data.length && data instanceof Float32Array) {
      m_data = data;
      return;
    }
    /* If our internal array is immutable and we will need to change it, create
     * a regular mutable array from it. */
    if (!m_data.slice && (m_data.length || !data.slice)) {
      m_data = Array.prototype.slice.call(m_data);
    }
    if (!data.length) {
      /* data is a singular value, so append it to our array */
      m_data[m_data.length] = data;
    } else {
      /* We don't have any data currently, so it is faster to copy the data
       * using slice. */
      if (!m_data.length && data.slice) {
        m_data = data.slice(0);
      } else {
        for (i = 0; i < data.length; i += 1) {
          m_data[m_data.length] = data[i];
        }
      }
    }
  };

  this.insertAt = function (index, data) {
    var i;

    if (!data.length) {
      m_data[index] = data;
    } else {
      for (i = 0; i < data.length; i += 1) {
        m_data[index * data.length + i] = data[i];
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return name of the source data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.name = function () {
    return m_name;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set name of the source data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setName = function (name) {
    m_name = name;
  };


  return this;
};


vgl.sourceDataAnyfv = function (size, key, arg) {
  'use strict';
  if (!(this instanceof vgl.sourceDataAnyfv)) {
    return new vgl.sourceDataAnyfv(size, key, arg);
  }

  vgl.sourceData.call(this, arg);
  this.addAttribute(key, vgl.GL.FLOAT,
                    4, 0, size * 4, size, false);

  this.pushBack = function (value) {
    this.insert(value);
  };

  return this;
};
inherit(vgl.sourceDataAnyfv, vgl.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataP3T3f
 *
 * @returns {vgl.sourceDataP3T3f}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.sourceDataP3T3f = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataP3T3f)) {
    return new vgl.sourceDataP3T3f(arg);
  }
  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.Position, vgl.GL.FLOAT, 4, 0, 6 * 4, 3,
                    false);
  this.addAttribute(vgl.vertexAttributeKeys.TextureCoordinate, vgl.GL.FLOAT, 4, 12,
                    6 * 4, 3, false);

  this.pushBack = function (value) {
    this.insert(value.m_position);
    this.insert(value.m_texCoordinate);
  };

  return this;
};

inherit(vgl.sourceDataP3T3f, vgl.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataP3N3f
 *
 * @returns {vgl.sourceDataP3N3f}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.sourceDataP3N3f = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataP3N3f)) {
    return new vgl.sourceDataP3N3f(arg);
  }

  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.Position, vgl.GL.FLOAT, 4, 0, 6 * 4, 3,
                    false);
  this.addAttribute(vgl.vertexAttributeKeys.Normal, vgl.GL.FLOAT, 4, 12, 6 * 4, 3,
                    false);

  this.pushBack = function (value) {
    this.insert(value.m_position);
    this.insert(value.m_normal);
  };

  return this;
};

inherit(vgl.sourceDataP3N3f, vgl.sourceData);

/////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataP3fv
 *
 * @returns {vgl.sourceDataP3fv}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.sourceDataP3fv = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataP3fv)) {
    return new vgl.sourceDataP3fv(arg);
  }

  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.Position, vgl.GL.FLOAT, 4, 0, 3 * 4, 3,
                    false);

  this.pushBack = function (value) {
    this.insert(value);
  };

  return this;
};

inherit(vgl.sourceDataP3fv, vgl.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataT2fv
 *
 * @returns {vgl.sourceDataT2fv}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.sourceDataT2fv = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataT2fv)) {
    return new vgl.sourceDataT2fv(arg);
  }

  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.TextureCoordinate, vgl.GL.FLOAT, 4, 0,
                    2 * 4, 2, false);

  this.pushBack = function (value) {
    this.insert(value);
  };

  return this;
};

inherit(vgl.sourceDataT2fv, vgl.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataC3fv
 *
 * @returns {vgl.sourceDataC3fv}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.sourceDataC3fv = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataC3fv)) {
    return new vgl.sourceDataC3fv(arg);
  }

  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.Color, vgl.GL.FLOAT, 4, 0, 3 * 4, 3, false);

  this.pushBack = function (value) {
    this.insert(value);
  };

  return this;
};

inherit(vgl.sourceDataC3fv, vgl.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataSf meant to hold scalar float values
 *
 * @class
 * @returns {vgl.sourceDataSf}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.sourceDataSf = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataSf)) {
    return new vgl.sourceDataSf(arg);
  }

  var m_min = null,
      m_max = null,
      m_fixedmin = null,
      m_fixedmax = null;

  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.Scalar, vgl.GL.FLOAT, 4, 0, 4, 1, false);

  this.pushBack = function (value) {
    if (m_max === null || value > m_max) {
      m_max = value;
    }
    if (m_min === null || value < m_min) {
      m_min = value;
    }
    //this.insert(value); //no, slow on Safari
    this.data()[this.data().length] = value;
  };

  this.insertAt = function (index, value) {
    if (m_max === null || value > m_max) {
      m_max = value;
    }
    if (m_min === null || value < m_min) {
      m_min = value;
    }
    //call superclass ??
    //vgl.sourceData.insertAt.call(this, index, value);
    this.data()[index] = value;
  };

  this.scalarRange = function () {
    if (m_fixedmin === null || m_fixedmax === null) {
      return [m_min, m_max];
    }

    return [m_fixedmin, m_fixedmax];
  };

  this.setScalarRange = function (min, max) {
    m_fixedmin = min;
    m_fixedmax = max;
  };

  return this;
};

inherit(vgl.sourceDataSf, vgl.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sourceDataDf meant to hold data float values
 *
 * This source array is the best way to pass a array of floats to the shader
 * that has one entry for each of the vertices.
 *
 * @class
 * @returns {vgl.sourceDataDf}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.sourceDataDf = function (arg) {
  'use strict';

  if (!(this instanceof vgl.sourceDataDf)) {
    return new vgl.sourceDataDf(arg);
  }

  vgl.sourceData.call(this, arg);

  this.addAttribute(vgl.vertexAttributeKeys.Scalar, vgl.GL.FLOAT,
                    4, 0, 4, 1, false);

  this.pushBack = function (value) {
    this.data()[this.data().length] = value;
  };

  this.insertAt = function (index, value) {
    this.data()[index] = value;
  };

  return this;
};

inherit(vgl.sourceDataDf, vgl.sourceData);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class geometryData
 *
 * @class
 * @returns {vgl.geometryData}
 */
/////////////////////////////////////////////////////////////////////////////
vgl.geometryData = function () {
  'use strict';

  if (!(this instanceof vgl.geometryData)) {
    return new vgl.geometryData();
  }
  vgl.data.call(this);

  /** @private */
  var m_name = '',
      m_primitives = [],
      m_sources = [],
      m_bounds = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      m_computeBoundsTimestamp = vgl.timestamp(),
      m_boundsDirtyTimestamp = vgl.timestamp();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return type
   */
  ////////////////////////////////////////////////////////////////////////////
  this.type = function () {
    return vgl.data.geometry;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return ID of the geometry data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.name = function () {
    return m_name;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set name of the geometry data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setName = function (name) {
    m_name = name;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add new source
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addSource = function (source, sourceName) {
    // @todo Check if the incoming source has duplicate keys

    if (sourceName !== undefined) {
      source.setName(sourceName);
    }
    // NOTE This might not work on IE8 or lower
    if (m_sources.indexOf(source) === -1) {
      m_sources.push(source);

      if (source.hasKey(vgl.vertexAttributeKeys.Position)) {
        m_boundsDirtyTimestamp.modified();
      }
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return source for a given index. Returns 0 if not found.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.source = function (index) {
    if (index < m_sources.length) {
      return m_sources[index];
    }

    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return source with a specified name.  Returns 0 if not found.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sourceByName = function (sourceName) {
    for (var i = 0; i < m_sources.length; i += 1) {
      if (m_sources[i].name() === sourceName) {
        return m_sources[i];
      }
    }
    return 0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return number of sources
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numberOfSources = function () {
    return m_sources.length;
  };

  /**
   * Return source data given a key
   */
  this.sourceData = function (key) {
    var i;

    for (i = 0; i < m_sources.length; i += 1) {
      if (m_sources[i].hasKey(key)) {
        return m_sources[i];
      }
    }

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add new primitive
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addPrimitive = function (primitive) {
    m_primitives.push(primitive);
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return primitive for a given index. Returns null if not found.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.primitive = function (index) {
    if (index < m_primitives.length) {
      return m_primitives[index];
    }

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return number of primitives
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numberOfPrimitives = function () {
    return m_primitives.length;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return bounds [minX, maxX, minY, maxY, minZ, maxZ]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bounds = function () {
    if (m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime()) {
      this.computeBounds();
    }
    return m_bounds;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if bounds are dirty or mark them as such.
   *
   * @param dirty: true to set bounds as dirty.
   * Return true if bounds are dirty.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.boundsDirty = function (dirty) {
    if (dirty) {
      m_boundsDirtyTimestamp.modified();
    }
    return m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset bounds
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resetBounds = function () {
    m_bounds[0] = 0.0;
    m_bounds[1] = 0.0;
    m_bounds[2] = 0.0;
    m_bounds[3] = 0.0;
    m_bounds[4] = 0.0;
    m_bounds[5] = 0.0;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set bounds
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setBounds = function (minX, maxX, minY, maxY, minZ, maxZ) {
    m_bounds[0] = minX;
    m_bounds[1] = maxX;
    m_bounds[2] = minY;
    m_bounds[3] = maxY;
    m_bounds[4] = minZ;
    m_bounds[5] = maxZ;

    m_computeBoundsTimestamp.modified();

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute bounds
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function () {
    if (m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime()) {
      var attr = vgl.vertexAttributeKeys.Position,
          sourceData = this.sourceData(attr),
          data = sourceData.data(),
          numberOfComponents = sourceData.attributeNumberOfComponents(attr),
          stride = sourceData.attributeStride(attr),
          offset = sourceData.attributeOffset(attr),
          sizeOfDataType = sourceData.sizeOfAttributeDataType(attr),
          count = data.length,
          j, ib, jb, maxv, minv,
          value = null,
          vertexIndex;

      // We advance by index, not by byte
      stride /= sizeOfDataType;
      offset /= sizeOfDataType;

      this.resetBounds();

      for (j = 0; j < numberOfComponents; j += 1) {
        ib = j * 2;
        jb = j * 2 + 1;
        if (count) {
          maxv = minv = m_bounds[jb] = data[offset + j];
        } else {
          maxv = minv = 0;
        }
        for (vertexIndex = offset + stride + j; vertexIndex < count;
             vertexIndex += stride) {
          value = data[vertexIndex];
          if (value > maxv) {
            maxv = value;
          }
          if (value < minv) {
            minv = value;
          }
        }
        m_bounds[ib] = minv;  m_bounds[jb] = maxv;
      }

      m_computeBoundsTimestamp.modified();
    }
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns the vertex closest to a given position
   */
  ////////////////////////////////////////////////////////////////////////////
  this.findClosestVertex = function (point) {
    var attr = vgl.vertexAttributeKeys.Position,
        sourceData = this.sourceData(attr),
        sizeOfDataType = sourceData.sizeOfAttributeDataType(attr),
        numberOfComponents = sourceData.attributeNumberOfComponents(attr),
        data = sourceData.data(),
        stride = sourceData.attributeStride(attr) / sizeOfDataType,
        offset = sourceData.attributeOffset(attr) / sizeOfDataType,
        minDist = Number.MAX_VALUE,
        minIndex = null,
        vi, vPos, dx, dy, dz, dist, i;

    // assume positions are always triplets
    if (numberOfComponents !== 3) {
      console.log('[warning] Find closest vertex assumes three' +
        'component vertex ');
    }

    if (!point.z) {
      point = {x: point.x, y: point.y, z: 0};
    }

    for (vi = offset, i = 0; vi < data.length; vi += stride, i += 1) {
      vPos = [data[vi],
              data[vi + 1],
              data[vi + 2]];

      dx = vPos[0] - point.x;
      dy = vPos[1] - point.y;
      dz = vPos[2] - point.z;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        minIndex = i;
      }
    }
    return minIndex;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns the requested vertex position
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getPosition = function (index) {
    var attr = vgl.vertexAttributeKeys.Position,
        sourceData = this.sourceData(attr),
        sizeOfDataType = sourceData.sizeOfAttributeDataType(attr),
        numberOfComponents = sourceData.attributeNumberOfComponents(attr),
        data = sourceData.data(),
        stride = sourceData.attributeStride(attr) / sizeOfDataType,
        offset = sourceData.attributeOffset(attr) / sizeOfDataType;

    // assume positions are always triplets
    if (numberOfComponents !== 3) {
      console.log('[warning] getPosition assumes three component data');
    }

    return [data[offset + index * stride],
            data[offset + index * stride + 1],
            data[offset + index * stride + 2]];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns the scalar corresponding to a given vertex index
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getScalar = function (index) {
    var attr = vgl.vertexAttributeKeys.Scalar,
        sourceData = this.sourceData(attr),
        numberOfComponents, sizeOfDataType, data, stride, offset;

    if (!sourceData) {
      return null;
    }

    numberOfComponents = sourceData.attributeNumberOfComponents(attr);
    sizeOfDataType = sourceData.sizeOfAttributeDataType(attr);
    data = sourceData.data();
    stride = sourceData.attributeStride(attr) / sizeOfDataType;
    offset = sourceData.attributeOffset(attr) / sizeOfDataType;

    //console.log('index for scalar is ' + index);
    //console.log('offset for scalar is ' + offset);
    //console.log('stride for scalar is ' + stride);

    //console.log('have ' + data.length + ' scalars');

    if (index * stride + offset >= data.length) {
      console.log('access out of bounds in getScalar');
    }

    return data[index * stride + offset];
  };

  return this;
};

inherit(vgl.geometryData, vgl.data);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, Float32Array, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class mapper
 *
 * @class
 * @returns {vgl.mapper}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.mapper = function (arg) {
  'use strict';

  if (!(this instanceof vgl.mapper)) {
    return new vgl.mapper(arg);
  }
  vgl.boundingObject.call(this);

  /** @private */
  arg = arg || {};

  var m_dirty = true,
      m_color = [0.0, 1.0, 1.0],
      m_geomData = null,
      m_buffers = [],
      m_bufferVertexAttributeMap = {},
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      m_glCompileTimestamp = vgl.timestamp(),
      m_context = null,
      m_this = this;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete cached VBO if any
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteVertexBufferObjects = function (renderState) {
    var i;
    var context = m_context;
    if (renderState) {
      context = renderState.m_context;
    }
    if (context) {
      for (i = 0; i < m_buffers.length; i += 1) {
        context.deleteBuffer(m_buffers[i]);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create new VBO for all its geometryData sources and primitives
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function createVertexBufferObjects(renderState) {
    if (m_geomData) {
      if (renderState) {
        m_context = renderState.m_context;
      }
      var numberOfSources = m_geomData.numberOfSources(),
          i, j, k, bufferId = null, keys, ks, numberOfPrimitives, data;

      for (i = 0; i < numberOfSources; i += 1) {
        bufferId = m_context.createBuffer();
        m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, bufferId);
        data = m_geomData.source(i).data();
        if (!(data instanceof Float32Array)) {
          data = new Float32Array(data);
        }
        m_context.bufferData(vgl.GL.ARRAY_BUFFER, data,
                      m_dynamicDraw ? vgl.GL.DYNAMIC_DRAW :
                      vgl.GL.STATIC_DRAW);

        keys = m_geomData.source(i).keys();
        ks = [];

        for (j = 0; j < keys.length; j += 1) {
          ks.push(keys[j]);
        }

        m_bufferVertexAttributeMap[i] = ks;
        m_buffers[i] = bufferId;
      }

      numberOfPrimitives = m_geomData.numberOfPrimitives();
      for (k = 0; k < numberOfPrimitives; k += 1) {
        bufferId = m_context.createBuffer();
        m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, bufferId);
        m_context.bufferData(vgl.GL.ARRAY_BUFFER,
          m_geomData.primitive(k).indices(), vgl.GL.STATIC_DRAW);
        m_buffers[i] = bufferId;
        i += 1;
      }

      m_glCompileTimestamp.modified();
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear cache related to buffers
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function cleanUpDrawObjects(renderState) {
    renderState = renderState; /* avoid unused warning */
    m_bufferVertexAttributeMap = {};
    m_buffers = [];
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Setup draw objects; Delete old ones and create new ones
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function setupDrawObjects(renderState) {
    // Delete buffer objects from past if any.
    m_this.deleteVertexBufferObjects(renderState);

    // Clear any cache related to buffers
    cleanUpDrawObjects(renderState);

    // Now construct the new ones.
    createVertexBufferObjects(renderState);

    m_dirty = false;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute bounds of the data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function () {
    if (m_geomData === null || typeof m_geomData === 'undefined') {
      this.resetBounds();
      return;
    }

    var computeBoundsTimestamp = this.computeBoundsTimestamp(),
        boundsDirtyTimestamp = this.boundsDirtyTimestamp(),
        geomBounds = null;

    if (boundsDirtyTimestamp.getMTime() > computeBoundsTimestamp.getMTime()) {
      geomBounds = m_geomData.bounds();

      this.setBounds(geomBounds[0], geomBounds[1], geomBounds[2],
        geomBounds[3], geomBounds[4], geomBounds[5]) ;

      computeBoundsTimestamp.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get solid color of the geometry
   */
  ////////////////////////////////////////////////////////////////////////////
  this.color = function () {
    return m_color;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set solid color of the geometry. Default is teal [1.0, 1.0, 1.0]
   *
   * @param r Red component of the color [0.0 - 1.0]
   * @param g Green component of the color [0.0 - 1.0]
   * @param b Blue component of the color [0.0 - 1.0]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setColor = function (r, g, b) {
    m_color[0] = r;
    m_color[1] = g;
    m_color[2] = b;

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return stored geometry data if any
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometryData = function () {
    return m_geomData;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect mapper to its geometry data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setGeometryData = function (geom) {
    if (m_geomData !== geom) {
      m_geomData = geom;

      this.modified();
      this.boundsDirtyTimestamp().modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update the buffer used for a named source.
   *
   * @param {String} sourceName The name of the source to update.
   * @param {Object[] or Float32Array} values The values to use for the source.
   *    If not specified, use the source's own buffer.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateSourceBuffer = function (sourceName, values, renderState) {
    if (renderState) {
      m_context = renderState.m_context;
    }
    if (!m_context) {
      return false;
    }
    var bufferIndex = -1;
    for (var i = 0; i < m_geomData.numberOfSources(); i += 1) {
      if (m_geomData.source(i).name() === sourceName) {
        bufferIndex = i;
        break;
      }
    }
    if (bufferIndex < 0 || bufferIndex >= m_buffers.length) {
      return false;
    }
    if (!values) {
      values = m_geomData.source(i).dataToFloat32Array();
    }
    m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_buffers[bufferIndex]);
    if (values instanceof Float32Array) {
      m_context.bufferSubData(vgl.GL.ARRAY_BUFFER, 0, values);
    } else {
      m_context.bufferSubData(vgl.GL.ARRAY_BUFFER, 0,
                              new Float32Array(values));
    }
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the buffer used for a named source.  If the current buffer isn't a
   * Float32Array, it is converted to one.  This array can then be modified
   * directly, after which updateSourceBuffer can be called to update the
   * GL array.
   *
   * @param {String} sourceName The name of the source to update.
   * @returns {Float32Array} An array used for this source.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getSourceBuffer = function (sourceName) {
    var source = m_geomData.sourceByName(sourceName);
    if (!source) {
      return new Float32Array();
    }
    return source.dataToFloat32Array();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render the mapper
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function (renderState) {
    if (this.getMTime() > m_glCompileTimestamp.getMTime() ||
        renderState.m_contextChanged) {
      setupDrawObjects(renderState);
    }
    m_context = renderState.m_context;

    // Fixed vertex color
    m_context.vertexAttrib3fv(vgl.vertexAttributeKeys.Color, this.color());

    // TODO Use renderState
    var bufferIndex = 0,
        j = 0, i, noOfPrimitives = null, primitive = null;

    for (i in m_bufferVertexAttributeMap) {
      if (m_bufferVertexAttributeMap.hasOwnProperty(i)) {
        m_context.bindBuffer(vgl.GL.ARRAY_BUFFER,
                                         m_buffers[bufferIndex]);
        for (j = 0; j < m_bufferVertexAttributeMap[i].length; j += 1) {
          renderState.m_material
              .bindVertexData(renderState, m_bufferVertexAttributeMap[i][j]);
        }
        bufferIndex += 1;
      }
    }

    noOfPrimitives = m_geomData.numberOfPrimitives();
    for (j = 0; j < noOfPrimitives; j += 1) {
      m_context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_buffers[bufferIndex]);
      bufferIndex += 1;
      primitive = m_geomData.primitive(j);
      switch (primitive.primitiveType()) {
        case vgl.GL.POINTS:
          m_context.drawArrays(vgl.GL.POINTS, 0, primitive.numberOfIndices());
          break;
        case vgl.GL.LINES:
          m_context.drawArrays(vgl.GL.LINES, 0, primitive.numberOfIndices());
          break;
        case vgl.GL.LINE_STRIP:
          m_context.drawArrays(vgl.GL.LINE_STRIP, 0, primitive.numberOfIndices());
          break;
        case vgl.GL.TRIANGLES:
          m_context.drawArrays(vgl.GL.TRIANGLES, 0, primitive.numberOfIndices());
          break;
        case vgl.GL.TRIANGLE_STRIP:
          m_context.drawArrays(vgl.GL.TRIANGLE_STRIP, 0, primitive.numberOfIndices());
          break;
      }
      m_context.bindBuffer (vgl.GL.ARRAY_BUFFER, null);
    }
  };

  return this;
};

inherit(vgl.mapper, vgl.boundingObject);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

vgl.groupMapper = function () {
  'use strict';

  if (!(this instanceof vgl.groupMapper)) {
    return new vgl.groupMapper();
  }
  vgl.mapper.call(this);

  /** @private */
  var m_createMappersTimestamp = vgl.timestamp(),
      m_mappers = [],
      m_geomDataArray = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return stored geometry data if any
   *
   * @param index optional
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometryData = function (index) {
    if (index !== undefined && index < m_geomDataArray.length) {
      return m_geomDataArray[index];
    }

    if (m_geomDataArray.length > 0) {
      return m_geomDataArray[0];
    }

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect mapper to its geometry data
   *
   * @param geom {vgl.geomData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setGeometryData = function (geom) {
    if (m_geomDataArray.length === 1) {
      if (m_geomDataArray[0] === geom) {
        return;
      }
    }
    m_geomDataArray = [];
    m_geomDataArray.push(geom);
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return stored geometry data array if any
   */
  ////////////////////////////////////////////////////////////////////////////
  this.geometryDataArray = function () {
    return m_geomDataArray;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect mapper to its geometry data
   *
   * @param geoms {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setGeometryDataArray = function (geoms) {
    if (geoms instanceof Array) {
      if (m_geomDataArray !== geoms) {
        m_geomDataArray = [];
        m_geomDataArray = geoms;
        this.modified();
        return true;
      }
    } else {
      console.log('[error] Requies array of geometry data');
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute bounds of the data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function () {
    if (m_geomDataArray === null ||
        m_geomDataArray === undefined) {
      this.resetBounds();
      return;
    }

    var computeBoundsTimestamp = this.computeBoundsTimestamp(),
        boundsDirtyTimestamp = this.boundsDirtyTimestamp(),
        m_bounds = this.bounds(),
        geomBounds = null,
        i = null;

    if (boundsDirtyTimestamp.getMTime() >
        computeBoundsTimestamp.getMTime()) {

      for (i = 0; i < m_geomDataArray.length; i += 1) {
        geomBounds = m_geomDataArray[i].bounds();

        if (m_bounds[0] > geomBounds[0]) {
          m_bounds[0] = geomBounds[0];
        }
        if (m_bounds[1] < geomBounds[1]) {
          m_bounds[1] = geomBounds[1];
        }
        if (m_bounds[2] > geomBounds[2]) {
          m_bounds[2] = geomBounds[2];
        }
        if (m_bounds[3] < geomBounds[3]) {
          m_bounds[3] = geomBounds[3];
        }
        if (m_bounds[4] > geomBounds[4]) {
          m_bounds[4] = geomBounds[4];
        }
        if (m_bounds[5] < geomBounds[5]) {
          m_bounds[5] = geomBounds[5];
        }
      }

      this.modified();
      computeBoundsTimestamp.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render the mapper
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function (renderState) {
    var i = null;

    if (this.getMTime() > m_createMappersTimestamp.getMTime()) {
      // NOTE Hoping that it will release the graphics resources
      for (i = 0; i < m_geomDataArray.length; i += 1) {
        m_mappers.push(vgl.mapper());
        m_mappers[i].setGeometryData(m_geomDataArray[i]);
      }
      m_createMappersTimestamp.modified();
    }

    for (i = 0; i < m_mappers.length; i += 1) {
      m_mappers[i].render(renderState);
    }
  };

  return this;
};

inherit(vgl.groupMapper, vgl.mapper);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

vgl.materialAttributeType = {
  'Undefined' : 0x0,
  'ShaderProgram' : 0x1,
  'Texture' : 0x2,
  'Blend' : 0x3,
  'Depth' : 0x4
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class materialAttribute
 *
 * @class
 * @param type
 * @returns {vgl.materialAttribute}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.materialAttribute = function (type) {
  'use strict';

  if (!(this instanceof vgl.materialAttribute)) {
    return new vgl.materialAttribute();
  }
  vgl.graphicsObject.call(this);

  /** @private */
  var m_this = this,
      m_type = type,
      m_enabled = true;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return tyep of the material attribute
   *
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.type = function () {
    return m_type;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return if material attribute is enabled or not
   *
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.enabled = function () {
    return m_enabled;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bind and activate vertex specific data
   *
   * @param renderState
   * @param key
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bindVertexData = function (renderState, key) {
    renderState = renderState; /* unused parameter */
    key = key /* unused parameter */;
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind and deactivate vertex specific data
   *
   * @param renderState
   * @param key
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.undoBindVertexData = function (renderState, key) {
    renderState = renderState; /* unused parameter */
    key = key /* unused parameter */;
    return false;
  };

  return m_this;
};

inherit(vgl.materialAttribute, vgl.graphicsObject);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of clas blendFunction
 *
 * @class
 * @param source
 * @param destination
 * @returns {vgl.blendFunction}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.blendFunction = function (source, destination) {
  'use strict';

  if (!(this instanceof vgl.blendFunction)) {
    return new vgl.blendFunction(source, destination);
  }

  /** @private */
  var m_source = source,
      m_destination = destination;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Apply blend function to the current state
   *
   * @param {vgl.renderState}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.apply = function (renderState) {
    renderState.m_context.blendFuncSeparate(m_source, m_destination,
                         vgl.GL.ONE, vgl.GL.ONE_MINUS_SRC_ALPHA);
  };

  return this;
};

////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class blend
 *
 * @returns {vgl.blend}
 */
////////////////////////////////////////////////////////////////////////////
vgl.blend = function () {
  'use strict';

  if (!(this instanceof vgl.blend)) {
    return new vgl.blend();
  }
  vgl.materialAttribute.call(
    this, vgl.materialAttributeType.Blend);

  /** @private */
  var m_wasEnabled = false,
      m_blendFunction = vgl.blendFunction(vgl.GL.SRC_ALPHA,
                                          vgl.GL.ONE_MINUS_SRC_ALPHA);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bind blend attribute
   *
   * @param {vgl.renderState}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bind = function (renderState) {
    m_wasEnabled = renderState.m_context.isEnabled(vgl.GL.BLEND);

    if (this.enabled()) {
      renderState.m_context.enable(vgl.GL.BLEND);
      m_blendFunction.apply(renderState);
    } else {
      renderState.m_context.disable(vgl.GL.BLEND);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind blend attribute
   *
   * @param {vgl.renderState}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.undoBind = function (renderState) {
    if (m_wasEnabled) {
      renderState.m_context.enable(vgl.GL.BLEND);
    } else {
      renderState.m_context.disable(vgl.GL.BLEND);
    }

    return true;
  };

  return this;
};

inherit(vgl.blend, vgl.materialAttribute);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class material
 *
 * @class
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.material = function () {
  'use strict';

  if (!(this instanceof vgl.material)) {
    return new vgl.material();
  }
  vgl.graphicsObject.call(this);

  // / Private member variables
  var m_this = this,
      m_shaderProgram = new vgl.shaderProgram(),
      m_binNumber = 100,
      m_textureAttributes = {},
      m_attributes = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return bin number for the material
   *
   * @default 100
   * @returns {number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.binNumber = function () {
    return m_binNumber;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set bin number for the material
   *
   * @param binNo
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setBinNumber = function (binNo) {
    m_binNumber = binNo;
    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if incoming attribute already exists in the material
   *
   * @param attr
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.exists = function (attr) {
    if (attr.type() === vgl.materialAttribute.Texture) {
      return m_textureAttributes.hasOwnProperty(attr);
    }

    return m_attributes.hasOwnProperty(attr);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get uniform given a name

   * @param name Uniform name
   * @returns {vgl.uniform}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.uniform = function (name) {
    if (m_shaderProgram) {
      return m_shaderProgram.uniform(name);
    }

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get material attribute

   * @param attr Attribute name
   * @returns {vgl.materialAttribute}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.attribute = function (name) {
    if (m_attributes.hasOwnProperty(name)) {
      return m_attributes[name];
    }

    if (m_textureAttributes.hasOwnProperty(name)) {
      return m_textureAttributes[name];
    }

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set a new attribute for the material
   *
   * This method replace any existing attribute except for textures as
   * materials can have multiple textures.
   *
   * @param attr
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setAttribute = function (attr) {
    if (attr.type() === vgl.materialAttributeType.Texture &&
        m_textureAttributes[attr.textureUnit()] !== attr) {
      m_textureAttributes[attr.textureUnit()] = attr;
      m_this.modified();
      return true;
    }

    if (m_attributes[attr.type()] === attr) {
      return false;
    }

    // Shader is a very special attribute
    if (attr.type() === vgl.materialAttributeType.ShaderProgram) {
      m_shaderProgram = attr;
    }

    m_attributes[attr.type()] = attr;
    m_this.modified();
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add a new attribute to the material.
   *
   * @param attr
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addAttribute = function (attr) {
    if (m_this.exists(attr)) {
      return false;
    }

    if (attr.type() === vgl.materialAttributeType.Texture) {
      // TODO Currently we don't check if we are replacing or not.
      // It would be nice to have a flag for it.
      m_textureAttributes[attr.textureUnit()] = attr;
      m_this.modified();
      return true;
    }

    // Shader is a very special attribute
    if (attr.type() === vgl.materialAttributeType.ShaderProgram) {
      m_shaderProgram = attr;
    }

    m_attributes[attr.type()] = attr;
    m_this.modified();
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return shader program used by the material
   *
   * @returns {vgl.shaderProgram}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.shaderProgram = function () {
    return m_shaderProgram;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Setup (initialize) the material attribute
   *
   * @param renderState
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._setup = function (renderState) {
    renderState = renderState; /* unused parameter */
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove any resources acquired before deletion
   *
   * @param renderState
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._cleanup = function (renderState) {
    for (var key in m_attributes) {
      if (m_attributes.hasOwnProperty(key)) {
        m_attributes[key]._cleanup(renderState);
      }
    }

    for (key in m_textureAttributes) {
      if (m_textureAttributes.hasOwnProperty(key)) {
        m_textureAttributes[key]._cleanup(renderState);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bind and activate material states
   *
   * @param renderState
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bind = function (renderState) {
    var key = null;

    m_shaderProgram.bind(renderState);

    for (key in m_attributes) {
      if (m_attributes.hasOwnProperty(key)) {
        if (m_attributes[key] !== m_shaderProgram) {
          m_attributes[key].bind(renderState);
        }
      }
    }

    for (key in m_textureAttributes) {
      if (m_textureAttributes.hasOwnProperty(key)) {
        m_textureAttributes[key].bind(renderState);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Undo-bind and de-activate material states
   *
   * @param renderState
   */
  ////////////////////////////////////////////////////////////////////////////
  this.undoBind = function (renderState) {
    var key = null;
    for (key in m_attributes) {
      if (m_attributes.hasOwnProperty(key)) {
        m_attributes[key].undoBind(renderState);
      }
    }

    for (key in m_textureAttributes) {
      if (m_textureAttributes.hasOwnProperty(key)) {
        m_textureAttributes[key].undoBind(renderState);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bind vertex data
   *
   * @param renderState
   * @param key
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bindVertexData = function (renderState, key) {
    var i = null;

    for (i in m_attributes) {
      if (m_attributes.hasOwnProperty(i)) {
        m_attributes[i].bindVertexData(renderState, key);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind vertex data
   *
   * @param renderState
   * @param key
   */
  ////////////////////////////////////////////////////////////////////////////
  this.undoBindVertexData = function (renderState, key) {
    var i = null;

    for (i in m_attributes) {
      if (m_attributes.hasOwnProperty(i)) {
        m_attributes.undoBindVertexData(renderState, key);
      }
    }
  };

  return m_this;
};

vgl.material.RenderBin = {
  'Base' : 0,
  'Default' : 100,
  'Opaque' : 100,
  'Transparent' : 1000,
  'Overlay' : 10000
};

inherit(vgl.material, vgl.graphicsObject);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, vec2, vec3, vec4, mat4, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class renderState
 *
 * @returns {vgl.renderState}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.renderState = function () {
  'use strict';

  this.m_context = null;
  this.m_modelViewMatrix = mat4.create();
  this.m_normalMatrix = mat4.create();
  this.m_projectionMatrix = null;
  this.m_material = null;
  this.m_mapper = null;
};

////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class renderer *
 *
 * @returns {vgl.renderer}
 */
////////////////////////////////////////////////////////////////////////////
vgl.renderer = function (arg) {
  'use strict';

  if (!(this instanceof vgl.renderer)) {
    return new vgl.renderer(arg);
  }
  vgl.graphicsObject.call(this);
  arg = arg || {};

  /** @private */
  var m_this = this;
  m_this.m_renderWindow = null;
  m_this.m_contextChanged = false;
  m_this.m_sceneRoot = new vgl.groupNode();
  m_this.m_camera = new vgl.camera(arg);
  m_this.m_nearClippingPlaneTolerance = null;
  m_this.m_x = 0;
  m_this.m_y = 0;
  m_this.m_width = 0;
  m_this.m_height = 0;
  m_this.m_resizable = true;
  m_this.m_resetScene = true;
  m_this.m_layer = 0;
  m_this.m_renderPasses = null;
  m_this.m_resetClippingRange = true;
  m_this.m_depthBits = null;

  m_this.m_camera.addChild(m_this.m_sceneRoot);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get width of the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.width = function () {
    return m_this.m_width;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get height of the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.height = function () {
    return m_this.m_height;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get layer this renderer is associated with
   *
   * @return {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.layer = function () {
    return m_this.m_layer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set the layer this renderer is associated with.
   *
   * @param layerNo
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setLayer = function (layerNo) {
    m_this.m_layer = layerNo;
    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.isResizable = function () {
    return m_this.m_resizable;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setResizable = function (r) {
    m_this.m_resizable = r;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return render window (owner) of the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.renderWindow = function () {
    return m_this.m_renderWindow;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set render window for the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setRenderWindow = function (renWin) {
    if (m_this.m_renderWindow !== renWin) {
      if (m_this.m_renderWindow) {
        m_this.m_renderWindow.removeRenderer(this);
      }
      m_this.m_renderWindow = renWin;
      m_this.m_contextChanged = true;
      m_this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get background color
   */
  ////////////////////////////////////////////////////////////////////////////
  this.backgroundColor = function () {
    return m_this.m_camera.clearColor();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set background color of the renderer
   *
   * @param r
   * @param g
   * @param b
   * @param a
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setBackgroundColor = function (r, g, b, a) {
    m_this.m_camera.setClearColor(r, g, b, a);
    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get scene root
   *
   * @returns {vgl.groupNode}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.sceneRoot = function () {
    return m_this.m_sceneRoot;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get main camera of the renderer
   *
   * @returns {vgl.camera}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.camera = function () {
    return m_this.m_camera;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render the scene
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function () {
    var i, renSt, children, actor = null, sortedActors = [],
        mvMatrixInv = mat4.create(), clearColor = null;

    renSt = new vgl.renderState();
    renSt.m_renderer = m_this;
    renSt.m_context = m_this.renderWindow().context();
    if (!m_this.m_depthBits || m_this.m_contextChanged) {
      m_this.m_depthBits = renSt.m_context.getParameter(vgl.GL.DEPTH_BITS);
    }
    renSt.m_contextChanged = m_this.m_contextChanged;

    if (m_this.m_renderPasses) {
      for (i = 0; i < m_this.m_renderPasses.length; i += 1) {
        if (m_this.m_renderPasses[i].render(renSt)) {
          // Stop the rendering if render pass returns false
          console.log('returning');
          m_this.m_renderPasses[i].remove(renSt);
          return;
        }
        m_this.m_renderPasses[i].remove(renSt);
      }
    }

    renSt.m_context.enable(vgl.GL.DEPTH_TEST);
    renSt.m_context.depthFunc(vgl.GL.LEQUAL);

    /*jshint bitwise: false */
    if (m_this.m_camera.clearMask() & vgl.GL.COLOR_BUFFER_BIT) {
      clearColor = m_this.m_camera.clearColor();
      renSt.m_context.clearColor(clearColor[0], clearColor[1],
                                 clearColor[2], clearColor[3]);
    }

    if (m_this.m_camera.clearMask() & vgl.GL.DEPTH_BUFFER_BIT) {
      renSt.m_context.clearDepth(m_this.m_camera.clearDepth());
    }
    /*jshint bitwise: true */

    renSt.m_context.clear(m_this.m_camera.clearMask());

    // Set the viewport for this renderer
    renSt.m_context.viewport(m_this.m_x, m_this.m_y,
                             m_this.m_width, m_this.m_height);

    children = m_this.m_sceneRoot.children();

    if (children.length > 0 && m_this.m_resetScene) {
      m_this.resetCamera();
      m_this.m_resetScene = false;
    }

    for (i = 0; i < children.length; i += 1) {
      actor = children[i];

      // Compute the bounds even if the actor is not visible
      actor.computeBounds();

      // If bin number is < 0, then don't even bother
      // rendering the data
      if (actor.visible() && actor.material().binNumber() >= 0) {
        sortedActors.push([actor.material().binNumber(), actor]);
      }
    }

    // Now perform sorting
    sortedActors.sort(function (a, b) {return a[0] - b[0];});

    for (i = 0; i < sortedActors.length; i += 1) {
      actor = sortedActors[i][1];
      if (actor.referenceFrame() ===
          vgl.boundingObject.ReferenceFrame.Relative) {
        var view = m_this.m_camera.viewMatrix();
        /* If the view matrix is a plain array, keep it as such.  This is
         * intended to preserve precision, and will only be the case if the
         * view matrix was created by delibrately setting it as an array. */
        if (view instanceof Array) {
          renSt.m_modelViewMatrix = new Array(16);
        }
        mat4.multiply(renSt.m_modelViewMatrix, view, actor.matrix());
        renSt.m_projectionMatrix = m_this.m_camera.projectionMatrix();
        renSt.m_modelViewAlignment = m_this.m_camera.viewAlignment();
      } else {
        renSt.m_modelViewMatrix = actor.matrix();
        renSt.m_modelViewAlignment = null;
        renSt.m_projectionMatrix = mat4.create();
        mat4.ortho(renSt.m_projectionMatrix,
                   0, m_this.m_width, 0, m_this.m_height, -1, 1);
      }

      mat4.invert(mvMatrixInv, renSt.m_modelViewMatrix);
      mat4.transpose(renSt.m_normalMatrix, mvMatrixInv);
      renSt.m_material = actor.material();
      renSt.m_mapper = actor.mapper();

      // TODO Fix this shortcut
      renSt.m_material.bind(renSt);
      renSt.m_mapper.render(renSt);
      renSt.m_material.undoBind(renSt);
    }

    renSt.m_context.finish();
    m_this.m_contextChanged = false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Automatically set up the camera based on visible actors
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resetCamera = function () {
    m_this.m_camera.computeBounds();

    var vn = m_this.m_camera.directionOfProjection(),
        visibleBounds = m_this.m_camera.bounds(),
        center = [
          (visibleBounds[0] + visibleBounds[1]) / 2.0,
          (visibleBounds[2] + visibleBounds[3]) / 2.0,
          (visibleBounds[4] + visibleBounds[5]) / 2.0
        ],
        diagonals = [
          visibleBounds[1] - visibleBounds[0],
          visibleBounds[3] - visibleBounds[2],
          visibleBounds[5] - visibleBounds[4]
        ],
        radius = 0.0,
        aspect = m_this.m_camera.viewAspect(),
        angle = m_this.m_camera.viewAngle(),
        distance = null,
        vup = null;

    if (diagonals[0] > diagonals[1]) {
      if (diagonals[0] > diagonals[2]) {
        radius = diagonals[0] / 2.0;
      } else {
        radius = diagonals[2] / 2.0;
      }
    } else {
      if (diagonals[1] > diagonals[2]) {
        radius = diagonals[1] / 2.0;
      } else {
        radius = diagonals[2] / 2.0;
      }
    }

    // @todo Need to figure out what's happening here
    if (aspect >= 1.0) {
      angle = 2.0 * Math.atan(Math.tan(angle * 0.5) / aspect);
    } else {
      angle = 2.0 * Math.atan(Math.tan(angle * 0.5) * aspect);
    }

    distance = radius / Math.sin(angle * 0.5);
    vup = m_this.m_camera.viewUpDirection();

    if (Math.abs(vec3.dot(vup, vn)) > 0.999) {
      m_this.m_camera.setViewUpDirection(-vup[2], vup[0], vup[1]);
    }

    m_this.m_camera.setFocalPoint(center[0], center[1], center[2]);
    m_this.m_camera.setPosition(center[0] + distance * -vn[0],
      center[1] + distance * -vn[1], center[2] + distance * -vn[2]);

    m_this.resetCameraClippingRange(visibleBounds);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  * Check whether or not whether or not the bounds are valid
  */
  ////////////////////////////////////////////////////////////////////////////
  this.hasValidBounds = function (bounds) {
    if (bounds[0] === Number.MAX_VALUE ||
        bounds[1] === -Number.MAX_VALUE ||
        bounds[2] === Number.MAX_VALUE ||
        bounds[3] === -Number.MAX_VALUE ||
        bounds[4] === Number.MAX_VALUE ||
        bounds[5] === -Number.MAX_VALUE) {
      return false;
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Recalculate camera's clipping range
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resetCameraClippingRange = function (bounds) {
    if (typeof bounds === 'undefined') {
      m_this.m_camera.computeBounds();
      bounds = m_this.m_camera.bounds();
    }

    if (!m_this.hasValidBounds(bounds)) {
      return;
    }

    var vn = m_this.m_camera.viewPlaneNormal(),
        position = m_this.m_camera.position(),
        a = -vn[0],
        b = -vn[1],
        c = -vn[2],
        d = -(a * position[0] + b * position[1] + c * position[2]),
        range = vec2.create(),
        dist = null,
        i = null,
        j = null,
        k = null;

    if (!m_this.m_resetClippingRange) {
      return;
    }

    // Set the max near clipping plane and the min far clipping plane
    range[0] = a * bounds[0] + b * bounds[2] + c * bounds[4] + d;
    range[1] = 1e-18;

    // Find the closest / farthest bounding box vertex
    for (k = 0; k < 2; k += 1) {
      for (j = 0; j < 2; j += 1) {
        for (i = 0; i < 2; i += 1) {
          dist = a * bounds[i] + b * bounds[2 + j] + c * bounds[4 + k] + d;
          range[0] = (dist < range[0]) ? (dist) : (range[0]);
          range[1] = (dist > range[1]) ? (dist) : (range[1]);
        }
      }
    }

    // Do not let the range behind the camera throw off the calculation.
    if (range[0] < 0.0) {
      range[0] = 0.0;
    }

    // Give ourselves a little breathing room
    range[0] = 0.99 * range[0] - (range[1] - range[0]) * 0.5;
    range[1] = 1.01 * range[1] + (range[1] - range[0]) * 0.5;

    // Make sure near is not bigger than far
    range[0] = (range[0] >= range[1]) ? (0.01 * range[1]) : (range[0]);

    // Make sure near is at least some fraction of far - this prevents near
    // from being behind the camera or too close in front. How close is too
    // close depends on the resolution of the depth buffer.
    if (!m_this.m_nearClippingPlaneTolerance) {
      m_this.m_nearClippingPlaneTolerance = 0.01;

      if (m_this.m_depthBits && m_this.m_depthBits > 16) {
        m_this.m_nearClippingPlaneTolerance = 0.001;
      }
    }

    // make sure the front clipping range is not too far from the far clippnig
    // range, this is to make sure that the zbuffer resolution is effectively
    // used.
    if (range[0] < m_this.m_nearClippingPlaneTolerance * range[1]) {
      range[0] = m_this.m_nearClippingPlaneTolerance * range[1];
    }

    m_this.m_camera.setClippingRange(range[0], range[1]);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize viewport given a width and height
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function (width, height) {
    if (!width || !height) {
      return;
    }
    // @note: where do m_this.m_x and m_this.m_y come from?
    m_this.positionAndResize(m_this.m_x, m_this.m_y, width, height);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize viewport given a position, width and height
   */
  ////////////////////////////////////////////////////////////////////////////
  this.positionAndResize = function (x, y, width, height) {
    var i;

    // TODO move this code to camera
    if (x < 0 || y < 0 || width <= 0 || height <= 0) {
      console.log('[error] Invalid position and resize values',
        x, y, width, height);
      return;
    }

    //If we're allowing this renderer to resize ...
    if (m_this.m_resizable) {
      m_this.m_width = width;
      m_this.m_height = height;

      m_this.m_camera.setViewAspect(width / height);
      m_this.m_camera.setParallelExtents({width: width, height: height});
      m_this.modified();
    }

    if (m_this.m_renderPasses) {
      for (i = 0; i < m_this.m_renderPasses.length; i += 1) {
        m_this.m_renderPasses[i].resize(width, height);
        m_this.m_renderPasses[i].renderer().positionAndResize(x, y, width, height);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add new actor to the collection
   *
   * @param actor
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addActor = function (actor) {
    if (actor instanceof vgl.actor) {
      m_this.m_sceneRoot.addChild(actor);
      m_this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return true if this renderer has this actor attached, false otherwise.
   *
   * @param actor
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hasActor = function (actor) {
    return m_this.m_sceneRoot.hasChild(actor);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add an array of actors to the collection
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addActors = function (actors) {
    var i = null;
    if (actors instanceof Array) {
      for (i = 0; i < actors.length; i += 1) {
        m_this.m_sceneRoot.addChild(actors[i]);
      }
      m_this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove the actor from the collection
   *
   * @param actor
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeActor = function (actor) {
    if (m_this.m_sceneRoot.children().indexOf(actor) !== -1) {
      /* When we remove an actor, free the VBOs of the mapper and mark the
       * mapper as modified; it will reallocate VBOs as necessary. */
      if (actor.mapper()) {
        actor.mapper().deleteVertexBufferObjects();
        actor.mapper().modified();
      }
      m_this.m_sceneRoot.removeChild(actor);
      m_this.modified();
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove actors from the collection
   *
   * @param actors
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeActors = function (actors) {
    if (!(actors instanceof Array)) {
      return false;
    }

    var i;
    for (i = 0; i < actors.length; i += 1) {
      m_this.m_sceneRoot.removeChild(actors[i]);
    }
    m_this.modified();
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove all actors for a renderer
   *
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeAllActors = function () {
    return m_this.m_sceneRoot.removeChildren();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point in the world space to display space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function (worldPt, viewMatrix, projectionMatrix, width,
                                 height) {
    var viewProjectionMatrix = mat4.create(),
        winX = null,
        winY = null,
        winZ = null,
        winW = null,
        clipPt = null;


    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    // Transform world to clipping coordinates
    clipPt = vec4.create();
    vec4.transformMat4(clipPt, worldPt, viewProjectionMatrix);

    if (clipPt[3] !== 0.0) {
      clipPt[0] = clipPt[0] / clipPt[3];
      clipPt[1] = clipPt[1] / clipPt[3];
      clipPt[2] = clipPt[2] / clipPt[3];
      clipPt[3] = 1.0;
    }

    winX = (((clipPt[0]) + 1) / 2.0) * width;
    // We calculate -point3D.getY() because the screen Y axis is
    // oriented top->down
    winY = ((1 - clipPt[1]) / 2.0) * height;
    winZ = clipPt[2];
    winW = clipPt[3];

    return vec4.fromValues(winX, winY, winZ, winW);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point in display space to world space
   * @param displayPt
   * @param viewMatrix
   * @param projectionMatrix
   * @param width
   * @param height
   * @returns {vec4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function (displayPt, viewMatrix, projectionMatrix,
                                 width, height) {
    var x = (2.0 * displayPt[0] / width) - 1,
        y = -(2.0 * displayPt[1] / height) + 1,
        z = displayPt[2],
        viewProjectionInverse = mat4.create(),
        worldPt = null;

    mat4.multiply(viewProjectionInverse, projectionMatrix, viewMatrix);
    mat4.invert(viewProjectionInverse, viewProjectionInverse);

    worldPt = vec4.fromValues(x, y, z, 1);
    vec4.transformMat4(worldPt, worldPt, viewProjectionInverse);
    if (worldPt[3] !== 0.0) {
      worldPt[0] = worldPt[0] / worldPt[3];
      worldPt[1] = worldPt[1] / worldPt[3];
      worldPt[2] = worldPt[2] / worldPt[3];
      worldPt[3] = 1.0;
    }

    return worldPt;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the focusDisplayPoint
   * @returns {vec4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.focusDisplayPoint = function () {
    var focalPoint = m_this.m_camera.focalPoint(),
      focusWorldPt = vec4.fromValues(
        focalPoint[0], focalPoint[1], focalPoint[2], 1);

    return m_this.worldToDisplay(
      focusWorldPt, m_this.m_camera.viewMatrix(),
      m_this.m_camera.projectionMatrix(), m_this.m_width, m_this.m_height);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Will the scene be reset.
   * @returns {bool}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resetScene = function () {
    return m_this.m_resetScene;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * If true the scene will be reset, otherwise the scene will not be
   * automatically reset.
   *
   * @param reset
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setResetScene = function (reset) {
    if (m_this.m_resetScene !== reset) {
      m_this.m_resetScene = reset;
      m_this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Will the clipping range be reset
   * @returns {bool}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resetClippingRange = function () {
    return m_this.m_resetClippingRange;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * If true the camera clipping range will be reset, otherwise the scene will
   * not be automatically reset.
   *
   * @param reset
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setResetClippingRange = function (reset) {
    if (m_this.m_resetClippingRange !== reset) {
      m_this.m_resetClippingRange = reset;
      m_this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addRenderPass = function (renPass) {
    var i;

    if (m_this.m_renderPasses) {
      for (i = 0; i < m_this.m_renderPasses.length; i += 1) {
        if (renPass === m_this.m_renderPasses[i]) {
          return;
        }
      }
    }

    m_this.m_renderPasses = [];
    m_this.m_renderPasses.push(renPass);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeRenderPass = function (renPass) {
    renPass = renPass; // TODO Implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this._cleanup = function (renderState) {
    var children = m_this.m_sceneRoot.children();
    for (var i = 0; i < children.length; i += 1) {
      var actor = children[i];
      actor.material()._cleanup(renderState);
      actor.mapper()._cleanup(renderState);
    }

    m_this.m_sceneRoot.removeChildren();
  };

  return m_this;
};

inherit(vgl.renderer, vgl.graphicsObject);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, vec4, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class renderWindow
 *
 * @class
 * @returns {vgl.renderWindow}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.renderWindow = function (canvas) {
  'use strict';

  if (!(this instanceof vgl.renderWindow)) {
    return new vgl.renderWindow(canvas);
  }
  vgl.graphicsObject.call(this);

  /** @private */
  var m_this = this,
      m_x = 0,
      m_y = 0,
      m_width = 400,
      m_height = 400,
      m_canvas = canvas,
      m_activeRender = null,
      m_renderers = [],
      m_context = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get size of the render window
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.windowSize = function () {
    return [m_width, m_height];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set size of the render window
   *
   * @param width
   * @param height
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setWindowSize = function (width, height) {

    if (m_width !== width || m_height !== height) {
      m_width = width;
      m_height = height;

      m_this.modified();

      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get window position (top left coordinates)
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.windowPosition = function () {
    return [m_x, m_y];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set window position (top left coordinates)
   *
   * @param x
   * @param y
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setWindowPosition = function (x, y) {
    if ((m_x !== x) || (m_y !== y)) {
      m_x = x;
      m_y = y;
      m_this.modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return all renderers contained in the render window
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.renderers = function () {
    return m_renderers;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get active renderer of the the render window
   *
   * @returns vgl.renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.activeRenderer = function () {
    return m_activeRender;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add renderer to the render window
   *
   * @param ren
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addRenderer = function (ren) {
    if (m_this.hasRenderer(ren) === false) {
      m_renderers.push(ren);
      ren.setRenderWindow(m_this);
      if (m_activeRender === null) {
        m_activeRender = ren;
      }
      if (ren.layer() !== 0) {
        ren.camera().setClearMask(vgl.GL.DepthBufferBit);
      }
      m_this.modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove renderer from the render window
   *
   * @param ren
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeRenderer = function (ren) {
    var index = m_renderers.indexOf(ren);
    if (index !== -1) {
      if (m_activeRender === ren) {
        m_activeRender = null;
      }
      m_renderers.splice(index, 1);
      m_this.modified();
      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return a renderer at a given index
   *
   * @param index
   * @returns {vgl.renderer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getRenderer = function (index) {
    if (index < m_renderers.length) {
      return m_renderers[index];
    }

    console.log('[WARNING] Out of index array');
    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if the renderer exists
   *
   * @param ren
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.hasRenderer = function (ren) {
    var i;
    for (i = 0; i < m_renderers.length; i += 1) {
      if (ren === m_renderers[i]) {
        return true;
      }
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize window
   *
   * @param width
   * @param height
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function (width, height) {
    m_this.positionAndResize(m_x, m_y, width, height);
    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize and reposition the window
   *
   * @param x
   * @param y
   * @param width
   * @param height
   */
  ////////////////////////////////////////////////////////////////////////////
  this.positionAndResize = function (x, y, width, height) {
    m_x = x;
    m_y = y;
    m_width = width;
    m_height = height;
    var i;
    for (i = 0; i < m_renderers.length; i += 1) {
      m_renderers[i].positionAndResize(m_x, m_y, m_width, m_height);
    }
    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create the window
   *
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._setup = function (renderState) {
    renderState = renderState; /* unused parameter */
    m_context = null;

    try {
      // Try to grab the standard context. If it fails, fallback to
      // experimental.
      m_context = m_canvas.getContext('webgl') ||
            m_canvas.getContext('experimental-webgl');

      // Set width and height of renderers if not set already
      var i;
      for (i = 0; i < m_renderers.length; i += 1) {
        if ((m_renderers[i].width() > m_width) ||
            m_renderers[i].width() === 0 ||
            (m_renderers[i].height() > m_height) ||
            m_renderers[i].height() === 0) {
          m_renderers[i].resize(m_x, m_y, m_width, m_height);
        }
      }

      return true;
    }
    catch (e) {
    }

    // If we don't have a GL context, give up now
    if (!m_context) {
      console('[ERROR] Unable to initialize WebGL. Your browser may not support it.');
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return current GL context
   */
  ////////////////////////////////////////////////////////////////////////////
  this.context = function () {
    return m_context;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete this window and release any graphics resources
   */
  ////////////////////////////////////////////////////////////////////////////
  this._cleanup = function (renderState) {
    var i;
    for (i = 0; i < m_renderers.length; i += 1) {
      m_renderers[i]._cleanup(renderState);
    }
    vgl.clearCachedShaders(renderState ? renderState.m_context : null);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render the scene
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function () {
    var i;
    m_renderers.sort(function (a, b) {return a.layer() - b.layer();});
    for (i = 0; i < m_renderers.length; i += 1) {
      m_renderers[i].render();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the focusDisplayPoint from the activeRenderer
   * @returns {vec4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.focusDisplayPoint = function () {
    return m_activeRender.focusDisplayPoint();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point in display space to world space
   * @param {Number} x
   * @param {Number} y
   * @param {vec4} focusDisplayPoint
   * @returns {vec4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function (x, y, focusDisplayPoint, ren) {
    ren = ren === undefined ? ren = m_activeRender : ren;

    var camera = ren.camera();
    if (!focusDisplayPoint) {
      focusDisplayPoint = ren.focusDisplayPoint();
    }

    return ren.displayToWorld(
      vec4.fromValues(x, y, focusDisplayPoint[2], 1.0), camera.viewMatrix(),
      camera.projectionMatrix(), m_width, m_height);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point in display space to world space
   * @param {Number} x
   * @param {Number} y
   * @param {vec4} focusDisplayPoint
   * @returns {vec4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function (x, y, z, ren) {
    ren = ren === undefined ? ren = m_activeRender : ren;
    var camera = ren.camera();
    return ren.worldToDisplay(
      vec4.fromValues(x, y, z, 1.0), camera.viewMatrix(),
      camera.projectionMatrix(), m_width, m_height);
  };

  return m_this;
};

inherit(vgl.renderWindow, vgl.graphicsObject);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, vec3, vec4, mat4, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class camera
 *
 * @class
 * @returns {vgl.camera}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.camera = function (arg) {
  'use strict';

  if (!(this instanceof vgl.camera)) {
    return new vgl.camera(arg);
  }
  vgl.groupNode.call(this);
  arg = arg || {};

  /** @private */
  var m_viewAngle = (Math.PI * 30) / 180.0,
      m_position = vec4.fromValues(0.0, 0.0, 1.0, 1.0),
      m_focalPoint = vec4.fromValues(0.0, 0.0, 0.0, 1.0),
      m_centerOfRotation = vec3.fromValues(0.0, 0.0, 0.0),
      m_viewUp = vec4.fromValues(0.0, 1.0, 0.0, 0.0),
      m_rightDir = vec4.fromValues(1.0, 0.0, 0.0, 0.0),
      m_near = 0.01,
      m_far = 10000.0,
      m_viewAspect = 1.0,
      m_directionOfProjection = vec4.fromValues(0.0, 0.0, -1.0, 0.0),
      m_viewPlaneNormal = vec4.fromValues(0.0, 0.0, 1.0, 0.0),
      m_viewMatrix = mat4.create(),
      m_projectionMatrix = mat4.create(),
      m_computeModelViewMatrixTime = vgl.timestamp(),
      m_computeProjectMatrixTime = vgl.timestamp(),
      m_left = -1.0,
      m_right = 1.0,
      m_top = +1.0,
      m_bottom = -1.0,
      m_parallelExtents = {zoom: 1, tilesize: 256},
      m_enableTranslation = true,
      m_enableRotation = true,
      m_enableScale = true,
      m_enableParallelProjection = false,
      m_clearColor = [0.0, 0.0, 0.0, 0.0],
      m_clearDepth = 1.0,
      /*jshint bitwise: false */
      m_clearMask = vgl.GL.COLOR_BUFFER_BIT |
                    vgl.GL.DEPTH_BUFFER_BIT;
  /*jshint bitwise: true */

  if (arg.parallelProjection !== undefined) {
    m_enableParallelProjection = arg.parallelProjection ? true : false;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get view angle of the camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewAngle = function () {
    return m_viewAngle;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set view angle of the camera in degrees, which is converted to radians.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setViewAngleDegrees = function (a) {
    m_viewAngle = (Math.PI * a) / 180.0;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set view angle of the camera in degrees, which is converted to radians.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setViewAngle = function (a) {
    if (m_enableScale) {
      m_viewAngle = a;
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get position of the camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.position = function () {
    return m_position;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set position of the camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPosition = function (x, y, z) {
    if (m_enableTranslation) {
      m_position = vec4.fromValues(x, y, z, 1.0);
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get focal point of the camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.focalPoint = function () {
    return m_focalPoint;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set focal point of the camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setFocalPoint = function (x, y, z) {
    if (m_enableRotation && m_enableTranslation) {
      m_focalPoint = vec4.fromValues(x, y, z, 1.0);
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get view-up direction of camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewUpDirection = function () {
    return m_viewUp;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set view-up direction of the camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setViewUpDirection = function (x, y, z) {
    m_viewUp = vec4.fromValues(x, y, z, 0);
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get center of rotation for camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.centerOfRotation = function () {
    return m_centerOfRotation;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set center of rotation for camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setCenterOfRotation = function (centerOfRotation) {
    m_centerOfRotation = centerOfRotation;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get clipping range of the camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clippingRange = function () {
    return [m_near, m_far];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set clipping range of the camera
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setClippingRange = function (near, far) {
    m_near = near;
    m_far = far;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get view aspect
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewAspect = function () {
    return m_viewAspect;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set view aspect
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setViewAspect = function (aspect) {
    m_viewAspect = aspect;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return active mode for scaling (enabled / disabled)
   */
  ////////////////////////////////////////////////////////////////////////////
  this.enableScale = function () {
    return m_enableScale;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Enable/disable scaling
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setEnableScale = function (flag) {
    if (flag !== m_enableScale) {
      m_enableScale = flag;
      this.modified();
      return true;
    }

    return m_enableScale;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return active mode for rotation (enabled / disabled)
   */
  ////////////////////////////////////////////////////////////////////////////
  this.enableRotation = function () {
    return m_enableRotation;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Enable / disable rotation
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setEnableRotation = function (flag) {
    if (flag !== m_enableRotation) {
      m_enableRotation = flag;
      this.modified();
      return true;
    }

    return m_enableRotation;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return active mode for translation (enabled/disabled)
   */
  ////////////////////////////////////////////////////////////////////////////
  this.enableTranslation = function () {
    return m_enableTranslation;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Enable / disable translation
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setEnableTranslation = function (flag) {
    if (flag !== m_enableTranslation) {
      m_enableTranslation = flag;
      this.modified();
      return true;
    }

    return m_enableTranslation;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return if parallel projection is enabled
   */
  ////////////////////////////////////////////////////////////////////////////
  this.isEnabledParallelProjection = function () {
    return m_enableParallelProjection;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Enable / disable parallel projection
   */
  ////////////////////////////////////////////////////////////////////////////
  this.enableParallelProjection = function (flag) {
    if (flag !== m_enableParallelProjection) {
      m_enableParallelProjection = flag;
      this.modified();
      return true;
    }

    return m_enableParallelProjection;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Enable / disable parallel projection
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setEnableParallelProjection = function (flag) {
    return this.enableParallelProjection(flag);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get parallel projection parameters
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parallelProjection = function () {
    return {left: m_left, right: m_right, top: m_top, bottom: m_bottom};
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set parallel projection parameters
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setParallelProjection = function (left, right, top, bottom) {
    m_left = left;
    m_right = right;
    m_top = top;
    m_bottom = bottom;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get parallel projection extents parameters
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parallelExtents = function () {
    return m_parallelExtents;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set parallel projection extents parameters
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setParallelExtents = function (extents) {
    var prop = ['width', 'height', 'zoom', 'tilesize'], mod = false, i, key;
    for (i = 0; i < prop.length; i += 1) {
      key = prop[i];
      if (extents[key] !== undefined &&
          extents[key] !== m_parallelExtents[key]) {
        m_parallelExtents[key] = extents[key];
        mod = true;
      }
    }
    if (mod && m_parallelExtents.width && m_parallelExtents.height &&
        m_parallelExtents.zoom !== undefined && m_parallelExtents.tilesize) {
      var unitsPerPixel = this.unitsPerPixel(m_parallelExtents.zoom,
                                             m_parallelExtents.tilesize);
      m_right = unitsPerPixel * m_parallelExtents.width / 2;
      m_left = -m_right;
      m_top = unitsPerPixel * m_parallelExtents.height / 2;
      m_bottom = -m_top;
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute the units per pixel.
   *
   * @param zoom: tile zoom level.
   * @param tilesize: number of pixels per tile (defaults to 256).
   * @returns: unitsPerPixel.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.unitsPerPixel = function (zoom, tilesize) {
    tilesize = tilesize || 256;
    return 360.0 * Math.pow(2, -zoom) / tilesize;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return direction of projection
   */
  ////////////////////////////////////////////////////////////////////////////
  this.directionOfProjection = function () {
    this.computeDirectionOfProjection();
    return m_directionOfProjection;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return view plane normal direction
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewPlaneNormal = function () {
    this.computeViewPlaneNormal();
    return m_viewPlaneNormal;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return view-matrix for the camera This method does not compute the
   * view-matrix for the camera. It is assumed that a call to computeViewMatrix
   * has been made earlier.
   *
   * @returns {mat4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewMatrix = function () {
    return this.computeViewMatrix();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set the view-matrix for the camera and mark that it is up to date so that
   * it won't be recomputed unless something else changes.
   *
   * @param {mat4} view: new view matrix.
   * @param {boolean} preserveType: if true, clone the input using slice.  This
   *    can be used to ensure the array is a specific precision.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setViewMatrix = function (view, preserveType) {
    if (!preserveType) {
      mat4.copy(m_viewMatrix, view);
    } else {
      m_viewMatrix = view.slice();
    }
    m_computeModelViewMatrixTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return camera projection matrix This method does not compute the
   * projection-matrix for the camera. It is assumed that a call to
   * computeProjectionMatrix has been made earlier.
   *
   * @returns {mat4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.projectionMatrix = function () {
    return this.computeProjectionMatrix();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set the projection-matrix for the camera and mark that it is up to date so
   * that it won't be recomputed unless something else changes.
   *
   * @param {mat4} proj: new projection matrix.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setProjectionMatrix = function (proj) {
    mat4.copy(m_projectionMatrix, proj);
    m_computeProjectMatrixTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return clear mask used by this camera
   *
   * @returns {number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clearMask = function () {
    return m_clearMask;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set clear mask for camera
   *
   * @param mask
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setClearMask = function (mask) {
    m_clearMask = mask;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get clear color (background color) of the camera
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clearColor = function () {
    return m_clearColor;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set clear color (background color) for the camera
   *
   * @param color RGBA
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setClearColor = function (r, g, b, a) {
    m_clearColor[0] = r;
    m_clearColor[1] = g;
    m_clearColor[2] = b;
    m_clearColor[3] = a;

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @returns {{1.0: null}}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clearDepth = function () {
    return m_clearDepth;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @param depth
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setClearDepth = function (depth) {
    m_clearDepth = depth;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute direction of projection
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeDirectionOfProjection = function () {
    vec3.subtract(m_directionOfProjection, m_focalPoint, m_position);
    vec3.normalize(m_directionOfProjection, m_directionOfProjection);
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute view plane normal
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeViewPlaneNormal = function () {
    m_viewPlaneNormal[0] = -m_directionOfProjection[0];
    m_viewPlaneNormal[1] = -m_directionOfProjection[1];
    m_viewPlaneNormal[2] = -m_directionOfProjection[2];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Move camera closer or further away from the scene
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function (d, dir) {
    if (d === 0) {
      return;
    }

    if (!m_enableTranslation) {
      return;
    }

    d = d * vec3.distance(m_focalPoint, m_position);
    if (!dir) {
      dir = m_directionOfProjection;
      m_position[0] = m_focalPoint[0] - d * dir[0];
      m_position[1] = m_focalPoint[1] - d * dir[1];
      m_position[2] = m_focalPoint[2] - d * dir[2];
    } else {
      m_position[0] = m_position[0]  + d * dir[0];
      m_position[1] = m_position[1]  + d * dir[1];
      m_position[2] = m_position[2]  + d * dir[2];
    }

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Move camera sideways
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pan = function (dx, dy, dz) {
    if (!m_enableTranslation) {
      return;
    }

    m_position[0] += dx;
    m_position[1] += dy;
    m_position[2] += dz;

    m_focalPoint[0] += dx;
    m_focalPoint[1] += dy;
    m_focalPoint[2] += dz;

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute camera coordinate axes
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeOrthogonalAxes = function () {
    this.computeDirectionOfProjection();
    vec3.cross(m_rightDir, m_directionOfProjection, m_viewUp);
    vec3.normalize(m_rightDir, m_rightDir);
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Rotate camera around center of rotation
   * @param dx Rotation around vertical axis in degrees
   * @param dy Rotation around horizontal axis in degrees
   */
  ////////////////////////////////////////////////////////////////////////////
  this.rotate = function (dx, dy) {
    if (!m_enableRotation) {
      return;
    }

    // Convert degrees into radians
    dx = 0.5 * dx * (Math.PI / 180.0);
    dy = 0.5 * dy * (Math.PI / 180.0);

    var mat = mat4.create(),
        inverseCenterOfRotation = new vec3.create();

    mat4.identity(mat);

    inverseCenterOfRotation[0] = -m_centerOfRotation[0];
    inverseCenterOfRotation[1] = -m_centerOfRotation[1];
    inverseCenterOfRotation[2] = -m_centerOfRotation[2];

    mat4.translate(mat, mat, m_centerOfRotation);
    mat4.rotate(mat, mat, dx, m_viewUp);
    mat4.rotate(mat, mat, dy, m_rightDir);
    mat4.translate(mat, mat, inverseCenterOfRotation);

    vec4.transformMat4(m_position, m_position, mat);
    vec4.transformMat4(m_focalPoint, m_focalPoint, mat);

    // Update viewup vector
    vec4.transformMat4(m_viewUp, m_viewUp, mat);
    vec4.normalize(m_viewUp, m_viewUp);

    // Update direction of projection
    this.computeOrthogonalAxes();

    // Mark modified
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute camera view matrix
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeViewMatrix = function () {
    if (m_computeModelViewMatrixTime.getMTime() < this.getMTime()) {
      mat4.lookAt(m_viewMatrix, m_position, m_focalPoint, m_viewUp);
      m_computeModelViewMatrixTime.modified();
    }
    return m_viewMatrix;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if the texture should be aligned to the screen.  Alignment only
   * occurs if the parallel extents contain width, height, and a
   * close-to-integer zoom level, and if the units-per-pixel value has been
   * computed.  The camera must either be in parallel projection mode OR must
   * have a perspective camera which is oriented along the z-axis without any
   * rotation.
   *
   * @returns: either null if no alignment should occur, or an alignment object
   *           with the rounding value and offsets.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewAlignment = function () {
    if (!m_enableParallelProjection) {
      /* If we aren't in parallel projection mode, ensure that the projection
       * matrix meets strict specifications */
      var proj = this.projectionMatrix();
      if (proj[1] || proj[2] || proj[3] || proj[4] || proj[6] || proj[7] ||
          proj[8] || proj[9] || proj[12] || proj[13] || proj[15]) {
        return null;
      }
    }
    var unitsPerPixel = this.unitsPerPixel(m_parallelExtents.zoom,
                                           m_parallelExtents.tilesize);
    /* If we don't have screen dimensions, we can't know how to align pixels */
    if (!m_parallelExtents.width || !m_parallelExtents.height ||
        !unitsPerPixel) {
      return null;
    }
    /* If we aren't at an integer zoom level, we shouldn't align pixels.  If
     * we are really close to an integer zoom level, that is good enough. */
    if (parseFloat(m_parallelExtents.zoom.toFixed(6)) !==
        parseFloat(m_parallelExtents.zoom.toFixed(0))) {
      return null;
    }
    var align = {roundx: unitsPerPixel, roundy: unitsPerPixel, dx: 0, dy: 0};
    /* If the screen is an odd number of pixels, shift the view center to the
     * center of a pixel so that the pixels fit discretely across the screen.
     * If an even number of pixels, align the view center between pixels for
     * the same reason. */
    if (m_parallelExtents.width % 2) {
      align.dx = unitsPerPixel * 0.5;
    }
    if (m_parallelExtents.height % 2) {
      align.dy = unitsPerPixel * 0.5;
    }
    return align;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute camera projection matrix
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeProjectionMatrix = function () {
    if (m_computeProjectMatrixTime.getMTime() < this.getMTime()) {
      if (!m_enableParallelProjection) {
        mat4.perspective(m_projectionMatrix, m_viewAngle, m_viewAspect, m_near, m_far);
      } else {
        mat4.ortho(m_projectionMatrix,
          m_left, m_right, m_bottom, m_top, m_near, m_far);
      }

      m_computeProjectMatrixTime.modified();
    }

    return m_projectionMatrix;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert a zoom level and window size to a camera height.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoomToHeight = function (zoom, width, height) {
    return vgl.zoomToHeight(zoom, width, height, m_viewAngle);
  };

  this.computeDirectionOfProjection();

  return this;
};

inherit(vgl.camera, vgl.groupNode);

////////////////////////////////////////////////////////////////////////////
/**
 * Convert a zoom level and window size to a camera height.
 *
 * @param zoom: Zoom level, as used in OSM maps.
 * @param width: width of the window.
 * @param height: height of the window.
 * @returns: perspective camera height.
 */
////////////////////////////////////////////////////////////////////////////
vgl.zoomToHeight = function (zoom, width, height, viewAngle) {
  'use strict';
  viewAngle = viewAngle || (30 * Math.PI / 180.0);
  var newZ = 360 * Math.pow(2, -zoom);
  newZ /= Math.tan(viewAngle / 2) * 2 * 256 / height;
  return newZ;
};

////////////////////////////////////////////////////////////////////////////
/**
 * Convert a camera height and window size to a zoom level.
 *
 * @param z: perspective camera height.
 * @param width: width of the window.
 * @param height: height of the window.
 * @returns: zoom level.
 */
////////////////////////////////////////////////////////////////////////////
vgl.heightToZoom = function (z, width, height, viewAngle) {
  'use strict';
  viewAngle = viewAngle || (30 * Math.PI / 180.0);
  z *= Math.tan(viewAngle / 2) * 2 * 256 / height;
  var zoom = -Math.log2(z / 360);
  return zoom;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class interactorStyle
 *
 * @class vgl.interactorStyle
 * interactorStyle is a base class for all interactor styles
 * @returns {vgl.interactorStyle}
 */
////////////////////////////////////////////////////////////////////////////
vgl.interactorStyle = function () {
  'use strict';

  if (!(this instanceof vgl.interactorStyle)) {
    return new vgl.interactorStyle();
  }
  vgl.object.call(this);

  // Private member variables
  var m_that = this,
      m_viewer = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return viewer referenced by the interactor style
   *
   * @returns {null}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewer = function () {
    return m_viewer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set viewer for the interactor style
   *
   * @param viewer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setViewer = function (viewer) {
    if (viewer !== m_viewer) {
      m_viewer = viewer;
      $(m_viewer).on(vgl.event.mousePress, m_that.handleMouseDown);
      $(m_viewer).on(vgl.event.mouseRelease, m_that.handleMouseUp);
      $(m_viewer).on(vgl.event.mouseMove, m_that.handleMouseMove);
      $(m_viewer).on(vgl.event.mouseOut, m_that.handleMouseOut);
      $(m_viewer).on(vgl.event.mouseWheel, m_that.handleMouseWheel);
      $(m_viewer).on(vgl.event.keyPress, m_that.handleKeyPress);
      $(m_viewer).on(vgl.event.mouseContextMenu, m_that.handleContextMenu);
      $(m_viewer).on(vgl.event.click, m_that.handleClick);
      $(m_viewer).on(vgl.event.dblClick, m_that.handleDoubleClick);
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse up event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseOut = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse wheel event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseWheel = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle click event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleClick = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle double click event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleDoubleClick = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle key press event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleKeyPress = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle context menu event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleContextMenu = function (event) {
    event = event; /* unused parameter */
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset to default
   */
  ////////////////////////////////////////////////////////////////////////////
  this.reset = function () {
    return true;
  };

  return this;
};

inherit(vgl.interactorStyle, vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, vec4, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of trackballInteractorStyle
 *
 * @class vgl.trackballInteractorStyle
 * @returns {vgl.trackballInteractorStyle}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.trackballInteractorStyle = function () {
  'use strict';

  if (!(this instanceof vgl.trackballInteractorStyle)) {
    return new vgl.trackballInteractorStyle();
  }
  vgl.interactorStyle.call(this);
  var m_that = this,
      m_leftMouseBtnDown = false,
      m_rightMouseBtnDown = false,
      m_midMouseBtnDown = false,
      m_outsideCanvas,
      m_currPos = {x: 0, y: 0},
      m_lastPos = {x: 0, y: 0};


  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function (event) {
    var width = m_that.viewer().renderWindow().windowSize()[0],
        height = m_that.viewer().renderWindow().windowSize()[1],
        ren = m_that.viewer().renderWindow().activeRenderer(),
        cam = ren.camera(), coords = m_that.viewer().relMouseCoords(event),
        fp, fdp, fwp, dp1, dp2, wp1, wp2, dx, dy, dz, m_zTrans;

    m_outsideCanvas = false;
    m_currPos = {x: 0, y: 0};

    if ((coords.x < 0) || (coords.x > width)) {
      m_currPos.x = 0;
      m_outsideCanvas = true;
    } else {
      m_currPos.x = coords.x;
    }
    if ((coords.y < 0) || (coords.y > height)) {
      m_currPos.y = 0;
      m_outsideCanvas = true;
    } else {
      m_currPos.y = coords.y;
    }
    if (m_outsideCanvas === true) {
      return;
    }

    fp = cam.focalPoint();
    fwp = vec4.fromValues(fp[0], fp[1], fp[2], 1);
    fdp = ren.worldToDisplay(fwp, cam.viewMatrix(),
                              cam.projectionMatrix(), width, height);

    dp1 = vec4.fromValues(m_currPos.x, m_currPos.y, fdp[2], 1.0);
    dp2 = vec4.fromValues(m_lastPos.x, m_lastPos.y, fdp[2], 1.0);

    wp1 = ren.displayToWorld(dp1, cam.viewMatrix(), cam.projectionMatrix(),
                             width, height);
    wp2 = ren.displayToWorld(dp2, cam.viewMatrix(), cam.projectionMatrix(),
                             width, height);

    dx = wp1[0] - wp2[0];
    dy = wp1[1] - wp2[1];
    dz = wp1[2] - wp2[2];

    if (m_midMouseBtnDown) {
      cam.pan(-dx, -dy, -dz);
      m_that.viewer().render();
    }
    if (m_leftMouseBtnDown) {
      cam.rotate((m_lastPos.x - m_currPos.x),
      (m_lastPos.y - m_currPos.y));
      ren.resetCameraClippingRange();
      m_that.viewer().render();
    }
    if (m_rightMouseBtnDown) {
      /// 2.0 is the speed up factor
      m_zTrans = 2.0 * (m_currPos.y - m_lastPos.y) / height;

      // Calculate zoom scale here
      if (m_zTrans > 0) {
        cam.zoom(1 - Math.abs(m_zTrans));
      } else {
        cam.zoom(1 + Math.abs(m_zTrans));
      }
      ren.resetCameraClippingRange();
      m_that.viewer().render();
    }
    m_lastPos.x = m_currPos.x;
    m_lastPos.y = m_currPos.y;
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function (event) {
    var coords;

    if (event.button === 0) {
      m_leftMouseBtnDown = true;
    }
    if (event.button === 1) {
      m_midMouseBtnDown = true;
    }
    if (event.button === 2) {
      m_rightMouseBtnDown = true;
    }
    coords = m_that.viewer().relMouseCoords(event);
    if (coords.x < 0) {
      m_lastPos.x = 0;
    } else {
      m_lastPos.x = coords.x;
    }
    if (coords.y < 0) {
      m_lastPos.y = 0;
    } else {
      m_lastPos.y = coords.y;
    }
    return false;
  };

  // @note We never get mouse up from scroll bar: See the bug report here
  // http://bugs.jquery.com/ticket/8184
  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse up event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function (event) {
    if (event.button === 0) {
      m_leftMouseBtnDown = false;
    }
    if (event.button === 1) {
      m_midMouseBtnDown = false;
    }
    if (event.button === 2) {
      m_rightMouseBtnDown = false;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse wheel event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseWheel = function (event) {
    var ren = m_that.viewer().renderWindow().activeRenderer(),
        cam = ren.camera();

    // TODO Compute zoom factor intelligently
    if (event.originalEvent.wheelDelta < 0) {
      cam.zoom(0.9);
    } else {
      cam.zoom(1.1);
    }
    ren.resetCameraClippingRange();
    m_that.viewer().render();
    return true;
  };

  return this;
};
inherit(vgl.trackballInteractorStyle, vgl.interactorStyle);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, vec4, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pvwInteractorStyle (for ParaViewWeb)
 *
 * @class vgl.pvwInteractorStyle
 * @returns {vgl.pvwInteractorStyle}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.pvwInteractorStyle = function () {
  'use strict';

  if (!(this instanceof vgl.pvwInteractorStyle)) {
    return new vgl.pvwInteractorStyle();
  }
  vgl.trackballInteractorStyle.call(this);
  var m_that = this,
      m_leftMouseButtonDown = false,
      m_rightMouseButtonDown = false,
      m_middleMouseButtonDown = false,
      m_width,
      m_height,
      m_renderer,
      m_camera,
      m_outsideCanvas,
      m_coords,
      m_currentMousePos,
      m_focalPoint,
      m_focusWorldPt,
      m_focusDisplayPt,
      m_displayPt1,
      m_displayPt2,
      m_worldPt1,
      m_worldPt2,
      m_dx,
      m_dy,
      m_dz,
      m_zTrans,
      m_mouseLastPos = {
        x: 0,
        y: 0
      };

  function render() {
    m_renderer.resetCameraClippingRange();
    m_that.viewer().render();
  }

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function (event) {
    var rens = [], i = null, secCameras = [], deltaxy = null;
    m_width = m_that.viewer().renderWindow().windowSize()[0];
    m_height = m_that.viewer().renderWindow().windowSize()[1];
    m_renderer = m_that.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();
    m_outsideCanvas = false;
    m_coords = m_that.viewer().relMouseCoords(event);
    m_currentMousePos = {
      x: 0,
      y: 0
    };

    // Get secondary cameras
    rens = m_that.viewer().renderWindow().renderers();
    for (i = 0; i < rens.length; i += 1) {
      if (m_renderer !== rens[i]) {
        secCameras.push(rens[i].camera());
      }
    }

    if ((m_coords.x < 0) || (m_coords.x > m_width)) {
      m_currentMousePos.x = 0;
      m_outsideCanvas = true;
    } else {
      m_currentMousePos.x = m_coords.x;
    }
    if ((m_coords.y < 0) || (m_coords.y > m_height)) {
      m_currentMousePos.y = 0;
      m_outsideCanvas = true;
    } else {
      m_currentMousePos.y = m_coords.y;
    }
    if (m_outsideCanvas === true) {
      return;
    }
    m_focalPoint = m_camera.focalPoint();
    m_focusWorldPt = vec4.fromValues(m_focalPoint[0], m_focalPoint[1],
                                     m_focalPoint[2], 1);
    m_focusDisplayPt = m_renderer.worldToDisplay(m_focusWorldPt,
        m_camera.viewMatrix(), m_camera.projectionMatrix(), m_width, m_height);
    m_displayPt1 = vec4.fromValues(
      m_currentMousePos.x, m_currentMousePos.y, m_focusDisplayPt[2], 1.0);
    m_displayPt2 = vec4.fromValues(
      m_mouseLastPos.x, m_mouseLastPos.y, m_focusDisplayPt[2], 1.0);
    m_worldPt1 = m_renderer.displayToWorld(
      m_displayPt1, m_camera.viewMatrix(), m_camera.projectionMatrix(),
      m_width, m_height);
    m_worldPt2 = m_renderer.displayToWorld(
      m_displayPt2, m_camera.viewMatrix(), m_camera.projectionMatrix(),
      m_width, m_height);

    m_dx = m_worldPt1[0] - m_worldPt2[0];
    m_dy = m_worldPt1[1] - m_worldPt2[1];
    m_dz = m_worldPt1[2] - m_worldPt2[2];

    if (m_middleMouseButtonDown) {
      m_camera.pan(-m_dx, -m_dy, -m_dz);
      render();
    }
    if (m_leftMouseButtonDown) {
      deltaxy = [(m_mouseLastPos.x - m_currentMousePos.x),
      (m_mouseLastPos.y - m_currentMousePos.y)];
      m_camera.rotate(deltaxy[0], deltaxy[1]);

      // Apply rotation to all other cameras
      for (i = 0; i < secCameras.length; i += 1) {
        secCameras[i].rotate(deltaxy[0], deltaxy[1]);
      }

      // Apply rotation to all other cameras
      for (i = 0; i < rens.length; i += 1) {
        rens[i].resetCameraClippingRange();
      }
      render();
    }
    if (m_rightMouseButtonDown) {
      /// 2.0 is the speed up factor.
      m_zTrans = 2.0 * (m_currentMousePos.y - m_mouseLastPos.y) / m_height;

      // Calculate zoom scale here
      if (m_zTrans > 0) {
        m_camera.zoom(1 - Math.abs(m_zTrans));
      } else {
        m_camera.zoom(1 + Math.abs(m_zTrans));
      }
      render();
    }
    m_mouseLastPos.x = m_currentMousePos.x;
    m_mouseLastPos.y = m_currentMousePos.y;
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function (event) {
    if (event.button === 0) {
      m_leftMouseButtonDown = true;
    }
    if (event.button === 1) {
      m_middleMouseButtonDown = true;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = true;
    }
    m_coords = m_that.viewer().relMouseCoords(event);
    if (m_coords.x < 0) {
      m_mouseLastPos.x = 0;
    } else {
      m_mouseLastPos.x = m_coords.x;
    }
    if (m_coords.y < 0) {
      m_mouseLastPos.y = 0;
    } else {
      m_mouseLastPos.y = m_coords.y;
    }
    return false;
  };

  // @note We never get mouse up from scroll bar: See the bug report here
  // http://bugs.jquery.com/ticket/8184
  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse up event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function (event) {
    if (event.button === 0) {
      m_leftMouseButtonDown = false;
    }
    if (event.button === 1) {
      m_middleMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
    }
    return false;
  };

  return this;
};
inherit(vgl.pvwInteractorStyle, vgl.trackballInteractorStyle);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global window, vgl, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class viewer
 *
 * @param canvas
 * @returns {vgl.viewer}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.viewer = function (canvas, options) {
  'use strict';

  if (!(this instanceof vgl.viewer)) {
    return new vgl.viewer(canvas, options);
  }

  vgl.object.call(this);

  var m_that = this,
      m_canvas = canvas,
      m_ready = true,
      m_interactorStyle = null,
      m_renderer = vgl.renderer(options),
      m_renderWindow = vgl.renderWindow(m_canvas);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get canvas of the viewer
   *
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.canvas = function () {
    return m_canvas;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return render window of the viewer
   *
   * @returns {vgl.renderWindow}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.renderWindow = function () {
    return m_renderWindow;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize the viewer
   *
   * This is a must call or otherwise render context may not initialized
   * properly.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.init = function () {
    if (m_renderWindow !== null) {
      m_renderWindow._setup();
    } else {
      console.log('[ERROR] No render window attached');
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   *  Remove the viewer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.exit = function (renderState) {
    if (m_renderWindow !== null) {
      m_renderWindow._cleanup(renderState);
    } else {
      console.log('[ERROR] No render window attached');
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get interactor style of the viewer
   *
   * @returns {vgl.interactorStyle}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.interactorStyle = function () {
    return m_interactorStyle;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set interactor style to be used by the viewer
   *
   * @param {vgl.interactorStyle} style
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setInteractorStyle = function (style) {
    if (style !== m_interactorStyle) {
      m_interactorStyle = style;
      m_interactorStyle.setViewer(this);
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      // Only prevent default action for right mouse button
      if (event.button === 2) {
        fixedEvent.preventDefault();
      }
      fixedEvent.state = 'down';
      fixedEvent.type = vgl.event.mousePress;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse up event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.state = 'up';
      fixedEvent.type = vgl.event.mouseRelease;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vgl.event.mouseMove;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse wheel scroll
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseWheel = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vgl.event.mouseWheel;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseOut = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vgl.event.mouseOut;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle key press event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleKeyPress = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vgl.event.keyPress;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle context menu event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleContextMenu = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vgl.event.contextMenu;
      $(m_that).trigger(fixedEvent);
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle click event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleClick = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vgl.event.click;
      $(m_that).trigger(fixedEvent);
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle double click event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleDoubleClick = function (event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vgl.event.dblClick;
      $(m_that).trigger(fixedEvent);
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get mouse coodinates related to canvas
   *
   * @param event
   * @returns {{x: number, y: number}}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.relMouseCoords = function (event) {
    if (event.pageX === undefined || event.pageY === undefined) {
      throw 'Missing attributes pageX and pageY on the event';
    }

    var totalOffsetX = 0,
        totalOffsetY = 0,
        canvasX = 0,
        canvasY = 0,
        currentElement = m_canvas;

    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
      currentElement = currentElement.offsetParent;
    } while (currentElement);

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
      x: canvasX,
      y: canvasY
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function () {
    m_renderWindow.render();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bind canvas mouse events to their default handlers
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bindEventHandlers = function () {
    $(m_canvas).on('mousedown', this.handleMouseDown);
    $(m_canvas).on('mouseup', this.handleMouseUp);
    $(m_canvas).on('mousemove', this.handleMouseMove);
    $(m_canvas).on('mousewheel', this.handleMouseWheel);
    $(m_canvas).on('contextmenu', this.handleContextMenu);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Undo earlier binded  handlers for canvas mouse events
   */
  ////////////////////////////////////////////////////////////////////////////
  this.unbindEventHandlers = function () {
    $(m_canvas).off('mousedown', this.handleMouseDown);
    $(m_canvas).off('mouseup', this.handleMouseUp);
    $(m_canvas).off('mousemove', this.handleMouseMove);
    $(m_canvas).off('mousewheel', this.handleMouseWheel);
    $(m_canvas).off('contextmenu', this.handleContextMenu);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    this.bindEventHandlers();
    m_renderWindow.addRenderer(m_renderer);
  };

  this._init();
  return this;
};

inherit(vgl.viewer, vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class shader
 *
 * @param type
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.shader = function (type) {
  'use strict';

  if (!(this instanceof vgl.shader)) {
    return new vgl.shader(type);
  }
  vgl.object.call(this);

  var m_shaderContexts = [],
      m_shaderType = type,
      m_shaderSource = '';

  /**
   * A shader can be associated with multiple contexts.  Each context needs to
   * be compiled and attached separately.  These are tracked in the
   * m_shaderContexts array.
   *
   * @param renderState a renderState that includes a m_context value.
   * @return an object with context, compileTimestamp, and, if compiled, a
   *    shaderHandle entry.
   */
  this._getContextEntry = function (renderState) {
    var context = renderState.m_context, i, entry;
    for (i = 0; i < m_shaderContexts.length; i += 1) {
      if (m_shaderContexts[i].context === context) {
        return m_shaderContexts[i];
      }
    }
    entry = {
      context: context,
      compileTimestamp: vgl.timestamp()
    };
    m_shaderContexts.push(entry);
    return entry;
  };

  /**
   * Remove the context from the list of tracked contexts.  This allows the
   * associated shader handle to be GCed.  Does nothing if the context is not
   * in the list of tracked contexts.
   *
   * @param renderState a renderState that includes a m_context value.
   */
  this.removeContext = function (renderState) {
    var context = renderState.m_context, i;
    for (i = 0; i < m_shaderContexts.length; i += 1) {
      if (m_shaderContexts[i].context === context) {
        m_shaderContexts.splice(i, 1);
        return;
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get shader handle
   */
  /////////////////////////////////////////////////////////////////////////////
  this.shaderHandle = function (renderState) {
    var entry = this._getContextEntry(renderState);
    return entry.shaderHandle;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get type of the shader
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.shaderType = function () {
    return m_shaderType;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get shader source
   *
   * @returns {string}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.shaderSource = function () {
    return m_shaderSource;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set shader source
   *
   * @param {string} source
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setShaderSource = function (source) {
    m_shaderSource = source;
    this.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Compile the shader
   *
   * @returns {null}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.compile = function (renderState) {
    var entry = this._getContextEntry(renderState);
    if (this.getMTime() < entry.compileTimestamp.getMTime()) {
      return entry.shaderHandle;
    }

    renderState.m_context.deleteShader(entry.shaderHandle);
    entry.shaderHandle = renderState.m_context.createShader(m_shaderType);
    renderState.m_context.shaderSource(entry.shaderHandle, m_shaderSource);
    renderState.m_context.compileShader(entry.shaderHandle);

    // See if it compiled successfully
    if (!renderState.m_context.getShaderParameter(entry.shaderHandle,
        vgl.GL.COMPILE_STATUS)) {
      console.log('[ERROR] An error occurred compiling the shaders: ' +
                  renderState.m_context.getShaderInfoLog(entry.shaderHandle));
      console.log(m_shaderSource);
      renderState.m_context.deleteShader(entry.shaderHandle);
      return null;
    }

    entry.compileTimestamp.modified();

    return entry.shaderHandle;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Attach shader to the program
   *
   * @param programHandle
   */
  /////////////////////////////////////////////////////////////////////////////
  this.attachShader = function (renderState, programHandle) {
    renderState.m_context.attachShader(
        programHandle, this.shaderHandle(renderState));
  };
};

inherit(vgl.shader, vgl.object);


/* We can use the same shader multiple times if it is identical.  This caches
 * the last N shaders and will reuse them when possible.  The cache keeps the
 * most recently requested shader at the front.  If you are doing anything more
 * to a shader then creating it and setting its source once, do not use this
 * cache.
 */
(function () {
  'use strict';
  var m_shaderCache = [],
      m_shaderCacheMaxSize = 10;

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get a shader from the cache.  Create a new shader if necessary using a
   * specific source.
   *
   * @param type One of vgl.GL.*_SHADER
   * @param context the GL context for the shader.
   * @param {string} source the source code of the shader.
   */
  /////////////////////////////////////////////////////////////////////////////
  vgl.getCachedShader = function (type, context, source) {
    for (var i = 0; i < m_shaderCache.length; i += 1) {
      if (m_shaderCache[i].type === type &&
          m_shaderCache[i].context === context &&
          m_shaderCache[i].source === source) {
        if (i) {
          m_shaderCache.splice(0, 0, m_shaderCache.splice(i, 1)[0]);
        }
        return m_shaderCache[0].shader;
      }
    }
    var shader = new vgl.shader(type);
    shader.setShaderSource(source);
    m_shaderCache.unshift({
      type: type,
      context: context,
      source: source,
      shader: shader
    });
    if (m_shaderCache.length >= m_shaderCacheMaxSize) {
      m_shaderCache.splice(m_shaderCacheMaxSize,
                           m_shaderCache.length - m_shaderCacheMaxSize);
    }
    return shader;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Clear the shader cache.
   *
   * @param context the GL context to clear, or null for clear all.
   */
  /////////////////////////////////////////////////////////////////////////////
  vgl.clearCachedShaders = function (context) {
    for (var i = m_shaderCache.length - 1; i >= 0; i -= 1) {
      if (context === null || context === undefined ||
          m_shaderCache[i].context === context) {
        m_shaderCache.splice(i, 1);
      }
    }
  };
})();

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instace of class shaderProgram
 *
 * @class
 * @returns {vgl.shaderProgram}
 */
//////////////////////////////////////////////////////////////////////////////

var getBaseUrl = (function () {
  'use strict';
  var baseUrl = '.';
  var scripts = document.getElementsByTagName('script');
  /* When run in certain environments, there may be no scripts loaded.  For
   * instance, jQuery's $.getScript won't add it to a script tag. */
  if (scripts.length > 0) {
    var index = scripts.length - 1;
    var vglScript = scripts[index];
    index = vglScript.src.lastIndexOf('/');
    baseUrl = vglScript.src.substring(0, index);
  }
  return function () { return baseUrl; };
})();


vgl.shaderProgram = function () {
  'use strict';

  if (!(this instanceof vgl.shaderProgram)) {
    return new vgl.shaderProgram();
  }
  vgl.materialAttribute.call(
    this, vgl.materialAttributeType.ShaderProgram);

  /** @private */
  var m_this = this,
      m_programHandle = 0,
      m_compileTimestamp = vgl.timestamp(),
      m_bindTimestamp = vgl.timestamp(),
      m_shaders = [],
      m_uniforms = [],
      m_vertexAttributes = {},
      m_uniformNameToLocation = {},
      m_vertexAttributeNameToLocation = {};

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Create a particular shader type using GLSL shader strings from a file
   */
  /////////////////////////////////////////////////////////////////////////////
  this.loadFromFile = function (type, sourceUrl) {
    var shader;
    $.ajax({
      url: sourceUrl,
      type: 'GET',
      async: false,
      success: function (result) {
        //console.log(result);
        shader = vgl.shader(type);
        shader.setShaderSource(result);
        m_this.addShader(shader);
      }
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Create a particular shader type using GLSL shader strings from a file
   * relative to VGL load URL.
   */
  /////////////////////////////////////////////////////////////////////////////
  this.loadShader = function (type, file) {
    this.loadFromFile(type, getBaseUrl() + '/shaders/' + file);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Query uniform location in the program
   *
   * @param name
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.queryUniformLocation = function (renderState, name) {
    return renderState.m_context.getUniformLocation(m_programHandle, name);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Query attribute location in the program
   *
   * @param name
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.queryAttributeLocation = function (renderState, name) {
    return renderState.m_context.getAttribLocation(m_programHandle, name);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Add a new shader to the program
   *
   * @param shader
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.addShader = function (shader) {
    if (m_shaders.indexOf(shader) > -1) {
      return false;
    }

    var i;
    for (i = 0; i < m_shaders.length; i += 1) {
      if (m_shaders[i].shaderType() === shader.shaderType()) {
        m_shaders.splice(m_shaders.indexOf(shader), 1);
      }
    }

    m_shaders.push(shader);
    m_this.modified();
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Add a new uniform to the program
   *
   * @param uniform
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.addUniform = function (uniform) {
    if (m_uniforms.indexOf(uniform) > -1) {
      return false;
    }

    m_uniforms.push(uniform);
    m_this.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Add a new vertex attribute to the program
   *
   * @param attr
   * @param key
   */
  /////////////////////////////////////////////////////////////////////////////
  this.addVertexAttribute = function (attr, key) {
    m_vertexAttributes[key] = attr;
    m_this.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get uniform location
   *
   * This method does not perform any query into the program but relies on
   * the fact that it depends on a call to queryUniformLocation earlier.
   *
   * @param name
   * @returns {number}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.uniformLocation = function (name) {
    return m_uniformNameToLocation[name];
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get attribute location
   *
   * This method does not perform any query into the program but relies on the
   * fact that it depends on a call to queryUniformLocation earlier.
   *
   * @param name
   * @returns {number}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.attributeLocation = function (name) {
    return m_vertexAttributeNameToLocation[name];
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get uniform object using name as the key
   *
   * @param name
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.uniform = function (name) {
    var i;
    for (i = 0; i < m_uniforms.length; i += 1) {
      if (m_uniforms[i].name() === name) {
        return m_uniforms[i];
      }
    }

    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update all uniforms
   *
   * This method should be used directly unless required
   */
  /////////////////////////////////////////////////////////////////////////////
  this.updateUniforms = function (renderState) {
    var i;

    for (i = 0; i < m_uniforms.length; i += 1) {
      m_uniforms[i].callGL(renderState,
        m_uniformNameToLocation[m_uniforms[i].name()]);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Link shader program
   *
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.link = function (renderState) {
    renderState.m_context.linkProgram(m_programHandle);

    // If creating the shader program failed, alert
    if (!renderState.m_context.getProgramParameter(m_programHandle,
        vgl.GL.LINK_STATUS)) {
      console.log('[ERROR] Unable to initialize the shader program.');
      return false;
    }

    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Use the shader program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.use = function (renderState) {
    renderState.m_context.useProgram(m_programHandle);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Peform any initialization required
   */
  /////////////////////////////////////////////////////////////////////////////
  this._setup = function (renderState) {
    if (m_programHandle === 0) {
      m_programHandle = renderState.m_context.createProgram();
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Peform any clean up required when the program gets deleted
   */
  /////////////////////////////////////////////////////////////////////////////
  this._cleanup = function (renderState) {
    m_this.deleteVertexAndFragment(renderState);
    m_this.deleteProgram(renderState);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Delete the shader program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.deleteProgram = function (renderState) {
    renderState.m_context.deleteProgram(m_programHandle);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Delete vertex and fragment shaders
   */
  /////////////////////////////////////////////////////////////////////////////
  this.deleteVertexAndFragment = function (renderState) {
    var i;
    for (i = 0; i < m_shaders.length; i += 1) {
      renderState.m_context.detachShader(m_shaders[i].shaderHandle(renderState));
      renderState.m_context.deleteShader(m_shaders[i].shaderHandle(renderState));
      m_shaders[i].removeContext(renderState);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Compile and link a shader
   */
  /////////////////////////////////////////////////////////////////////////////
  this.compileAndLink = function (renderState) {
    var i;

    if (m_compileTimestamp.getMTime() >= this.getMTime()) {
      return;
    }

    m_this._setup(renderState);

    // Compile shaders
    for (i = 0; i < m_shaders.length; i += 1) {
      m_shaders[i].compile(renderState);
      m_shaders[i].attachShader(renderState, m_programHandle);
    }

    m_this.bindAttributes(renderState);

    // link program
    if (!m_this.link(renderState)) {
      console.log('[ERROR] Failed to link Program');
      m_this._cleanup(renderState);
    }

    m_compileTimestamp.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Bind the program with its shaders
   *
   * @param renderState
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bind = function (renderState) {
    var i = 0;

    if (m_bindTimestamp.getMTime() < m_this.getMTime()) {

      // Compile shaders
      m_this.compileAndLink(renderState);

      m_this.use(renderState);
      m_this.bindUniforms(renderState);
      m_bindTimestamp.modified();
    } else {
      m_this.use(renderState);
    }

    // Call update callback.
    for (i = 0; i < m_uniforms.length; i += 1) {
      m_uniforms[i].update(renderState, m_this);
    }

    // Now update values to GL.
    m_this.updateUniforms(renderState);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Undo binding of the shader program
   *
   * @param renderState
   */
  /////////////////////////////////////////////////////////////////////////////
  this.undoBind = function (renderState) {
    // REF https://www.khronos.org/opengles/sdk/docs/man/xhtml/glUseProgram.xml
    // If program is 0, then the current rendering state refers to an invalid
    // program object, and the results of vertex and fragment shader execution
    // due to any glDrawArrays or glDrawElements commands are undefined
    renderState.m_context.useProgram(null);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Bind vertex data
   *
   * @param renderState
   * @param key
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bindVertexData = function (renderState, key) {
    if (m_vertexAttributes.hasOwnProperty(key)) {
      m_vertexAttributes[key].bindVertexData(renderState, key);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind vetex data
   *
   * @param renderState
   * @param key
   */
  /////////////////////////////////////////////////////////////////////////////
  this.undoBindVertexData = function (renderState, key) {
    if (m_vertexAttributes.hasOwnProperty(key)) {
      m_vertexAttributes[key].undoBindVertexData(renderState, key);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Bind uniforms
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bindUniforms = function (renderState) {
    var i;
    for (i = 0; i < m_uniforms.length; i += 1) {
      m_uniformNameToLocation[m_uniforms[i].name()] = this
          .queryUniformLocation(renderState, m_uniforms[i].name());
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Bind vertex attributes
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bindAttributes = function (renderState) {
    var key, name;
    for (key in m_vertexAttributes) {
      if (m_vertexAttributes.hasOwnProperty(key)) {
        name = m_vertexAttributes[key].name();
        renderState.m_context.bindAttribLocation(m_programHandle, key, name);
        m_vertexAttributeNameToLocation[name] = key;
      }
    }
  };

  return m_this;
};

inherit(vgl.shaderProgram, vgl.materialAttribute);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global Uint8Array, vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class texture
 *
 * @class
 * @returns {vgl.texture}
 */
///////////////////////////////////////////////////////////////////////////////
vgl.texture = function () {
  'use strict';

  if (!(this instanceof vgl.texture)) {
    return new vgl.texture();
  }
  vgl.materialAttribute.call(
    this, vgl.materialAttributeType.Texture);

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

  var m_setupTimestamp = vgl.timestamp(),
      m_that = this;

  function activateTextureUnit(renderState) {
    switch (m_that.m_textureUnit) {
      case 0:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE0);
        break;
      case 1:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE1);
        break;
      case 2:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE2);
        break;
      case 3:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE3);
        break;
      case 4:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE4);
        break;
      case 5:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE5);
        break;
      case 6:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE6);
        break;
      case 7:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE7);
        break;
      case 8:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE8);
        break;
      case 9:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE9);
        break;
      case 10:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE10);
        break;
      case 11:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE11);
        break;
      case 12:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE12);
        break;
      case 13:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE13);
        break;
      case 14:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE14);
        break;
      case 15:
        renderState.m_context.activeTexture(vgl.GL.TEXTURE15);
        break;
      default:
        throw '[error] Texture unit '  + m_that.m_textureUnit +
              ' is not supported';
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Create texture, update parameters, and bind data
   *
   * @param renderState
   */
  /////////////////////////////////////////////////////////////////////////////
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

      // console.log('m_internalFormat ' + this.m_internalFormat);
      // console.log('m_pixelFormat ' + this.m_pixelFormat);
      // console.log('m_pixelDataType ' + this.m_pixelDataType);

      // FOR now support only 2D textures
      renderState.m_context.texImage2D(vgl.GL.TEXTURE_2D, 0, this.m_internalFormat,
        this.m_pixelFormat, this.m_pixelDataType, this.m_image);
    } else {
      renderState.m_context.texImage2D(vgl.GL.TEXTURE_2D, 0, this.m_internalFormat,
        this.m_width, this.m_height, 0, this.m_pixelFormat, this.m_pixelDataType, null);
    }

    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, null);
    m_setupTimestamp.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Create texture and if already created use it
   *
   * @param renderState
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bind = function (renderState) {
    // TODO Call setup via material setup
    if (this.getMTime() > m_setupTimestamp.getMTime()) {
      this.setup(renderState);
    }

    activateTextureUnit(renderState);
    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, this.m_textureHandle);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Turn off the use of this texture
   *
   * @param renderState
   */
  /////////////////////////////////////////////////////////////////////////////
  this.undoBind = function (renderState) {
    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, null);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get image used by the texture
   *
   * @returns {vgl.image}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.image = function () {
    return this.m_image;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set image for the texture
   *
   * @param {vgl.image} image
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setImage = function (image) {
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
   * Get nearest pixel flag for the texture
   *
   * @returns boolean
   */
  /////////////////////////////////////////////////////////////////////////////
  this.nearestPixel = function () {
    return this.m_nearestPixel;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set nearest pixel flag for the texture
   *
   * @param {boolean} nearest pixel flag
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setNearestPixel = function (nearest) {
    nearest = nearest ? true : false;
    if (nearest !== this.m_nearestPixel) {
      this.m_nearestPixel = nearest;
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
  this.textureUnit = function () {
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
  this.setTextureUnit = function (unit) {
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
  this.width = function () {
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
  this.setWidth = function (width) {
    if (m_that.m_width !== width) {
      m_that.m_width = width;
      m_that.modified();
      return true;
    }

    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get width of the texture
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.height = function () {
    return m_that.m_height;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set height of the texture
   *
   * @param {number} height
   * @returns {vgl.texture}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setHeight = function (height) {
    if (m_that.m_height !== height) {
      m_that.m_height = height;
      m_that.modified();
      return true;
    }

    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get depth of the texture
   *
   * @returns {number}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.depth = function () {
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
  this.setDepth = function (depth) {
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
  this.textureHandle = function () {
    return this.m_textureHandle;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get internal format of the texture
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.internalFormat = function () {
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
  this.setInternalFormat = function (internalFormat) {
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
  this.pixelFormat = function () {
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
  this.setPixelFormat = function (pixelFormat) {
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
  this.pixelDataType = function () {
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
  this.setPixelDataType = function (pixelDataType) {
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
    this.m_internalFormat = vgl.GL.RGBA;
    this.m_pixelFormat = vgl.GL.RGBA;
    this.m_pixelDataType = vgl.GL.UNSIGNED_BYTE;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update texture dimensions
   */
  /////////////////////////////////////////////////////////////////////////////
  this.updateDimensions = function () {
    if (this.m_image !== null) {
      this.m_width = this.m_image.width;
      this.m_height = this.m_image.height;
      this.m_depth = 0; // Only 2D images are supported now
    }
  };

  return this;
};

inherit(vgl.texture, vgl.materialAttribute);

///////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lookupTable
 *
 * @class
 * @returns {vgl.lookupTable}
 */
///////////////////////////////////////////////////////////////////////////////
vgl.lookupTable = function () {
  'use strict';

  if (!(this instanceof vgl.lookupTable)) {
    return new vgl.lookupTable();
  }
  vgl.texture.call(this);

  var m_setupTimestamp = vgl.timestamp(),
      m_range = [0, 0];

  this.m_colorTable = //paraview bwr colortable
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
             function (x) {return x * 255;});

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Create lookup table, initialize parameters, and bind data to it
   *
   * @param {vgl.renderState} renderState
   */
  /////////////////////////////////////////////////////////////////////////////
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

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get color table used by the lookup table
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.colorTable = function () {
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
  this.setColorTable = function (colors) {
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
  this.range = function () {
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
  this.setRange = function (range) {
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
  this.updateRange = function (range) {
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

inherit(vgl.lookupTable, vgl.texture);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, mat4, inherit*/
//////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class uniform
 *
 * @param type
 * @param name
 * @returns {vgl.uniform} OpenGL uniform encapsulation
 */
///////////////////////////////////////////////////////////////////////////////
vgl.uniform = function (type, name) {
  'use strict';

  if (!(this instanceof vgl.uniform)) {
    return new vgl.uniform();
  }

  this.getTypeNumberOfComponents = function (type) {
    switch (type) {
      case vgl.GL.FLOAT:
      case vgl.GL.INT:
      case vgl.GL.BOOL:
        return 1;

      case vgl.GL.FLOAT_VEC2:
      case vgl.GL.INT_VEC2:
      case vgl.GL.BOOL_VEC2:
        return 2;

      case vgl.GL.FLOAT_VEC3:
      case vgl.GL.INT_VEC3:
      case vgl.GL.BOOL_VEC3:
        return 3;

      case vgl.GL.FLOAT_VEC4:
      case vgl.GL.INT_VEC4:
      case vgl.GL.BOOL_VEC4:
        return 4;

      case vgl.GL.FLOAT_MAT3:
        return 9;

      case vgl.GL.FLOAT_MAT4:
        return 16;

      default:
        return 0;
    }
  };

  var m_type = type,
      m_name = name,
      m_dataArray = [];

  m_dataArray.length = this.getTypeNumberOfComponents(m_type);

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get name of the uniform
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.name = function () {
    return m_name;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get type of the uniform
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.type = function () {
    return m_type;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get value of the uniform
   *
   * @returns {Array}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.get = function () {
    return m_dataArray;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set value of the uniform
   *
   * @param value
   */
  /////////////////////////////////////////////////////////////////////////////
  this.set = function (value) {
    var i = 0;
    if (m_dataArray.length === 16) {
      for (i = 0; i < 16; i += 1) {
        m_dataArray[i] = value[i];
      }
    } else if (m_dataArray.length === 9) {
      for (i = 0; i < 9; i += 1) {
        m_dataArray[i] = value[i];
      }
    } else if (m_dataArray.length === 4) {
      for (i = 0; i < 4; i += 1) {
        m_dataArray[i] = value[i];
      }
    } else if (m_dataArray.length === 3) {
      for (i = 0; i < 3; i += 1) {
        m_dataArray[i] = value[i];
      }
    } else if (m_dataArray.length === 2) {
      for (i = 0; i < 2; i += 1) {
        m_dataArray[i] = value[i];
      }
    } else {
      m_dataArray[0] = value;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Call GL and pass updated values to the current shader
   *
   * @param location
   */
  /////////////////////////////////////////////////////////////////////////////
  this.callGL = function (renderState, location) {
    if (this.m_numberElements < 1) {
      return;
    }

    switch (m_type) {
      case vgl.GL.BOOL:
      case vgl.GL.INT:
        renderState.m_context.uniform1iv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT:
        renderState.m_context.uniform1fv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT_VEC2:
        renderState.m_context.uniform2fv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT_VEC3:
        renderState.m_context.uniform3fv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT_VEC4:
        renderState.m_context.uniform4fv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT_MAT3:
        renderState.m_context.uniformMatrix3fv(location, vgl.GL.FALSE, m_dataArray);
        break;
      case vgl.GL.FLOAT_MAT4:
        renderState.m_context.uniformMatrix4fv(location, vgl.GL.FALSE, m_dataArray);
        break;
      default:
        break;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual method to update the uniform
   *
   * Should be implemented by the derived class.
   *
   * @param renderState
   * @param program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.update = function (renderState, program) {
    renderState = renderState; /* unused parameter */
    program = program; /* unused parameter */
    // Should be implemented by the derived class
  };

  return this;
};

///////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of class modelViewUniform
 *
 * @param name
 * @returns {vgl.modelViewUniform}
 */
///////////////////////////////////////////////////////////////////////////////
vgl.modelViewUniform = function (name) {
  'use strict';

  if (!(this instanceof vgl.modelViewUniform)) {
    return new vgl.modelViewUniform(name);
  }

  if (name.length === 0) {
    name = 'modelViewMatrix';
  }

  vgl.uniform.call(this, vgl.GL.FLOAT_MAT4, name);

  this.set(mat4.create());

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update the uniform given a render state and shader program
   *
   * @param {vgl.renderState} renderState
   * @param {vgl.shaderProgram} program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.update = function (renderState, program) {
    program = program; /* unused parameter */
    this.set(renderState.m_modelViewMatrix);
  };

  return this;
};

inherit(vgl.modelViewUniform, vgl.uniform);

///////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of class modelViewOriginUniform.
 *
 * @param name
 * @param {array} origin a triplet of floats.
 * @returns {vgl.modelViewUniform}
 */
///////////////////////////////////////////////////////////////////////////////
vgl.modelViewOriginUniform = function (name, origin) {
  'use strict';

  if (!(this instanceof vgl.modelViewOriginUniform)) {
    return new vgl.modelViewOriginUniform(name, origin);
  }

  if (name.length === 0) {
    name = 'modelViewMatrix';
  }
  origin = origin || [0, 0, 0];

  var m_origin = [origin[0], origin[1], origin[2] || 0];

  vgl.uniform.call(this, vgl.GL.FLOAT_MAT4, name);

  this.set(mat4.create());

  /**
   * Change the origin used by the uniform view matrix.
   *
   * @param {array} origin a triplet of floats.
   */
  this.setOrigin = function (origin) {
    origin = origin || [0, 0, 0];
    m_origin = [origin[0], origin[1], origin[2] || 0];
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update the uniform given a render state and shader program.  This offsets
   * the modelViewMatrix by the origin, and, if the model view should be
   * aligned, aligns it appropriately.  The alignment must be done after the
   * origin offset to maintain precision.
   *
   * @param {vgl.renderState} renderState
   * @param {vgl.shaderProgram} program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.update = function (renderState, program) {
    program = program; /* unused parameter */
    var view = mat4.create();
    mat4.translate(view, renderState.m_modelViewMatrix, m_origin);
    if (renderState.m_modelViewAlignment) {
      var align = renderState.m_modelViewAlignment;
      /* view[12] and view[13] are the x and y offsets.  align.round is the
       * units-per-pixel, and align.dx and .dy are either 0 or half the size of
       * a unit-per-pixel.  The alignment guarantees that the texels are
       * aligned with screen pixels. */
      view[12] = Math.round(view[12] / align.roundx) * align.roundx + align.dx;
      view[13] = Math.round(view[13] / align.roundy) * align.roundy + align.dy;
    }
    this.set(view);
  };

  return this;
};

inherit(vgl.modelViewOriginUniform, vgl.uniform);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class projectionUniform
 *
 * @param name
 * @returns {vgl.projectionUniform}
 */
///////////////////////////////////////////////////////////////////////////////
vgl.projectionUniform = function (name) {
  'use strict';

  if (!(this instanceof vgl.projectionUniform)) {
    return new vgl.projectionUniform(name);
  }

  if (name.length === 0) {
    name = 'projectionMatrix';
  }

  vgl.uniform.call(this, vgl.GL.FLOAT_MAT4, name);

  this.set(mat4.create());

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update the uniform given a render state and shader program
   *
   * @param renderState
   * @param program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.update = function (renderState, program) {
    program = program; /* unused parameter */
    this.set(renderState.m_projectionMatrix);
  };

  return this;
};

inherit(vgl.projectionUniform, vgl.uniform);

///////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class floatUniform
 *
 * @param name
 * @param value
 * @returns {vgl.floatUniform}
 */
///////////////////////////////////////////////////////////////////////////////
vgl.floatUniform = function (name, value) {
  'use strict';

  if (!(this instanceof vgl.floatUniform)) {
    return new vgl.floatUniform(name, value);
  }

  if (name.length === 0) {
    name = 'floatUniform';
  }

  value = value === undefined ? 1.0 : value;

  vgl.uniform.call(this, vgl.GL.FLOAT, name);

  this.set(value);
};

inherit(vgl.floatUniform, vgl.uniform);

///////////////////////////////////////////////////////////////////////////////
/**
 * Create new instance of class normalMatrixUniform
 *
 * @param name
 * @returns {vgl.normalMatrixUniform}
 */
///////////////////////////////////////////////////////////////////////////////
vgl.normalMatrixUniform = function (name) {
  'use strict';

  if (!(this instanceof vgl.normalMatrixUniform)) {
    return new vgl.normalMatrixUniform(name);
  }

  if (name.length === 0) {
    name = 'normalMatrix';
  }

  vgl.uniform.call(this, vgl.GL.FLOAT_MAT4, name);

  this.set(mat4.create());

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update the uniform given a render state and shader program
   *
   * @param {vgl.renderState} renderState
   * @param {vgl.shaderProgram} program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.update = function (renderState, program) {
    program = program; /* unused parameter */
    this.set(renderState.m_normalMatrix);
  };

  return this;
};

inherit(vgl.normalMatrixUniform, vgl.uniform);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Keys to identify vertex attributes
 *
 * @type {{Position: number, Normal: number, TextureCoordinate: number,
 *         Color: number, Scalar: number, Scalar2: number, Scalar3: number,
 *         Scalar4: number, Scalar5: number, Scalar6: number, Scalar7: number,
 *         CountAttributeIndex: number}}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.vertexAttributeKeys = {
  'Position' : 0,
  'Normal' : 1,
  'TextureCoordinate' : 2,
  'Color' : 3,
  'Scalar': 4,
  'CountAttributeIndex' : 5
};

vgl.vertexAttributeKeysIndexed = {
  'Zero' : 0,
  'One' : 1,
  'Two' : 2,
  'Three' : 3,
  'Four' : 4,
  'Five' : 5,
  'Six' : 6,
  'Seven' : 7,
  'Eight' : 8,
  'Nine' : 9
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of vertexAttribute
 *
 * @param {string} name
 * @returns {vgl.vertexAttribute}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.vertexAttribute = function (name) {
  'use strict';

  if (!(this instanceof vgl.vertexAttribute)) {
    return new vgl.vertexAttribute(name);
  }

  var m_name = name;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get name of the vertex attribute
   *
   * @returns {string}
   */
  //////////////////////////////////////////////////////////////////////////////
  this.name = function () {
    return m_name;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Bind vertex data to the given render state
   *
   * @param {vgl.renderState} renderState
   * @param {vgl.vertexAttributeKeys} key
   */
  //////////////////////////////////////////////////////////////////////////////
  this.bindVertexData = function (renderState, key) {
    var geometryData = renderState.m_mapper.geometryData(),
        sourceData = geometryData.sourceData(key),
        program = renderState.m_material.shaderProgram();

    renderState.m_context.vertexAttribPointer(program.attributeLocation(
        m_name), sourceData
        .attributeNumberOfComponents(key), sourceData.attributeDataType(key),
                           sourceData.normalized(key), sourceData
                               .attributeStride(key), sourceData
                               .attributeOffset(key));

    renderState.m_context.enableVertexAttribArray(program.attributeLocation(m_name));
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind vertex data for a given render state
   *
   * @param {vgl.renderState} renderState
   * @param {vgl.vertexAttributeKeys} key
   */
  //////////////////////////////////////////////////////////////////////////////
  this.undoBindVertexData = function (renderState, key) {
    key = key; /* unused parameter */

    var program = renderState.m_material.shaderProgram();

    renderState.m_context.disableVertexAttribArray(program.attributeLocation(m_name));
  };
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class source
 *
 * @returns {vgl.source}
 */
///////////////////////////////////////////////////////////////////////////////
vgl.source = function () {
  'use strict';

  if (!(this instanceof vgl.source)) {
    return new vgl.source();
  }

  vgl.object.call(this);

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Virtual function to create a source instance
   */
  /////////////////////////////////////////////////////////////////////////////
  this.create = function () {
  };

  return this;
};

inherit(vgl.source, vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class planeSource
 *
 * @class
 * @returns {vgl.planeSource}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.planeSource = function () {
  'use strict';

  if (!(this instanceof vgl.planeSource)) {
    return new vgl.planeSource();
  }
  vgl.source.call(this);

  var m_origin = [0.0, 0.0, 0.0],
      m_point1 = [1.0, 0.0, 0.0],
      m_point2 = [0.0, 1.0, 0.0],
      m_normal = [0.0, 0.0, 1.0],
      m_xresolution = 1,
      m_yresolution = 1,
      m_geom = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set origin of the plane
   *
   * @param x
   * @param y
   * @param z
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setOrigin = function (x, y, z) {
    m_origin[0] = x;
    m_origin[1] = y;
    m_origin[2] = z;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set point that defines the first axis of the plane
   *
   * @param x
   * @param y
   * @param z
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPoint1 = function (x, y, z) {
    m_point1[0] = x;
    m_point1[1] = y;
    m_point1[2] = z;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set point that defines the first axis of the plane
   *
   * @param x
   * @param y
   * @param z
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPoint2 = function (x, y, z) {
    m_point2[0] = x;
    m_point2[1] = y;
    m_point2[2] = z;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a plane geometry given input parameters
   *
   * @returns {null}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.create = function () {
    m_geom = new vgl.geometryData();

    var x = [], tc = [], v1 = [], v2 = [],
        pts = [], i, j, k, ii, numPts, numPolys,
        posIndex = 0, normIndex = 0, colorIndex = 0, texCoordIndex = 0,
        positions = [], normals = [], colors = [],
        texCoords = [], indices = [], tristrip = null,
        sourcePositions = null, sourceColors = null, sourceTexCoords;

    x.length = 3;
    tc.length = 2;
    v1.length = 3;
    v2.length = 3;
    pts.length = 3;

    // Check input
    for (i = 0; i < 3; i += 1) {
      v1[i] = m_point1[i] - m_origin[i];
      v2[i] = m_point2[i] - m_origin[i];
    }

    // TODO Compute center and normal
    // Set things up; allocate memory
    numPts = (m_xresolution + 1) * (m_yresolution + 1);
    numPolys = m_xresolution * m_yresolution * 2;
    positions.length = 3 * numPts;
    normals.length = 3 * numPts;
    texCoords.length = 2 * numPts;
    indices.length = numPts;

    for (k = 0, i = 0; i < (m_yresolution + 1); i += 1) {
      tc[1] = i / m_yresolution;

      for (j = 0; j < (m_xresolution + 1); j += 1) {
        tc[0] = j / m_xresolution;

        for (ii = 0; ii < 3; ii += 1) {
          x[ii] = m_origin[ii] + tc[0] * v1[ii] + tc[1] * v2[ii];
        }

        //jshint plusplus: false
        positions[posIndex++] = x[0];
        positions[posIndex++] = x[1];
        positions[posIndex++] = x[2];

        colors[colorIndex++] = 1.0;
        colors[colorIndex++] = 1.0;
        colors[colorIndex++] = 1.0;

        normals[normIndex++] = m_normal[0];
        normals[normIndex++] = m_normal[1];
        normals[normIndex++] = m_normal[2];

        texCoords[texCoordIndex++] = tc[0];
        texCoords[texCoordIndex++] = tc[1];
        //jshint plusplus: true
      }
    }

    /// Generate polygon connectivity
    for (i = 0; i < m_yresolution; i += 1) {
      for (j = 0; j < m_xresolution; j += 1) {
        pts[0] = j + i * (m_xresolution + 1);
        pts[1] = pts[0] + 1;
        pts[2] = pts[0] + m_xresolution + 2;
        pts[3] = pts[0] + m_xresolution + 1;
      }
    }

    for (i = 0; i < numPts; i += 1) {
      indices[i] = i;
    }

    tristrip = new vgl.triangleStrip();
    tristrip.setIndices(indices);

    sourcePositions = vgl.sourceDataP3fv();
    sourcePositions.pushBack(positions);

    sourceColors = vgl.sourceDataC3fv();
    sourceColors.pushBack(colors);

    sourceTexCoords = vgl.sourceDataT2fv();
    sourceTexCoords.pushBack(texCoords);

    m_geom.addSource(sourcePositions);
    m_geom.addSource(sourceColors);
    m_geom.addSource(sourceTexCoords);
    m_geom.addPrimitive(tristrip);

    return m_geom;
  };
};

inherit(vgl.planeSource, vgl.source);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pointSource
 *
 * @class
 * @returns {vgl.pointSource}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.pointSource = function () {
  'use strict';

  if (!(this instanceof vgl.pointSource)) {
    return new vgl.pointSource();
  }
  vgl.source.call(this);

  var m_this = this,
      m_positions = [],
      m_colors = [],
      m_textureCoords = [],
      m_size = [],
      m_geom = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get positions for the points
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getPositions = function () {
    return m_positions;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set positions for the source
   *
   * @param positions
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPositions = function (positions) {
    if (positions instanceof Array) {
      m_positions = positions;
    } else {
      console
          .log('[ERROR] Invalid data type for positions. Array is required.');
    }
    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get colors for the points
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getColors = function () {
    return m_colors;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set colors for the points
   *
   * @param colors
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setColors = function (colors) {
    if (colors instanceof Array) {
      m_colors = colors;
    } else {
      console.log('[ERROR] Invalid data type for colors. Array is required.');
    }

    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get size for the points
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getSize = function () {
    return m_size;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set colors for the points
   *
   * @param colors
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setSize = function (size) {
    m_size = size;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set texture coordinates for the points
   *
   * @param texcoords
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setTextureCoordinates = function (texcoords) {
    if (texcoords instanceof Array) {
      m_textureCoords = texcoords;
    } else {
      console.log('[ERROR] Invalid data type for ' +
                  'texture coordinates. Array is required.');
    }
    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a point geometry given input parameters
   */
  ////////////////////////////////////////////////////////////////////////////
  this.create = function () {
    m_geom = new vgl.geometryData();

    if (m_positions.length % 3 !== 0) {
      console.log('[ERROR] Invalid length of the points array');
      return;
    }

    var numPts = m_positions.length / 3,
        i = 0,
        indices = [],
        pointsPrimitive,
        sourcePositions,
        sourceColors,
        sourceTexCoords,
        sourceSize;

    indices.length = numPts;
    for (i = 0; i < numPts; i += 1) {
      indices[i] = i;
    }

    /// Generate array of size if needed
    sourceSize = vgl.sourceDataDf();
    if (numPts !== m_size.length) {
      for (i = 0; i < numPts; i += 1) {
        sourceSize.pushBack(m_size);
      }
    } else {
      sourceSize.setData(m_size);
    }
    m_geom.addSource(sourceSize);

    pointsPrimitive = new vgl.points();
    pointsPrimitive.setIndices(indices);

    sourcePositions = vgl.sourceDataP3fv();
    sourcePositions.pushBack(m_positions);
    m_geom.addSource(sourcePositions);

    if ((m_colors.length > 0) && m_colors.length === m_positions.length) {
      sourceColors = vgl.sourceDataC3fv();
      sourceColors.pushBack(m_colors);
      m_geom.addSource(sourceColors);
    } else if ((m_colors.length > 0) && m_colors.length !== m_positions.length) {
      console
          .log('[ERROR] Number of colors are different than number of points');
    }

    if (m_textureCoords.length > 0 &&
        m_textureCoords.length === m_positions.length) {
      sourceTexCoords = vgl.sourceDataT2fv();
      sourceTexCoords.pushBack(m_textureCoords);
      m_geom.addSource(sourceTexCoords);
    } else if (m_textureCoords.length > 0 &&
        (m_textureCoords.length / 2) !== (m_positions.length / 3)) {
      console
          .log('[ERROR] Number of texture coordinates are different than ' +
               'number of points');
    }


    m_geom.addPrimitive(pointsPrimitive);

    return m_geom;
  };
};

inherit(vgl.pointSource, vgl.source);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class lineSource
 *
 * @class
 * @returns {vgl.lineSource}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.lineSource = function (positions, colors) {
  'use strict';

  if (!(this instanceof vgl.lineSource)) {
    return new vgl.lineSource();
  }
  vgl.source.call(this);

  var m_positions = positions,
      m_colors = colors;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set start positions for the lines
   *
   * @param positions
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setPositions = function (positions) {
    if (positions instanceof Array) {
      m_positions = positions;
      this.modified();
      return true;
    }

    console
      .log('[ERROR] Invalid data type for positions. Array is required.');
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set colors for the lines
   *
   * @param colors
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setColors = function (colors) {
    if (colors instanceof Array) {
      m_colors = colors;
      this.modified();
      return true;
    }

    console.log('[ERROR] Invalid data type for colors. Array is required.');
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a point geometry given input parameters
   */
  ////////////////////////////////////////////////////////////////////////////
  this.create = function () {
    if (!m_positions) {
      console.log('[error] Invalid positions');
      return;
    }

    if (m_positions.length % 3 !== 0) {
      console.log('[error] Line source requires 3d points');
      return;
    }

    if (m_positions.length % 3 !== 0) {
      console.log('[ERROR] Invalid length of the points array');
      return;
    }

    var m_geom = new vgl.geometryData(),
        numPts = m_positions.length / 3,
        i,
        indices = [],
        linesPrimitive,
        sourcePositions,
        sourceColors;

    indices.length = numPts;

    for (i = 0; i < numPts; i += 1) {
      indices[i] = i;
    }

    linesPrimitive = new vgl.lines();
    linesPrimitive.setIndices(indices);

    sourcePositions = vgl.sourceDataP3fv();
    sourcePositions.pushBack(m_positions);
    m_geom.addSource(sourcePositions);

    if (m_colors && (m_colors.length > 0) &&
         m_colors.length === m_positions.length) {
      sourceColors = vgl.sourceDataC3fv();
      sourceColors.pushBack(m_colors);
      m_geom.addSource(sourceColors);
    } else if (m_colors && (m_colors.length > 0) &&
             m_colors.length !== m_positions.length) {
      console
        .log('[error] Number of colors are different than number of points');
    }

    m_geom.addPrimitive(linesPrimitive);

    return m_geom;
  };
};

inherit(vgl.lineSource, vgl.source);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global document, vgl, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class utils
 *
 * Utility class provides helper functions such as functions to create
 * shaders, geometry etc.
 *
 * @returns {vgl.utils}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils = function () {
  'use strict';

  if (!(this instanceof vgl.utils)) {
    return new vgl.utils();
  }
  vgl.object.call(this);

  return this;
};

inherit(vgl.utils, vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * Helper function to compute power of 2 number
 *
 * @param value
 * @param pow
 *
 * @returns {number}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.computePowerOfTwo = function (value, pow) {
  'use strict';
  pow = pow || 1;
  while (pow < value) {
    pow *= 2;
  }
  return pow;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of default vertex shader that uses a texture
 *
 * Helper function to create default vertex shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createTextureVertexShader = function (context) {
  'use strict';
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
        ' iTextureCoord = textureCoord;', '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.VERTEX_SHADER, context,
                             vertexShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of default fragment shader that uses a texture
 *
 * Helper function to create default fragment shader with sampler
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createTextureFragmentShader = function (context) {
  'use strict';
  var fragmentShaderSource = [
        'varying highp vec3 iTextureCoord;',
        'uniform sampler2D sampler2d;',
        'uniform mediump float opacity;',
        'void main(void) {',
        'gl_FragColor = vec4(texture2D(sampler2d, vec2(iTextureCoord.s, ' +
                        'iTextureCoord.t)).xyz, opacity);',
        '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.FRAGMENT_SHADER, context,
                             fragmentShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create variation of createTextureFragmentShader which uses texture alpha
 *
 * Helper function to create default fragment shader with sampler
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createRgbaTextureFragmentShader = function (context) {
  'use strict';
  var fragmentShaderSource = [
        'varying highp vec3 iTextureCoord;',
        'uniform sampler2D sampler2d;',
        'uniform mediump float opacity;',
        'void main(void) {',
        '  mediump vec4 color = vec4(texture2D(sampler2d, vec2(' +
                                'iTextureCoord.s, iTextureCoord.t)).xyzw);',
        '  color.w *= opacity;',
        '  gl_FragColor = color;',
        '}'
      ].join('\n');
  return vgl.getCachedShader(vgl.GL.FRAGMENT_SHADER, context,
                             fragmentShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of default vertex shader
 *
 * Helper function to create default vertex shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createVertexShader = function (context) {
  'use strict';
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
        ' iVertexColor = vertexColor;', '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.VERTEX_SHADER, context,
                             vertexShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of default vertex shader
 *
 * Helper function to create default vertex shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPointVertexShader = function (context) {
  'use strict';
  var vertexShaderSource = [
        'attribute vec3 vertexPosition;',
        'attribute vec3 vertexColor;',
        'attribute float vertexSize;',
        'uniform mat4 modelViewMatrix;',
        'uniform mat4 projectionMatrix;',
        'varying mediump vec3 iVertexColor;',
        'varying highp vec3 iTextureCoord;',
        'void main(void)',
        '{',
        'gl_PointSize =  vertexSize;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
        ' iVertexColor = vertexColor;', '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.VERTEX_SHADER, context,
                             vertexShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of vertex shader with a solid color
 *
 * Helper function to create default vertex shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createVertexShaderSolidColor = function (context) {
  'use strict';
  var vertexShaderSource = [
        'attribute vec3 vertexPosition;',
        'uniform mediump float pointSize;',
        'uniform mat4 modelViewMatrix;',
        'uniform mat4 projectionMatrix;',
        'void main(void)',
        '{',
        'gl_PointSize = pointSize;',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
        '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.VERTEX_SHADER, context,
                             vertexShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of vertex shader that passes values through
 * for color mapping
 *
 * Helper function to create default vertex shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createVertexShaderColorMap = function (context, min, max) {
  'use strict';
  min = min; /* unused parameter */
  max = max; /* unused parameter */
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
        '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.VERTEX_SHADER, context,
                             vertexShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of default fragment shader
 *
 * Helper function to create default fragment shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createFragmentShader = function (context) {
  'use strict';
  var fragmentShaderSource = ['varying mediump vec3 iVertexColor;',
                              'uniform mediump float opacity;',
                              'void main(void) {',
                              'gl_FragColor = vec4(iVertexColor, opacity);',
                              '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.FRAGMENT_SHADER, context,
                             fragmentShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a Phong vertex shader
 *
 * Helper function to create Phong vertex shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPhongVertexShader = function (context) {
  'use strict';
  var vertexShaderSource = [
      'attribute highp vec3 vertexPosition;',
      'attribute mediump vec3 vertexNormal;',
      'attribute mediump vec3 vertexColor;',

      'uniform highp mat4 projectionMatrix;',
      'uniform mat4 modelViewMatrix;',
      'uniform mat4 normalMatrix;',

      'varying highp vec4 varPosition;',
      'varying mediump vec3 varNormal;',
      'varying mediump vec3 varVertexColor;',

      'void main(void)',
      '{',
      'varPosition = modelViewMatrix * vec4(vertexPosition, 1.0);',
      'gl_Position = projectionMatrix * varPosition;',
      'varNormal = vec3(normalMatrix * vec4(vertexNormal, 0.0));',
      'varVertexColor = vertexColor;',
      '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.VERTEX_SHADER, context,
                             vertexShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of Phong fragment shader
 *
 * Helper function to create Phong fragment shader
 *
 * NOTE: Shader assumes directional light
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPhongFragmentShader = function (context) {
  'use strict';
  var fragmentShaderSource = [
    'uniform mediump float opacity;',
    'precision mediump float;',
    'varying vec3 varNormal;',
    'varying vec4 varPosition;',
    'varying mediump vec3 varVertexColor;',
    'const vec3 lightPos = vec3(0.0, 0.0,10000.0);',
    'const vec3 ambientColor = vec3(0.01, 0.01, 0.01);',
    'const vec3 specColor = vec3(0.0, 0.0, 0.0);',

    'void main() {',
    'vec3 normal = normalize(varNormal);',
    'vec3 lightDir = normalize(lightPos);',
    'vec3 reflectDir = -reflect(lightDir, normal);',
    'vec3 viewDir = normalize(-varPosition.xyz);',

    'float lambertian = max(dot(lightDir, normal), 0.0);',
    'vec3 color = vec3(0.0);',
    'if(lambertian > 0.0) {',
    '  color = lambertian * varVertexColor;',
    '}',
    'gl_FragColor = vec4(color * opacity, 1.0 - opacity);',
    '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.FRAGMENT_SHADER, context,
                             fragmentShaderSource);
};


//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of fragment shader with an assigned constant color.
 *
 * Helper function to create default fragment shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createFragmentShaderSolidColor = function (context, color) {
  'use strict';
  var fragmentShaderSource = [
      'uniform mediump float opacity;',
      'void main(void) {',
      'gl_FragColor = vec4(' + color[0] + ',' + color[1] + ',' + color[2] + ', opacity);',
      '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.FRAGMENT_SHADER, context,
                             fragmentShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of fragment shader that maps values into colors bia lookup table
 *
 * Helper function to create default fragment shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createFragmentShaderColorMap = function (context) {
  'use strict';
  var fragmentShaderSource = [
        'varying mediump float iVertexScalar;',
        'uniform sampler2D sampler2d;',
        'uniform mediump float opacity;',
        'void main(void) {',
        'gl_FragColor = vec4(texture2D(sampler2d, vec2(iVertexScalar, ' +
            '0.0)).xyz, opacity);',
        '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.FRAGMENT_SHADER, context,
                             fragmentShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of vertex shader for point sprites
 *
 * Helper function to create default point sprites vertex shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPointSpritesVertexShader = function (context) {
  'use strict';
  var vertexShaderSource = [
        'attribute vec3 vertexPosition;',
        'attribute vec3 vertexColor;',
        'uniform mediump vec2 pointSize;',
        'uniform mat4 modelViewMatrix;',
        'uniform mat4 projectionMatrix;',
        'uniform float height;',
        'varying mediump vec3 iVertexColor;',
        'varying highp float iVertexScalar;',
        'void main(void)',
        '{',
        'mediump float realPointSize = pointSize.y;',
        'if (pointSize.x > pointSize.y) {',
        '  realPointSize = pointSize.x;}',
        'gl_PointSize = realPointSize ;',
        'iVertexScalar = vertexPosition.z;',
        'gl_Position = projectionMatrix * modelViewMatrix * ' +
            'vec4(vertexPosition.xy, height, 1.0);',
        ' iVertexColor = vertexColor;', '}'].join('\n');
  return vgl.getCachedShader(vgl.GL.VERTEX_SHADER, context,
                             vertexShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of fragment shader for point sprites
 *
 * Helper function to create default point sprites fragment shader
 *
 * @param context
 * @returns {vgl.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPointSpritesFragmentShader = function (context) {
  'use strict';
  var fragmentShaderSource = [
        'varying mediump vec3 iVertexColor;',
        'varying highp float iVertexScalar;',
        'uniform sampler2D opacityLookup;',
        'uniform highp float lutMin;',
        'uniform highp float lutMax;',
        'uniform sampler2D scalarsToColors;',
        'uniform int useScalarsToColors;',
        'uniform int useVertexColors;',
        'uniform mediump vec2 pointSize;',
        'uniform mediump float vertexColorWeight;',
        'void main(void) {',
        'mediump vec2 realTexCoord;',
        'if (pointSize.x > pointSize.y) {',
        '  realTexCoord = vec2(1.0, pointSize.y/pointSize.x) * gl_PointCoord;',
        '} else {',
        '  realTexCoord = vec2(pointSize.x/pointSize.y, 1.0) * gl_PointCoord;',
        '}',
        'highp float texOpacity = texture2D(opacityLookup, realTexCoord).w;',
        'if (useScalarsToColors == 1) {',
        '  gl_FragColor = vec4(texture2D(scalarsToColors, vec2((' +
            'iVertexScalar - lutMin)/(lutMax - lutMin), 0.0)).xyz, ' +
            'texOpacity);',
        '} else if (useVertexColors == 1) {',
        '  gl_FragColor = vec4(iVertexColor, texOpacity);',
        '} else {',
        '  gl_FragColor = vec4(texture2D(opacityLookup, realTexCoord).xyz, texOpacity);',
        '}}'
    ].join('\n');
  return vgl.getCachedShader(vgl.GL.FRAGMENT_SHADER, context,
                             fragmentShaderSource);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of texture material
 *
 * Helper function to create a texture material
 *
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createTextureMaterial = function (isRgba, origin) {
  'use strict';
  var mat = new vgl.material(),
    blend = new vgl.blend(),
    prog = new vgl.shaderProgram(),
    vertexShader = vgl.utils.createTextureVertexShader(vgl.GL),
    fragmentShader = null,
    posVertAttr = new vgl.vertexAttribute('vertexPosition'),
    texCoordVertAttr = new vgl.vertexAttribute('textureCoord'),
    pointsizeUniform = new vgl.floatUniform('pointSize', 5.0),
    modelViewUniform,
    projectionUniform = new vgl.projectionUniform('projectionMatrix'),
    samplerUniform = new vgl.uniform(vgl.GL.INT, 'sampler2d'),
    opacityUniform = null;
  if (origin !== undefined) {
    modelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix',
                                                      origin);
  } else {
    modelViewUniform = new vgl.modelViewUniform('modelViewMatrix');
  }

  samplerUniform.set(0);

  prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
  prog.addVertexAttribute(texCoordVertAttr,
                          vgl.vertexAttributeKeys.TextureCoordinate);
  prog.addUniform(pointsizeUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);

  if (isRgba) {
    fragmentShader = vgl.utils.createRgbaTextureFragmentShader(vgl.GL);
  } else {
    fragmentShader = vgl.utils.createTextureFragmentShader(vgl.GL);
  }
  opacityUniform = new vgl.floatUniform('opacity', 1.0);
  prog.addUniform(opacityUniform);

  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  return mat;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geometry material
 *
 * Helper function to create geometry material
 *
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createGeometryMaterial = function () {
  'use strict';
  var mat = new vgl.material(),
      prog = new vgl.shaderProgram(),
      pointSize = 5.0,
      opacity = 1.0,
      vertexShader = vgl.utils.createVertexShader(vgl.GL),
      fragmentShader = vgl.utils.createFragmentShader(vgl.GL),
      posVertAttr = new vgl.vertexAttribute('vertexPosition'),
      colorVertAttr = new vgl.vertexAttribute('vertexColor'),
      pointsizeUniform = new vgl.floatUniform('pointSize', pointSize),
      opacityUniform = new vgl.floatUniform('opacity', opacity),
      modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
      projectionUniform = new vgl.projectionUniform('projectionMatrix');

  prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
  prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
  prog.addUniform(pointsizeUniform);
  prog.addUniform(opacityUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);

  return mat;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geometry material
 *
 * Helper function to create geometry material
 *
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPointGeometryMaterial = function (opacity) {
  'use strict';
  opacity = opacity === undefined ? 1.0 : opacity;
  var mat = new vgl.material(),
      blend = new vgl.blend(),
      prog = new vgl.shaderProgram(),
      vertexShader = vgl.utils.createPointVertexShader(vgl.GL),
      fragmentShader = vgl.utils.createFragmentShader(vgl.GL),
      posVertAttr = new vgl.vertexAttribute('vertexPosition'),
      colorVertAttr = new vgl.vertexAttribute('vertexColor'),
      sizeVertAttr = new vgl.vertexAttribute('vertexSize'),
      opacityUniform = new vgl.floatUniform('opacity', opacity),
      modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
      projectionUniform = new vgl.projectionUniform('projectionMatrix');

  prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
  prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
  prog.addVertexAttribute(sizeVertAttr, vgl.vertexAttributeKeys.Scalar);
  prog.addUniform(opacityUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  return mat;
};


//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geometry material with the phong shader
 *
 * Helper function to create color phong shaded geometry material
 *
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPhongMaterial = function () {
  'use strict';
  var mat = new vgl.material(),
      prog = new vgl.shaderProgram(),
      vertexShader = vgl.utils.createPhongVertexShader(vgl.GL),
      fragmentShader = vgl.utils.createPhongFragmentShader(vgl.GL),
      posVertAttr = new vgl.vertexAttribute('vertexPosition'),
      normalVertAttr = new vgl.vertexAttribute('vertexNormal'),
      colorVertAttr = new vgl.vertexAttribute('vertexColor'),
      opacityUniform = new vgl.floatUniform('opacity', 1.0),
      modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
      normalUniform = new vgl.normalMatrixUniform('normalMatrix'),
      projectionUniform = new vgl.projectionUniform('projectionMatrix');

  prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
  prog.addVertexAttribute(normalVertAttr, vgl.vertexAttributeKeys.Normal);
  prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
  prog.addUniform(opacityUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addUniform(normalUniform);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  //mat.addAttribute(blend);
  mat.addAttribute(prog);

  return mat;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of colored geometry material
 *
 * Helper function to create color geometry material
 *
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createColorMaterial = function () {
  'use strict';
  var mat = new vgl.material(),
      blend = new vgl.blend(),
      prog = new vgl.shaderProgram(),
      vertexShader = vgl.utils.createVertexShader(vgl.GL),
      fragmentShader = vgl.utils.createFragmentShader(vgl.GL),
      posVertAttr = new vgl.vertexAttribute('vertexPosition'),
      texCoordVertAttr = new vgl.vertexAttribute('textureCoord'),
      colorVertAttr = new vgl.vertexAttribute('vertexColor'),
      pointsizeUniform = new vgl.floatUniform('pointSize', 5.0),
      opacityUniform = new vgl.floatUniform('opacity', 1.0),
      modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
      projectionUniform = new vgl.projectionUniform('projectionMatrix');

  prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
  prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
  prog.addVertexAttribute(texCoordVertAttr,
                          vgl.vertexAttributeKeys.TextureCoordinate);
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

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of geometry material
 *
 * Helper function to create geometry material
 *
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createColorMappedMaterial = function (lut) {
  'use strict';
  if (!lut) {
    lut = new vgl.lookupTable();
  }

  var scalarRange = lut.range(),
      mat = new vgl.material(),
      blend = new vgl.blend(),
      prog = new vgl.shaderProgram(),
      vertexShader = vgl.utils.createVertexShaderColorMap(
        vgl.GL, scalarRange[0], scalarRange[1]),
      fragmentShader = vgl.utils.createFragmentShaderColorMap(vgl.GL),
      posVertAttr = new vgl.vertexAttribute('vertexPosition'),
      scalarVertAttr = new vgl.vertexAttribute('vertexScalar'),
      pointsizeUniform = new vgl.floatUniform('pointSize', 5.0),
      opacityUniform = new vgl.floatUniform('opacity', 1.0),
      lutMinUniform = new vgl.floatUniform('lutMin', scalarRange[0]),
      lutMaxUniform = new vgl.floatUniform('lutMax', scalarRange[1]),
      modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
      projectionUniform = new vgl.projectionUniform('projectionMatrix'),
      samplerUniform = new vgl.uniform(vgl.GL.FLOAT, 'sampler2d'),
      lookupTable = lut;

  samplerUniform.set(0);

  prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
  prog.addVertexAttribute(scalarVertAttr, vgl.vertexAttributeKeys.Scalar);
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
  mat.addAttribute(lookupTable);

  return mat;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Update color mapped material
 *
 * @param mat
 * @param scalarRange
 * @param lut
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.updateColorMappedMaterial = function (mat, lut) {
  'use strict';
  if (!mat) {
    console.log('[warning] Invalid material. Nothing to update.');
    return;
  }

  if (!lut) {
    console.log('[warning] Invalid lookup table. Nothing to update.');
    return;
  }


  var lutMin = mat.shaderProgram().uniform('lutMin'),
      lutMax = mat.shaderProgram().uniform('lutMax');

  lutMin.set(lut.range()[0]);
  lutMax.set(lut.range()[1]);

  // This will replace the existing lookup table
  mat.setAttribute(lut);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of solid color material
 *
 * Helper function to create geometry material
 *
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createSolidColorMaterial = function (color) {
  'use strict';
  if (!color) {
    color = [1.0, 1.0, 1.0];
  }

  var mat = new vgl.material(),
      blend = new vgl.blend(),
      prog = new vgl.shaderProgram(),
      vertexShader = vgl.utils.createVertexShaderSolidColor(vgl.GL),
      fragmentShader = vgl.utils.createFragmentShaderSolidColor(vgl.GL, color),
      posVertAttr = new vgl.vertexAttribute('vertexPosition'),
      pointsizeUniform = new vgl.floatUniform('pointSize', 5.0),
      opacityUniform = new vgl.floatUniform('opacity', 1.0),
      modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
      projectionUniform = new vgl.projectionUniform('projectionMatrix');

  prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
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

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of point sprites material
 *
 * Helper function to create point sprites material
 *
 * @returns {vgl.material}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPointSpritesMaterial = function (image, lut) {
  'use strict';
  var scalarRange = lut === undefined ? [0, 1] : lut.range(),
      mat = new vgl.material(),
      blend = new vgl.blend(),
      prog = new vgl.shaderProgram(),
      vertexShader = vgl.utils.createPointSpritesVertexShader(vgl.GL),
      fragmentShader = vgl.utils.createPointSpritesFragmentShader(vgl.GL),
      posVertAttr = new vgl.vertexAttribute('vertexPosition'),
      colorVertAttr = new vgl.vertexAttribute('vertexColor'),
      heightUniform = new vgl.floatUniform('height', 0.0),
      vertexColorWeightUniform =
        new vgl.floatUniform('vertexColorWeight', 0.0),
      lutMinUniform = new vgl.floatUniform('lutMin', scalarRange[0]),
      lutMaxUniform = new vgl.floatUniform('lutMax', scalarRange[1]),
      modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
      projectionUniform = new vgl.projectionUniform('projectionMatrix'),
      samplerUniform = new vgl.uniform(vgl.GL.INT, 'opacityLookup'),
      scalarsToColors = new vgl.uniform(vgl.GL.INT, 'scalarsToColors'),
      useScalarsToColors = new vgl.uniform(vgl.GL.INT, 'useScalarsToColors'),
      useVertexColors = new vgl.uniform(vgl.GL.INT, 'useVertexColors'),
      pointSize = new vgl.uniform(vgl.GL.FLOAT_VEC2, 'pointSize'),
      texture = new vgl.texture();

  samplerUniform.set(0);
  scalarsToColors.set(1);
  useScalarsToColors.set(0);
  useVertexColors.set(0);
  pointSize.set([1.0, 1.0]);

  prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
  prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
  prog.addUniform(heightUniform);
  prog.addUniform(vertexColorWeightUniform);
  prog.addUniform(modelViewUniform);
  prog.addUniform(projectionUniform);
  prog.addUniform(samplerUniform);
  prog.addUniform(useVertexColors);
  prog.addUniform(useScalarsToColors);
  prog.addUniform(pointSize);
  prog.addShader(fragmentShader);
  prog.addShader(vertexShader);
  mat.addAttribute(prog);
  mat.addAttribute(blend);

  if (lut) {
    prog.addUniform(scalarsToColors);
    useScalarsToColors.set(1);
    prog.addUniform(lutMinUniform);
    prog.addUniform(lutMaxUniform);
    lut.setTextureUnit(1);
    mat.addAttribute(lut);
  }

  texture.setImage(image);
  texture.setTextureUnit(0);
  mat.addAttribute(texture);
  return mat;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of an actor that contains a plane geometry
 *
 * Function to create a plane node This method will create a plane actor
 * with texture coordinates, eventually normal, and plane material.
 *
 * @returns {vgl.actor}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPlane = function (originX, originY, originZ,
                                 point1X, point1Y, point1Z,
                                 point2X, point2Y, point2Z) {
  'use strict';
  var mapper = new vgl.mapper(),
      planeSource = new vgl.planeSource(),
      mat = vgl.utils.createGeometryMaterial(),
      actor = new vgl.actor();

  planeSource.setOrigin(originX, originY, originZ);
  planeSource.setPoint1(point1X, point1Y, point1Z);
  planeSource.setPoint2(point2X, point2Y, point2Z);

  mapper.setGeometryData(planeSource.create());
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of an actor that contains a texture plane geometry
 *
 * Helper function to create a plane textured node This method will create
 * a plane actor with texture coordinates, eventually normal, and plane
 * material.
 *
 * @returns {vgl.actor}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createTexturePlane = function (originX, originY, originZ,
                                        point1X, point1Y, point1Z,
                                        point2X, point2Y, point2Z,
                                        isRgba) {
  'use strict';
  var mapper = new vgl.mapper(),
      planeSource = new vgl.planeSource(),
      mat = vgl.utils.createTextureMaterial(isRgba,
                                            [originX, originY, originZ]),
      actor = new vgl.actor();

  planeSource.setPoint1(point1X - originX, point1Y - originY, point1Z - originZ);
  planeSource.setPoint2(point2X - originX, point2Y - originY, point2Z - originZ);
  mapper.setGeometryData(planeSource.create());

  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of an actor that contains points
 *
 * Helper function to create a point node This method will create a point
 * actor with texture coordinates, eventually normal, and plane material.
 *
 * @returns {vgl.actor}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPoints = function (positions, size, colors, texcoords, opacity) {
  'use strict';
  if (!positions) {
    console.log('[ERROR] Cannot create points without positions');
    return null;
  }

  opacity = opacity === undefined ? 1.0 : opacity;
  var mapper = new vgl.mapper(),
      pointSource = new vgl.pointSource(),
      mat = vgl.utils.createPointGeometryMaterial(opacity),
      actor = new vgl.actor();

  pointSource.setPositions(positions);
  if (colors) {
    pointSource.setColors(colors);
  }

  if (texcoords) {
    pointSource.setTextureCoordinates(texcoords);
  }

  if (size) {
    pointSource.setSize(size);
  } else {
    pointSource.setSize(1.0);
  }

  mapper.setGeometryData(pointSource.create());
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of an actor that contains point sprites
 *
 * Helper function to create a point sprites node This method will create
 * a point sprites actor with texture coordinates, normals, and a point sprites
 * material.
 *
 * @returns {vgl.actor}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createPointSprites = function (image, positions, colors,
                                              texcoords) {
  'use strict';
  if (!image) {
    console.log('[ERROR] Point sprites requires an image');
    return null;
  }

  if (!positions) {
    console.log('[ERROR] Cannot create points without positions');
    return null;
  }

  var mapper = new vgl.mapper(),
      pointSource = new vgl.pointSource(),
      mat = vgl.utils.createPointSpritesMaterial(image),
      actor = new vgl.actor();

  pointSource.setPositions(positions);
  if (colors) {
    pointSource.setColors(colors);
  }

  if (texcoords) {
    pointSource.setTextureCoordinates(texcoords);
  }

  mapper.setGeometryData(pointSource.create());
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create lines given positions, colors, and desired length
 *
 * @param positions
 * @param colors
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createLines = function (positions, colors) {
  'use strict';
  if (!positions) {
    console.log('[ERROR] Cannot create points without positions');
    return null;
  }

  var mapper = new vgl.mapper(),
      lineSource = new vgl.lineSource(),
      mat = vgl.utils.createGeometryMaterial(),
      actor = new vgl.actor();

  lineSource.setPositions(positions);
  if (colors) {
    lineSource.setColors(colors);
  }

  mapper.setGeometryData(lineSource.create());
  actor.setMapper(mapper);
  actor.setMaterial(mat);

  return actor;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create color legend
 *
 * @param lookupTable
 * @param width
 * @param height
 * @param origin
 * @param divs
 * @returns {Array}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.createColorLegend = function (varname, lookupTable, origin,
                                             width, height, countMajor,
                                             countMinor) {
  'use strict';

  if (!lookupTable) {
    console.log('[error] Invalid lookup table');
    return [];
  }

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Create labels for the legend
   *
   * @param ticks
   * @param range
   * @param divs
   */
  //////////////////////////////////////////////////////////////////////////////
  function createLabels(varname, positions, range) {
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
        size = vgl.utils.computePowerOfTwo(48),
        index = 0,
        actors = [],
        origin = [],
        pt1 = [],
        pt2 = [],
        delta = (positions[6] - positions[0]),
        axisLabelOffset = 4, i;

    origin.length = 3;
    pt1.length = 3;
    pt2.length = 3;

    // For now just create labels for end points
    for (i = 0; i < 2; i += 1) {
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

      actor = vgl.utils.createTexturePlane(
        origin[0], origin[1], origin[2],
        pt1[0], pt1[1], pt1[2],
        pt2[0], pt2[1], pt2[2], true);

      actor.setReferenceFrame(vgl.boundingObject.ReferenceFrame.Absolute);
      actor.material().setBinNumber(vgl.material.RenderBin.Overlay);
      actor.material().addAttribute(vgl.utils.create2DTexture(
        range[i].toFixed(2).toString(), 12, null));
      actors.push(actor);
    }

    // Create axis label
    origin[0] = (positions[0] + positions[positions.length - 3]  - size) * 0.5;
    origin[1] = positions[1] + axisLabelOffset;
    origin[2] = positions[2];

    pt1[0] = origin[0] + size;
    pt1[1] = origin[1];
    pt1[2] = origin[2];

    pt2[0] = origin[0];
    pt2[1] = origin[1] + size;
    pt2[2] = origin[2];

    actor = vgl.utils.createTexturePlane(
      origin[0], origin[1], origin[2],
      pt1[0], pt1[1], pt1[2],
      pt2[0], pt2[1], pt2[2], true);
    actor.setReferenceFrame(vgl.boundingObject.ReferenceFrame.Absolute);
    actor.material().setBinNumber(vgl.material.RenderBin.Overlay);
    actor.material().addAttribute(vgl.utils.create2DTexture(
      varname, 24, null));
    actors.push(actor);

    return actors;
  }

  //////////////////////////////////////////////////////////////////////////////
  // TODO Currently we assume that the ticks are laid on x-axis
  // and this is on a 2D plane (ignoring Z axis. For now lets
  // not draw minor ticks.
  /**
   * Create ticks and labels
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
   * @returns {Array} Returns array of vgl.actor
   */
  //////////////////////////////////////////////////////////////////////////////
  function createTicksAndLabels(varname, lut,
                        originX, originY, originZ,
                        pt1X, pt1Y, pt1Z,
                        pt2X, pt2Y, pt2Z,
                        countMajor, countMinor,
                        heightMajor, heightMinor) {
    heightMinor = heightMinor; /* unused parameter */
    var width = pt2X - pt1X,
        index = null,
        delta = width / countMajor,
        positions = [],
        actors = [];

    for (index = 0; index <= countMajor; index += 1) {
      positions.push(pt1X + delta * index);
      positions.push(pt1Y);
      positions.push(pt1Z);

      positions.push(pt1X + delta * index);
      positions.push(pt1Y + heightMajor);
      positions.push(pt1Z);
    }

    // TODO: Fix this
    //actor = vgl.utils.createLines(positions, null);
    //actor.setReferenceFrame(vgl.boundingObject.ReferenceFrame.Absolute);
    //actor.material().setBinNumber(vgl.material.RenderBin.Overlay);
    //actors.push(actor);

    actors = actors.concat(createLabels(varname, positions, lut.range()));
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
      mat = null,
      group = vgl.groupNode();

  actor = vgl.utils.createTexturePlane(
    origin[0], origin[1], origin[2],
    pt1X, pt1Y, pt1Z,
    pt2X, pt2Y, pt2Z, true
  );

  mat = actor.material();
  mat.addAttribute(lookupTable);
  actor.setMaterial(mat);
  group.addChild(actor);
  actor.material().setBinNumber(vgl.material.RenderBin.Overlay);
  actor.setReferenceFrame(vgl.boundingObject.ReferenceFrame.Absolute);
  actors.push(actor);
  actors = actors.concat(createTicksAndLabels(
                          varname,
                          lookupTable,
                          origin[0], origin[1], origin[1],
                          pt2X, pt1Y, pt1Z,
                          pt1X, pt1Y, pt1Z,
                          countMajor, countMinor, 5, 3));

  // TODO This needs to change so that we can return a group node
  // which should get appended to the scene graph
  return actors;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create 2D texture by rendering text using canvas2D context
 *
 * @param textToWrite
 * @param textSize
 * @param color
 * @returns {vgl.texture}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.utils.create2DTexture = function (textToWrite, textSize,
  color, font, alignment, baseline, bold) {
  'use strict';

  var canvas = document.getElementById('textRendering'),
      ctx = null,
      texture = vgl.texture();

  font = font || 'sans-serif';
  alignment = alignment || 'center';
  baseline = baseline || 'bottom';

  if (typeof bold === 'undefined') {
    bold = true;
  }

  if (!canvas) {
    canvas = document.createElement('canvas');
  }
  ctx = canvas.getContext('2d');

  canvas.setAttribute('id', 'textRendering');
  canvas.style.display = 'none';

  // Make width and height equal so that we get pretty looking text.
  canvas.height = vgl.utils.computePowerOfTwo(8 * textSize);
  canvas.width = canvas.height;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // This determines the text colour, it can take a hex value or rgba value
  // (e.g. rgba(255,0,0,0.5))
  ctx.fillStyle = 'rgba(200, 85, 10, 1.0)';

  // This determines the alignment of text, e.g. left, center, right
  ctx.textAlign = alignment;

  // This determines the baseline of the text, e.g. top, middle, bottom
  ctx.textBaseline = baseline;

  // This determines the size of the text and the font family used
  ctx.font = 4 * textSize + 'px ' + font;
  if (bold) {
    ctx.font = 'bold ' + ctx.font;
  }

  ctx.fillText(textToWrite, canvas.width / 2, canvas.height / 2, canvas.width);

  texture.setImage(canvas);
  texture.updateDimensions();

  return texture;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, vec4, inherit*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class picker
 *
 * @class vgl.picker
 * @returns {vgl.picker}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.picker = function () {
  'use strict';

  if (!(this instanceof vgl.picker)) {
    return new vgl.picker();
  }
  vgl.object.call(this);

  /** @private */
  var m_actors = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get actors intersected
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getActors = function () {
    return m_actors;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Perform pick operation
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pick = function (selectionX, selectionY, renderer) {
    // Check if variables are acceptable
    if (selectionX === undefined) {
      return 0;
    }
    if (selectionY === undefined) {
      return 0;
    }
    if (renderer === undefined) {
      return 0;
    }

    // Clean list of actors intersected previously
    m_actors = [];

    //
    var camera = renderer.camera(),
        width = renderer.width(),
        height = renderer.height(),
        fpoint = camera.focalPoint(),
        focusWorldPt = vec4.fromValues(fpoint[0], fpoint[1], fpoint[2], 1.0),
        focusDisplayPt = renderer.worldToDisplay(
          focusWorldPt, camera.viewMatrix(),
        camera.projectionMatrix(), width, height),
        displayPt = vec4.fromValues(selectionX,
                      selectionY, focusDisplayPt[2], 1.0),
        // Convert selection point into world coordinates
        worldPt = renderer.displayToWorld(displayPt, camera.viewMatrix(),
                    camera.projectionMatrix(), width, height),
        cameraPos = camera.position(), ray = [], actors, count, i, bb,
        tmin, tmax, tymin, tymax, tzmin, tzmax, actor;

    for (i = 0; i < 3; i += 1) {
      ray[i] = worldPt[i] - cameraPos[i];
    }

    // Go through all actors and check if intersects
    actors = renderer.sceneRoot().children();
    count = 0;

    for (i = 0; i < actors.length; i += 1) {
      actor = actors[i];
      if (actor.visible() === true) {
        bb = actor.bounds();
        // Ray-aabb intersection - Smits' method
        if (ray[0] >= 0) {
          tmin = (bb[0] - cameraPos[0]) / ray[0];
          tmax = (bb[1] - cameraPos[0]) / ray[0];
        } else {
          tmin = (bb[1] - cameraPos[0]) / ray[0];
          tmax = (bb[0] - cameraPos[0]) / ray[0];
        }
        if (ray[1] >= 0) {
          tymin = (bb[2] - cameraPos[1]) / ray[1];
          tymax = (bb[3] - cameraPos[1]) / ray[1];
        } else {
          tymin = (bb[3] - cameraPos[1]) / ray[1];
          tymax = (bb[2] - cameraPos[1]) / ray[1];
        }
        if ((tmin > tymax) || (tymin > tmax)) {
          //jscs:disable disallowKeywords
          continue;
          //jscs:enable disallowKeywords
        }


        if (tymin > tmin) {
          tmin = tymin;
        }
        if (tymax < tmax) {
          tmax = tymax;
        }
        if (ray[2] >= 0) {
          tzmin = (bb[4] - cameraPos[2]) / ray[2];
          tzmax = (bb[5] - cameraPos[2]) / ray[2];
        } else {
          tzmin = (bb[5] - cameraPos[2]) / ray[2];
          tzmax = (bb[4] - cameraPos[2]) / ray[2];
        }
        if ((tmin > tzmax) || (tzmin > tmax)) {
          //jscs:disable disallowKeywords
          continue;
          //jscs:enable disallowKeywords
        }
        if (tzmin > tmin) {
          tmin = tzmin;
        }
        if (tzmax < tmax) {
          tmax = tzmax;
        }

        m_actors[count] = actor;
        count += 1;
      }
    }
    return count;
  };

  return this;
};

inherit(vgl.picker, vgl.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of shapefile reader
 *
 * This contains code that reads a shapefile and produces vgl geometries
 *
 * @class
 * @returns {vgl.shapefileReader}
 */
//////////////////////////////////////////////////////////////////////////////
vgl.shapefileReader = function () {
  'use strict';

  if (!(this instanceof vgl.shapefileReader)) {
    return new vgl.shapefileReader();
  }

  var m_that = this;
  var SHP_NULL = 0;
  var SHP_POINT = 1;
  var SHP_POLYGON = 5;
  var SHP_POLYLINE = 3;

  this.int8 = function (data, offset) {
    return data.charCodeAt (offset);
  };

  /*jshint bitwise: false */
  this.bint32 = function (data, offset) {
    return (
      ((data.charCodeAt (offset) & 0xff) << 24) +
        ((data.charCodeAt (offset + 1) & 0xff) << 16) +
        ((data.charCodeAt (offset + 2) & 0xff) << 8) +
        (data.charCodeAt (offset + 3) & 0xff)
    );
  };

  this.lint32 = function (data, offset) {
    return (
      ((data.charCodeAt (offset + 3) & 0xff) << 24) +
        ((data.charCodeAt (offset + 2) & 0xff) << 16) +
        ((data.charCodeAt (offset + 1) & 0xff) << 8) +
        (data.charCodeAt (offset) & 0xff)
    );
  };

  this.bint16 = function (data, offset) {
    return (
      ((data.charCodeAt (offset) & 0xff) << 8) +
        (data.charCodeAt (offset + 1) & 0xff)
    );
  };

  this.lint16 = function (data, offset) {
    return (
      ((data.charCodeAt (offset + 1) & 0xff) << 8) +
        (data.charCodeAt (offset) & 0xff)
    );
  };

  this.ldbl64 = function (data, offset) {
    var b0 = data.charCodeAt (offset) & 0xff;
    var b1 = data.charCodeAt (offset + 1) & 0xff;
    var b2 = data.charCodeAt (offset + 2) & 0xff;
    var b3 = data.charCodeAt (offset + 3) & 0xff;
    var b4 = data.charCodeAt (offset + 4) & 0xff;
    var b5 = data.charCodeAt (offset + 5) & 0xff;
    var b6 = data.charCodeAt (offset + 6) & 0xff;
    var b7 = data.charCodeAt (offset + 7) & 0xff;

    var sign = 1 - 2 * (b7 >> 7);
    var exp = (((b7 & 0x7f) << 4) + ((b6 & 0xf0) >> 4)) - 1023;
    //var frac = (b6 & 0x0f) * Math.pow (2, -4) + b5 * Math.pow (2, -12) + b4 *
    // Math.pow (2, -20) + b3 * Math.pow (2, -28) + b2 * Math.pow (2, -36) + b1 *
    // Math.pow (2, -44) + b0 * Math.pow (2, -52);

    //return sign * (1 + frac) * Math.pow (2, exp);
    var frac = (b6 & 0x0f) * Math.pow (2, 48) + b5 * Math.pow (2, 40) + b4 *
                 Math.pow (2, 32) + b3 * Math.pow (2, 24) + b2 *
                 Math.pow (2, 16) + b1 * Math.pow (2, 8) + b0;

    return sign * (1 + frac * Math.pow (2, -52)) * Math.pow (2, exp);
  };

  this.lfloat32 = function (data, offset) {
    var b0 = data.charCodeAt (offset) & 0xff;
    var b1 = data.charCodeAt (offset + 1) & 0xff;
    var b2 = data.charCodeAt (offset + 2) & 0xff;
    var b3 = data.charCodeAt (offset + 3) & 0xff;

    var sign = 1 - 2 * (b3 >> 7);
    var exp = (((b3 & 0x7f) << 1) + ((b2 & 0xfe) >> 7)) - 127;
    var frac = (b2 & 0x7f) * Math.pow (2, 16) + b1 * Math.pow (2, 8) + b0;

    return sign * (1 + frac * Math.pow (2, -23)) * Math.pow (2, exp);
  };
  /*jshint bitwise: true */

  this.str = function (data, offset, length) {
    var chars = [];
    var index = offset;
    while (index < offset + length) {
      var c = data[index];
      if (c.charCodeAt (0) !== 0) {
        chars.push (c);
      } else {
        break;
      }
      index += 1;
    }
    return chars.join ('');
  };

  this.readHeader = function (data) {
    var code = this.bint32(data, 0);
    var length = this.bint32(data, 24);
    var version = this.lint32(data, 28);
    var shapetype = this.lint32(data, 32);

    /*
    var xmin = this.ldbl64(data, 36);
    var ymin = this.ldbl64(data, 44);
    var xmax = this.ldbl64(data, 52);
    var ymax = this.ldbl64(data, 60);
    */
    return {
      code: code,
      length: length,
      version: version,
      shapetype: shapetype
      // bounds: new Box (vect (xmin, ymin), vect (xmax, ymax))
    };
  };

  this.loadShx = function (data) {
    var indices = [];
    var appendIndex = function (offset) {
      indices.push (2 * m_that.bint32(data, offset));
      return offset + 8;
    };
    var offset = 100;
    while (offset < data.length) {
      offset = appendIndex (offset);
    }
    return indices;
  };

  this.Shapefile = function (options) {
    var path = options.path;
    $.ajax ({
      url: path + '.shx',
      mimeType: 'text/plain; charset=x-user-defined',
      success: function (data) {
        var indices = this.loadShx(data);
        $.ajax ({
          url: path + '.shp',
          mimeType: 'text/plain; charset=x-user-defined',
          success: function (data) {
            $.ajax ({
              url: path + '.dbf',
              mimeType: 'text/plain; charset=x-user-defined',
              success: function (dbf_data) {
                var layer = this.loadShp (data, dbf_data, indices, options);
                options.success (layer);
              }
            });
          }
        });
      }
    });
  };

  this.localShapefile = function (options) {
    var shxFile = options.shx;
    var shpFile = options.shp;
    var dbfFile = options.dbf;
    var shxReader = new FileReader();
    shxReader.onloadend = function () {
      var indices = m_that.loadShx(shxReader.result);
      var shpReader = new FileReader();

      shpReader.onloadend = function () {
        var shpData = shpReader.result;

        var dbfReader = new FileReader();
        dbfReader.onloadend = function () {
          var dbfData = dbfReader.result;
          var layer = m_that.loadShp(shpData, dbfData, indices, options);
          options.success(layer);
        };
        dbfReader.readAsBinaryString(dbfFile);
      };
      shpReader.readAsBinaryString(shpFile);
    };
    shxReader.readAsBinaryString(shxFile);
  };

  this.loadDBF = function (data) {
    var readHeader = function (offset) {
      var name = m_that.str(data, offset, 10);
      var type = m_that.str(data, offset + 11, 1);
      var length = m_that.int8(data, offset + 16);
      return {
        name: name,
        type: type,
        length: length
      };
    };

    // Level of the dBASE file
    var level = m_that.int8(data, 0);
    if (level === 4) {
      throw 'Level 7 dBASE not supported';
    }

    // Date of last update
    /*
    var year = m_that.int8(data, 1);
    var month = m_that.int8(data, 2);
    var day = m_that.int8(data, 3);
    */

    var num_entries = m_that.lint32(data, 4);
    var header_size = m_that.lint16(data, 8);
    var record_size = m_that.lint16(data, 10);

    var FIELDS_START = 32;
    var HEADER_LENGTH = 32;

    var header_offset = FIELDS_START;
    var headers = [];
    while (header_offset < header_size - 1) {
      headers.push (readHeader(header_offset));
      header_offset += HEADER_LENGTH;
    }

    var records = [];
    var record_offset = header_size;
    while (record_offset < header_size + num_entries * record_size) {
      var declare = m_that.str(data, record_offset, 1);
      if (declare === '*') {
        // Record size in the header include the size of the delete indicator
        record_offset += record_size;
      } else {
        // Move offset to the start of the actual data
        record_offset += 1;
        var record = {};
        for (var i = 0; i < headers.length; i  += 1) {
          var header = headers[i];
          var value;
          if (header.type === 'C') {
            value = m_that.str(data, record_offset, header.length).trim ();
          } else if (header.type === 'N') {
            value = parseFloat (m_that.str (data, record_offset, header.length));
          }
          record_offset += header.length;
          record[header.name] = value;
        }
        records.push(record);
      }
    }
    return records;
  };

  this.loadShp = function (data, dbf_data, indices, options) {
    options = options; /* unused parameter */
    var features = [];
    var readRing = function (offset, start, end) {
      var ring = [];
      for (var i = end - 1; i >= start; i -= 1) {
        var x = m_that.ldbl64(data, offset + 16 * i);
        var y = m_that.ldbl64(data, offset + 16 * i + 8);
        ring.push ([x, y]);
      }
      //if (ring.length <= 3)
      // return [];
      return ring;
    };

    var readRecord = function (offset) {
      // var index = m_that.bint32(data, offset);
      // var record_length = m_that.bint32(data, offset + 4);
      var record_offset = offset + 8;
      var geom_type = m_that.lint32(data, record_offset);
      var num_parts, num_points, parts_start, points_start, i,
          start, end, ring, rings;

      if (geom_type === SHP_NULL) {
        console.log ('NULL Shape');
        //return offset + 12;
      } else if (geom_type === SHP_POINT) {
        var x = m_that.ldbl64(data, record_offset + 4);
        var y = m_that.ldbl64(data, record_offset + 12);

        features.push ({
          type: 'Point',
          attr: {},
          geom: [[x, y]]
        });
      } else if (geom_type === SHP_POLYGON) {
        num_parts = m_that.lint32(data, record_offset + 36);
        num_points = m_that.lint32(data, record_offset + 40);

        parts_start = offset + 52;
        points_start = offset + 52 + 4 * num_parts;

        rings = [];
        for (i = 0; i < num_parts; i  += 1) {
          start = m_that.lint32(data, parts_start + i * 4);
          if (i + 1 < num_parts) {
            end = m_that.lint32(data, parts_start + (i + 1) * 4);
          } else {
            end = num_points;
          }
          ring = readRing (points_start, start, end);
          rings.push (ring);
        }
        features.push ({
          type: 'Polygon',
          attr: {},
          geom: [rings]
        });
      } else if (geom_type === SHP_POLYLINE) {
        num_parts = m_that.lint32(data, record_offset + 36);
        num_points = m_that.lint32(data, record_offset + 40);

        parts_start = offset + 52;
        points_start = offset + 52 + 4 * num_parts;

        rings = [];
        for (i = 0; i < num_parts; i  += 1) {
          start = m_that.lint32(data, parts_start + i * 4);
          if (i + 1 < num_parts) {
            end = m_that.lint32(data, parts_start + (i + 1) * 4);
          } else {
            end = num_points;
          }
          ring = readRing (points_start, start, end);
          rings.push (ring);
        }
        features.push ({
          type: 'Polyline',
          attr: {},
          geom: [rings]
        });
      } else {
        throw 'Not Implemented: ' + geom_type;
      }
      //return offset + 2 * record_length + SHP_HEADER_LEN;
    };

    var attr = this.loadDBF(dbf_data), i;

    //var offset = 100;
    //while (offset < length * 2) {
    // offset = readRecord (offset);
    //}
    for (i = 0; i < indices.length; i  += 1) {
      var offset = indices[i];
      readRecord (offset);
    }

    var layer = []; //new Layer ();

    for (i = 0; i < features.length; i  += 1) {
      var feature = features[i];
      feature.attr = attr[i];
      layer.push (feature);
    }
    return layer;
  };

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * @module vgl
 */

/*global vgl, mat4, unescape, Float32Array, Int8Array, Uint16Array*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
//
// vbgModule.vtkReader class
// This contains code that unpack a json base64 encoded vtkdataset,
// such as those produced by ParaView's webGL exporter (where much
// of the code originated from) and convert it to VGL representation.
//
//////////////////////////////////////////////////////////////////////////////

vgl.vtkReader = function () {
  'use strict';

  if (!(this instanceof vgl.vtkReader)) {
    return new vgl.vtkReader();
  }

  var m_base64Chars =
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
     'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
     'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
     'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
     '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'],
  m_reverseBase64Chars = [],
  m_vtkRenderedList = {},
  m_vtkObjectCount = 0,
  m_vtkScene = null,
  m_node = null,
  END_OF_INPUT = -1,
  m_base64Str = '',
  m_base64Count = 0,
  m_pos = 0,
  m_viewer = null,
  i = 0;

  //initialize the array here if not already done.
  if (m_reverseBase64Chars.length === 0) {
    for (i = 0; i < m_base64Chars.length; i += 1) {
      m_reverseBase64Chars[m_base64Chars[i]] = i;
    }
  }



  ////////////////////////////////////////////////////////////////////////////
  /**
   * ntos
   *
   * @param n
   * @returns unescaped n
   */
  ////////////////////////////////////////////////////////////////////////////
  this.ntos = function (n) {
    var unN;

    unN = n.toString(16);
    if (unN.length === 1) {
      unN = '0' + unN;
    }
    unN = '%' + unN;

    return unescape(unN);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * readReverseBase64
   *
   * @returns
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readReverseBase64 = function () {
    var nextCharacter;

    if (!m_base64Str) {
      return END_OF_INPUT;
    }

    while (true) {
      if (m_base64Count >= m_base64Str.length) {
        return END_OF_INPUT;
      }
      nextCharacter = m_base64Str.charAt(m_base64Count);
      m_base64Count += 1;

      if (m_reverseBase64Chars[nextCharacter]) {
        return m_reverseBase64Chars[nextCharacter];
      }
      if (nextCharacter === 'A') {
        return 0;
      }
    }

    return END_OF_INPUT;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * decode64
   *
   * @param str
   * @returns result
   */
  ////////////////////////////////////////////////////////////////////////////
  this.decode64 = function (str) {
    var result = '',
        inBuffer = new Array(4),
        done = false;

    m_base64Str = str;
    m_base64Count = 0;

    while (!done &&
           (inBuffer[0] = this.readReverseBase64()) !== END_OF_INPUT &&
           (inBuffer[1] = this.readReverseBase64()) !== END_OF_INPUT) {
      inBuffer[2] = this.readReverseBase64();
      inBuffer[3] = this.readReverseBase64();
      /*jshint bitwise: false */
      result += this.ntos((((inBuffer[0] << 2) & 0xff) | inBuffer[1] >> 4));
      if (inBuffer[2] !== END_OF_INPUT) {
        result +=  this.ntos((((inBuffer[1] << 4) & 0xff) | inBuffer[2] >> 2));
        if (inBuffer[3] !== END_OF_INPUT) {
          result +=  this.ntos((((inBuffer[2] << 6) & 0xff) | inBuffer[3]));
        } else {
          done = true;
        }
      } else {
        done = true;
      }
      /*jshint bitwise: true */
    }

    return result;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * readNumber
   *
   * @param ss
   * @returns v
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readNumber = function (ss) {
    //jshint plusplus: false, bitwise: false
    var v = ((ss[m_pos++]) +
             (ss[m_pos++] << 8) +
             (ss[m_pos++] << 16) +
             (ss[m_pos++] << 24));
    //jshint plusplus: true, bitwise: true
    return v;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * readF3Array
   *
   * @param numberOfPoints
   * @param ss
   * @returns points
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readF3Array = function (numberOfPoints, ss) {
    var size = numberOfPoints * 4 * 3, test = new Int8Array(size),
        points = null, i;

    for (i = 0; i < size; i += 1) {
      test[i] = ss[m_pos];
      m_pos += 1;
    }

    points = new Float32Array(test.buffer);

    return points;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * readColorArray
   *
   * @param numberOfPoints
   * @param ss
   * @param vglcolors
   * @returns points
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readColorArray = function (numberOfPoints, ss, vglcolors) {
    var i, idx = 0, tmp = new Array(numberOfPoints * 3);
    //jshint plusplus: false
    for (i = 0; i < numberOfPoints; i += 1) {
      tmp[idx++] = ss[m_pos++] / 255.0;
      tmp[idx++] = ss[m_pos++] / 255.0;
      tmp[idx++] = ss[m_pos++] / 255.0;
      m_pos++;
    }
    //jshint plusplus: true
    vglcolors.insert(tmp);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * parseObject
   *
   * @param buffer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parseObject = function (vtkObject) {
    var geom = new vgl.geometryData(), mapper = vgl.mapper(), ss = [],
        type = null, data = null, size, matrix = null, material = null,
        actor, colorMapData, shaderProg, opacityUniform, lookupTable,
        colorTable, windowSize, width, height, position;

    //dehexlify
    //data = this.decode64(vtkObject.data);
    data = atob(vtkObject.data);
    //jshint bitwise: false
    for (i = 0; i < data.length; i += 1) {
      ss[i] = data.charCodeAt(i) & 0xff;
    }
    //jshint bitwise: true

    //Determine the Object type
    m_pos = 0;
    size = this.readNumber(ss);
    type = String.fromCharCode(ss[m_pos]);
    m_pos += 1;
    geom.setName(type);

    // Lines
    if (type === 'L') {
      matrix = this.parseLineData(geom, ss);
      material = vgl.utils.createGeometryMaterial();
    // Mesh
    } else if (type === 'M') {
      matrix = this.parseMeshData(geom, ss);
      material = vgl.utils.createPhongMaterial();
    // Points
    } else if (type === 'P') {
      matrix = this.parsePointData(geom, ss);
      material = vgl.utils.createGeometryMaterial();
    // ColorMap
    } else if (type === 'C') {
      colorMapData = this.parseColorMapData(geom, ss, size);
      colorTable = [];

      for (i = 0; i < colorMapData.colors.length; i += 1) {
        colorTable.push(colorMapData.colors[i][1]);
        colorTable.push(colorMapData.colors[i][2]);
        colorTable.push(colorMapData.colors[i][3]);
        colorTable.push(colorMapData.colors[i][0] * 255);
      }

      lookupTable = new vgl.lookupTable();
      lookupTable.setColorTable(colorTable);

      windowSize = m_viewer.renderWindow().windowSize();
      width = colorMapData.size[0] * windowSize[0];
      height = colorMapData.size[1] * windowSize[1];

      position = [colorMapData.position[0] * windowSize[0],
                  (1 - colorMapData.position[1]) * windowSize[1], 0];
      position[1] = position[1] - height;

      // For now hardcode the height
      height = 30;

      return vgl.utils.createColorLegend(colorMapData.title,
          lookupTable, position, width, height, 3, 0);
    // Unknown
    } else {
      console.log('Ignoring unrecognized encoded data type ' + type);
    }

    mapper.setGeometryData(geom);

    //default opacity === solid. If were transparent, set it lower.
    if (vtkObject.hasTransparency) {
      shaderProg = material.shaderProgram();
      opacityUniform = shaderProg.uniform('opacity');
      console.log('opacity ', vtkObject.opacity);
      opacityUniform.set(vtkObject.opacity);
      material.setBinNumber(1000);
    }

    actor = vgl.actor();
    actor.setMapper(mapper);
    actor.setMaterial(material);
    actor.setMatrix(mat4.transpose(mat4.create(), matrix));

    return [actor];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * parseLineData
   *
   * @param geom, ss
   * @returns matrix
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parseLineData = function (geom, ss) {
    var vglpoints = null, vglcolors = null, vgllines = null,
        matrix = mat4.create(),
        numberOfIndex, numberOfPoints, points,
        temp, index, size, m, i,
        p = null, idx = 0;

    numberOfPoints = this.readNumber(ss);
    p = new Array(numberOfPoints * 3);

    //Getting Points
    vglpoints = new vgl.sourceDataP3fv();
    points = this.readF3Array(numberOfPoints, ss);

    //jshint plusplus: false
    for (i = 0; i < numberOfPoints; i += 1) {
      p[idx++] = points[i * 3/*+0*/];
      p[idx++] = points[i * 3 + 1];
      p[idx++] =  points[i * 3 + 2];
    }
    //jshint plusplus: true
    vglpoints.insert(p);
    geom.addSource(vglpoints);

    //Getting Colors
    vglcolors = new vgl.sourceDataC3fv();
    this.readColorArray(numberOfPoints, ss, vglcolors);
    geom.addSource(vglcolors);

    //Getting connectivity
    vgllines = new vgl.lines();
    geom.addPrimitive(vgllines);
    numberOfIndex = this.readNumber(ss);

    temp = new Int8Array(numberOfIndex * 2);
    for (i = 0; i < numberOfIndex * 2; i += 1) {
      temp[i] = ss[m_pos];
      m_pos += 1;
    }

    index = new Uint16Array(temp.buffer);
    vgllines.setIndices(index);
    vgllines.setPrimitiveType(vgl.GL.LINES);

    //Getting Matrix
    size = 16 * 4;
    temp = new Int8Array(size);
    for (i = 0; i < size; i += 1) {
      temp[i] = ss[m_pos];
      m_pos += 1;
    }

    m = new Float32Array(temp.buffer);
    mat4.copy(matrix, m);

    return matrix;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * parseMeshData
   *
   * @param geom, ss
   * @returns matrix
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parseMeshData = function (geom, ss) {
    var vglpoints = null, vglcolors = null,
        normals = null, matrix = mat4.create(),
        vgltriangles = null, numberOfIndex, numberOfPoints,
        points, temp, index, size, m, i, tcoord,
        pn = null, idx = 0;

    numberOfPoints = this.readNumber(ss);
    pn = new Array(numberOfPoints * 6);
    //Getting Points
    vglpoints = new vgl.sourceDataP3N3f();
    points = this.readF3Array(numberOfPoints, ss);

    //Getting Normals
    normals = this.readF3Array(numberOfPoints, ss);
    //jshint plusplus: false
    for (i = 0; i < numberOfPoints; i += 1) {
      pn[idx++] = points[i * 3/*+0*/];
      pn[idx++] = points[i * 3 + 1];
      pn[idx++] = points[i * 3 + 2];
      pn[idx++] = normals[i * 3/*+0*/];
      pn[idx++] = normals[i * 3 + 1];
      pn[idx++] = normals[i * 3 + 2];
    }
    //jshint plusplus: true
    vglpoints.insert(pn);
    geom.addSource(vglpoints);

    //Getting Colors
    vglcolors = new vgl.sourceDataC3fv();
    this.readColorArray(numberOfPoints, ss, vglcolors);
    geom.addSource(vglcolors);

    //Getting connectivity
    temp = [];
    vgltriangles = new vgl.triangles();
    numberOfIndex = this.readNumber(ss);

    temp = new Int8Array(numberOfIndex * 2);
    for (i = 0; i < numberOfIndex * 2; i += 1) {
      temp[i] = ss[m_pos];
      m_pos += 1;
    }

    index = new Uint16Array(temp.buffer);
    vgltriangles.setIndices(index);
    geom.addPrimitive(vgltriangles);

    //Getting Matrix
    size = 16 * 4;
    temp = new Int8Array(size);
    for (i = 0; i < size; i += 1) {
      temp[i] = ss[m_pos];
      m_pos += 1;
    }

    m = new Float32Array(temp.buffer);
    mat4.copy(matrix, m);

    //Getting TCoord
    //TODO: renderer is not doing anything with this yet
    tcoord = null;

    return matrix;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * parsePointData
   *
   * @param geom, ss
   * @returns matrix
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parsePointData = function (geom, ss) {
    var numberOfPoints, points, indices, temp, size,
        matrix = mat4.create(), vglpoints = null,
        vglcolors = null, vglVertexes = null, m,
        p = null, idx = 0;

    numberOfPoints = this.readNumber(ss);
    p = new Array(numberOfPoints * 3);

    //Getting Points and creating 1:1 connectivity
    vglpoints = new vgl.sourceDataP3fv();
    points = this.readF3Array(numberOfPoints, ss);

    indices = new Uint16Array(numberOfPoints);

    //jshint plusplus: false
    for (i = 0; i < numberOfPoints; i += 1) {
      indices[i] = i;
      p[idx++] = points[i * 3/*+0*/];
      p[idx++] = points[i * 3 + 1];
      p[idx++] = points[i * 3 + 2];
    }
    //jshint plusplus: true
    vglpoints.insert(p);
    geom.addSource(vglpoints);

    //Getting Colors
    vglcolors = new vgl.sourceDataC3fv();
    this.readColorArray(numberOfPoints, ss, vglcolors);
    geom.addSource(vglcolors);

    //Getting connectivity
    vglVertexes = new vgl.points();
    vglVertexes.setIndices(indices);
    geom.addPrimitive(vglVertexes);

    //Getting matrix
    size = 16 * 4;
    temp = new Int8Array(size);
    for (i = 0; i < size; i += 1) {
      temp[i] = ss[m_pos];
      m_pos += 1;
    }

    m = new Float32Array(temp.buffer);
    mat4.copy(matrix, m);

    return matrix;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * parseColorMapData
   *
   * @param geom, ss
   * @returns matrix
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parseColorMapData = function (geom, ss, numColors) {

    var tmpArray, size, xrgb, i, c, obj = {};

    // Set number of colors
    obj.numOfColors = numColors;

    // Getting Position
    size = 8;
    tmpArray = new Int8Array(size);
    for (i = 0; i < size; i += 1) {
      tmpArray[i] = ss[m_pos];
      m_pos += 1;
    }
    obj.position = new Float32Array(tmpArray.buffer);

    // Getting Size
    size = 8;
    tmpArray = new Int8Array(size);
    for (i = 0; i < size; i += 1) {
      tmpArray[i] = ss[m_pos];
      m_pos += 1;
    }
    obj.size = new Float32Array(tmpArray.buffer);

    //Getting Colors
    obj.colors = [];
    //jshint plusplus: false
    for (c = 0; c < obj.numOfColors; c += 1) {
      tmpArray = new Int8Array(4);
      for (i = 0; i < 4; i += 1) {
        tmpArray[i] = ss[m_pos];
        m_pos += 1;
      }

      xrgb = [
        new Float32Array(tmpArray.buffer)[0],
        ss[m_pos++],
        ss[m_pos++],
        ss[m_pos++]
      ];
      obj.colors[c] = xrgb;
    }

    obj.orientation = ss[m_pos++];
    obj.numOfLabels = ss[m_pos++];
    obj.title = '';
    while (m_pos < ss.length) {
      obj.title += String.fromCharCode(ss[m_pos++]);
    }
    //jshint plusplus: true

    return obj;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * parseSceneMetadata
   *
   * @param data
   * @returns renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parseSceneMetadata = function (renderer, layer) {

    var sceneRenderer = m_vtkScene.Renderers[layer],
        camera = renderer.camera(), bgc, localWidth, localHeight;

    localWidth = (sceneRenderer.size[0] - sceneRenderer.origin[0]) * m_node.width;
    localHeight = (sceneRenderer.size[1] - sceneRenderer.origin[1]) * m_node.height;
    renderer.resize(localWidth, localHeight);

    /// We are setting the center to the focal point because of
    /// a possible paraview web bug. The center of rotation isn't
    /// getting updated correctly on resetCamera.
    camera.setCenterOfRotation(
      [sceneRenderer.LookAt[1], sceneRenderer.LookAt[2],
       sceneRenderer.LookAt[3]]);
    camera.setViewAngleDegrees(sceneRenderer.LookAt[0]);
    camera.setPosition(
      sceneRenderer.LookAt[7], sceneRenderer.LookAt[8],
      sceneRenderer.LookAt[9]);
    camera.setFocalPoint(
      sceneRenderer.LookAt[1], sceneRenderer.LookAt[2],
      sceneRenderer.LookAt[3]);
    camera.setViewUpDirection(
      sceneRenderer.LookAt[4], sceneRenderer.LookAt[5],
      sceneRenderer.LookAt[6]);

    if (layer === 0) {
      bgc = sceneRenderer.Background1;
      renderer.setBackgroundColor(bgc[0], bgc[1], bgc[2], 1);
    } else {
      renderer.setResizable(false);
    }
    renderer.setLayer(layer);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * initScene
   *
   * @returns viewer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.initScene = function () {
    var renderer, layer;

    if (m_vtkScene === null) {
      return m_viewer;
    }
    for (layer = m_vtkScene.Renderers.length - 1; layer >= 0; layer -= 1) {

      renderer = this.getRenderer(layer);
      this.parseSceneMetadata(renderer, layer);
    }

    return m_viewer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * createViewer - Creates a viewer object.
   *
   * @param
   *
   * @returns viewer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createViewer = function (node) {
    var interactorStyle;

    if (m_viewer === null) {
      m_node = node;
      m_viewer = vgl.viewer(node);
      m_viewer.init();
      m_viewer.renderWindow().removeRenderer(m_viewer.renderWindow().activeRenderer());
      m_viewer.renderWindow().addRenderer(new vgl.depthPeelRenderer());
      m_vtkRenderedList[0] = m_viewer.renderWindow().activeRenderer();
      m_viewer.renderWindow().resize(node.width, node.height);
      interactorStyle = vgl.pvwInteractorStyle();
      m_viewer.setInteractorStyle(interactorStyle);
    }

    return m_viewer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * deleteViewer - Deletes the viewer object associated with the reader.
   *
   * @returns void
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteViewer = function () {
    m_vtkRenderedList = {};
    m_viewer = null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * updateCanvas -
   *
   * @param
   *
   * @returns void
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateCanvas = function (node) {
    m_node = node;
    m_viewer.renderWindow().resize(node.width, node.height);

    return m_viewer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * clearVtkObjectData - Clear out the list of VTK geometry data.
   *
   * @param void
   * @returns void
   */
  ////////////////////////////////////////////////////////////////////////////
  this.numObjects = function () {
    return m_vtkObjectCount;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * getRenderer - Gets (or creates) the renderer for a layer.
   *
   * @param layer
   * @returns renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getRenderer = function (layer) {
    var renderer;

    renderer = m_vtkRenderedList[layer];
    if (renderer === null || typeof renderer === 'undefined') {
      renderer = new vgl.renderer();
      renderer.setResetScene(false);
      renderer.setResetClippingRange(false);
      m_viewer.renderWindow().addRenderer(renderer);

      if (layer !== 0) {
        renderer.camera().setClearMask(vgl.GL.DepthBufferBit);
      }

      m_vtkRenderedList[layer] = renderer;
    }

    return renderer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * setVtkScene - Set the VTK scene data for camera initialization.
   *
   * @param scene
   * @returns void
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setVtkScene = function (scene) {
    m_vtkScene = scene;
  };

  return this;
};

vgl.DataBuffers = function (initialSize) {
  'use strict';
  if (!(this instanceof vgl.DataBuffers)) {
    return new vgl.DataBuffers(initialSize);
  }

  var data = {};

  var size;
  if (!initialSize && initialSize !== 0) {
    size = 256;
  } else {
    size = initialSize;
  }

  var current = 0;

  var copyArray = function (dst, src, start, count) {
    if (!dst) {
      console.log ('ack');
    }
    if (!start) {
      start = 0;
    }
    if (!count) {
      count = src.length;
    }
    for (var i = 0; i < count; i += 1) {
      dst[start + i] = src[i];
    }
  };

  var resize = function (min_expand) {
    var new_size = size;
    /* If the array would increase substantially, don't just double its
     * size.  If the array has been increasing gradually, double it as the
     * expectation is that it will increase again. */
    if (new_size * 2 < min_expand) {
      new_size = min_expand;
    }
    while (new_size < min_expand) {
      new_size *= 2;
    }
    size = new_size;
    for (var name in data) {
      if (data.hasOwnProperty(name)) {
        var newArray = new Float32Array (new_size * data[name].len);
        var oldArray = data[name].array;
        copyArray (newArray, oldArray);
        data[name].array = newArray;
        data[name].dirty = true;
      }
    }
  };

  this.create = function (name, len) {
    if (!len) {
      throw 'Length of buffer must be a positive integer';
    }
    var array = new Float32Array (size * len);
    data[name] = {
      array: array,
      len: len,
      dirty: false
    };
    return data[name].array;
  };

  this.alloc = function (num) {
    if ((current + num) >= size) {
      resize (current + num);
    }
    var start = current;
    current += num;
    return start;
  };

  this.get = function (name) {
    return data[name].array;
  };

  this.write = function (name, array, start, count) {
    copyArray (data[name].array, array, start * data[name].len, count * data[name].len);
    data[name].dirty = true;
  };

  this.repeat = function (name, elem, start, count) {
    for (var i = 0; i < count; i += 1) {
      copyArray (data[name].array, elem,
                 (start + i) * data[name].len, data[name].len);
    }
    data[name].dirty = true;
  };

  this.count = function () {
    return current;
  };

  this.data = function (name) {
    return data[name].array;
  };
};

return vgl;

}));
