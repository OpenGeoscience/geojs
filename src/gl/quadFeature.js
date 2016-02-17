//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class quadFeature
 *
 * @class
 * @param {Object} arg Options object
 * @extends geo.quadFeature
 * @returns {geo.gl.quadFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.quadFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.gl.quadFeature)) {
    return new geo.gl.quadFeature(arg);
  }
  geo.quadFeature.call(this, arg);

  var m_this = this,
      s_exit = this._exit,
      s_init = this._init,
      s_update = this._update,
      m_modelViewUniform,
      m_actor_image, m_actor_color, m_glBuffers = {}, m_imgposbuf,
      m_clrposbuf, m_clrModelViewUniform,
      m_glCompileTimestamp = vgl.timestamp(),
      m_glColorCompileTimestamp = vgl.timestamp(),
      m_quads;
  var vertexShaderImageSource = [
    'attribute vec3 vertexPosition;',
    'attribute vec3 textureCoord;',
    'uniform mat4 modelViewMatrix;',
    'uniform mat4 projectionMatrix;',
    'varying highp vec3 iTextureCoord;',
    'void main(void) {',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
    '  iTextureCoord = textureCoord;',
    '}'].join('\n');
  var vertexShaderColorSource = [
    'attribute vec3 vertexPosition;',
    'uniform vec3 vertexColor;',
    'uniform mat4 modelViewMatrix;',
    'uniform mat4 projectionMatrix;',
    'varying mediump vec3 iVertexColor;',
    'varying highp vec3 iTextureCoord;',
    'void main(void) {',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);',
    '  iVertexColor = vertexColor;',
    '}'].join('\n');

  /**
   * Allocate buffers that we need to control for image quads.  This mimics
   * the actions from vgl.mapper to some degree.
   *
   * @private
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
      context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_glBuffers.imgQuadsPosition);
      if (newbuf) {
        context.bufferData(vgl.GL.ARRAY_BUFFER, m_imgposbuf, vgl.GL.DYNAMIC_DRAW);
      } else {
        context.bufferSubData(vgl.GL.ARRAY_BUFFER, 0, m_imgposbuf);
      }
    }
    m_glCompileTimestamp.modified();
  }

  /**
   * Allocate buffers that we need to control for color quads.  This mimics
   * the actions from vgl.mapper to some degree.
   *
   * @private
   */
  function setupColorDrawObjects(renderState) {
    var context = renderState.m_context,
        newbuf = false;

    if (m_quads.clrQuads.length) {
      if (!m_clrposbuf || m_clrposbuf.length < m_quads.clrQuads.length * 12 ||
          !m_glBuffers.clrQuadsPosition) {
        if (m_glBuffers.imgQuadsPosition) {
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
      context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_glBuffers.clrQuadsPosition);
      if (newbuf) {
        context.bufferData(vgl.GL.ARRAY_BUFFER, m_clrposbuf, vgl.GL.DYNAMIC_DRAW);
      } else {
        context.bufferSubData(vgl.GL.ARRAY_BUFFER, 0, m_clrposbuf);
      }
    }
    m_glColorCompileTimestamp.modified();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build this feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var mapper, mat, prog, srctex, geom;

    if (!m_this.position()) {
      return;
    }
    m_quads = this._generateQuads();
    /* Create an actor to render image quads */
    if (m_quads.imgQuads.length && !m_actor_image) {
      m_this.visible(false);
      mapper = new vgl.mapper({dynamicDraw: true});
      m_actor_image = new vgl.actor();
      /* This is similar to vgl.utils.createTextureMaterial */
      m_actor_image.setMapper(mapper);
      mat = new vgl.material();
      prog = new vgl.shaderProgram();
      prog.addVertexAttribute(new vgl.vertexAttribute('vertexPosition'),
                              vgl.vertexAttributeKeys.Position);
      prog.addVertexAttribute(new vgl.vertexAttribute('textureCoord'),
                              vgl.vertexAttributeKeys.TextureCoordinate);
      m_modelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix',
        m_quads.origin);
      prog.addUniform(m_modelViewUniform);
      prog.addUniform(new vgl.projectionUniform('projectionMatrix'));
      prog.addUniform(new vgl.floatUniform('opacity', 1.0));
      prog.addShader(vgl.getCachedShader(
          vgl.GL.VERTEX_SHADER, vgl.GL, vertexShaderImageSource));
      prog.addShader(vgl.utils.createRgbaTextureFragmentShader(vgl.GL));
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

      mapper.s_render = mapper.render;
      mapper.render = m_this._renderImageQuads;
      m_this.renderer().contextRenderer().addActor(m_actor_image);
      m_this.visible(true);
    }
    /* Create an actor to render color quads */
    if (m_quads.clrQuads.length && !m_actor_color) {
      m_this.visible(false);
      mapper = new vgl.mapper({dynamicDraw: true});
      m_actor_color = new vgl.actor();
      /* This is similar to vgl.utils.createTextureMaterial */
      m_actor_color.setMapper(mapper);
      mat = new vgl.material();
      prog = new vgl.shaderProgram();
      prog.addVertexAttribute(new vgl.vertexAttribute('vertexPosition'),
                              vgl.vertexAttributeKeys.Position);
      m_clrModelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix',
        m_quads.origin);
      prog.addUniform(m_clrModelViewUniform);
      prog.addUniform(new vgl.projectionUniform('projectionMatrix'));
      prog.addUniform(new vgl.floatUniform('opacity', 1.0));
      prog.addUniform(new vgl.uniform(vgl.GL.FLOAT_VEC3, 'vertexColor'));
      prog.addShader(vgl.getCachedShader(
          vgl.GL.VERTEX_SHADER, vgl.GL, vertexShaderColorSource));
      prog.addShader(vgl.utils.createFragmentShader(vgl.GL));
      mat.addAttribute(prog);
      mat.addAttribute(new vgl.blend());
      /* This is similar to vgl.planeSource */
      geom = new vgl.geometryData();
      m_clrposbuf = undefined;
      /* We deliberately do not add a primitive to our geometry -- we take care
       * of that ourselves. */

      mapper.setGeometryData(geom);
      m_actor_color.setMaterial(mat);

      mapper.s_render = mapper.render;
      mapper.render = m_this._renderColorQuads;
      m_this.renderer().contextRenderer().addActor(m_actor_color);
      m_this.visible(true);
    }
    if (m_modelViewUniform) {
      m_modelViewUniform.setOrigin(m_quads.origin);
    }
    if (m_clrModelViewUniform) {
      m_clrModelViewUniform.setOrigin(m_quads.origin);
    }
    m_this.buildTime().modified();
  };

  /**
   * Check all of the image quads.  If any do not have the correct texture,
   * update them. */
  this._updateTextures = function () {
    var texture;

    $.each(m_quads.imgQuads, function (idx, quad) {
      if (!quad.image) {
        return;
      }
      if (quad.image._texture) {
        quad.texture = quad.image._texture;
      } else {
        texture = new vgl.texture();
        texture.setImage(quad.image);
        quad.texture = quad.image._texture = texture;
      }
    });
  };

  /**
   * Render all of the color quads using a single mapper.
   *
   * @param renderState: the render state used for the render.
   */
  this._renderColorQuads = function (renderState) {
    if (!m_quads.clrQuads.length) {
      return;
    }
    var mapper = this;
    if (mapper.getMTime() > m_glColorCompileTimestamp.getMTime() ||
        m_this.dataTime().getMTime() > m_glColorCompileTimestamp.getMTime() ||
        renderState.m_contextChanged || !m_clrposbuf ||
        m_quads.clrQuads.length * 12 > m_clrposbuf.length) {
      setupColorDrawObjects(renderState);
    }
    mapper.s_render(renderState);

    var context = renderState.m_context, opacity = 1, color;

    context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_glBuffers.clrQuadsPosition);
    $.each(m_quads.clrQuads, function (idx, quad) {
      if (quad.opacity !== opacity) {
        opacity = quad.opacity;
        context.uniform1fv(renderState.m_material.shaderProgram(
            ).uniformLocation('opacity'), new Float32Array([opacity]));
      }
      if (!color || color.r !== quad.color.r || color.g !== quad.color.g ||
          color.b !== quad.color.b) {
        color = quad.color;
        context.uniform3fv(renderState.m_material.shaderProgram(
            ).uniformLocation('vertexColor'), new Float32Array([
              color.r, color.g, color.b]));
      }

      context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_glBuffers.clrQuadsPosition);
      context.vertexAttribPointer(vgl.vertexAttributeKeys.Position, 3,
                                  vgl.GL.FLOAT, false, 12, idx * 12 * 4);
      context.enableVertexAttribArray(vgl.vertexAttributeKeys.Position);

      context.drawArrays(vgl.GL.TRIANGLE_STRIP, 0, 4);
    });
    context.bindBuffer(vgl.GL.ARRAY_BUFFER, null);
  };

  /**
   * Render all of the image quads using a single mapper.
   *
   * @param renderState: the render state used for the render.
   */
  this._renderImageQuads = function (renderState) {
    if (!m_quads.imgQuads.length) {
      return;
    }
    var mapper = this;
    if (mapper.getMTime() > m_glCompileTimestamp.getMTime() ||
        m_this.dataTime().getMTime() > m_glCompileTimestamp.getMTime() ||
        renderState.m_contextChanged || !m_imgposbuf ||
        m_quads.imgQuads.length * 12 > m_imgposbuf.length) {
      setupDrawObjects(renderState);
    }
    mapper.s_render(renderState);

    var context = renderState.m_context, opacity = 1;

    m_this._updateTextures();

    context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_glBuffers.imgQuadsPosition);
    $.each(m_quads.imgQuads, function (idx, quad) {
      if (!quad.image) {
        return;
      }
      quad.texture.bind(renderState);

      if (quad.opacity !== opacity) {
        opacity = quad.opacity;
        context.uniform1fv(renderState.m_material.shaderProgram(
            ).uniformLocation('opacity'), new Float32Array([opacity]));
      }

      context.bindBuffer(vgl.GL.ARRAY_BUFFER, m_glBuffers.imgQuadsPosition);
      context.vertexAttribPointer(vgl.vertexAttributeKeys.Position, 3,
                                  vgl.GL.FLOAT, false, 12, idx * 12 * 4);
      context.enableVertexAttribArray(vgl.vertexAttributeKeys.Position);

      context.drawArrays(vgl.GL.TRIANGLE_STRIP, 0, 4);
      quad.texture.undoBind(renderState);
    });
    context.bindBuffer(vgl.GL.ARRAY_BUFFER, null);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    s_init.call(m_this, arg);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    if (m_actor_image) {
      m_this.renderer().contextRenderer().removeActor(m_actor_image);
      m_actor_image = null;
    }
    if (m_actor_color) {
      m_this.renderer().contextRenderer().removeActor(m_actor_color);
      m_actor_color = null;
    }
    s_exit.call(m_this);
  };

  m_this._init(arg);
  return this;
};

inherit(geo.gl.quadFeature, geo.quadFeature);

// Now register it
geo.registerFeature('vgl', 'quad', geo.gl.quadFeature);
