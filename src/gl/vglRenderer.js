//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vglRenderer
 *
 * @class
 * @extends geo.gl.renderer
 * @param canvas
 * @returns {geo.gl.vglRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.vglRenderer = function (arg) {
  'use strict';

  if (!(this instanceof geo.gl.vglRenderer)) {
    return new geo.gl.vglRenderer(arg);
  }
  arg = arg || {};
  geo.gl.renderer.call(this, arg);

  var m_this = this,
      s_exit = this._exit,
      m_contextRenderer = null,
      m_viewer = null,
      m_width = 0,
      m_height = 0,
      m_initialized = false,
      s_init = this._init;

  /// TODO: Move this API to the base class
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return width of the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.width = function () {
    return m_width;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return height of the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.height = function () {
    return m_height;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert input data in display space to world space
   *
   * @param {object} input {x:val, y:val}, [{x:val, y:val}],
   * [{x:val, y:val}], [x1,y1], [[x,y]]
   *
   * @returns {object} {x:val, y:val, z:val, w:val}, [{x:val, y:val, z:val, w:val}],
              [[x, y, z, w]], [x1,y1,z1,w]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function (input) {
    var i,
        delta,
        ren = m_this.contextRenderer(),
        cam = ren.camera(),
        fdp = ren.focusDisplayPoint(),
        output,
        temp,
        point;

    /// Handle if the input is an array [...]
    if (input instanceof Array && input.length > 0) {
      output = [];
      /// Input is array of object {x:val, y:val}
      if (input[0] instanceof Object) {
        delta = 1;
        for (i = 0; i < input.length; i += delta) {
          point = input[i];
          temp = ren.displayToWorld(vec4.fromValues(
                   point.x, point.y, fdp[2], 1.0),
                   cam.viewMatrix(), cam.projectionMatrix(),
                   m_width, m_height);
          output.push({x: temp[0], y: temp[1], z: temp[2], w: temp[3]});
        }
    /// Input is array of 2d array [[x,y], [x,y]]
      } else if (input[0] instanceof Array) {
        delta = 1;
        for (i = 0; i < input.length; i += delta) {
          point = input[i];
          temp = ren.displayToWorld(vec4.fromValues(
                   point[0], point[1], fdp[2], 1.0),
                   cam.viewMatrix(), cam.projectionMatrix(),
                   m_width, m_height);
          output.push(temp);
        }
    /// Input is flat array [x1,y1,x2,y2]
      } else {
        delta = input.length % 3 === 0 ? 3 : 2;
        for (i = 0; i < input.length; i += delta) {
          temp = ren.displayToWorld(vec4.fromValues(
            input[i],
            input[i + 1],
            fdp[2],
            1.0), cam.viewMatrix(), cam.projectionMatrix(),
            m_width, m_height);
          output.push(temp[0]);
          output.push(temp[1]);
          output.push(temp[2]);
          output.push(temp[3]);
        }
      }
    /// Input is object {x:val, y:val}
    } else if (input instanceof Object) {
      output = {};
      temp = ren.displayToWorld(vec4.fromValues(
               input.x, input.y, fdp[2], 1.0),
               cam.viewMatrix(), cam.projectionMatrix(),
               m_width, m_height);
      output = {x: temp[0], y: temp[1], z: temp[2], w: temp[3]};
    } else {
      throw 'Display to world conversion requires array of 2D/3D points';
    }
    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert input data in world space to display space
   *
   * @param {object} input {x:val, y:val} or {x:val, y:val, z:val} or [{x:val, y:val}]
   * [{x:val, y:val, z:val}] or [[x,y]] or  [[x,y,z]] or [x1,y1,z1, x2, y2, z2]
   *
   * @returns {object} {x:val, y:val} or [{x:val, y:val}] or [[x,y]] or
   * [x1,y1, x2, y2]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function (input) {
    var i, temp, delta,
        ren = m_this.contextRenderer(), cam = ren.camera(),
        fp = cam.focalPoint(), output = [];

    /// Input is an array
    if (input instanceof Array && input.length > 0) {
      output = [];

      /// Input is an array of objects
      if (input[0] instanceof Object) {
        delta = 1;
        for (i = 0; i < input.length; i += delta) {
          temp = ren.worldToDisplay(vec4.fromValues(
                   input[i].x, input[i].y, fp[2], 1.0), cam.viewMatrix(),
                   cam.projectionMatrix(),
                   m_width, m_height);
          output[i] = { x: temp[0], y: temp[1], z: temp[2] };
        }
      } else if (input[0] instanceof Array) {
        /// Input is an array of array
        delta = 1;
        for (i = 0; i < input.length; i += delta) {
          temp = ren.worldToDisplay(
                   vec4.fromValues(input[i][0], input[i][1], fp[2], 1.0),
                   cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
          output[i].push(temp);
        }
      } else {
        /// Input is a flat array of 2 or 3 dimension
        delta = input.length % 3 === 0 ? 3 : 2;
        if (delta === 2) {
          for (i = 0; i < input.length; i += delta) {
            temp = ren.worldToDisplay(vec4.fromValues(
                     input[i], input[i + 1], fp[2], 1.0), cam.viewMatrix(),
                     cam.projectionMatrix(),
                     m_width, m_height);
            output.push(temp[0]);
            output.push(temp[1]);
            output.push(temp[2]);
          }
        } else {
          for (i = 0; i < input.length; i += delta) {
            temp = ren.worldToDisplay(vec4.fromValues(
                         input[i], input[i + 1], input[i + 2], 1.0), cam.viewMatrix(),
                         cam.projectionMatrix(),
                         m_width, m_height);
            output.push(temp[0]);
            output.push(temp[1]);
            output.push(temp[2]);
          }
        }
      }
    } else if (input instanceof Object) {
      temp = ren.worldToDisplay(vec4.fromValues(
               input.x, input.y, fp[2], 1.0), cam.viewMatrix(),
               cam.projectionMatrix(),
               m_width, m_height);

      output = {x: temp[0], y: temp[1], z: temp[2]};
    } else {
      throw 'World to display conversion requires array of 2D/3D points';
    }

    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get context specific renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.contextRenderer = function () {
    return m_contextRenderer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.api = function () {
    return 'vgl';
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    if (m_this.initialized()) {
      return m_this;
    }

    s_init.call(m_this);

    var canvas = $(document.createElement('canvas'));
    canvas.attr('class', 'webgl-canvas');
    m_this.canvas(canvas);
    $(m_this.layer().node().get(0)).append(canvas);
    m_viewer = vgl.viewer(canvas.get(0), arg.options);
    m_viewer.init();
    m_contextRenderer = m_viewer.renderWindow().activeRenderer();
    m_contextRenderer.setResetScene(false);

    if (m_viewer.renderWindow().renderers().length > 0) {
      m_contextRenderer.setLayer(m_viewer.renderWindow().renderers().length);
    }

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function (x, y, w, h) {
    var vglRenderer = m_this.contextRenderer(),
        map = m_this.layer().map(),
        camera = vglRenderer.camera(),
        baseContextRenderer,
        baseCamera,
        renderWindow = m_viewer.renderWindow(),
        layer = m_this.layer(),
        baseLayer = layer.map().baseLayer(),
        focalPoint,
        position,
        zoom,
        newZ,
        mapCenter;

    m_width = w;
    m_height = h;
    m_this.canvas().attr('width', w);
    m_this.canvas().attr('height', h);
    renderWindow.positionAndResize(x, y, w, h);
    m_this._render();

    // Ignore if the base layer is not set yet
    if (!baseLayer || m_initialized) {
      return;
    }
    m_initialized = true;

    // skip handling if the renderer is unconnected
    if (!vglRenderer || !vglRenderer.camera()) {
      console.log('Zoom event triggered on unconnected vgl renderer.');
    }

    position = camera.position();
    zoom = map.zoom();
    newZ = camera.zoomToHeight(zoom, w, h);

    // Assuming that baselayer will be a GL layer
    if (layer !== baseLayer) {
      baseContextRenderer = baseLayer.renderer().contextRenderer();
      baseCamera = baseContextRenderer.camera();
      position = baseCamera.position();
      focalPoint = baseCamera.focalPoint();
      camera.setPosition(position[0], position[1], position[2]);
      camera.setFocalPoint(focalPoint[0], focalPoint[1], focalPoint[2]);
    } else {
      mapCenter = layer.toLocal(layer.map().center());
      focalPoint = camera.focalPoint();
      camera.setPosition(mapCenter.x, mapCenter.y, newZ);
      camera.setFocalPoint(mapCenter.x, mapCenter.y, focalPoint[2]);
    }
    camera.setParallelExtents({zoom: zoom});

    m_this._updateRendererCamera();

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function () {
    m_viewer.render();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   * @todo remove all vgl objects
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    geo.gl.vglViewerInstance.deleteCache(m_viewer);
    s_exit();
  };

  this._updateRendererCamera = function () {
    var vglRenderer = m_this.contextRenderer(),
        renderWindow = m_viewer.renderWindow(),
        camera = vglRenderer.camera(),
        pos, fp, cr, pe;

    vglRenderer.resetCameraClippingRange();
    pos = camera.position();
    fp = camera.focalPoint();
    cr = camera.clippingRange();
    pe = camera.parallelExtents();
    renderWindow.renderers().forEach(function (renderer) {
      var cam = renderer.camera();

      if (cam !== camera) {
        cam.setPosition(pos[0], pos[1], pos[2]);
        cam.setFocalPoint(fp[0], fp[1], fp[2]);
        cam.setClippingRange(cr[0], cr[1]);
        cam.setParallelExtents(pe);
        renderer.render();
      }
    });
  };

  // Connect to interactor events
  // Connect to pan event
  m_this.layer().geoOn(geo.event.pan, function (evt) {
    var vglRenderer = m_this.contextRenderer(),
        camera,
        focusPoint,
        centerDisplay,
        centerGeo,
        newCenterDisplay,
        newCenterGeo,
        renderWindow,
        layer = m_this.layer();

    if (evt.geo && evt.geo._triggeredBy !== layer) {
      // skip handling if the renderer is unconnected
      if (!vglRenderer || !vglRenderer.camera()) {
        console.log('Pan event triggered on unconnected VGL renderer.');
      }

      renderWindow = m_viewer.renderWindow();
      camera = vglRenderer.camera();
      focusPoint = renderWindow.focusDisplayPoint();

      // Calculate the center in display coordinates
      centerDisplay = [m_width / 2, m_height / 2, 0];

      // Calculate the center in world coordinates
      centerGeo = renderWindow.displayToWorld(
        centerDisplay[0],
        centerDisplay[1],
        focusPoint,
        vglRenderer
      );

      newCenterDisplay = [
        centerDisplay[0] + evt.screenDelta.x,
        centerDisplay[1] + evt.screenDelta.y
      ];

      newCenterGeo = renderWindow.displayToWorld(
        newCenterDisplay[0],
        newCenterDisplay[1],
        focusPoint,
        vglRenderer
      );

      camera.pan(
        centerGeo[0] - newCenterGeo[0],
        centerGeo[1] - newCenterGeo[1],
        centerGeo[2] - newCenterGeo[2]
      );

      evt.center = {
        x: newCenterGeo[0],
        y: newCenterGeo[1],
        z: newCenterGeo[2]
      };

      m_this._updateRendererCamera();
    }
  });

  // Connect to zoom event
  m_this.layer().geoOn(geo.event.zoom, function (evt) {
    var vglRenderer = m_this.contextRenderer(),
      camera,
      renderWindow,
      layer = m_this.layer(),
      center,
      dir,
      focusPoint,
      position,
      newZ;

    if (evt.geo && evt.geo._triggeredBy !== layer) {
      // skip handling if the renderer is unconnected
      if (!vglRenderer || !vglRenderer.camera()) {
        console.log('Zoom event triggered on unconnected vgl renderer.');
      }

      renderWindow = m_viewer.renderWindow();
      camera = vglRenderer.camera();
      focusPoint = camera.focalPoint();
      position = camera.position();
      var windowSize = renderWindow.windowSize();
      newZ = camera.zoomToHeight(evt.zoomLevel, windowSize[0], windowSize[1]);

      evt.pan = null;
      if (evt.screenPosition) {
        center = renderWindow.displayToWorld(
          evt.screenPosition.x,
          evt.screenPosition.y,
          focusPoint,
          vglRenderer
        );
        dir = [center[0] - position[0], center[1] - position[1], center[2] - position[2]];
        evt.center = layer.fromLocal({
          x: position[0] + dir[0] * (1 - newZ / position[2]),
          y: position[1] + dir[1] * (1 - newZ / position[2])
        });
      }

      camera.setPosition(position[0], position[1], newZ);
      camera.setParallelExtents({zoom: evt.zoomLevel});

      m_this._updateRendererCamera();
    }
  });

  // Connect to parallelprojection event
  m_this.layer().geoOn(geo.event.parallelprojection, function (evt) {
    var vglRenderer = m_this.contextRenderer(),
        camera,
        layer = m_this.layer();

    if (evt.geo && evt.geo._triggeredBy !== layer) {
      if (!vglRenderer || !vglRenderer.camera()) {
        console.log('Parallel projection event triggered on unconnected VGL ' +
                    'renderer.');
      }
      camera = vglRenderer.camera();
      camera.setEnableParallelProjection(evt.parallelProjection);
      m_this._updateRendererCamera();
    }
  });

  return this;
};

inherit(geo.gl.vglRenderer, geo.gl.renderer);

geo.registerRenderer('vgl', geo.gl.vglRenderer);
