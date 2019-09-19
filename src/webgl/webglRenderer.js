var inherit = require('../inherit');
var registerRenderer = require('../registry').registerRenderer;
var renderer = require('../renderer');

/**
 * Create a new instance of class webglRenderer.
 *
 * @class
 * @alias geo.webgl.webglRenderer
 * @extends geo.renderer
 * @param {object} arg Options for the renderer.
 * @param {geo.layer} [arg.layer] Layer associated with the renderer.
 * @param {HTMLElement} [arg.canvas] Canvas element associated with the
 *   renderer.
 * @param {object} [arg.options] Additional options for the webgl renderer.
 * @returns {geo.webgl.webglRenderer}
 */
var webglRenderer = function (arg) {
  'use strict';

  if (!(this instanceof webglRenderer)) {
    return new webglRenderer(arg);
  }
  arg = arg || {};
  renderer.call(this, arg);

  var $ = require('jquery');
  var vgl = require('vgl');
  var mat4 = require('gl-mat4');
  var util = require('../util');
  var geo_event = require('../event');

  var m_this = this,
      m_contextRenderer = null,
      m_viewer = null,
      m_lastZoom,
      m_updateCamera = false,
      s_init = this._init,
      s_exit = this._exit;

  /**
   * Get context specific renderer.
   *
   * @returns {object} The vgl context renderer.
   */
  this.contextRenderer = function () {
    return m_contextRenderer;
  };

  /**
   * Get API used by the renderer.
   *
   * @returns {string} `webgl`.
   */
  this.api = function () {
    return webglRenderer.apiname;
  };

  /**
   * Initialize.
   *
   * @returns {this}
   */
  this._init = function () {
    if (m_this.initialized()) {
      return m_this;
    }

    s_init.call(m_this);

    var canvas = arg.canvas || $(document.createElement('canvas'));
    canvas.addClass('webgl-canvas');
    $(m_this.layer().node().get(0)).append(canvas);

    if (window.overrideContextAttributes) {
      var elem = canvas.get(0);
      var getContext = elem.getContext;
      elem.getContext = function (contextType, contextAttributes) {
        contextAttributes = contextAttributes || {};
        if (window.overrideContextAttributes) {
          for (var key in window.overrideContextAttributes) {
            if (window.overrideContextAttributes.hasOwnProperty(key)) {
              contextAttributes[key] = window.overrideContextAttributes[key];
            }
          }
        }
        return getContext.call(elem, contextType, contextAttributes);
      };
    }

    m_viewer = vgl.viewer(canvas.get(0), arg.options);
    m_viewer.init();
    m_contextRenderer = m_viewer.renderWindow().activeRenderer();
    m_contextRenderer.setResetScene(false);

    if (m_viewer.renderWindow().renderers().length > 0) {
      m_contextRenderer.setLayer(m_viewer.renderWindow().renderers().length);
    }
    m_this.canvas(canvas);
    /* Initialize the size of the renderer */
    var map = m_this.layer().map(),
        mapSize = map.size();
    m_this._resize(0, 0, mapSize.width, mapSize.height);

    return m_this;
  };

  /**
   * Handle resize event.
   *
   * @param {number} x The left coordinate.
   * @param {number} y The top coordinate.
   * @param {number} w The width in pixels.
   * @param {number} h The height in pixels.
   * @returns {this}
   */
  this._resize = function (x, y, w, h) {
    var renderWindow = m_viewer.renderWindow();

    if (x !== renderWindow.windowPosition[0] ||
        y !== renderWindow.windowPosition[1] ||
        w !== m_this.width() || h !== m_this.height()) {
      m_this._setWidthHeight(w, h);
      m_this.canvas().attr('width', w);
      m_this.canvas().attr('height', h);
      renderWindow.positionAndResize(x, y, w, h);

      m_updateCamera = true;
      m_this._render();
    }
    return m_this;
  };

  /**
   * Render.  This actually schedules rendering for the next animation frame.
   *
   * @returns {this}
   */
  this._render = function () {
    /* If we are already scheduled to render, don't schedule again.  Rather,
     * mark that we should render after other animation frame requests occur.
     * It would be nice if we could just reschedule the call by removing and
     * readding the animation frame request, but this doesn't work for if the
     * reschedule occurs during another animation frame callback (it then waits
     * until a subsequent frame). */
    m_this.layer().map().scheduleAnimationFrame(m_this._renderFrame, true);
    return m_this;
  };

  /**
   * This clears the render timer and actually renders.
   */
  this._renderFrame = function () {
    if (m_viewer) {
      if (m_updateCamera) {
        m_updateCamera = false;
        m_this._updateRendererCamera();
      }
      m_viewer.render();
    }
  };

  /**
   * Get the GL context for this renderer.
   *
   * @returns {WebGLRenderingContext} The current context.  If unavailable,
   *    falls back to the vgl generic context.
   */
  this._glContext = function () {
    if (m_viewer && m_viewer.renderWindow()) {
      return m_viewer.renderWindow().context();
    }
    return vgl.GL;
  };

  /**
   * Exit.
   */
  this._exit = function () {
    m_this.layer().map().scheduleAnimationFrame(m_this._renderFrame, 'remove');
    m_this.canvas().remove();
    if (m_viewer) {
      var renderState = new vgl.renderState();
      renderState.m_renderer = m_viewer;
      renderState.m_context = m_this._glContext();
      m_viewer.exit(renderState);
      if (m_this._glContext() !== vgl.GL && m_this._glContext().getExtension('WEBGL_lose_context') && m_this._glContext().getExtension('WEBGL_lose_context').loseContext) {
        m_this._glContext().getExtension('WEBGL_lose_context').loseContext();
      }
    }
    // make sure we clear shaders associated with the generate context, too
    vgl.clearCachedShaders(vgl.GL);
    m_viewer = null;
    s_exit();
  };

  /**
   * Update the vgl renderer's camera based on the map's camera class.
   */
  this._updateRendererCamera = function () {
    var renderWindow = m_viewer.renderWindow(),
        map = m_this.layer().map(),
        camera = map.camera(),
        rotation = map.rotation() || 0,
        view = camera.view,
        proj = camera.projectionMatrix;
    if (proj[15]) {
      /* In the parallel projection, we want the clipbounds [near, far] to map
       * to [0, 1].  The ortho matrix scales to [-1, 1]. */
      proj = mat4.copy(util.mat4AsArray(), proj);
      proj = mat4.scale(proj, proj, [1, 1, -0.5]);
      proj = mat4.translate(proj, proj, [0, 0, camera.clipbounds.far]);
    } else {
      /* This rescales the perspective projection to work with most gl
       * features.  It doesn't work with all clipbounds, and will probably need
       * to be refactored when we have tiltable maps. */
      var near = camera.clipbounds.near,
          far = camera.clipbounds.far;
      proj = mat4.copy(util.mat4AsArray(), proj);
      proj = mat4.scale(proj, proj, [1 / near, 1 / near, -1 / far]);
    }
    /* Check if the rotation is a multiple of 90 */
    var basis = Math.PI / 2,
        angle = rotation % basis,  // move to range (-pi/2, pi/2)
        ortho = (Math.min(Math.abs(angle), Math.abs(angle - basis)) < 0.00001);
    renderWindow.renderers().forEach(function (renderer) {
      var cam = renderer.camera();
      if (util.compareArrays(view, cam.viewMatrix()) &&
          util.compareArrays(proj, cam.projectionMatrix()) &&
          m_lastZoom === map.zoom()) {
        return;
      }
      m_lastZoom = map.zoom();
      cam.setViewMatrix(view, true);
      cam.setProjectionMatrix(proj);
      var viewport = camera.viewport;
      /* Test if we should align texels.  We won't if the projection matrix
       * is not simple, if there is a rotation that isn't a multiple of 90
       * degrees, if the viewport is not at an integer location, or if the zoom
       * level is not close to an integer.
       *   Note that the test for the viewport is strict (val % 1 is non-zero
       * if the value is not an integer), as, in general, the alignment is only
       * non-integral if a percent offset or calculation was used in css
       * somewhere.  The test for zoom level always has some allowance for
       * precision, as it is often the result of repeated computations. */
      if (proj[1] || proj[2] || proj[3] || proj[4] || proj[6] || proj[7] ||
          proj[8] || proj[9] || proj[11] || proj[15] !== 1 || !ortho ||
          (viewport.left && viewport.left % 1) ||
          (viewport.top && viewport.top % 1) ||
          (parseFloat(m_lastZoom.toFixed(6)) !==
           parseFloat(m_lastZoom.toFixed(0)))) {
        /* Don't align texels */
        cam.viewAlignment = function () {
          return null;
        };
      } else {
        /* Set information for texel alignment.  The rounding factors should
         * probably be divided by window.devicePixelRatio. */
        cam.viewAlignment = function () {
          var align = {
            roundx: 2.0 / viewport.width,
            roundy: 2.0 / viewport.height
          };
          align.dx = (viewport.width % 2) ? align.roundx * 0.5 : 0;
          align.dy = (viewport.height % 2) ? align.roundy * 0.5 : 0;
          return align;
        };
      }
    });
  };

  // Connect to pan event.  This is sufficient, as all zooms and rotations also
  // produce a pan
  m_this.layer().geoOn(geo_event.pan, function (evt) {
    void (evt);
    m_updateCamera = true;
  });

  // Connect to parallelprojection event
  m_this.layer().geoOn(geo_event.parallelprojection, function (evt) {
    var vglRenderer = m_this.contextRenderer(),
        camera,
        layer = m_this.layer();

    if (evt.geo && evt.geo._triggeredBy !== layer) {
      if (!vglRenderer || !vglRenderer.camera()) {
        console.log('Parallel projection event triggered on unconnected VGL ' +
                    'renderer.');
        return;
      }
      camera = vglRenderer.camera();
      camera.setEnableParallelProjection(evt.parallelProjection);
      m_updateCamera = true;
    }
  });

  return this;
};
webglRenderer.apiname = 'webgl';

