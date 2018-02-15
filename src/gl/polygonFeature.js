var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var polygonFeature = require('../polygonFeature');

/**
 * Create a new instance of gl.polygonFeature.
 *
 * @class
 * @alias geo.gl.polygonFeature
 * @extends geo.polygonFeature
 * @param {geo.polygonFeature.spec} arg
 * @returns {geo.gl.polygonFeature}
 */
var gl_polygonFeature = function (arg) {
  'use strict';
  if (!(this instanceof gl_polygonFeature)) {
    return new gl_polygonFeature(arg);
  }
  arg = arg || {};
  polygonFeature.call(this, arg);

  var vgl = require('vgl');
  var earcut = require('earcut');
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');

  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      m_actor = vgl.actor(),
      m_mapper = vgl.mapper(),
      m_material = vgl.material(),
      m_geometry,
      s_init = this._init,
      s_update = this._update,
      m_updateAnimFrameRef;

  function createVertexShader() {
    var vertexShaderSource = [
          'attribute vec3 pos;',
          'attribute vec3 fillColor;',
          'attribute float fillOpacity;',
          'uniform mat4 modelViewMatrix;',
          'uniform mat4 projectionMatrix;',
          'varying vec4 fillColorVar;',

          'void main(void)',
          '{',
          '  vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1);',
          '  if (clipPos.w != 0.0) {',
          '    clipPos = clipPos/clipPos.w;',
          '  }',
          '  fillColorVar = vec4(fillColor, fillOpacity);',
          '  gl_Position = clipPos;',
          '}'
        ].join('\n'),
        shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
  }

  function createFragmentShader() {
    var fragmentShaderSource = [
          '#ifdef GL_ES',
          '  precision highp float;',
          '#endif',
          'varying vec4 fillColorVar;',
          'void main () {',
          '  gl_FragColor = fillColorVar;',
          '}'
        ].join('\n'),
        shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
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
   * @param {boolean} onlyStyle if true, use the existing geoemtry and just
   *    recalculate the style.
   */
  function createGLPolygons(onlyStyle) {
    var posBuf, posFunc, polyFunc,
        fillColor, fillColorFunc, fillColorVal,
        fillOpacity, fillOpacityFunc, fillOpacityVal,
        fillFunc, fillVal,
        uniformPolyFunc, uniform,
        indices,
        items = [],
        target_gcs = m_this.gcs(),
        map_gcs = m_this.layer().map().gcs(),
        numPts = 0,
        geom = m_mapper.geometryData(),
        color, opacity, fill, d, d3, vertices, i, j, k, n,
        record, item, itemIndex, original;

    fillColorFunc = m_this.style.get('fillColor');
    fillColorVal = util.isFunction(m_this.style('fillColor')) ? undefined : fillColorFunc();
    fillOpacityFunc = m_this.style.get('fillOpacity');
    fillOpacityVal = util.isFunction(m_this.style('fillOpacity')) ? undefined : fillOpacityFunc();
    fillFunc = m_this.style.get('fill');
    fillVal = util.isFunction(m_this.style('fill')) ? undefined : fillFunc();
    uniformPolyFunc = m_this.style.get('uniformPolygon');

    if (!onlyStyle) {
      posFunc = m_this.style.get('position');
      polyFunc = m_this.style.get('polygon');
      m_this.data().forEach(function (item, itemIndex) {
        var polygon, outer, geometry, c;

        polygon = polyFunc(item, itemIndex);
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
          c = posFunc(outer[i], i, item, itemIndex);
          geometry[d3] = c.x;
          geometry[d3 + 1] = c.y;
          geometry[d3 + 2] = c.z || 0;
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
              c = posFunc(hole[i], i, item, itemIndex);
              geometry.vertices[d3] = c.x;
              geometry.vertices[d3 + 1] = c.y;
              geometry.vertices[d3 + 2] = c.z || 0;
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
    } else {
      items = m_geometry.items;
      numPts = m_geometry.numPts;
    }
    fillColor = util.getGeomBuffer(geom, 'fillColor', numPts * 3);
    fillOpacity = util.getGeomBuffer(geom, 'fillOpacity', numPts);
    d = d3 = 0;
    color = fillColorVal;
    fill = fillVal;
    for (k = 0; k < items.length; k += 1) {
      n = items[k].triangles.length;
      vertices = items[k].vertices;
      item = items[k].item;
      itemIndex = items[k].itemIndex;
      original = items[k].original;
      uniform = uniformPolyFunc(item, itemIndex);
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
      if (uniform && onlyStyle && items[k].uniform && items[k].color &&
          color.r === items[k].color.r && color.g === items[k].color.g &&
          color.b === items[k].color.b && opacity === items[k].opacity) {
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
          j = items[k].triangles[i] * 3;
          if (!onlyStyle) {
            posBuf[d3] = vertices[j];
            posBuf[d3 + 1] = vertices[j + 1];
            posBuf[d3 + 2] = vertices[j + 2];
            indices[d] = i;
          }
          if (!uniform && fillColorVal === undefined) {
            color = fillColorFunc(original[j], j, item, itemIndex);
          }
          fillColor[d3] = color.r;
          fillColor[d3 + 1] = color.g;
          fillColor[d3 + 2] = color.b;
          if (!uniform && fillOpacityVal === undefined) {
            opacity = fillOpacityFunc(original[j], j, item, itemIndex);
          }
          fillOpacity[d] = opacity;
        }
      }
      if (uniform || items[k].uniform) {
        items[k].uniform = uniform;
        items[k].color = color;
        items[k].opacity = opacity;
      }
    }
    m_mapper.modified();
    if (!onlyStyle) {
      geom.boundsDirty(true);
      m_mapper.boundsDirtyTimestamp().modified();
    }
  }

  /**
   * Initialize.
   *
   * @param {geo.polygonFeature.spec} arg An object with options for the
   *    feature.
   */
  this._init = function (arg) {
    var prog = vgl.shaderProgram(),
        posAttr = vgl.vertexAttribute('pos'),
        fillColorAttr = vgl.vertexAttribute('fillColor'),
        fillOpacityAttr = vgl.vertexAttribute('fillOpacity'),
        modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
        projectionUniform = new vgl.projectionUniform('projectionMatrix'),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        blend = vgl.blend(),
        geom = vgl.geometryData(),
        sourcePositions = vgl.sourceDataP3fv({'name': 'pos'}),
        sourceFillColor = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Two, {'name': 'fillColor'}),
        sourceFillOpacity = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Three, {'name': 'fillOpacity'}),
        trianglePrimitive = vgl.triangles();

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(fillColorAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(fillOpacityAttr, vgl.vertexAttributeKeysIndexed.Three);

    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    m_material.addAttribute(prog);
    m_material.addAttribute(blend);

    m_actor.setMaterial(m_material);
    m_actor.setMapper(m_mapper);

    geom.addSource(sourcePositions);
    geom.addSource(sourceFillColor);
    geom.addSource(sourceFillOpacity);
    geom.addPrimitive(trianglePrimitive);
    m_mapper.setGeometryData(geom);

    s_init.call(m_this, arg);
  };

  /**
   * Build.
   *
   * @override
   */
  this._build = function () {
    createGLPolygons(m_this.dataTime().getMTime() < m_this.buildTime().getMTime() && m_geometry);

    if (!m_this.renderer().contextRenderer().hasActor(m_actor)) {
      m_this.renderer().contextRenderer().addActor(m_actor);
    }
    m_this.buildTime().modified();
  };

  /**
   * Update.
   *
   * @override
   */
  this._update = function (opts) {
    if (opts && opts.mayDelay) {
      m_updateAnimFrameRef = m_this.layer().map().scheduleAnimationFrame(m_this._update);
      return;
    }
    if (m_updateAnimFrameRef) {
      m_this.layer().map().scheduleAnimationFrame(m_this._update, 'remove');
      m_updateAnimFrameRef = null;
    }
    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() <= m_this.getMTime()) {
      m_this._build();
    }

    m_actor.setVisible(m_this.visible());
    m_actor.material().setBinNumber(m_this.bin());
    m_this.updateTime().modified();
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    m_this.renderer().contextRenderer().removeActor(m_actor);
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(gl_polygonFeature, polygonFeature);

// Now register it
registerFeature('vgl', 'polygon', gl_polygonFeature);
module.exports = gl_polygonFeature;
