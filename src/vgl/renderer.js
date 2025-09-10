var vgl = require('./vgl');
var inherit = require('../inherit');
var mat4 = require('gl-mat4');

/**
 * Create a new instance of class renderState.
 *
 * @class
 * @alias vgl.renderState
 */
vgl.renderState = function () {
  'use strict';

  this.m_context = null;
  this.m_modelViewMatrix = mat4.create();
  this.m_normalMatrix = mat4.create();
  this.m_projectionMatrix = null;
  this.m_material = null;
  this.m_mapper = null;
};

/**
 * Create a new instance of class renderer.
 *
 * @class
 * @alias vgl.renderer
 * @extends vgl.graphicsObject
 * @param {object} arg
 * @returns {vgl.renderer}
 */
vgl.renderer = function (arg) {
  'use strict';

  if (!(this instanceof vgl.renderer)) {
    return new vgl.renderer(arg);
  }
  vgl.graphicsObject.call(this);
  arg = arg || {};

  /** @private */
  var m_this = this;
  m_this.m_renderWindow = null;
  m_this.m_contextChanged = false;
  m_this.m_sceneRoot = new vgl.groupNode();
  m_this.m_camera = new vgl.camera(arg);
  m_this.m_nearClippingPlaneTolerance = null;
  m_this.m_x = 0;
  m_this.m_y = 0;
  m_this.m_width = 0;
  m_this.m_height = 0;
  m_this.m_resizable = true;
  m_this.m_resetScene = true;
  m_this.m_layer = 0;
  m_this.m_renderPasses = null;
  m_this.m_resetClippingRange = true;
  m_this.m_depthBits = null;

  m_this.m_camera.addChild(m_this.m_sceneRoot);

  /**
   * Get width of the renderer.
   *
   * @returns {number}
   */
  this.width = function () {
    return m_this.m_width;
  };

  /**
   * Get height of the renderer.
   *
   * @returns {number}
   */
  this.height = function () {
    return m_this.m_height;
  };

  /**
   * Get layer this renderer is associated with.
   *
   * @returns {number}
   */
  this.layer = function () {
    return m_this.m_layer;
  };

  /**
   * Set the layer this renderer is associated with.
   *
   * @param {number} layerNo
   */
  this.setLayer = function (layerNo) {
    m_this.m_layer = layerNo;
    m_this.modified();
  };

  /**
   * Return render window (owner) of the renderer.
   *
   * @returns {vgl.renderWindow}
   */
  this.renderWindow = function () {
    return m_this.m_renderWindow;
  };

  /**
   * Set render window for the renderer.
   *
   * @param {vgl.renderWindow} renWin
   */
  this.setRenderWindow = function (renWin) {
    if (m_this.m_renderWindow !== renWin) {
      if (m_this.m_renderWindow) {
        m_this.m_renderWindow.removeRenderer(this);
      }
      m_this.m_renderWindow = renWin;
      m_this.m_contextChanged = true;
      m_this.modified();
    }
  };

  /**
   * Get main camera of the renderer.
   *
   * @returns {vgl.camera}
   */
  this.camera = function () {
    return m_this.m_camera;
  };

  /**
   * Render the scene.
   */
  this.render = function () {
    var i, renSt, children, actor = null, sortedActors = [],
        mvMatrixInv = mat4.create(), clearColor = null;

    renSt = new vgl.renderState();
    renSt.m_renderer = m_this;
    renSt.m_context = m_this.renderWindow().context();
    if (!m_this.m_depthBits || m_this.m_contextChanged) {
      m_this.m_depthBits = renSt.m_context.getParameter(vgl.GL.DEPTH_BITS);
    }
    renSt.m_contextChanged = m_this.m_contextChanged;

    if (m_this.m_renderPasses) {
      for (i = 0; i < m_this.m_renderPasses.length; i += 1) {
        if (m_this.m_renderPasses[i].render(renSt)) {
          // Stop the rendering if render pass returns false
          m_this.m_renderPasses[i].remove(renSt);
          return;
        }
        m_this.m_renderPasses[i].remove(renSt);
      }
    }

    renSt.m_context.enable(vgl.GL.DEPTH_TEST);
    renSt.m_context.depthFunc(vgl.GL.LEQUAL);

    if (m_this.m_camera.clearMask() & vgl.GL.COLOR_BUFFER_BIT) {
      clearColor = m_this.m_camera.clearColor();
      renSt.m_context.clearColor(clearColor[0], clearColor[1],
                                 clearColor[2], clearColor[3]);
    }

    if (m_this.m_camera.clearMask() & vgl.GL.DEPTH_BUFFER_BIT) {
      renSt.m_context.clearDepth(m_this.m_camera.clearDepth());
    }

    renSt.m_context.clear(m_this.m_camera.clearMask());

    // Set the viewport for this renderer
    renSt.m_context.viewport(m_this.m_x, m_this.m_y,
                             m_this.m_width, m_this.m_height);

    children = m_this.m_sceneRoot.children();

    if (children.length > 0 && m_this.m_resetScene) {
      m_this.m_resetScene = false;
    }

    for (i = 0; i < children.length; i += 1) {
      actor = children[i];

      // Compute the bounds even if the actor is not visible
      actor.computeBounds();

      // If bin number is < 0, then don't even bother
      // rendering the data
      if (actor.visible() && actor.material().binNumber() >= 0) {
        sortedActors.push([actor.material().binNumber(), actor]);
      }
    }

    // Now perform sorting
    sortedActors.sort(function (a, b) { return a[0] - b[0]; });

    for (i = 0; i < sortedActors.length; i += 1) {
      actor = sortedActors[i][1];
      if (actor.referenceFrame() ===
          vgl.boundingObject.ReferenceFrame.Relative) {
        var view = m_this.m_camera.viewMatrix();
        /* If the view matrix is a plain array, keep it as such.  This is
         * intended to preserve precision, and will only be the case if the
         * view matrix was created by deliberately setting it as an array. */
        if (view instanceof Array) {
          renSt.m_modelViewMatrix = new Array(16);
        }
        mat4.multiply(renSt.m_modelViewMatrix, view, actor.matrix());
        renSt.m_projectionMatrix = m_this.m_camera.projectionMatrix();
        renSt.m_modelViewAlignment = m_this.m_camera.viewAlignment();
      } else {
        renSt.m_modelViewMatrix = actor.matrix();
        renSt.m_modelViewAlignment = null;
        renSt.m_projectionMatrix = mat4.create();
        mat4.ortho(renSt.m_projectionMatrix,
                   0, m_this.m_width, 0, m_this.m_height, -1, 1);
      }

      mat4.invert(mvMatrixInv, renSt.m_modelViewMatrix);
      mat4.transpose(renSt.m_normalMatrix, mvMatrixInv);
      renSt.m_material = actor.material();
      renSt.m_mapper = actor.mapper();

      // TODO Fix this shortcut
      renSt.m_material.bind(renSt);
      renSt.m_mapper.render(renSt);
      renSt.m_material.undoBind(renSt);
    }

    renSt.m_context.finish();
    m_this.m_contextChanged = false;
    m_this.m_lastRenderState = renSt;
  };

  /**
   * Resize viewport given a width and height.
   *
   * @param {number} width
   * @param {number} height
   */
  this.resize = function (width, height) {
    if (!width || !height) {
      return;
    }
    // @note: where do m_this.m_x and m_this.m_y come from?
    m_this.positionAndResize(m_this.m_x, m_this.m_y, width, height);
  };

  /**
   * Resize viewport given a position, width and height.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  this.positionAndResize = function (x, y, width, height) {
    var i;

    // TODO move this code to camera
    if (x < 0 || y < 0 || width <= 0 || height <= 0) {
      console.log('[error] Invalid position and resize values', x, y, width, height);  // eslint-disable-line no-console
      return;
    }

    //If we're allowing this renderer to resize ...
    if (m_this.m_resizable) {
      m_this.m_width = width;
      m_this.m_height = height;

      m_this.m_camera.setViewAspect(width / height);
      m_this.m_camera.setParallelExtents({width: width, height: height});
      m_this.modified();
    }

    if (m_this.m_renderPasses) {
      for (i = 0; i < m_this.m_renderPasses.length; i += 1) {
        m_this.m_renderPasses[i].resize(width, height);
        m_this.m_renderPasses[i].renderer().positionAndResize(x, y, width, height);
      }
    }
  };

  /**
   * Add new actor to the collection.
   *
   * @param {vgl.actor} actor
   * @returns {boolean}
   */
  this.addActor = function (actor) {
    if (actor instanceof vgl.actor) {
      m_this.m_sceneRoot.addChild(actor);
      m_this.modified();
      return true;
    }

    return false;
  };

  /**
   * Return true if this renderer has this actor attached, false otherwise.
   *
   * @param {vgl.actor} actor
   * @returns {boolean}
   */
  this.hasActor = function (actor) {
    return m_this.m_sceneRoot.hasChild(actor);
  };

  /**
   * Remove the actor from the collection.
   *
   * @param {vgl.actor} actor
   * @returns {boolean}
   */
  this.removeActor = function (actor) {
    if (m_this.m_sceneRoot.children().indexOf(actor) !== -1) {
      /* When we remove an actor, free the VBOs of the mapper and mark the
       * mapper as modified; it will reallocate VBOs as necessary. */
      if (m_this.m_lastRenderState) {
        if (actor.mapper()) {
          actor.mapper()._cleanup(m_this.m_lastRenderState);
        }
        if (actor.material()) {
          actor.material()._cleanup(m_this.m_lastRenderState);
        }
      }
      actor.modified();
      m_this.m_sceneRoot.removeChild(actor);
      m_this.modified();
      return true;
    }

    return false;
  };

  /**
   * If true the scene will be reset, otherwise the scene will not be
   * automatically reset.
   *
   * @param {boolean} reset
   */
  this.setResetScene = function (reset) {
    if (m_this.m_resetScene !== reset) {
      m_this.m_resetScene = reset;
      m_this.modified();
    }
  };

  /**
   * Cleanup.
   *
   * @param {vgl.renderState} renderState
   */
  this._cleanup = function (renderState) {
    var children = m_this.m_sceneRoot.children();
    for (var i = 0; i < children.length; i += 1) {
      var actor = children[i];
      actor.material()._cleanup(renderState);
      actor.mapper()._cleanup(renderState);
    }

    m_this.m_sceneRoot.removeChildren();
    m_this.modified();
  };

  return m_this;
};

inherit(vgl.renderer, vgl.graphicsObject);
