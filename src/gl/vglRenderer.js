//////////////////////////////////////////////////////////////////////////////
/**
 * @module ggl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global window, ggl, ogs, vec4, inherit, $, geo*/
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

ggl.vglViewerInstance = function() {
  var canvas;

  if (ggl._vglViewerInstance === null) {
    canvas = $(document.createElement('canvas'));
    canvas.attr('class', '.webgl-canvas');
    ggl._vglViewerInstance = vgl.viewer(canvas.get(0));
    ggl._vglViewerInstance.setInteractorStyle(ggl.mapInteractorStyle());
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
ggl.vglRenderer = function(arg) {
  'use strict';

  if (!(this instanceof ggl.vglRenderer)) {
    return new ggl.vglRenderer(arg);
  }
  ggl.renderer.call(this, arg);

  var m_this = this,
      m_viewer = ggl.vglViewerInstance(),
      m_contextRenderer = vgl.renderer(),
      s_init = this._init;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert input data in display space to world space
   *
   * @param input {[x:x1, y:y1], [x1,y1,x2,y2]}
   * @returns {[{x:x1, y:y1}], [[x1, y1]]}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function(input) {
    var i, delta, node = this.canvas(),
        ren = this.contextRenderer(), cam = ren.camera(),
        fdp = ren.focusDisplayPoint(), output = [], temp;

    if (input instanceof Array && input.length > 0) {
      if (input[0] instanceof Object) {
        delta = 1;
        for (i = 0; i < points.length; i =+ delta) {
          temp = ren.displayToWorld(vec4.fromValues(
                   input.x, input.y, fdp[2], 1.0),
                   cam.viewMatrix(), cam.projectionMatrix(),
                   node.width(), node.height());
          output.push({x: temp[0], y: temp[1], z: temp[2], w: temp[3]});
        }
      } else {
        delta = input.length % 3 === 0 ? 3 : 2;
        for (i = 0; i < input.length; i =+ delta) {
          output.push(ren.displayToWorld(vec4.fromValues(
            input[i],
            input[i + 1],
            fdp[2],
            1.0), cam.viewMatrix(), cam.projectionMatrix(),
            node.width(), node.height()));
        }
      }
    } else if (input instanceof Object) {
      temp = ren.displayToWorld(vec4.fromValues(
               input.x, input.y, fdp[2], 1.0),
               cam.viewMatrix(), cam.projectionMatrix(),
               node.width(), node.height());
      output.push({x: temp[0], y: temp[1], z: temp[2], w: temp[3]});
    } else {
      throw "Display to world conversion requires array of 2D/3D points";
    }
    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert input data in world space to display space
   *
   * @param input {[{x:x1, y:y1}, ...], [x1, y1, x2, y2, x3, y3...] }
   * @returns {[{x:x1, y:y1}. ...], [[x1, y1], [x2, y2]]}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function(input) {
    var input, xyzFormat, i, output, toDisplay, delta, node = this.canvas(),
        ren = this.contextRenderer(), cam = ren.camera(),
        fp = cam.focalPoint(), output = [];

    /// Helper private function
    toDisplay = function(x, y, z, isObject) {
      var result;
      isObject = isObject === undefined ? false : true;
      if (!isObject) {
        output.push(ren.worldToDisplay(vec4.fromValues(
          x, y, z, 1.0), cam.viewMatrix(), cam.projectionMatrix(),
          node.width(), node.height()));
        return;
      }
      result = ren.worldToDisplay(vec4.fromValues(
        x, y, z, 1.0), cam.viewMatrix(), cam.projectionMatrix(),
        node.width(), node.height());
      output.push({x: result[0], y: result[1], z: result[2]});
    };

    if (input instanceof Array && input.length > 0) {
      xyzFormat = input.length % 3 === 0 ? true : false;

      if (input[0] instanceof Object) {
        delta = 1;
        for (i = 0; i < input.length; i =+ delta) {
          toDisplay(input[i].x, input[i].y, fp[2], true);
        }
      } else if (xyzFormat) {
        delta = 3;
        for (i = 0; i < input.length; i =+ delta) {
          toDisplay(input[i], input[i + 1], input[i + 2]);
        }
      } else {
        delta = 2;
        for (i = 0; i < input.length; i =+ delta) {
          toDisplay(input[i], input[i + 1], fp[2]);
        }
      }
      return output;
    } else if (input instanceof Object) {
      toDisplay(input.x, input.y, fp[2], true);
      return output;
    }
    throw "World to display conversion requires array of 2D/3D points";
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get context specific renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.contextRenderer = function() {
    return m_contextRenderer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get API used by the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.api = function() {
    return 'vgl';
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function() {
    if (this.initialized()) {
      return this;
    }

    s_init.call(this);

    this.canvas($(m_viewer.canvas()));
    m_viewer.renderWindow().addRenderer(m_contextRenderer);

    this.layer().node().append(this.canvas());

    /// VGL uses jquery trigger on methods
    $(m_viewer.interactorStyle()).on(geo.event.pan, function(event) {
      m_this.trigger(geo.event.pan, event);
    });

    $(m_viewer.interactorStyle()).on(geo.event.zoom, function(event) {
      m_this.trigger(geo.event.zoom, event);
    });

    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Connect events to the map layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._connectMapEvents = function() {

    // Only connect up events if this renderer is associated with the
    // reference/base layer.
    if (m_this.layer().referenceLayer()) {

      var map = $(m_this.layer().map().node());
      map.on('mousewheel', function (event) {
        m_viewer.handleMouseWheel(event);
      });
      map.on('mousemove', function(event) {
        m_viewer.handleMouseMove(event);
      });

      map.on('mouseup', function(event) {
        m_viewer.handleMouseUp(event);
      });

      map.on('mousedown', function(event) {
        m_viewer.handleMouseDown(event);
      });

      map.on('mouseout', function(event) {
        // check if the mouse actually left the map area
        var selection = $(map),
            offset = selection.offset(),
            width = selection.width(),
            height = selection.height(),
            x = event.pageX - offset.left,
            y = event.pageY - offset.top;
        if ( x < 0 || x >= width ||
             y < 0 || y >= height ) {
          m_viewer.handleMouseOut(event);
        }
      });

      map.on('keypress', function(event) {
        m_viewer.handleKeyPress(event);
      });

      map.on('contextmenu', function(event) {
        m_viewer.handleContextMenu(event);
      });
    }

    m_viewer.interactorStyle().map(this.layer().map());
  };

  this.on(geo.event.layerAdd, function (event) {
    if (event.layer === m_this.layer()) {
      m_this._connectMapEvents();
    }
  });

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle resize event
   */
  ////////////////////////////////////////////////////////////////////////////
  this._resize = function(x, y, w, h) {
    this.canvas().attr('width', w);
    this.canvas().attr('height', h);
    m_viewer.renderWindow().positionAndResize(x, y, w, h);
    this._render();
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this._render = function() {
    m_viewer.render();
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function() {
  };

  return this;
};

inherit(ggl.vglRenderer, ggl.renderer);

geo.registerRenderer('vglRenderer', ggl.vglRenderer);