inherit(webglRenderer, renderer);

registerRenderer('webgl', webglRenderer);
// Also register under an alternate name (alias for backwards compatibility)
registerRenderer('vgl', webglRenderer);

/* Code for checking if the renderer is supported */

var checkedWebGL;

/**
 * Report if the webgl renderer is supported.  This is just a check if webGL is
 * supported and available.
 *
 * @returns {boolean} true if available.
 */
webglRenderer.supported = function () {
  if (checkedWebGL === undefined) {
    /* This is extracted from what Modernizr uses. */
    var canvas, ctx, exts; // eslint-disable-line no-unused-vars
    try {
      canvas = document.createElement('canvas');
      ctx = (canvas.getContext('webgl') ||
             canvas.getContext('experimental-webgl'));
      /* getSupportExtensions will throw an exception if the context isn't
       * really supported. */
      exts = ctx.getSupportedExtensions();
      /* If available, store the unmasked renderer to aid in debugging. */
      if (exts.indexOf('WEBGL_debug_renderer_info') >= 0) {
        webglRenderer._unmaskedRenderer = ctx.getParameter(ctx.getExtension(
          'WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL);
      }
      // store some parameters for convenience
      webglRenderer._maxTextureSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
      webglRenderer._maxPointSize = ctx.getParameter(ctx.ALIASED_POINT_SIZE_RANGE)[1];
      checkedWebGL = true;
    } catch (e) {
      console.warn('No webGL support');
      checkedWebGL = false;
    }
    canvas = undefined;
    ctx = undefined;
    exts = undefined;
  }
  return checkedWebGL;
};

/**
 * If the webgl renderer is not supported, supply the name of a renderer that
 * should be used instead.  This asks for the null renderer.
 *
 * @returns {null} null for the null renderer.
 */
webglRenderer.fallback = function () {
  return null;
};

module.exports = webglRenderer;
