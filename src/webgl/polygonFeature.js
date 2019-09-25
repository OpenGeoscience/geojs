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

  var vgl = require('vgl');
  var earcut = require('earcut');
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');
  var fragmentShader = require('./polygonFeature.frag');
  var vertexShader = require('./polygonFeature.vert');

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
      m_origin,
      m_modelViewUniform,
      s_init = this._init,
      s_update = this._update,
      m_builtOnce,
      m_updateAnimFrameRef;

  function createVertexShader() {
    var shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    shader.setShaderSource(vertexShader);
    return shader;
  }

  function createFragmentShader() {
    var shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShader);
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
              c = posFunc(hole[i], i, item, itemIndex);
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
    m_modelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix');

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(fillColorAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(fillOpacityAttr, vgl.vertexAttributeKeysIndexed.Three);

    prog.addUniform(m_modelViewUniform);
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
    /* We don't need vgl to compute bounds, so make the geo.computeBounds just
     * set them to 0. */
    geom.computeBounds = function () {
      geom.setBounds(0, 0, 0, 0, 0, 0);
    };
    m_mapper.setGeometryData(geom);

    s_init.call(m_this, arg);
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
    createGLPolygons(m_this.dataTime().timestamp() < m_this.buildTime().timestamp() && m_geometry);

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
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(webgl_polygonFeature, polygonFeature);

// Now register it
registerFeature('webgl', 'polygon', webgl_polygonFeature);
module.exports = webgl_polygonFeature;
