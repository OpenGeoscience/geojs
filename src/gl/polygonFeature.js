var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var polygonFeature = require('../polygonFeature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of polygonFeature
 *
 * @class geo.gl.polygonFeature
 * @extends geo.polygonFeature
 * @returns {geo.gl.polygonFeature}
 */
//////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_exit = this._exit,
      m_actor = vgl.actor(),
      m_mapper = vgl.mapper(),
      m_material = vgl.material(),
      s_init = this._init,
      s_update = this._update;

  function createVertexShader() {
    var vertexShaderSource = [
          'attribute vec3 pos;',
          'attribute vec3 fillColor;',
          'attribute float fillOpacity;',
          'uniform mat4 modelViewMatrix;',
          'uniform mat4 projectionMatrix;',
          'uniform float pixelWidth;',
          'varying vec3 fillColorVar;',
          'varying float fillOpacityVar;',

          'void main(void)',
          '{',
          '  vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1);',
          '  if (clipPos.w != 0.0) {',
          '    clipPos = clipPos/clipPos.w;',
          '  }',
          '  fillColorVar = fillColor;',
          '  fillOpacityVar = fillOpacity;',
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
          'varying vec3 fillColorVar;',
          'varying float fillOpacityVar;',
          'void main () {',
          '  gl_FragColor = vec4 (fillColorVar, fillOpacityVar);',
          '}'
        ].join('\n'),
        shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
  }

  function createGLPolygons() {
    var posFunc = null,
        fillColorFunc = null,
        fillOpacityFunc = null,
        buffers = vgl.DataBuffers(1024),
        sourcePositions = vgl.sourceDataP3fv(),
        sourceFillColor =
          vgl.sourceDataAnyfv(3, vgl.vertexAttributeKeysIndexed.Two),
        sourceFillOpacity =
          vgl.sourceDataAnyfv(1, vgl.vertexAttributeKeysIndexed.Three),
        trianglePrimitive = vgl.triangles(),
        geom = vgl.geometryData(),
        triangles = [],
        target_gcs = m_this.gcs(),
        map_gcs = m_this.layer().map().gcs(),
        color;

    posFunc = m_this.position();
    fillColorFunc = m_this.style.get('fillColor');
    fillOpacityFunc = m_this.style.get('fillOpacity');

    buffers.create('pos', 3);
    buffers.create('indices', 1);
    buffers.create('fillColor', 3);
    buffers.create('fillOpacity', 1);

    m_this.data().forEach(function (item, itemIndex) {
      var polygon, geometry, numPts, start, i, vertex, j;

      function position(d, i) {
        var c = posFunc(d, i, item, itemIndex);
        return [c.x, c.y, c.z || 0];
      }

      polygon = m_this.polygon()(item, itemIndex);
      polygon.outer = polygon.outer || [];
      polygon.inner = polygon.inner || [];

      // expand to a geojson polygon geometry
      geometry = [(polygon.outer || []).map(position)];
      (polygon.inner || []).forEach(function (hole) {
        geometry.push(hole.map(position));
      });

      // convert to an earcut geometry
      geometry = earcut.flatten(geometry);

      // tranform to map gcs
      geometry.vertices = transform.transformCoordinates(
        target_gcs,
        map_gcs,
        geometry.vertices,
        geometry.dimensions
      );

      // triangulate
      triangles = earcut(geometry.vertices, geometry.holes, geometry.dimensions);

      // append to buffers
      numPts = triangles.length;
      start = buffers.alloc(triangles.length);

      for (i = 0; i < numPts; i += 1) {
        j = triangles[i] * 3;
        vertex = geometry.vertices.slice(triangles[i] * 3, j + 3);
        buffers.write('pos', vertex, start + i, 1);
        buffers.write('indices', [i], start + i, 1);
        color = fillColorFunc(vertex, i, item, itemIndex);

        buffers.write(
          'fillColor',
          [color.r, color.g, color.b],
          start + i,
          1
        );
        buffers.write(
          'fillOpacity',
          [fillOpacityFunc(vertex, i, item, itemIndex)],
          start + i,
          1
        );
      }
    });

    sourcePositions.pushBack(buffers.get('pos'));
    geom.addSource(sourcePositions);

    sourceFillColor.pushBack(buffers.get('fillColor'));
    geom.addSource(sourceFillColor);

    sourceFillOpacity.pushBack(buffers.get('fillOpacity'));
    geom.addSource(sourceFillOpacity);

    trianglePrimitive.setIndices(buffers.get('indices'));
    geom.addPrimitive(trianglePrimitive);

    m_mapper.setGeometryData(geom);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    var blend = vgl.blend(),
        prog = vgl.shaderProgram(),
        posAttr = vgl.vertexAttribute('pos'),
        fillColorAttr = vgl.vertexAttribute('fillColor'),
        fillOpacityAttr = vgl.vertexAttribute('fillOpacity'),
        modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
        projectionUniform = new vgl.projectionUniform('projectionMatrix'),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader();

    s_init.call(m_this, arg);

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(fillColorAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(fillOpacityAttr, vgl.vertexAttributeKeysIndexed.Three);

    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    m_material.addAttribute(prog);
    m_material.addAttribute(blend);

    m_actor.setMapper(m_mapper);
    m_actor.setMaterial(m_material);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    if (m_actor) {
      m_this.renderer().contextRenderer().removeActor(m_actor);
    }

    createGLPolygons();

    m_this.renderer().contextRenderer().addActor(m_actor);
    m_this.buildTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() <= m_this.getMTime()) {
      m_this._build();
    }

    m_actor.setVisible(m_this.visible());
    m_actor.material().setBinNumber(m_this.bin());
    m_this.updateTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   */
  ////////////////////////////////////////////////////////////////////////////
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
