//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of polygonFeature
 *
 * @class
 * @extends geo.polygonFeature
 * @returns {geo.gl.polygonFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.polygonFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.gl.polygonFeature)) {
    return new geo.gl.polygonFeature(arg);
  }
  arg = arg || {};
  geo.polygonFeature.call(this, arg);

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
    shader = new vgl.shader(gl.VERTEX_SHADER);
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
    shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
  }

  function createGLPolygons() {
    var i = null,
        numPts = null,
        start = null,
        itemIndex = 0,
        polygonItemCoordIndex = 0,
        position = [],
        fillColor = [],
        fillOpacity = [],
        fillColorNew = [],
        fillOpacityNew = [],
        posFunc = null,
        fillColorFunc = null,
        polygonItem = null,
        fillOpacityFunc = null,
        buffers = vgl.DataBuffers(1024),
        sourcePositions = vgl.sourceDataP3fv(),
        sourceFillColor =
          vgl.sourceDataAnyfv(3, vgl.vertexAttributeKeysIndexed.Two),
        sourceFillOpacity =
          vgl.sourceDataAnyfv(1, vgl.vertexAttributeKeysIndexed.Three),
        trianglePrimitive = vgl.triangles(),
        geom = vgl.geometryData(),
        polygon = null,
        holes = null,
        extRing = null,
        extIndex = 0,
        extLength = null,
        intIndex = 0,
        posInstance = null,
        triangulator = new PNLTRI.Triangulator(),
        triangList = null,
        newTriangList = null,
        fillColorInstance = null,
        currentIndex = null;

    posFunc = m_this.position();
    fillColorFunc = m_this.style.get('fillColor');
    fillOpacityFunc = m_this.style.get('fillOpacity');

    m_this.data().forEach(function (item) {
      polygon = m_this.polygon()(item, itemIndex);
      polygonItem = polygon.outer || [];
      holes = polygon.inner || [];
      polygonItemCoordIndex = 0;
      extRing = [];
      extIndex = 0;
      extLength = polygonItem.length - 1;
      extRing[0] = [];
      intIndex = 0;

      polygonItem.forEach(function (extRingCoords) {
        if (extIndex !== extLength) {
          //extRing = extRing.concat(extRingCoords);
          posInstance = posFunc(extRingCoords,
                                polygonItemCoordIndex,
                                item, itemIndex);
          if (posInstance instanceof geo.latlng) {
            extRing[0].push({
              x: posInstance.x(), y: posInstance.y(), i: fillColor.length
            });
          } else {
            extRing[0].push({
              x: posInstance.x, y: posInstance.y, i: fillColor.length
            });
          }

          fillColorInstance = fillColorFunc(extRingCoords,
                                            polygonItemCoordIndex,
                                            item, itemIndex);
          fillColor.push([fillColorInstance.r,
                          fillColorInstance.g,
                          fillColorInstance.b]);
          fillOpacity.push(fillOpacityFunc(extRingCoords,
                                           polygonItemCoordIndex,
                                           item,
                                           itemIndex));
          polygonItemCoordIndex += 1;
        }
        extIndex += 1;
      });

      polygonItemCoordIndex = 0;
      holes.forEach(function (hole) {
        extRing[intIndex + 1] = [];
        hole.forEach(function (intRingCoords) {
          posInstance = posFunc(intRingCoords, polygonItemCoordIndex,
                                item, itemIndex);
          if (posInstance instanceof geo.latlng) {
            extRing[intIndex + 1].push({
              x: posInstance.x(), y: posInstance.y(), i: fillColor.length
            });
          } else {
            extRing[intIndex + 1].push({
              x: posInstance.x, y: posInstance.y, i: fillColor.length
            });
          }
          fillColorInstance = fillColorFunc(intRingCoords,
                                            polygonItemCoordIndex,
                                            item, itemIndex);
          fillColor.push([fillColorInstance.r,
                          fillColorInstance.g,
                          fillColorInstance.b]);
          fillOpacity.push(fillOpacityFunc(intRingCoords,
                                           polygonItemCoordIndex,
                                           item, itemIndex));
          polygonItemCoordIndex += 1;
        });
        intIndex += 1;
      });

      //console.log("extRing ", extRing);
      //console.log("result", PolyK.Triangulate(extRing));
      triangList = triangulator.triangulate_polygon(extRing);
      newTriangList = [];

      triangList.forEach(function (newIndices) {
        Array.prototype.push.apply(newTriangList, newIndices);
      });

      for (i = 1; i < extRing.length; i += 1) {
        extRing[0] = extRing[0].concat(extRing[i]);
      }

      newTriangList.forEach(function (polygonIndex) {
        var polygonItemCoords = extRing[0][polygonIndex];
        position.push([polygonItemCoords.x,
                       polygonItemCoords.y,
                       polygonItemCoords.z || 0.0]);
        fillColorNew.push(fillColor[polygonItemCoords.i]);
        fillOpacityNew.push(fillOpacity[polygonItemCoords.i]);
      });

      itemIndex += 1;
    });

    position = geo.transform.transformCoordinates(
                 m_this.gcs(), m_this.layer().map().gcs(),
                 position, 3);

    buffers.create('pos', 3);
    buffers.create('indices', 1);
    buffers.create('fillColor', 3);
    buffers.create('fillOpacity', 1);

    numPts = position.length;

    start = buffers.alloc(numPts);
    currentIndex = start;

    //console.log("numPts ", numPts);
    for (i = 0; i < numPts; i += 1) {
      buffers.write('pos', position[i], start + i, 1);
      buffers.write('indices', [i], start + i, 1);
      buffers.write('fillColor', fillColorNew[i], start + i, 1);
      buffers.write('fillOpacity', [fillOpacityNew[i]], start + i, 1);
    }

    //console.log(buffers.get('fillColor'));
    sourcePositions.pushBack(buffers.get('pos'));
    geom.addSource(sourcePositions);

    sourceFillColor.pushBack(buffers.get('fillColor'));
    geom.addSource(sourceFillColor);

    sourceFillOpacity.pushBack(buffers.get('fillOpacity'));
    geom.addSource(sourceFillOpacity);

    //console.log(buffers.get('indices'));
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

inherit(geo.gl.polygonFeature, geo.polygonFeature);

// Now register it
geo.registerFeature('vgl', 'polygon', geo.gl.polygonFeature);
