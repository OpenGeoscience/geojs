var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var polygonFeature = require('../polygonFeature');

/**
 * Create a new instance of webgl.polygonFeature.
 *
 * @class
 * @alias geo.webgl.polygonFeature
 * @extends geo.polygonFeature
 * @param {geo.polygonFeature.spec} arg
 * @returns {geo.webgl.polygonFeature}
 */
var webgl_polygonFeature = function (arg) {
  'use strict';
  if (!(this instanceof webgl_polygonFeature)) {
    return new webgl_polygonFeature(arg);
  }
  arg = arg || {};
  polygonFeature.call(this, arg);

  var vgl = require('../vgl');
  var earcut = require('earcut');
  earcut = earcut.__esModule ? earcut.default : earcut;
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');
  var markerFeature = require('../markerFeature');
  var fragmentShader = require('./polygonFeature.frag');
  var fragmentPatternShader = require('./polygonPatternFeature.frag');
  var vertexShader = require('./polygonFeature.vert');
  var vertexPatternShader = require('./polygonPatternFeature.vert');

  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      m_actor = null,
      m_mapper = null,
      m_geometry,
      m_origin,
      m_uniforms,
      m_modelViewUniform,
      s_init = this._init,
      s_update = this._update,
      m_builtOnce,
      m_updateAnimFrameRef;

  function createVertexShader() {
    var shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    if (!m_this._hasPatterns) {
      shader.setShaderSource(vertexShader);
    } else {
      shader.setShaderSource(vertexPatternShader);
    }
    return shader;
  }

  function createFragmentShader() {
    var shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    if (!m_this._hasPatterns) {
      shader.setShaderSource(fragmentShader);
    } else {
      shader.setShaderSource(fragmentPatternShader);
    }
    return shader;
  }

  function _resolvePattern(val, func, d, idx, v0) {
    if (!val && func === undefined) {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    const pattern = Array(16);
    let fillColor, strokeColor;
    if (val === undefined) {
      val = func(d, idx);
    }
    if (!val) {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    if (val.fillColor === undefined) {
      fillColor = util.convertColor(m_this.style.get('strokeColor')(v0, 0, d, idx));
      fillColor.a = m_this.style.get('strokeOpacity')(v0, 0, d, idx);
    } else {
      fillColor = util.convertColor(val.fillColor);
    }
    pattern[0] = fillColor.r;
    pattern[1] = fillColor.g;
    pattern[2] = fillColor.b;
    pattern[3] = fillColor.a;
    if (val.strokeColor === undefined) {
      strokeColor = util.convertColor(m_this.style.get('fillColor')(v0, 0, d, idx));
      strokeColor.a = m_this.style.get('fillOpacity')(v0, 0, d, idx);
    } else {
      strokeColor = util.convertColor(val.strokeColor);
    }
    pattern[4] = strokeColor.r;
    pattern[5] = strokeColor.g;
    pattern[6] = strokeColor.b;
    pattern[7] = strokeColor.a;
    pattern[8] = val.strokeWidth === undefined ? 1.25 : val.strokeWidth;
    pattern[9] = val.radius === undefined ? 6.25 : val.radius;
    let scaleWithZoom = val.scaleWithZoom === undefined ? markerFeature.scaleMode.none : val.scaleWithZoom;
    scaleWithZoom = markerFeature.scaleMode[scaleWithZoom] || scaleWithZoom;
    const strokeOffset = val.strokeOffset === undefined || val.strokeOffset < 0 ? -1 : (val.strokeOffset > 0 ? 1 : 0);
    pattern[10] = scaleWithZoom + (!val.rotateWithMap ? 4 : 0) + ((val.radiusIncludeStroke ? strokeOffset : 1) + 1) * 16 + (val.symbol || 0) * 64;
    if (val.symbol && val.symbolValue && val.symbol >= markerFeature.symbols.arrow && val.symbol < markerFeature.symbols.arrow + markerFeature.symbols.arrowMax) {
      pattern[11] = util.packFloats(val.symbolValue || 0);
    } else {
      pattern[11] = val.symbolValue || 0;
    }
    pattern[12] = val.rotation || 0;
    pattern[13] = val.spacing === undefined ? 20 : val.spacing;
    pattern[14] = val.origin === undefined ? 0 : val.origin[0];
    pattern[15] = val.origin === undefined ? 0 : val.origin[1];
    return pattern;
  }

  /**
   * Create and style the triangles needed to render the polygons.
   *
   * There are several optimizations to do less work when possible.  If only
   * styles have changed, the triangulation is not recomputed, nor is the
   * geometry re-transformed.  If styles use static values (rather than
   * functions), they are only calculated once.  If a polygon reports that it
   * has a uniform style, then styles are only calculated once for that polygon
   * (the uniform property may be different per polygon or per update).
   * Array.map is slower in Chrome that using a loop, so loops are used in
   * places that would be conceptually served by maps.
   *
   * @param {boolean} onlyStyle if true, use the existing geometry and just
   *    recalculate the style.
   */
  function createGLPolygons(onlyStyle) {
    var posBuf, posFunc, polyFunc,
        fillColor, fillColorFunc, fillColorVal,
        fillOpacity, fillOpacityFunc, fillOpacityVal,
        fillFunc, fillVal,
        patternFunc, patternVal, pattern,
        patternFillColor, patternStrokeColor,
        patternSymbolProps, patternPositionProps,
        uniformFunc, uniformVal, uniform,
        indices,
        items = [], itemsk, itemsktri,
        target_gcs = m_this.gcs(),
        map_gcs = m_this.layer().map().gcs(),
        numPts = 0,
        geom,
        color, opacity, fill, d, d3, vertices, i, j, k, n,
        record, item, itemIndex, original;

    fillColorFunc = m_this.style.get('fillColor');
    fillColorVal = util.isFunction(m_this.style('fillColor')) ? undefined : fillColorFunc();
    fillOpacityFunc = m_this.style.get('fillOpacity');
    fillOpacityVal = util.isFunction(m_this.style('fillOpacity')) ? undefined : fillOpacityFunc();
    fillFunc = m_this.style.get('fill');
    fillVal = util.isFunction(m_this.style('fill')) ? undefined : fillFunc();
    uniformFunc = m_this.style.get('uniformPolygon');
    uniformVal = util.isFunction(m_this.style('uniformPolygon')) ? undefined : uniformFunc();
    patternFunc = m_this.style.get('pattern');
    patternVal = util.isFunction(m_this.style('pattern')) ? undefined : (patternFunc() || null);
    if (patternVal !== null && m_this._hasPatterns !== true) {
      m_this.renderer().contextRenderer().removeActor(m_actor);
      m_actor = null;
      m_this._init(true);
    }
    geom = m_mapper.geometryData();

    if (!onlyStyle) {
      posFunc = m_this.style.get('position');
      posFunc = posFunc === util.identityFunction ? null : posFunc;
      polyFunc = m_this.style.get('polygon');
      polyFunc = polyFunc === util.identityFunction ? null : polyFunc;
      m_this.data().forEach(function (item, itemIndex) {
        var polygon, outer, geometry, c;

        polygon = polyFunc ? polyFunc(item, itemIndex) : item;
        if (!polygon) {
          return;
        }
        outer = polygon.outer || (Array.isArray(polygon) ? polygon : []);
        if (outer.length < 3) {
          return;
        }

        /* expand to an earcut polygon geometry.  We had been using a map call,
         * but using loops is much faster in Chrome (4 versus 33 ms for one
         * test). */
        geometry = new Array(outer.length * 3);
        for (i = d3 = 0; i < outer.length; i += 1, d3 += 3) {
          c = posFunc ? posFunc(outer[i], i, item, itemIndex) : outer[i];
          geometry[d3] = c.x;
          geometry[d3 + 1] = c.y;
          // ignore the z values until we support them
          geometry[d3 + 2] = 0;  // c.z || 0;
        }
        geometry = {vertices: geometry, dimensions: 3, holes: []};
        original = outer;

        if (polygon.inner) {
          polygon.inner.forEach(function (hole) {
            if (hole.length < 3) {
              return;
            }
            original = original.concat(hole);
            geometry.holes.push(d3 / 3);
            for (i = 0; i < hole.length; i += 1, d3 += 3) {
              c = posFunc ? posFunc(hole[i], i, item, itemIndex) : hole[i];
              geometry.vertices[d3] = c.x;
              geometry.vertices[d3 + 1] = c.y;
              // ignore the z values until we support them
              geometry.vertices[d3 + 2] = 0;  // c.z || 0;
            }
          });
        }

        // transform to map gcs
        geometry.vertices = transform.transformCoordinates(
          target_gcs,
          map_gcs,
          geometry.vertices,
          geometry.dimensions
        );

        record = {
          // triangulate
          triangles: earcut(geometry.vertices, geometry.holes, geometry.dimensions),
          vertices: geometry.vertices,
          original: original,
          item: item,
          itemIndex: itemIndex
        };
        if (record.triangles.length) {
          items.push(record);
          numPts += record.triangles.length;
        }
      });
      posBuf = util.getGeomBuffer(geom, 'pos', numPts * 3);
      indices = geom.primitive(0).indices();
      if (!(indices instanceof Uint16Array) || indices.length !== numPts) {
        indices = new Uint16Array(numPts);
        geom.primitive(0).setIndices(indices);
      }
      m_geometry = {items: items, numPts: numPts};
      m_origin = new Float32Array(m_this.style.get('origin')(items));
      m_modelViewUniform.setOrigin(m_origin);
    } else {
      items = m_geometry.items;
      numPts = m_geometry.numPts;
    }
    fillColor = util.getGeomBuffer(geom, 'fillColor', numPts * 3);
    fillOpacity = util.getGeomBuffer(geom, 'fillOpacity', numPts);
    d = d3 = 0;
    color = fillColorVal;
    fill = fillVal;
    if (m_this._hasPatterns) {
      patternFillColor = util.getGeomBuffer(geom, 'patternFillColor', numPts * 4);
      patternStrokeColor = util.getGeomBuffer(geom, 'patternStrokeColor', numPts * 4);
      patternSymbolProps = util.getGeomBuffer(geom, 'patternSymbolProps', numPts * 4);
      patternPositionProps = util.getGeomBuffer(geom, 'patternPositionProps', numPts * 4);
    }
    for (k = 0; k < items.length; k += 1) {
      itemsk = items[k];
      itemsktri = itemsk.triangles;
      n = itemsktri.length;
      vertices = itemsk.vertices;
      item = itemsk.item;
      itemIndex = itemsk.itemIndex;
      original = itemsk.original;
      uniform = uniformVal === undefined ? uniformFunc(item, itemIndex) : uniformVal;
      opacity = fillOpacityVal;
      if (uniform) {
        if (fillColorVal === undefined) {
          color = fillColorFunc(vertices[0], 0, item, itemIndex);
        }
        if (fillOpacityVal === undefined) {
          opacity = fillOpacityFunc(vertices[0], 0, item, itemIndex);
        }
      }
      if (fillVal === undefined) {
        fill = fillFunc(item, itemIndex);
      }
      if (!fill) {
        opacity = 0;
      }
      if (m_this._hasPatterns) {
        if ((pattern === undefined && patternVal) || patternVal === undefined) {
          pattern = _resolvePattern(patternVal, patternFunc, item, itemIndex, vertices[0]);
        }
      }
      if (uniform && onlyStyle && itemsk.uniform && itemsk.color &&
          color.r === itemsk.color.r && color.g === itemsk.color.g &&
          color.b === itemsk.color.b && opacity === itemsk.opacity) {
        d += n;
        d3 += n * 3;
        continue;
      }
      for (i = 0; i < n; i += 1, d += 1, d3 += 3) {
        if (onlyStyle && uniform) {
          fillColor[d3] = color.r;
          fillColor[d3 + 1] = color.g;
          fillColor[d3 + 2] = color.b;
          fillOpacity[d] = opacity;
        } else {
          j = itemsktri[i] * 3;
          if (!onlyStyle) {
            posBuf[d3] = vertices[j] - m_origin[0];
            posBuf[d3 + 1] = vertices[j + 1] - m_origin[1];
            posBuf[d3 + 2] = vertices[j + 2] - m_origin[2];
            indices[d] = i;
          }
          if (!uniform && fillColorVal === undefined) {
            color = fillColorFunc(original[j], j, item, itemIndex);
          }
          fillColor[d3] = color.r;
          fillColor[d3 + 1] = color.g;
          fillColor[d3 + 2] = color.b;
          if (!uniform && fill && fillOpacityVal === undefined) {
            opacity = fillOpacityFunc(original[j], j, item, itemIndex);
          }
          fillOpacity[d] = opacity;
        }
        if (m_this._hasPatterns) {
          patternFillColor[d * 4] = pattern[0];
          patternFillColor[d * 4 + 1] = pattern[1];
          patternFillColor[d * 4 + 2] = pattern[2];
          patternFillColor[d * 4 + 3] = pattern[3];
          patternStrokeColor[d * 4] = pattern[4];
          patternStrokeColor[d * 4 + 1] = pattern[5];
          patternStrokeColor[d * 4 + 2] = pattern[6];
          patternStrokeColor[d * 4 + 3] = pattern[7];
          patternSymbolProps[d * 4] = pattern[8];
          patternSymbolProps[d * 4 + 1] = pattern[9];
          patternSymbolProps[d * 4 + 2] = pattern[10];
          patternSymbolProps[d * 4 + 3] = pattern[11];
          patternPositionProps[d * 4] = pattern[12];
          patternPositionProps[d * 4 + 1] = pattern[13];
          patternPositionProps[d * 4 + 2] = pattern[14];
          patternPositionProps[d * 4 + 3] = pattern[15];
        }
      }
      if (uniform || itemsk.uniform) {
        itemsk.uniform = uniform;
        itemsk.color = color;
        itemsk.opacity = opacity;
      }
    }
    if (!onlyStyle) {
      m_mapper.modified();
      geom.boundsDirty(true);
      m_mapper.boundsDirtyTimestamp().modified();
    } else {
      m_mapper.updateSourceBuffer('fillOpacity');
      m_mapper.updateSourceBuffer('fillColor');
      if (m_this._hasPatterns) {
        m_mapper.updateSourceBuffer('patternFillColor');
        m_mapper.updateSourceBuffer('patternStrokeColor');
        m_mapper.updateSourceBuffer('patternSymbolProps');
        m_mapper.updateSourceBuffer('patternPositionProps');
      }
    }
  }

  /**
   * Initialize.
   *
   * @param {geo.polygonFeature.spec} arg An object with options for the
   *    feature.
   */
  this._init = function (arg) {
    m_this._hasPatterns = (arg === true);
    var prog = vgl.shaderProgram(),
        posAttr = vgl.vertexAttribute('pos'),
        fillColorAttr = vgl.vertexAttribute('fillColor'),
        fillOpacityAttr = vgl.vertexAttribute('fillOpacity'),
        projectionUniform = new vgl.projectionUniform('projectionMatrix'),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        blend = vgl.blend(),
        geom = vgl.geometryData(),
        sourcePositions = vgl.sourceDataP3fv({name: 'pos'}),
        sourceFillColor = vgl.sourceDataAnyfv(
          3, vgl.vertexAttributeKeysIndexed.Two, {name: 'fillColor'}),
        sourceFillOpacity = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Three, {name: 'fillOpacity'}),
        trianglePrimitive = vgl.triangles(),
        mat = vgl.material();
    m_modelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix');

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(fillColorAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(fillOpacityAttr, vgl.vertexAttributeKeysIndexed.Three);
    if (m_this._hasPatterns) {
      var patternFillColorAttr = vgl.vertexAttribute('patternFillColor'),
          patternStrokeColorAttr = vgl.vertexAttribute('patternStrokeColor'),
          patternSymbolPropsAttr = vgl.vertexAttribute('patternSymbolProps'),
          patternPositionPropsAttr = vgl.vertexAttribute('patternPositionProps');
      prog.addVertexAttribute(patternFillColorAttr, vgl.vertexAttributeKeysIndexed.Four);
      prog.addVertexAttribute(patternStrokeColorAttr, vgl.vertexAttributeKeysIndexed.Five);
      prog.addVertexAttribute(patternSymbolPropsAttr, vgl.vertexAttributeKeysIndexed.Six);
      prog.addVertexAttribute(patternPositionPropsAttr, vgl.vertexAttributeKeysIndexed.Seven);
    }
    prog.addUniform(m_modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);
    mat.addAttribute(blend);

    m_mapper = vgl.mapper();
    m_actor = vgl.actor();
    m_actor.setMaterial(mat);
    m_actor.setMapper(m_mapper);

    geom.addSource(sourcePositions);
    geom.addSource(sourceFillColor);
    geom.addSource(sourceFillOpacity);
    if (m_this._hasPatterns) {
      var uniforms = {
        pixelWidth: vgl.GL.FLOAT,
        aspect: vgl.GL.FLOAT,
        zoom: vgl.GL.FLOAT,
        rotationUniform: vgl.GL.FLOAT
      };
      m_uniforms = {};
      Object.keys(uniforms).forEach((key) => {
        m_uniforms[key] = new vgl.uniform(uniforms[key], key);
        prog.addUniform(m_uniforms[key]);
      });
      var sourcePatternFillColor = vgl.sourceDataAnyfv(
            4, vgl.vertexAttributeKeysIndexed.Four, {name: 'patternFillColor'}),
          sourcePatternStrokeColor = vgl.sourceDataAnyfv(
            4, vgl.vertexAttributeKeysIndexed.Five, {name: 'patternStrokeColor'}),
          sourcePatternSymbolProps = vgl.sourceDataAnyfv(
            4, vgl.vertexAttributeKeysIndexed.Six, {name: 'patternSymbolProps'}),
          sourcePatternPositionProps = vgl.sourceDataAnyfv(
            4, vgl.vertexAttributeKeysIndexed.Seven, {name: 'patternPositionProps'});
      geom.addSource(sourcePatternFillColor);
      geom.addSource(sourcePatternStrokeColor);
      geom.addSource(sourcePatternSymbolProps);
      geom.addSource(sourcePatternPositionProps);
    }
    geom.addPrimitive(trianglePrimitive);
    /* We don't need vgl to compute bounds, so make the geo.computeBounds just
     * set them to 0. */
    geom.computeBounds = function () {
      geom.setBounds(0, 0, 0, 0, 0, 0);
    };
    m_mapper.setGeometryData(geom);

    if (arg !== true) {
      s_init.call(m_this, arg);
    }
  };

  /**
   * List vgl actors.
   *
   * @returns {vgl.actor[]} The list of actors.
   */
  this.actors = function () {
    return [m_actor];
  };

  /**
   * Build.
   */
  this._build = function () {
    createGLPolygons(!!(m_this.dataTime().timestamp() < m_this.buildTime().timestamp() && m_geometry));

    if (!m_this.renderer().contextRenderer().hasActor(m_actor)) {
      m_this.renderer().contextRenderer().addActor(m_actor);
      m_builtOnce = true;
    }
    m_this.buildTime().modified();
  };

  /**
   * Update.
   *
   * @param {object} [opts] Update options.
   * @param {boolean} [opts.mayDelay] If truthy, wait until the next animation
   *    frame for the update.
   */
  this._update = function (opts) {
    if (!m_this.ready) {
      return;
    }
    if (opts && opts.mayDelay && m_builtOnce) {
      m_updateAnimFrameRef = m_this.layer().map().scheduleAnimationFrame(m_this._update);
      return;
    }
    if (m_updateAnimFrameRef) {
      m_this.layer().map().scheduleAnimationFrame(m_this._update, 'remove');
      m_updateAnimFrameRef = null;
    }
    s_update.call(m_this);

    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp() ||
        m_this.updateTime().timestamp() <= m_this.timestamp()) {
      m_this._build();
    }

    if (m_this._hasPatterns) {
      // Update uniforms
      m_uniforms.pixelWidth.set(2.0 / m_this.renderer().width());
      m_uniforms.aspect.set(m_this.renderer().width() / m_this.renderer().height());
      m_uniforms.zoom.set(m_this.renderer().map().zoom());
      m_uniforms.rotationUniform.set(m_this.renderer().map().rotation());
    }
    m_actor.setVisible(m_this.visible());
    m_actor.material().setBinNumber(m_this.bin());
    m_this.updateTime().modified();
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    if (m_updateAnimFrameRef && m_this.layer()) {
      m_this.layer().map().scheduleAnimationFrame(m_this._update, 'remove');
      m_updateAnimFrameRef = null;
    }
    m_this.renderer().contextRenderer().removeActor(m_actor);
    m_actor = null;
    m_uniforms = {};
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(webgl_polygonFeature, polygonFeature);

// Now register it
registerFeature('webgl', 'polygon', webgl_polygonFeature);
module.exports = webgl_polygonFeature;
