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
ggl._vglViewerInstances = {
  viewers: [],
  maps: []
};


//////////////////////////////////////////////////////////////////////////////
/**
 * Retrives the singleton, lazily constructs as necessary.
 *
 * @return {vgl.viewer} the single viewer instance.
 */
//////////////////////////////////////////////////////////////////////////////

ggl.vglViewerInstance = function (map) {
  "use strict";

  var mapIdx,
      maps = ggl._vglViewerInstances.maps,
      viewers = ggl._vglViewerInstances.viewers;

  function makeViewer() {
    var canvas = $(document.createElement("canvas"));
    canvas.attr("class", ".webgl-canvas");
    var viewer = vgl.viewer(canvas.get(0));
    viewer.renderWindow().removeRenderer(
    viewer.renderWindow().activeRenderer());
    viewer.setInteractorStyle(ggl.mapInteractorStyle());
    viewer.init();
    return viewer;
  }

  for (mapIdx = 0; mapIdx < maps.length; mapIdx += 1) {
    if (map === maps[mapIdx]) {
      break;
    }
  }

  if (map !== maps[mapIdx]) {
    maps[mapIdx] = map;
    viewers[mapIdx] = makeViewer();
  }

  return viewers[mapIdx];
};

ggl.vglViewerInstance.deleteCache = function (viewer) {
  "use strict";

  var mapIdx,
      maps = ggl._vglViewerInstances.maps,
      viewers = ggl._vglViewerInstances.viewers;

  for (mapIdx = 0; mapIdx < viewers.length; mapIdx += 1) {
    if (viewer === viewers[mapIdx]) {
      break;
    }
  }

  if (viewer === viewers[mapIdx]) {
    maps.splice(mapIdx, 1);
    viewers.splice(mapIdx, 1);
  }
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
      m_viewer = ggl.vglViewerInstance(this.layer().map()),
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
   * Return width of the renderer
   */
  ////////////////////////////////////////////////////////////////////////////


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
   * Reset to default
   */
  ////////////////////////////////////////////////////////////////////////////
  this.reset = function () {
    m_viewer.interactorStyle().reset();
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

    /// VGL uses jquery trigger on methods
    $(m_viewer.interactorStyle()).on(geo.event.pan, function (event) {
      m_this.geoTrigger(geo.event.pan, event);
    });

    $(m_viewer.interactorStyle()).on(geo.event.zoom, function (event) {
      m_this.geoTrigger(geo.event.zoom, event);
    });

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect events to the map layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._connectMapEvents = function () {

    // Only connect up events if this renderer is associated with the
    // reference/base layer.
    if (m_this.layer().referenceLayer()) {

      /// https://developer.mozilla.org/en-US/docs/Web/Events/wheel
      var map = $(m_this.layer().map().node()),
          wheel = "onwheel" in map.get(0) ? "wheel" :
                  document.onmousewheel !== undefined ? "mousewheel" :
                  "MozMousePixelScroll",
          wheelDelta = (wheel === "wheel") ? function (evt) {
            return evt.originalEvent.deltaY *
              (evt.originalEvent.deltaMode ? 120 : 1);
          } : wheel === "mousewheel" ? function (evt) {
            return evt.originalEvent.wheelDelta;
          } : function (evt) {
            return -evt.originalEvent.detail;
          };

      m_viewer.unbindEventHandlers();

      map.on(wheel, function (event) {
        event.originalEvent.wheelDeltaY = wheelDelta(event);
        event.originalEvent.wheelDelta = event.originalEvent.wheelDeltaY;
        m_viewer.handleMouseWheel(event);
      });

      map.on("mousedown", function (event) {
        m_viewer.handleMouseDown(event);
      });

      map.on("mousemove", function (event) {
        m_viewer.handleMouseMove(event);
      });

      map.on("keypress", function (event) {
        m_viewer.handleKeyPress(event);
      });

      map.on("contextmenu", function (event) {
        m_viewer.handleContextMenu(event);
      });

      map.on("click", function (event) {
        m_viewer.handleClick(event);
      });

      map.on("dblclick", function (event) {
        m_viewer.handleDoubleClick(event);
      });
    }

    m_viewer.interactorStyle().map(m_this.layer().map());
    m_viewer.interactorStyle().reset();
  };

  this.geoOn(geo.event.layerAdd, function (event) {
    if (event.layer === m_this.layer()) {
      m_this._connectMapEvents();
    }
  });

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
    ggl.vglViewerInstance.deleteCache(m_viewer);
  };

  return this;
};

inherit(ggl.vglRenderer, ggl.renderer);

geo.registerRenderer("vglRenderer", ggl.vglRenderer);
