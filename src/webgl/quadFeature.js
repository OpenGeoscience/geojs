var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var quadFeature = require('../quadFeature');
var timestamp = require('../timestamp');
var util = require('../util');

let _memoryCheckLargestTested = 4096 * 4096;

/**
 * Create a new instance of class quadFeature.
 *
 * @class
 * @alias geo.webgl.quadFeature
 * @param {geo.quadFeature.spec} arg Options object.
 * @extends geo.quadFeature
 * @returns {geo.webgl.quadFeature}
 */
var webgl_quadFeature = function (arg) {
  'use strict';
  if (!(this instanceof webgl_quadFeature)) {
    return new webgl_quadFeature(arg);
  }
  quadFeature.call(this, arg);

  var $ = require('jquery');
  var vgl = require('../vgl');
  var object = require('./object');
  var fragmentShaderImage = require('./quadFeatureImage.frag');
  var vertexShaderImage = require('./quadFeatureImage.vert');
  var fragmentShaderColor = require('./quadFeatureColor.frag');
  var vertexShaderColor = require('./quadFeatureColor.vert');

  object.call(this);

  var m_this = this,
      s_exit = this._exit,
      s_update = this._update,
      m_modelViewUniform,
      m_actor_image, m_actor_color, m_glBuffers = {}, m_imgposbuf,
      m_clrposbuf, m_clrModelViewUniform,
      m_glCompileTimestamp = timestamp(),
      m_glColorCompileTimestamp = timestamp(),
      m_quads;

  /**
   * Allocate buffers that we need to control for image quads.  This mimics
   * the actions from vgl.mapper to some degree.
   *
   * @private
   * @param {vgl.renderState} renderState An object that contains the context
   *   used for drawing.
   */
  function setupDrawObjects(renderState) {
    var context = renderState.m_context,
        newbuf = false;

    if (m_quads.imgQuads.length) {
      if (!m_imgposbuf || m_imgposbuf.length < m_quads.imgQuads.length * 12 ||
          !m_glBuffers.imgQuadsPosition) {
        if (m_glBuffers.imgQuadsPosition) {
          context.deleteBuffer(m_glBuffers.imgQuadsPosition);
        }
        m_glBuffers.imgQuadsPosition = context.createBuffer();
        m_imgposbuf = new Float32Array(Math.max(
          128, m_quads.imgQuads.length * 2) * 12);
        newbuf = true;
      }
      $.each(m_quads.imgQuads, function (idx, quad) {
        for (var i = 0; i < 12; i += 1) {
          m_imgposbuf[idx * 12 + i] = quad.pos[i] - m_quads.origin[i % 3];
        }
      });
      context.bindBuffer(context.ARRAY_BUFFER, m_glBuffers.imgQuadsPosition);
      if (newbuf) {
        context.bufferData(context.ARRAY_BUFFER, m_imgposbuf, context.DYNAMIC_DRAW);
      } else {
        context.bufferSubData(context.ARRAY_BUFFER, 0, m_imgposbuf);
      }
    }
    m_glCompileTimestamp.modified();
  }

  /**
   * Allocate buffers that we need to control for color quads.  This mimics
   * the actions from vgl.mapper to some degree.
   *
   * @private
   * @param {vgl.renderState} renderState An object that contains the context
   *   used for drawing.
   */
  function setupColorDrawObjects(renderState) {
    var context = renderState.m_context,
        newbuf = false;

    if (m_quads.clrQuads.length) {
      if (!m_clrposbuf || m_clrposbuf.length < m_quads.clrQuads.length * 12 ||
          !m_glBuffers.clrQuadsPosition) {
        if (m_glBuffers.clrQuadsPosition) {
          context.deleteBuffer(m_glBuffers.clrQuadsPosition);
        }
        m_glBuffers.clrQuadsPosition = context.createBuffer();
        m_clrposbuf = new Float32Array(Math.max(
          128, m_quads.clrQuads.length * 2) * 12);
        newbuf = true;
      }
      $.each(m_quads.clrQuads, function (idx, quad) {
        for (var i = 0; i < 12; i += 1) {
          m_clrposbuf[idx * 12 + i] = quad.pos[i] - m_quads.origin[i % 3];
        }
      });
      context.bindBuffer(context.ARRAY_BUFFER, m_glBuffers.clrQuadsPosition);
      if (newbuf) {
        context.bufferData(context.ARRAY_BUFFER, m_clrposbuf, context.DYNAMIC_DRAW);
      } else {
        context.bufferSubData(context.ARRAY_BUFFER, 0, m_clrposbuf);
      }
    }
    m_glColorCompileTimestamp.modified();
  }

  /**
   * Get a vgl mapper, mark dynamicDraw, augment the timestamp and the render
   * function.
   *
   * @private
   * @param {function} renderFunc Our own render function.
   * @returns {vgl.mapper} a vgl mapper object.
   */
  function getVGLMapper(renderFunc) {
    var mapper = new vgl.mapper({dynamicDraw: true});
    mapper.s_modified = mapper.modified;
    mapper.g_timestamp = timestamp();
    mapper.timestamp = mapper.g_timestamp.timestamp;
    mapper.modified = function () {
      mapper.s_modified();
      mapper.g_timestamp.modified();
      return mapper;
    };
    mapper.s_render = mapper.render;
    mapper.render = renderFunc;
    return mapper;
  }

  /**
   * List vgl actors.
   *
   * @returns {vgl.actor[]} The list of actors.
   */
  this.actors = function () {
    var actors = [];
    if (m_actor_image) {
      actors.push(m_actor_image);
    }
    if (m_actor_color) {
      actors.push(m_actor_color);
    }
    return actors;
  };

  /**
   * Build this feature.
   */
  this._build = function () {
    var mapper, mat, prog, srctex, unicrop, unicropsource, geom, context, sampler2d;

    if (!m_this.position()) {
      return;
    }
    m_quads = m_this._generateQuads();
    /* Create an actor to render image quads */
    if (m_quads.imgQuads.length && !m_actor_image) {
      m_this.visible(false);
      mapper = getVGLMapper(m_this._renderImageQuads);
      m_actor_image = new vgl.actor();
      /* This is similar to vgl.utils.createTextureMaterial */
      m_actor_image.setMapper(mapper);
      mat = new vgl.material();
      prog = new vgl.shaderProgram();
      prog.addVertexAttribute(new vgl.vertexAttribute('vertexPosition'),
                              vgl.vertexAttributeKeys.Position);
      prog.addVertexAttribute(new vgl.vertexAttribute('textureCoord'),
                              vgl.vertexAttributeKeys.TextureCoordinate);
      m_modelViewUniform = new vgl.modelViewOriginUniform(
        'modelViewMatrix', m_quads.origin);
      prog.addUniform(m_modelViewUniform);
      prog.addUniform(new vgl.projectionUniform('projectionMatrix'));
      prog.addUniform(new vgl.floatUniform('opacity', 1.0));
      prog.addUniform(new vgl.floatUniform('zOffset', 0.0));
      /* Use texture unit 0 */
      sampler2d = new vgl.uniform(vgl.GL.INT, 'sampler2d');
      sampler2d.set(0);
      prog.addUniform(sampler2d);
      context = m_this.renderer()._glContext();
      unicrop = new vgl.uniform(context.FLOAT_VEC2, 'crop');
      unicrop.set([1.0, 1.0]);
      prog.addUniform(unicrop);
      unicropsource = new vgl.uniform(context.FLOAT_VEC4, 'cropsource');
      unicropsource.set([0.0, 0.0, 0.0, 0.0]);
      prog.addUniform(unicropsource);
      prog.addShader(vgl.getCachedShader(
        context.VERTEX_SHADER, context, vertexShaderImage));
      prog.addShader(vgl.getCachedShader(
        context.FRAGMENT_SHADER, context, fragmentShaderImage));
      if (m_this._hookBuild) {
        m_this._hookBuild(prog);
      }
      mat.addAttribute(prog);
      mat.addAttribute(new vgl.blend());
      /* This is similar to vgl.planeSource */
      geom = new vgl.geometryData();
      m_imgposbuf = undefined;
      srctex = new vgl.sourceDataT2fv();
      srctex.pushBack([0, 0, 1, 0, 0, 1, 1, 1]);
      geom.addSource(srctex);
      /* We deliberately do not add a primitive to our geometry -- we take care
       * of that ourselves. */

      mapper.setGeometryData(geom);
      m_actor_image.setMaterial(mat);
      m_this.renderer().contextRenderer().addActor(m_actor_image);
      m_this.visible(true);
    }
    /* Create an actor to render color quads */
    if (m_quads.clrQuads.length && !m_actor_color) {
      m_this.visible(false);
      mapper = getVGLMapper(m_this._renderColorQuads);
      m_actor_color = new vgl.actor();
      /* This is similar to vgl.utils.createTextureMaterial */
      m_actor_color.setMapper(mapper);
      mat = new vgl.material();
      prog = new vgl.shaderProgram();
      prog.addVertexAttribute(new vgl.vertexAttribute('vertexPosition'),
                              vgl.vertexAttributeKeys.Position);
      m_clrModelViewUniform = new vgl.modelViewOriginUniform(
        'modelViewMatrix', m_quads.origin);
      prog.addUniform(m_clrModelViewUniform);
      prog.addUniform(new vgl.projectionUniform('projectionMatrix'));
      prog.addUniform(new vgl.floatUniform('opacity', 1.0));
      prog.addUniform(new vgl.floatUniform('zOffset', 0.0));
      context = m_this.renderer()._glContext();
      prog.addUniform(new vgl.uniform(context.FLOAT_VEC3, 'vertexColor'));
      prog.addShader(vgl.getCachedShader(
        context.VERTEX_SHADER, context, vertexShaderColor));
      prog.addShader(vgl.getCachedShader(
        context.FRAGMENT_SHADER, context, fragmentShaderColor));
      mat.addAttribute(prog);
      mat.addAttribute(new vgl.blend());
      /* This is similar to vgl.planeSource */
      geom = new vgl.geometryData();
      m_clrposbuf = undefined;
      /* We deliberately do not add a primitive to our geometry -- we take care
       * of that ourselves. */

      mapper.setGeometryData(geom);
      m_actor_color.setMaterial(mat);

      m_this.renderer().contextRenderer().addActor(m_actor_color);
      m_this.visible(true);
    }
    if (m_modelViewUniform) {
      m_modelViewUniform.setOrigin(m_quads.origin);
    }
    if (m_clrModelViewUniform) {
      m_clrModelViewUniform.setOrigin(m_quads.origin);
    }
    m_this._updateTextures();
    m_this.buildTime().modified();
  };

  /**
   * Check all of the image quads.  If any do not have the correct texture,
   * update them.
   */
  this._updateTextures = function () {
    $.each(m_quads.imgQuads, function (idx, quad) {
      // pick source (imageTexture has priority)
      const source = quad.imageTexture || quad.image;
      if (!source) {
        return;
      }
  
      // use cached texture if it exists
      if (source._texture) {
        quad.texture = source._texture;
        return;
      }
  
      // create a new texture
      const texture = new vgl.texture();
      if (quad.imageTexture) {
        texture.setTexture(source);
      } else {
        texture.setImage(source);
      }
  
      // handle nearest pixel logic
      let nearestPixel = m_this.nearestPixel();
      if (nearestPixel !== undefined) {
        if (nearestPixel !== true && util.isNonNullFinite(nearestPixel)) {
          const curZoom = m_this.layer().map().zoom();
          nearestPixel = curZoom >= nearestPixel;
        }
      }
      if (nearestPixel) {
        texture.setNearestPixel(true);
      }
  
      quad.texture = source._texture = texture;
    });  
  };

  /**
   * Render all of the color quads using a single mapper.
   *
   * @param {vgl.renderState} renderState An object that contains the context
   *   used for drawing.
   */
  this._renderColorQuads = function (renderState) {
    if (!m_quads.clrQuads.length) {
      return;
    }
    var mapper = this;
    if (mapper.timestamp() > m_glColorCompileTimestamp.timestamp() ||
        m_this.dataTime().timestamp() > m_glColorCompileTimestamp.timestamp() ||
        renderState.m_contextChanged || !m_clrposbuf ||
        m_quads.clrQuads.length * 12 > m_clrposbuf.length) {
      setupColorDrawObjects(renderState);
    }
    mapper.s_render(renderState, true);

    var context = renderState.m_context, opacity, zOffset, color;

    context.bindBuffer(context.ARRAY_BUFFER, m_glBuffers.clrQuadsPosition);
    $.each(m_quads.clrQuads, function (idx, quad) {
      if (quad.opacity !== opacity) {
        opacity = quad.opacity;
        context.uniform1fv(renderState.m_material.shaderProgram()
          .uniformLocation('opacity'), new Float32Array([opacity]));
      }
      if ((quad.zOffset || 0.0) !== zOffset) {
        zOffset = quad.zOffset || 0.0;
        context.uniform1fv(renderState.m_material.shaderProgram()
          .uniformLocation('zOffset'), new Float32Array([zOffset]));
      }
      if (!color || color.r !== quad.color.r || color.g !== quad.color.g ||
          color.b !== quad.color.b) {
        color = quad.color;
        context.uniform3fv(renderState.m_material.shaderProgram()
          .uniformLocation('vertexColor'), new Float32Array([
          color.r, color.g, color.b]));
      }

      context.bindBuffer(context.ARRAY_BUFFER, m_glBuffers.clrQuadsPosition);
      context.vertexAttribPointer(vgl.vertexAttributeKeys.Position, 3,
                                  context.FLOAT, false, 12, idx * 12 * 4);
      context.enableVertexAttribArray(vgl.vertexAttributeKeys.Position);

      context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
    });
    context.bindBuffer(context.ARRAY_BUFFER, null);
    mapper.undoBindVertexData(renderState);
  };

  /**
   * Render all of the image quads using a single mapper.
   *
   * @param {vgl.renderState} renderState An object that contains the context
   *   used for drawing.
   */
  this._renderImageQuads = function (renderState) {
    if (!m_quads.imgQuads.length) {
      return;
    }
    var mapper = this;
    if (mapper.timestamp() > m_glCompileTimestamp.timestamp() ||
        m_this.dataTime().timestamp() > m_glCompileTimestamp.timestamp() ||
        renderState.m_contextChanged || !m_imgposbuf ||
        m_quads.imgQuads.length * 12 > m_imgposbuf.length) {
      setupDrawObjects(renderState);
    }
    mapper.s_render(renderState, true);

    var context = renderState.m_context,
        opacity, zOffset,
        crop = {x: 1, y: 1}, quadcrop,
        cropsrc = {x0: 0, y0: 0, x1: 1, y1: 1}, quadcropsrc,
        w, h, quadw, quadh;

    let nearestPixel = m_this.nearestPixel();
    if (nearestPixel !== undefined) {
      if (nearestPixel !== true && util.isNonNullFinite(nearestPixel)) {
        const curZoom = m_this.layer().map().zoom();
        nearestPixel = curZoom >= nearestPixel;
      }
      m_quads.imgQuads.forEach((quad) => {
        if ((quad.image || quad.imageTexture) && quad.texture && quad.texture.nearestPixel() !== nearestPixel && quad.texture.textureHandle()) {
          /* This could just be
           *   quad.texture.setNearestPixel(nearestPixel);
           * but that needlessly redecodes the image.  Instead, just change the
           * the interpolation flags, then change the nearestPixel value
           * without triggering a complete re-setup. */
          renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, quad.texture.textureHandle());
          renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D, vgl.GL.TEXTURE_MIN_FILTER, nearestPixel ? vgl.GL.NEAREST : vgl.GL.LINEAR);
          renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D, vgl.GL.TEXTURE_MAG_FILTER, nearestPixel ? vgl.GL.NEAREST : vgl.GL.LINEAR);
          renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, null);
          const oldmod = quad.texture.modified;
          quad.texture.modified = () => {};
          quad.texture.setNearestPixel(nearestPixel);
          quad.texture.modified = oldmod;
        }
      });
    }
    if (m_this._hookRenderImageQuads) {
      m_this._hookRenderImageQuads(renderState, m_quads.imgQuads);
    }
    context.bindBuffer(context.ARRAY_BUFFER, m_glBuffers.imgQuadsPosition);
    $.each(m_quads.imgQuads, function (idx, quad) {
      if (!quad.image && !quad.imageTexture) {
        return;
      }
      quad.texture.bind(renderState);
      // only check if the context is out of memory when using modestly large
      // textures.  The check is slow.
      if (quad.image && quad.image.width * quad.image.height > _memoryCheckLargestTested) {
        _memoryCheckLargestTested = quad.image.width * quad.image.height;
        if (context.getError() === context.OUT_OF_MEMORY) {
          console.log('Insufficient GPU memory for texture');
        }
      }
      if (quad.imageTexture && quad.imageTexture.width * quad.imageTexture.height > _memoryCheckLargestTested) {
        _memoryCheckLargestTested = quad.imageTexture.width * quad.imageTexture.height;
        if (context.getError() === context.OUT_OF_MEMORY) {
          console.log('Insufficient GPU memory for texture');
        }
      }

      if (quad.opacity !== opacity) {
        opacity = quad.opacity;
        context.uniform1fv(renderState.m_material.shaderProgram()
          .uniformLocation('opacity'), new Float32Array([opacity]));
      }
      if ((quad.zOffset || 0.0) !== zOffset) {
        zOffset = quad.zOffset || 0.0;
        context.uniform1fv(renderState.m_material.shaderProgram()
          .uniformLocation('zOffset'), new Float32Array([zOffset]));
      }
      quadcrop = quad.crop || {x: 1, y: 1};
      if (!crop || quadcrop.x !== crop.x || quadcrop.y !== crop.y) {
        crop = quadcrop;
        context.uniform2fv(renderState.m_material.shaderProgram()
          .uniformLocation('crop'), new Float32Array([crop.x === undefined ? 1 : crop.x, crop.y === undefined ? 1 : crop.y]));
      }
      if (quad.image) {
        w = quad.image.width;
        h = quad.image.height;
      }
      if (quad.imageTexture) {
        w = quad.imageTexture.width;
        h = quad.imageTexture.height;
      }
      quadcropsrc = quad.crop || {left: 0, top: 0, right: w, bottom: h};
      if (!cropsrc || quadcropsrc.left !== cropsrc.left || quadcropsrc.top !== cropsrc.top || quadcropsrc.right !== cropsrc.right || quadcropsrc.bottom !== cropsrc.bottom || quadw !== w || quadh !== h) {
        cropsrc = quadcropsrc;
        quadw = w;
        quadh = h;
        context.uniform4fv(renderState.m_material.shaderProgram()
          .uniformLocation('cropsource'), new Float32Array([
          cropsrc.left / w, cropsrc.top / h, cropsrc.right / w, cropsrc.bottom / h]));
      }
      context.bindBuffer(context.ARRAY_BUFFER, m_glBuffers.imgQuadsPosition);
      context.vertexAttribPointer(vgl.vertexAttributeKeys.Position, 3,
                                  context.FLOAT, false, 12, idx * 12 * 4);
      context.enableVertexAttribArray(vgl.vertexAttributeKeys.Position);

      context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
      quad.texture.undoBind(renderState);
    });
    context.bindBuffer(context.ARRAY_BUFFER, null);
    mapper.undoBindVertexData(renderState);
  };

  /**
   * Update.
   */
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().timestamp() <= m_this.dataTime().timestamp() ||
        m_this.updateTime().timestamp() < m_this.timestamp()) {
      m_this._build();
    }
    if (m_actor_color) {
      m_actor_color.setVisible(m_this.visible());
      m_actor_color.material().setBinNumber(m_this.bin());
    }
    if (m_actor_image) {
      m_actor_image.setVisible(m_this.visible());
      m_actor_image.material().setBinNumber(m_this.bin());
    }
    m_this.updateTime().modified();
  };

  /**
   * Cleanup.
   */
  this._cleanup = function () {
    if (m_actor_image) {
      m_this.renderer().contextRenderer().removeActor(m_actor_image);
      m_actor_image = null;
    }
    if (m_actor_color) {
      m_this.renderer().contextRenderer().removeActor(m_actor_color);
      m_actor_color = null;
    }
    m_imgposbuf = undefined;
    m_clrposbuf = undefined;
    if (m_glBuffers) {
      Object.keys(m_glBuffers).forEach(function (key) { delete m_glBuffers[key]; });
    }
    if (m_quads && m_quads.imgQuads) {
      m_quads.imgQuads.forEach(function (quad) {
        if (quad.texture) {
          delete quad.texture;
          if (quad.image && quad.image._texture) {
            delete quad.image._texture;
          }
        }
        if (quad.imageTexture) {
          delete quad.imageTexture._texture;
        }
      });
      m_this._updateTextures();
    }
    m_this.modified();
  };

  /**
   * Set the image or color vertex or fragment shader.
   *
   * @param {string} shaderType One of `image_vertex`, `image_fragment`,
   *   `color_vertex`, or `color_fragment`.
   * @param {string} shaderCode The shader program.
   * @returns {this?} The class instance on success, undefined in an unknown
   *    shaderType was specified.
   */
  this.setShader = function (shaderType, shaderCode) {
    switch (shaderType) {
      case 'image_vertex': vertexShaderImage = shaderCode; break;
      case 'image_fragment': fragmentShaderImage = shaderCode; break;
      case 'color_vertex': vertexShaderColor = shaderCode; break;
      case 'color_fragment': fragmentShaderColor = shaderCode; break;
      default:
        return undefined;
    }
    return m_this;
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    m_this._cleanup();
    s_exit.call(m_this);
  };

  m_this._init(arg);
  return this;
};

inherit(webgl_quadFeature, quadFeature);

// Now register it
var capabilities = {};
capabilities[quadFeature.capabilities.color] = true;
capabilities[quadFeature.capabilities.image] = true;
capabilities[quadFeature.capabilities.imageCrop] = true;
capabilities[quadFeature.capabilities.imageFixedScale] = false;
capabilities[quadFeature.capabilities.imageFull] = true;
capabilities[quadFeature.capabilities.canvas] = false;
capabilities[quadFeature.capabilities.video] = false;

registerFeature('webgl', 'quad', webgl_quadFeature, capabilities);
module.exports = webgl_quadFeature;
