var $ = require('jquery');
var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pointFeature = require('../pointFeature');
var webglRenderer = require('./webglRenderer');

/**
 * Create a new instance of webgl.pointFeature.
 *
 * @class
 * @alias geo.webgl.pointFeature
 * @extends geo.pointFeature
 * @param {geo.pointFeature.spec} arg
 * @returns {geo.webgl.pointFeature}
 */
var webgl_pointFeature = function (arg) {
  'use strict';
  if (!(this instanceof webgl_pointFeature)) {
    return new webgl_pointFeature(arg);
  }
  arg = arg || {};
  pointFeature.call(this, arg);

  var vgl = require('../vgl');
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');
  var pointUtil = require('./pointUtil.js');
  var fragmentShaderPoly = require('./pointFeaturePoly.frag');
  var fragmentShaderSprite = require('./pointFeatureSprite.frag');
  var vertexShaderPoly = require('./pointFeaturePoly.vert');
  var vertexShaderSprite = require('./pointFeatureSprite.vert');

  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      m_actor = null,
      m_mapper = null,
      m_pixelWidthUniform = null,
      m_aspectUniform = null,
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      m_modelViewUniform,
      m_origin,
      s_init = this._init,
      s_update = this._update,
      s_updateStyleFromArray = this.updateStyleFromArray;

  pointUtil(m_this, arg);

  /**
   * Create the vertex shader for points.
   *
   * @returns {vgl.shader}
   */
  function createVertexShader() {
    var shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    shader.setShaderSource(
      m_this._primitiveShape === pointFeature.primitiveShapes.sprite ? vertexShaderSprite : vertexShaderPoly);
    return shader;
  }

  /**
   * Create the fragment shader for points.
   *
   * @returns {vgl.shader}
   */
  function createFragmentShader() {
    var shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(
      m_this._primitiveShape === pointFeature.primitiveShapes.sprite ? fragmentShaderSprite : fragmentShaderPoly);
    return shader;
  }

  /**
   * Create and style the data needed to render the points.
   *
   * @param {boolean} [onlyStyle] if true, use the existing geometry and just
   *    recalculate the style.
   */
  function createGLPoints(onlyStyle) {
    // unit and associated data is not used when drawing sprite
    var i, j, numPts = m_this.data().length,
        unit = m_this._pointPolygon(0, 0, 1, 1),
        position = new Array(numPts * 3), posBuf, posVal, posFunc,
        unitBuf, indices,
        radius, radiusVal, radFunc,
        stroke, strokeVal, strokeFunc,
        strokeWidth, strokeWidthVal, strokeWidthFunc,
        strokeOpacity, strokeOpacityVal, strokeOpacityFunc,
        strokeColor, strokeColorVal, strokeColorFunc,
        fill, fillVal, fillFunc,
        fillOpacity, fillOpacityVal, fillOpacityFunc,
        fillColor, fillColorVal, fillColorFunc,
        vpf = m_this.verticesPerFeature(),
        data = m_this.data(),
        item, ivpf, ivpf3, iunit, i3, maxr = 0,
        geom = m_mapper.geometryData();

    posFunc = m_this.position();
    radFunc = m_this.style.get('radius');
    strokeFunc = m_this.style.get('stroke');
    strokeWidthFunc = m_this.style.get('strokeWidth');
    strokeOpacityFunc = m_this.style.get('strokeOpacity');
    strokeColorFunc = m_this.style.get('strokeColor');
    fillFunc = m_this.style.get('fill');
    fillOpacityFunc = m_this.style.get('fillOpacity');
    fillColorFunc = m_this.style.get('fillColor');

    if (!onlyStyle) {
      /* It is more efficient to do a transform on a single array rather than on
       * an array of arrays or an array of objects. */
      for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
        posVal = posFunc(data[i], i);
        position[i3] = posVal.x;
        position[i3 + 1] = posVal.y;
        // ignore the z values until we support them
        position[i3 + 2] = 0;  // posVal.z || 0;
      }
      position = transform.transformCoordinates(
        m_this.gcs(), m_this.layer().map().gcs(), position, 3);
      m_origin = new Float32Array(m_this.style.get('origin')(position));
      if (m_origin[0] || m_origin[1] || m_origin[2]) {
        for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
          position[i3] -= m_origin[0];
          position[i3 + 1] -= m_origin[1];
          position[i3 + 2] -= m_origin[2];
        }
      }
      m_modelViewUniform.setOrigin(m_origin);

      posBuf = util.getGeomBuffer(geom, 'pos', vpf * numPts * 3);

      unitBuf = util.getGeomBuffer(geom, 'unit', vpf * numPts * 2);
      indices = geom.primitive(0).indices();
      if (!(indices instanceof Uint16Array) || indices.length !== vpf * numPts) {
        indices = new Uint16Array(vpf * numPts);
        geom.primitive(0).setIndices(indices);
      }
    }

    radius = util.getGeomBuffer(geom, 'radius', vpf * numPts);
    stroke = util.getGeomBuffer(geom, 'stroke', vpf * numPts);
    strokeWidth = util.getGeomBuffer(geom, 'strokeWidth', vpf * numPts);
    strokeOpacity = util.getGeomBuffer(geom, 'strokeOpacity', vpf * numPts);
    strokeColor = util.getGeomBuffer(geom, 'strokeColor', vpf * numPts * 3);
    fill = util.getGeomBuffer(geom, 'fill', vpf * numPts);
    fillOpacity = util.getGeomBuffer(geom, 'fillOpacity', vpf * numPts);
    fillColor = util.getGeomBuffer(geom, 'fillColor', vpf * numPts * 3);

    for (i = ivpf = ivpf3 = iunit = i3 = 0; i < numPts; i += 1, i3 += 3) {
      item = data[i];
      if (!onlyStyle) {
        if (m_this._primitiveShape !== pointFeature.primitiveShapes.sprite) {
          for (j = 0; j < unit.length; j += 1, iunit += 1) {
            unitBuf[iunit] = unit[j];
          }
        }
      }
      /* We can ignore the indices (they will all be zero) */
      radiusVal = radFunc(item, i);
      strokeVal = strokeFunc(item, i) ? 1.0 : 0.0;
      strokeWidthVal = strokeWidthFunc(item, i);
      strokeOpacityVal = strokeOpacityFunc(item, i);
      strokeColorVal = strokeColorFunc(item, i);
      fillVal = fillFunc(item, i) ? 1.0 : 0.0;
      fillOpacityVal = fillOpacityFunc(item, i);
      fillColorVal = fillColorFunc(item, i);
      if (m_this._primitiveShapeAuto &&
          ((fillVal && fillOpacityVal) || (strokeVal && strokeOpacityVal)) &&
          radiusVal + (strokeVal && strokeOpacityVal ? strokeWidthVal : 0) > maxr) {
        maxr = radiusVal + (strokeVal && strokeOpacityVal ? strokeWidthVal : 0);
      }
      for (j = 0; j < vpf; j += 1, ivpf += 1, ivpf3 += 3) {
        if (!onlyStyle) {
          posBuf[ivpf3] = position[i3];
          posBuf[ivpf3 + 1] = position[i3 + 1];
          posBuf[ivpf3 + 2] = position[i3 + 2];
        }
        radius[ivpf] = radiusVal;
        stroke[ivpf] = strokeVal;
        strokeWidth[ivpf] = strokeWidthVal;
        strokeOpacity[ivpf] = strokeOpacityVal;
        strokeColor[ivpf3] = strokeColorVal.r;
        strokeColor[ivpf3 + 1] = strokeColorVal.g;
        strokeColor[ivpf3 + 2] = strokeColorVal.b;
        fill[ivpf] = fillVal;
        fillOpacity[ivpf] = fillOpacityVal;
        fillColor[ivpf3] = fillColorVal.r;
        fillColor[ivpf3 + 1] = fillColorVal.g;
        fillColor[ivpf3 + 2] = fillColorVal.b;
      }
    }

    if (m_this._primitiveShapeAuto &&
        ((m_this._primitiveShape === pointFeature.primitiveShapes.sprite && maxr > webglRenderer._maxPointSize) ||
         (m_this._primitiveShape !== pointFeature.primitiveShapes.sprite && maxr <= webglRenderer._maxPointSize))) {
      // Switch primitive
      m_this._primitiveShape = maxr > webglRenderer._maxPointSize ? pointFeature.primitiveShapes.triangle : pointFeature.primitiveShapes.sprite;
      m_this.renderer().contextRenderer().removeActor(m_actor);
      m_actor = null;
      m_this._init(true);
      createGLPoints();
      return;
    }

    if (!onlyStyle) {
      geom.boundsDirty(true);
      m_mapper.modified();
      m_mapper.boundsDirtyTimestamp().modified();
    } else {
      m_mapper.updateSourceBuffer('radius');
      m_mapper.updateSourceBuffer('stroke');
      m_mapper.updateSourceBuffer('strokeWidth');
      m_mapper.updateSourceBuffer('strokeColor');
      m_mapper.updateSourceBuffer('strokeOpacity');
      m_mapper.updateSourceBuffer('fill');
      m_mapper.updateSourceBuffer('fillColor');
      m_mapper.updateSourceBuffer('fillOpacity');
    }
  }

  /**
   * List vgl actors.
   *
   * @returns {vgl.actor[]} The list of actors.
   */
  this.actors = function () {
    if (!m_actor) {
      return [];
    }
    return [m_actor];
  };

  /**
   * Set style(s) from array(s).  For each style, the array should have one
   * value per data item.  The values are not converted or validated.  Color
   * values are {@link geo.geoColorObject} objects.  If invalid values are
   * given the behavior is undefined.
   *   For some feature styles, if the first entry of an array is itself an
   * array, then each entry of the array is expected to be an array, and values
   * are used from these subarrays.  This allows a style to apply, for
   * instance, per vertex of a data item rather than per data item.
   *
   * @param {string|object} keyOrObject Either the name of a single style or
   *    an object where the keys are the names of styles and the values are
   *    each arrays.
   * @param {array} styleArray If keyOrObject is a string, an array of values
   *    for the style.  If keyOrObject is an object, this parameter is ignored.
   * @param {boolean} [refresh=false] `true` to redraw the feature when it has
   *    been updated.  If an object with styles is passed, the redraw is only
   *    done once.
   * @returns {this}
   */
  this.updateStyleFromArray = function (keyOrObject, styleArray, refresh) {
    var bufferedKeys = {
      fill: 'bool',
      fillColor: 3,
      fillOpacity: 1,
      radius: 1,
      stroke: 'bool',
      strokeColor: 3,
      strokeOpacity: 1,
      strokeWidth: 1
    };
    var needsRefresh, needsRender;
    if (typeof keyOrObject === 'string') {
      var obj = {};
      obj[keyOrObject] = styleArray;
      keyOrObject = obj;
    }
    $.each(keyOrObject, function (key, styleArray) {
      if (m_this.visible() && m_actor && bufferedKeys[key] && !needsRefresh && !m_this.clustering()) {
        var vpf, mapper, buffer, numPts, value, i, j, v, bpv;
        bpv = bufferedKeys[key] === 'bool' ? 1 : bufferedKeys[key];
        numPts = m_this.data().length;
        mapper = m_actor.mapper();
        buffer = mapper.getSourceBuffer(key);
        vpf = m_this.verticesPerFeature();
        if (!buffer || !numPts || numPts * vpf * bpv !== buffer.length) {
          needsRefresh = true;
        } else {
          switch (bufferedKeys[key]) {
            case 1:
              for (i = 0, v = 0; i < numPts; i += 1) {
                value = styleArray[i];
                for (j = 0; j < vpf; j += 1, v += 1) {
                  buffer[v] = value;
                }
              }
              break;
            case 3:
              for (i = 0, v = 0; i < numPts; i += 1) {
                value = styleArray[i];
                for (j = 0; j < vpf; j += 1, v += 3) {
                  buffer[v] = value.r;
                  buffer[v + 1] = value.g;
                  buffer[v + 2] = value.b;
                }
              }
              break;
            case 'bool':
              for (i = 0, v = 0; i < numPts; i += 1) {
                value = styleArray[i] ? 1.0 : 0.0;
                for (j = 0; j < vpf; j += 1, v += 1) {
                  buffer[v] = value;
                }
              }
              break;
          }
          mapper.updateSourceBuffer(key);
          /* This could probably be even faster than calling _render after
           * updating the buffer, if the context's buffer was bound and
           * updated.  This would requiring knowing the webgl context and
           * probably the source to buffer mapping. */
          needsRender = true;
        }
      } else {
        needsRefresh = true;
      }
      const mod = m_this.modified;
      if (!needsRefresh) {
        // don't allow modified to be adjusted if we don't need to refresh
        m_this.modified = () => {};
      }
      s_updateStyleFromArray(key, styleArray, false);
      m_this.modified = mod;
    });
    if (refresh) {
      if (m_this.visible() && needsRefresh) {
        m_this.draw();
      } else if (needsRender) {
        m_this.renderer()._render();
      }
    }
    return m_this;
  };

  /**
   * Initialize.
   *
   * @param {boolean} [reinit] If truthy, skip the parent class's init method.
   */
  this._init = function (reinit) {
    var prog = vgl.shaderProgram(),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        posAttr = vgl.vertexAttribute('pos'),
        unitAttr = vgl.vertexAttribute('unit'),
        radAttr = vgl.vertexAttribute('radius'),
        strokeWidthAttr = vgl.vertexAttribute('strokeWidth'),
        fillColorAttr = vgl.vertexAttribute('fillColor'),
        fillAttr = vgl.vertexAttribute('fill'),
        strokeColorAttr = vgl.vertexAttribute('strokeColor'),
        strokeAttr = vgl.vertexAttribute('stroke'),
        fillOpacityAttr = vgl.vertexAttribute('fillOpacity'),
        strokeOpacityAttr = vgl.vertexAttribute('strokeOpacity'),
        projectionUniform = new vgl.projectionUniform('projectionMatrix'),
        mat = vgl.material(),
        blend = vgl.blend(),
        geom = vgl.geometryData(),
        sourcePositions = vgl.sourceDataP3fv({name: 'pos'}),
        sourceUnits = vgl.sourceDataAnyfv(
          2, vgl.vertexAttributeKeysIndexed.One, {name: 'unit'}),
        sourceRadius = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Two, {name: 'radius'}),
        sourceStrokeWidth = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Three, {name: 'strokeWidth'}),
        sourceFillColor = vgl.sourceDataAnyfv(
          3, vgl.vertexAttributeKeysIndexed.Four, {name: 'fillColor'}),
        sourceFill = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Five, {name: 'fill'}),
        sourceStrokeColor = vgl.sourceDataAnyfv(
          3, vgl.vertexAttributeKeysIndexed.Six, {name: 'strokeColor'}),
        sourceStroke = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Seven, {name: 'stroke'}),
        sourceAlpha = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Eight, {name: 'fillOpacity'}),
        sourceStrokeOpacity = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Nine, {name: 'strokeOpacity'}),
        primitive;
    m_modelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix', m_origin);

    if (m_this._primitiveShape === pointFeature.primitiveShapes.sprite) {
      primitive = new vgl.points();
    } else {
      primitive = new vgl.triangles();
    }
    primitive.setIndices(new Uint16Array());

    m_pixelWidthUniform = new vgl.floatUniform(
      'pixelWidth', 2.0 / m_this.renderer().width());
    m_aspectUniform = new vgl.floatUniform(
      'aspect', m_this.renderer().width() / m_this.renderer().height());

    if (!reinit) {
      s_init.call(m_this, arg);
    }
    m_mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    if (m_this._primitiveShape !== pointFeature.primitiveShapes.sprite) {
      prog.addVertexAttribute(unitAttr, vgl.vertexAttributeKeysIndexed.One);
    }

    prog.addVertexAttribute(radAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(strokeWidthAttr, vgl.vertexAttributeKeysIndexed.Three);
    prog.addVertexAttribute(fillColorAttr, vgl.vertexAttributeKeysIndexed.Four);
    prog.addVertexAttribute(fillAttr, vgl.vertexAttributeKeysIndexed.Five);
    prog.addVertexAttribute(strokeColorAttr, vgl.vertexAttributeKeysIndexed.Six);
    prog.addVertexAttribute(strokeAttr, vgl.vertexAttributeKeysIndexed.Seven);
    prog.addVertexAttribute(fillOpacityAttr, vgl.vertexAttributeKeysIndexed.Eight);
    prog.addVertexAttribute(strokeOpacityAttr, vgl.vertexAttributeKeysIndexed.Nine);

    prog.addUniform(m_pixelWidthUniform);
    prog.addUniform(m_aspectUniform);
    prog.addUniform(m_modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);
    mat.addAttribute(blend);

    m_actor = vgl.actor();
    m_actor.setMaterial(mat);
    m_actor.setMapper(m_mapper);

    geom.addSource(sourcePositions);
    geom.addSource(sourceUnits);
    geom.addSource(sourceRadius);
    geom.addSource(sourceStrokeWidth);
    geom.addSource(sourceFillColor);
    geom.addSource(sourceFill);
    geom.addSource(sourceStrokeColor);
    geom.addSource(sourceStroke);
    geom.addSource(sourceAlpha);
    geom.addSource(sourceStrokeOpacity);
    geom.addPrimitive(primitive);
    /* We don't need vgl to compute bounds, so make the geo.computeBounds just
     * set them to 0. */
    geom.computeBounds = function () {
      geom.setBounds(0, 0, 0, 0, 0, 0);
    };
    m_mapper.setGeometryData(geom);
  };

  /**
   * Build.  Create the necessary elements to render points.
   *
   * @returns {this}
   */
  this._build = function () {
    createGLPoints(m_this.dataTime().timestamp() < m_this.buildTime().timestamp());
    if (!m_this.renderer().contextRenderer().hasActor(m_actor)) {
      m_this.renderer().contextRenderer().addActor(m_actor);
    }
    m_this.buildTime().modified();
    return m_this;
  };

  /**
   * Update.  Rebuild if necessary.
   *
   * @returns {this}
   */
  this._update = function () {

    s_update.call(m_this);

    // For now build if the data or style changes. In the future we may
    // we able to partially update the data using dynamic gl buffers.
    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp() ||
        m_this.updateTime().timestamp() < m_this.timestamp()) {
      m_this._build();
    }

    // Update uniforms
    m_pixelWidthUniform.set(2.0 / m_this.renderer().width());
    m_aspectUniform.set(m_this.renderer().width() /
                        m_this.renderer().height());

    m_actor.setVisible(m_this.visible());
    m_actor.material().setBinNumber(m_this.bin());

    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Destroy.  Free used resources.
   */
  this._exit = function () {
    m_this.renderer().contextRenderer().removeActor(m_actor);
    m_actor = null;
    s_exit();
  };

  m_this._init();
  return this;
};

inherit(webgl_pointFeature, pointFeature);

var capabilities = {};
capabilities[pointFeature.capabilities.stroke] = true;

// Now register it
registerFeature('webgl', 'point', webgl_pointFeature, capabilities);

module.exports = webgl_pointFeature;
