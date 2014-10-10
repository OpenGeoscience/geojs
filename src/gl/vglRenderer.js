//////////////////////////////////////////////////////////////////////////////
/**
 * @module ggl
 */
//////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////
/**
 * Single VGL viewer
 *
 * This singleton instance is used to share a single GL context across multiple
 * vlgRenderer and therefore layers.
 */
//////////////////////////////////////////////////////////////////////////////
ggl._vglViewerInstance = null;


//////////////////////////////////////////////////////////////////////////////
/**
 * Retrives the singleton, lazily constructs as necessary.
 *
 * @return {vgl.viewer} the single viewer instance.
 */
//////////////////////////////////////////////////////////////////////////////

ggl.vglViewerInstance = function () {
  "use strict";
  var canvas;

  if (ggl._vglViewerInstance === null) {
    canvas = $(document.createElement("canvas"));
    canvas.attr("class", ".webgl-canvas");
    ggl._vglViewerInstance = vgl.viewer(canvas.get(0));
    ggl._vglViewerInstance.renderWindow().removeRenderer(
      ggl._vglViewerInstance.renderWindow().activeRenderer());
    ggl._vglViewerInstance.init();
  }

  return ggl._vglViewerInstance;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vglRenderer
 *
 * @param canvas
 * @returns {ggl.vglRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.vglRenderer = function (arg) {
  "use strict";

  if (!(this instanceof ggl.vglRenderer)) {
    return new ggl.vglRenderer(arg);
  }
  ggl.renderer.call(this, arg);

  var m_this = this,
      m_viewer = ggl.vglViewerInstance(),
      m_contextRenderer = vgl.renderer(),
      m_width = 0,
      m_height = 0,
      s_init = this._init;

  m_contextRenderer.setResetScene(false);

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
   * @param input {x:val, y:val}, [{x:val, y:val}],
   * [{x:val, y:val}], [x1,y1], [[x,y]]
   *
   * @returns {x:val, y:val, z:val, w:val}, [{x:val, y:val, z:val, w:val}],
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
      throw "Display to world conversion requires array of 2D/3D points";
    }
    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert input data in world space to display space
   *
   * @param input {x:val, y:val} or {x:val, y:val, z:val} or [{x:val, y:val}]
   * [{x:val, y:val, z:val}] or [[x,y]] or  [[x,y,z]] or [x1,y1,z1, x2, y2, z2]
   *
   * @returns {x:val, y:val} or [{x:val, y:val}] or [[x,y]] or
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
        if (delta === 2)  {
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
      throw "World to display conversion requires array of 2D/3D points";
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
    return "vgl";
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

    m_this.canvas($(m_viewer.canvas()));
    if (m_viewer.renderWindow().renderers().length > 0) {
      m_contextRenderer.setLayer(m_viewer.renderWindow().renderers().length);
      m_contextRenderer.setResetScene(false);
    }
    m_viewer.renderWindow().addRenderer(m_contextRenderer);

    m_this.layer().node().append(m_this.canvas());

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function (x, y, w, h) {
    m_width = w;
    m_height = h;
    m_this.canvas().attr("width", w);
    m_this.canvas().attr("height", h);
    m_viewer.renderWindow().positionAndResize(x, y, w, h);
    m_this._render();
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
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
  };

  function updateRenderer() {
    var vglRenderer = m_this.contextRenderer(),
        renderWindow = m_viewer.renderWindow(),
        camera = vglRenderer.camera(),
        pos, fp, cr;

    vglRenderer.resetCameraClippingRange();
    pos = camera.position();
    fp = camera.focalPoint();
    cr = camera.clippingRange();
    renderWindow.renderers().forEach(function (renderer) {
      var cam = renderer.camera();

      if (cam !== camera) {
        cam.setPosition(pos[0], pos[1], pos[2]);
        cam.setFocalPoint(fp[0], fp[1], fp[2]);
        cam.setClippingRange(cr[0], cr[1]);
        renderer.render();
      }
    });
  }

  // connect to interactor events
  this.geoOn(geo.event.pan, function (evt) {
    var vglRenderer = m_this.contextRenderer(),
        camera,
        focusPoint,
        centerDisplay,
        centerGeo,
        newCenterDisplay,
        newCenterGeo,
        renderWindow,
        layer = m_this.layer();

    // only the base layer needs to respond
    if (layer.map().baseLayer() !== layer) {
      return;
    }

    // skip handling if the renderer is unconnected
    if (!vglRenderer || !vglRenderer.camera()) {
      console.log("Pan event triggered on unconnected vgl renderer.");
    }

    renderWindow = m_viewer.renderWindow();
    camera = vglRenderer.camera();
    focusPoint = renderWindow.focusDisplayPoint();

    // Calculate the center in display coordinates
    centerDisplay = [ m_width / 2, m_height / 2, 0 ];

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

    updateRenderer();
  });

  this.geoOn(geo.event.zoom, function (evt) {
    var vglRenderer = m_this.contextRenderer(),
        camera,
        renderWindow,
        layer = m_this.layer(),
        delta,
        center,
        dir,
        focusPoint,
        position;

    // only the base layer needs to respond
    if (layer.map().baseLayer() !== layer) {
      return;
    }

    // skip handling if the renderer is unconnected
    if (!vglRenderer || !vglRenderer.camera()) {
      console.log("Zoom event triggered on unconnected vgl renderer.");
    }

    renderWindow = m_viewer.renderWindow();
    camera = vglRenderer.camera();
    focusPoint = camera.focalPoint();
    position = camera.position();

    if (evt.screenPosition && false) {
      center = renderWindow.displayToWorld(
        evt.screenPosition.x,
        evt.screenPosition.y,
        focusPoint,
        vglRenderer
      );
      dir = [center[0] - position[0], center[1] - position[1], center[2] - position[2]];
      vec3.normalize(dir, dir);
    } else {
      dir = undefined;
      delta = -delta;
    }

    camera.setPosition(position[0], position[1], 360 * Math.pow(2, -evt.zoomLevel));
    if (dir) {
      camera.setFocalPoint(center[0], center[1], focusPoint[2]);
    }

    updateRenderer();
  });

  return this;
};

inherit(ggl.vglRenderer, ggl.renderer);

geo.registerRenderer("vglRenderer", ggl.vglRenderer);
