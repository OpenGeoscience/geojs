var $ = require('jquery');
var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var markerFeature = require('../markerFeature');
var webglRenderer = require('./webglRenderer');

/**
 * Create a new instance of webgl.markerFeature.
 *
 * @class
 * @alias geo.webgl.markerFeature
 * @extends geo.markerFeature
 * @param {geo.markerFeature.spec} arg
 * @returns {geo.webgl.markerFeature}
 */
var webgl_markerFeature = function (arg) {
  'use strict';
  if (!(this instanceof webgl_markerFeature)) {
    return new webgl_markerFeature(arg);
  }
  arg = arg || {};
  markerFeature.call(this, arg);

  var vgl = require('../vgl');
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');
  var pointUtil = require('./pointUtil.js');
  var geo_event = require('../event');
  var fragmentShaderPoly = require('./markerFeaturePoly.frag');
  var fragmentShaderSprite = require('./markerFeatureSprite.frag');
  var vertexShaderPoly = require('./markerFeaturePoly.vert');
  var vertexShaderSprite = require('./markerFeatureSprite.vert');

  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      m_actor = null,
      m_mapper = null,
      m_uniforms = {},
      m_modelViewUniform,
      m_origin,
      s_init = this._init,
      s_update = this._update,
      s_updateStyleFromArray = this.updateStyleFromArray;

  pointUtil(m_this, arg);

  /**
   * Create the vertex shader for markers.
   *
   * @returns {vgl.shader}
   */
  function createVertexShader() {
    var shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    shader.setShaderSource(
      m_this._primitiveShape === markerFeature.primitiveShapes.sprite ? vertexShaderSprite : vertexShaderPoly);
    return shader;
  }

  /**
   * Create the fragment shader for markers.
   *
   * @returns {vgl.shader}
   */
  function createFragmentShader() {
    var shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(
      m_this._primitiveShape === markerFeature.primitiveShapes.sprite ? fragmentShaderSprite : fragmentShaderPoly);
    return shader;
  }

  /**
   * Pack an array of three numbers and one boolean into a single float.  Each
   * numerical value is either undefined or on the scale of [0, 1] and is
   * mapped to an integer range of [0, 250].
   *
   * @param {number|number[]} value A single value or an array of up to four
   *    values where the first three values are numbers and the last is a
   *    boolean.
   * @returns {number} A packed number.
   */
  function packFloats(value) {
    if (!value.length) {
      return value === undefined ? 0 : Math.floor(Math.abs(value) * 250) + 1;
    }
    return (
      (value[0] === undefined ? 0 : Math.floor(Math.abs(value[0]) * 250) + 1) +
      (value[1] === undefined ? 0 : Math.floor(Math.abs(value[1]) * 250) + 1) * 252 +
      (value[2] === undefined ? 0 : Math.floor(Math.abs(value[2]) * 250) + 1) * 252 * 252
    ) * (value[3] ? -1 : 1);
  }

  /**
   * Create and style the data needed to render the markers.
   *
    @param {boolean} [onlyStyle] if true, use the existing geometry and just
   *    recalculate the style.
   */
  function createGLMarkers(onlyStyle) {
    // unit and associated data is not used when drawing sprite
    var i, j, numPts = m_this.data().length,
        unit = m_this._pointPolygon(0, 0, 1, 1),
        position = new Array(numPts * 3), posBuf, posVal, posFunc,
        indices, unitBuf,
        styleBuf = {}, styleVal = {}, styleFunc = {}, styleUni = {},
        styleKeys = {
          radius: 1,
          fillColor: 3,
          fillOpacity: 1,
          strokeColor: 3,
          strokeOpacity: 1,
          strokeOffset: 0,
          strokeWidth: 1,
          symbol: 1,
          symbolValue: 1,
          rotation: 1,
          scaleWithZoom: 0,
          rotateWithMap: 0,
          radiusIncludesStroke: 0
        },
        vpf = m_this.verticesPerFeature(),
        data = m_this.data(),
        item, ivpf, ivpf3, iunit, i3,
        geom = m_mapper.geometryData();

    posFunc = m_this.position();

    for (const key in styleKeys) {
      styleFunc[key] = m_this.style.get(key);
      if (!util.isFunction(m_this.style(key))) {
        styleUni[key] = styleFunc[key]();
      }
      if (styleKeys[key]) {
        styleBuf[key] = util.getGeomBuffer(geom, key, vpf * numPts * styleKeys[key]);
      }
    }

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

      if (m_this._primitiveShape !== markerFeature.primitiveShapes.sprite) {
        unitBuf = util.getGeomBuffer(geom, 'unit', vpf * numPts * 2);
      }
      indices = geom.primitive(0).indices();
      if (!(indices instanceof Uint16Array) || indices.length !== vpf * numPts) {
        indices = new Uint16Array(vpf * numPts);
        geom.primitive(0).setIndices(indices);
      }
    }

    for (i = ivpf = ivpf3 = iunit = i3 = 0; i < numPts; i += 1, i3 += 3) {
      item = data[i];
      if (!onlyStyle) {
        if (m_this._primitiveShape !== markerFeature.primitiveShapes.sprite) {
          for (j = 0; j < unit.length; j += 1, iunit += 1) {
            unitBuf[iunit] = unit[j];
          }
        }
      }
      // unrolling this would speed it up
      for (const key in styleKeys) {
        styleVal[key] = styleUni[key] === undefined ? styleFunc[key](item, i) : styleUni[key];
      }
      styleVal.scaleWithZoom = markerFeature.scaleMode[styleVal.scaleWithZoom] || (styleVal.scaleWithZoom >= 1 && styleVal.scaleWithZoom <= 3 ? styleVal.scaleWithZoom : 0);
      styleVal.symbolComputed = (
        styleVal.scaleWithZoom +
        (styleVal.rotateWithMap ? 4 : 0) +
        // bit 3 reserved
        ((Math.sign(styleVal.radiusIncludesStroke !== undefined && styleVal.radiusIncludesStroke ? styleVal.strokeOffset : 1) + 1) * 16) +
        styleVal.symbol * 64);
      if (styleVal.symbolValue && styleVal.symbol >= markerFeature.symbols.arrow && styleVal.symbol < markerFeature.symbols.arrow + markerFeature.symbols.arrowMax) {
        styleVal.symbolValue = packFloats(styleVal.symbolValue);
      }
      for (j = 0; j < vpf; j += 1, ivpf += 1, ivpf3 += 3) {
        if (!onlyStyle) {
          posBuf[ivpf3] = position[i3];
          posBuf[ivpf3 + 1] = position[i3 + 1];
          posBuf[ivpf3 + 2] = position[i3 + 2];
        }
        styleBuf.radius[ivpf] = styleVal.radius;
        styleBuf.fillColor[ivpf3] = styleVal.fillColor.r;
        styleBuf.fillColor[ivpf3 + 1] = styleVal.fillColor.g;
        styleBuf.fillColor[ivpf3 + 2] = styleVal.fillColor.b;
        styleBuf.fillOpacity[ivpf] = styleVal.fillOpacity;
        styleBuf.strokeColor[ivpf3] = styleVal.strokeColor.r;
        styleBuf.strokeColor[ivpf3 + 1] = styleVal.strokeColor.g;
        styleBuf.strokeColor[ivpf3 + 2] = styleVal.strokeColor.b;
        styleBuf.strokeOpacity[ivpf] = styleVal.strokeOpacity;
        styleBuf.strokeWidth[ivpf] = styleVal.strokeWidth;
        styleBuf.symbol[ivpf] = styleVal.symbolComputed;
        styleBuf.symbolValue[ivpf] = styleVal.symbolValue;
        styleBuf.rotation[ivpf] = styleVal.rotation;
      }
    }

    if (m_this._primitiveShapeAuto) {
      const maxr = m_this._approximateMaxRadius(m_this.renderer().map().zoom());
      if ((m_this._primitiveShape === markerFeature.primitiveShapes.sprite && maxr > webglRenderer._maxPointSize) ||
          (m_this._primitiveShape !== markerFeature.primitiveShapes.sprite && maxr <= webglRenderer._maxPointSize)) {
        // Switch primitive
        m_this._primitiveShape = maxr > webglRenderer._maxPointSize ? markerFeature.primitiveShapes.triangle : markerFeature.primitiveShapes.sprite;
        m_this.renderer().contextRenderer().removeActor(m_actor);
        m_actor = null;
        m_this._init(true);
        createGLMarkers();
        return;
      }
    }

    if (!onlyStyle) {
      geom.boundsDirty(true);
      m_mapper.modified();
      m_mapper.boundsDirtyTimestamp().modified();
    } else {
      Object.keys(styleBuf).forEach(key => m_mapper.updateSourceBuffer(key));
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
   * For markers, there are two special keys: `symbolComputed` and
   * `symbolValueComputed`.  If these keys are used, they are assumed to be
   * processed values that can be set in the webgl buffer directly.  The style
   * is NOT updated with these values, as they may not be directly applicable.
   * Use `symbol` and `symbolValue` for a more expected behavior.
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
      fillColor: 3,
      fillOpacity: 1,
      radius: 1,
      strokeColor: 3,
      strokeOpacity: 1,
      strokeWidth: 1,
      symbolComputed: 1,
      symbolValueComputed: 1
    };
    var needsRefresh, needsRender;
    if (typeof keyOrObject === 'string') {
      var obj = {};
      obj[keyOrObject] = styleArray;
      keyOrObject = obj;
    }
    $.each(keyOrObject, function (key, styleArray) {
      if (m_this.visible() && m_actor && bufferedKeys[key] && !needsRefresh && !m_this.clustering()) {
        var vpf, mapper, buffer, numPts, value, i, j, v, bpv, sbkey;
        bpv = bufferedKeys[key];
        numPts = m_this.data().length;
        mapper = m_actor.mapper();
        sbkey = key === 'symbolComputed' ? 'symbol' : key === 'symbolValueComputed' ? 'symbolValue' : key;
        buffer = mapper.getSourceBuffer(sbkey);
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
          }
          mapper.updateSourceBuffer(sbkey);
          /* This could probably be even faster than calling _render after
           * updating the buffer, if the context's buffer was bound and
           * updated.  This would requiring knowing the webgl context and
           * probably the source to buffer mapping. */
          needsRender = true;
        }
      } else {
        needsRefresh = true;
      }
      if (key === sbkey) {
        const mod = m_this.modified;
        if (!needsRefresh) {
          // don't allow modified to be adjusted if we don't need to refresh
          m_this.modified = () => {};
        }
        s_updateStyleFromArray(key, styleArray, false);
        m_this.modified = mod;
      }
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
   * Handle zoom events for automatic primitive shape adjustment.
   *
   * @param {number} zoom The new zoom level.
   */
  this._handleZoom = function (zoom) {
    if (!m_this._primitiveShapeAuto || m_this._primitiveShape !== markerFeature.primitiveShapes.sprite) {
      return;
    }
    if (m_this._approximateMaxRadius(zoom) > webglRenderer._maxPointSize) {
      m_this._primitiveShape = markerFeature.primitiveShapes.triangle;
      m_this.renderer().contextRenderer().removeActor(m_this.actors()[0]);
      m_this._init(true);
      m_this.dataTime().modified();
      m_this.draw();
    }
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
        mat = vgl.material(),
        blend = vgl.blend(),
        geom = vgl.geometryData(),
        sourcePositions = vgl.sourceDataP3fv({name: 'pos'}),
        attr = {
          radius: 1,
          fillColor: 3,
          fillOpacity: 1,
          strokeColor: 3,
          strokeOpacity: 1,
          strokeWidth: 1,
          symbol: 1,
          symbolValue: 1,
          rotation: 1
        },
        uniforms = {
          pixelWidth: vgl.GL.FLOAT,
          aspect: vgl.GL.FLOAT,
          zoom: vgl.GL.FLOAT,
          rotationUniform: vgl.GL.FLOAT
        },
        projectionUniform = new vgl.projectionUniform('projectionMatrix'),
        primitive;
    m_modelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix', m_origin);
    if (m_this._primitiveShape === markerFeature.primitiveShapes.sprite) {
      primitive = new vgl.points();
    } else {
      primitive = new vgl.triangles();
      attr.unit = 2;
    }
    primitive.setIndices(new Uint16Array());
    if (!reinit) {
      s_init.call(m_this, arg);
    }
    m_mapper = vgl.mapper();
    prog.addVertexAttribute(vgl.vertexAttribute('pos'), vgl.vertexAttributeKeys.Position);
    geom.addSource(sourcePositions);
    Object.keys(attr).forEach((key, idx) => {
      prog.addVertexAttribute(vgl.vertexAttribute(key), idx + 1);
      geom.addSource(vgl.sourceDataAnyfv(attr[key], idx + 1, {name: key}));
    });
    m_uniforms = {};
    Object.keys(uniforms).forEach((key) => {
      m_uniforms[key] = new vgl.uniform(uniforms[key], key);
      prog.addUniform(m_uniforms[key]);
    });

    prog.addUniform(m_modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);
    mat.addAttribute(blend);

    m_actor = vgl.actor();
    m_actor.setMaterial(mat);
    m_actor.setMapper(m_mapper);

    geom.addPrimitive(primitive);
    /* We don't need vgl to compute bounds, so make the geo.computeBounds just
     * set them to 0. */
    geom.computeBounds = function () {
      geom.setBounds(0, 0, 0, 0, 0, 0);
    };
    m_mapper.setGeometryData(geom);
    if (!reinit) {
      m_this.geoOn(geo_event.zoom, function (evt) {
        m_this._handleZoom(evt.zoomLevel);
      });
    }
  };

  /**
   * Build.  Create the necessary elements to render markers.
   *
   * @returns {this}
   */
  this._build = function () {
    createGLMarkers(m_this.dataTime().timestamp() < m_this.buildTime().timestamp());
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
    m_uniforms.pixelWidth.set(2.0 / m_this.renderer().width());
    m_uniforms.aspect.set(m_this.renderer().width() / m_this.renderer().height());
    m_uniforms.zoom.set(m_this.renderer().map().zoom());
    m_uniforms.rotationUniform.set(m_this.renderer().map().rotation());

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
    m_uniforms = {};
    s_exit();
  };

  m_this._init();
  return this;
};

inherit(webgl_markerFeature, markerFeature);

var capabilities = {};

// Now register it
registerFeature('webgl', 'marker', webgl_markerFeature, capabilities);

module.exports = webgl_markerFeature;
