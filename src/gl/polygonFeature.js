  //////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.gl
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of polygonFeature
 *
 * @class
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
      m_actor = null,
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
        numPolygons = m_this.data().length,
        p = null,
        numPts = null,
        start = null,
        itemIndex = 0,
        polygonItemCoordIndex = 0,
        position = [],
        polygonItemCoords = null,
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
        mat = vgl.material(), blend = vgl.blend(),
        prog = vgl.shaderProgram(), vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        posAttr = vgl.vertexAttribute('pos'),
        fillColorAttr = vgl.vertexAttribute('fillColor'),
        fillOpacityAttr = vgl.vertexAttribute('fillOpacity'),
        modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
        projectionUniform = new vgl.projectionUniform('projectionMatrix'),
        geom = vgl.geometryData(),
        mapper = vgl.mapper(),
        polygon = null,
        holes = null,
        extRing = null,
        extIndex = 0,
        extLength = null,
        intIndex = 0,
        posInstance = null;

    posFunc = m_this.position();
    fillColorFunc = m_this.style.get('fillColor');
    fillOpacityFunc = m_this.style.get('fillOpacity');

    m_this.data().forEach(function (item) {
      polygon = m_this.polygon()(item, itemIndex);
      polygonItem = polygon.outer;
      holes = polygon.inner;
      polygonItemCoordIndex = 0;
      extRing = [], extIndex = 0, extLength = polygonItem.length - 1;
      extRing[0] = [];
      intIndex = 0;


      polygonItem.forEach(function (extRingCoords) {
        if (extIndex !== extLength) {
          //extRing = extRing.concat(extRingCoords);
          posInstance = posFunc(item, itemIndex,
                                extRingCoords, polygonItemCoordIndex);
          if (posInstance instanceof geo.latlng) {
            extRing[0].push({x: posInstance.x(), y: posInstance.y()});
          } else {
            extRing[0].push({x: posInstance.x, y: posInstance.y});
          }

          var sc = fillColorFunc(item, itemIndex, polygonItemCoords, polygonItemCoordIndex);
          fillColor.push([sc.r, sc.g, sc.b]);
          fillOpacity.push(fillOpacityFunc(item, itemIndex, polygonItemCoords, polygonItemCoordIndex));
          polygonItemCoordIndex += 1;
        }
        ++extIndex;
      });

      polygonItemCoordIndex = 0;
      holes.forEach(function (hole) {
        extRing[intIndex + 1] = [];
        hole.forEach(function (intRingCoords) {
          posInstance = posFunc(item, itemIndex,
                                intRingCoords, polygonItemCoordIndex);
          var sc = fillColorFunc(item, itemIndex, intRingCoords, polygonItemCoordIndex);
          fillColor.push([sc.r, sc.g, sc.b]);
          fillOpacity.push(fillOpacityFunc(item, itemIndex, intRingCoords, polygonItemCoordIndex));
          polygonItemCoordIndex += 1;
          extRing[intIndex + 1].push({x: intRingCoords[0], y: intRingCoords[1]});
        });
        ++intIndex;
      });

      //console.log("extRing ", extRing);
      //console.log("result", PolyK.Triangulate(extRing));
      var myTriangulator = new PNLTRI.Triangulator();
      var triangList = myTriangulator.triangulate_polygon( extRing );
      var newTriangList = [];
      //var result = PolyK.Triangulate(extRing)
      //console.log(triangList);

      triangList.forEach(function (newIndices) {
        newTriangList = newTriangList.concat(newIndices);
      });


      console.log("newTriangList length ", newTriangList.length);
      newTriangList.forEach(function (polygonIndex) {
        if (polygonIndex < extRing[0].length) {
          polygonItemCoords = extRing[0][polygonIndex];
        } else {
          polygonItemCoords = extRing[1][polygonIndex - extRing[0].length];
        }
        position.push([polygonItemCoords.x, polygonItemCoords.y, polygonItemCoords.z || 0.0]);
        fillColorNew.push(fillColor[polygonIndex]);
        fillOpacityNew.push(fillOpacity[polygonIndex]);
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

    // TODO: Right now this is ugly but we will fix it.
    prog.addVertexAttribute(posAttr,
      vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(fillColorAttr,
      vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(fillOpacityAttr,
      vgl.vertexAttributeKeysIndexed.Three);

    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);
    mat.addAttribute(blend);

    m_actor = vgl.actor();
    m_actor.setMaterial(mat);

    start = buffers.alloc(numPts);
    var currentIndex = start;

    //console.log("numPts ", numPts);
    for (i = 0; i < numPts; i += 1) {
      console.log("i is ", i);
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

    mapper.setGeometryData(geom);
    m_actor.setMapper(mapper);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
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
  };

  this._init(arg);
  return this;
};

inherit(geo.gl.polygonFeature, geo.polygonFeature);

// Now register it
geo.registerFeature('vgl', 'polygon', geo.gl.polygonFeature);
