/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of class renderState
 *
 * @class vglModule.renderState
 * @returns {vglModule.renderState}
 */
vglModule.renderState = function() {
  this.m_modelViewMatrix = mat4.create();
  this.m_projectionMatrix = null;
  this.m_material = null;
  this.m_mapper = null;
};

/**
 * Create a new instance of class renderer
 *
 * @class vglModule.renderer
 * @returns {vglModule.renderer}
 */
vglModule.renderer = function() {

  if (!(this instanceof vglModule.renderer)) {
    return new vglModule.renderer();
  }
  vglModule.object.call(this);

  /** @private */
  var m_sceneRoot = new vglModule.groupNode();

  /** @private */
  var m_camera = new vglModule.camera();

  m_camera.addChild(m_sceneRoot);

  /**
   * Get scene root
   */
  this.sceneRoot = function() {
    return m_sceneRoot;
  };

  /**
   * Get main camera of the renderer
   */
  this.camera = function() {
    return m_camera;
  };

  /**
   * Render the scene
   */
  this.render = function() {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    perspectiveMatrix = m_camera.projectionMatrix();

    var renSt = new vglModule.renderState();
    renSt.m_projectionMatrix = perspectiveMatrix;
    var children = m_sceneRoot.children();
    for ( var i = 0; i < children.length; ++i) {
      var actor = children[i];

      if (actor.visible() === false) {
        continue;
      }

      mat4.multiply(renSt.m_modelViewMatrix, m_camera.viewMatrix(),
                    actor.matrix());
      renSt.m_material = actor.material();
      renSt.m_mapper = actor.mapper();

      // TODO Fix this shortcut

      renSt.m_material.render(renSt);
      renSt.m_mapper.render(renSt);
      renSt.m_material.remove(renSt);
    }
  };

  /**
   * Recalculate camera's clipping range
   */
  this.resetCameraClippingRange = function() {
    // TODO
  };

  /**
   * Resize viewport given a width and height
   */
  this.resize = function(width, height) {
    this.positionAndResize(m_x, m_y, width, height);
  };

  /**
   * Resize viewport given a position, width and height
   */
  this.positionAndResize = function(x, y, width, height) {
    // TODO move this code to camera
    gl.viewport(x, y, width, height);
    m_camera.setViewAspect(width / height);
    this.modified();
  };

  /**
   * Add new actor to the collection
   */
  this.addActor = function(actor) {
    if (actor instanceof vglModule.actor) {
      m_sceneRoot.addChild(actor);
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Remove the actor from the collection
   */
  this.removeActor = function(actor) {
    if (m_sceneRoot.children().indexOf(actor) !== -1) {
      m_sceneRoot.removeChild(actor);
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Transform a point in the world space to display space
   */
  this.worldToDisplay = function(worldPt, viewMatrix, projectionMatrix, width,
                                 height) {
    var viewProjectionMatrix = mat4.create();
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    // Transform world to clipping coordinates
    var clipPt = vec4.create();
    vec4.transformMat4(clipPt, worldPt, viewProjectionMatrix);

    if (clipPt[3] !== 0.0) {
      clipPt[0] = clipPt[0] / clipPt[3];
      clipPt[1] = clipPt[1] / clipPt[3];
      clipPt[2] = clipPt[2] / clipPt[3];
      clipPt[3] = 1.0;
    }

    var winX = Math.round((((clipPt[0]) + 1) / 2.0) * width);
    // / We calculate -point3D.getY() because the screen Y axis is
    // / oriented top->down
    var winY = Math.round(((1 - clipPt[1]) / 2.0) * height);
    var winZ = clipPt[2];
    var winW = clipPt[3];

    return vec4.fromValues(winX, winY, winZ, winW);
  };

  /**
   * Transform a point in display space to world space
   */
  this.displayToWorld = function(displayPt, viewMatrix, projectionMatrix,
                                 width, height) {
    var x = (2.0 * displayPt[0] / width) - 1;
    var y = -(2.0 * displayPt[1] / height) + 1;
    var z = displayPt[2];

    var viewProjectionInverse = mat4.create();
    mat4.multiply(viewProjectionInverse, projectionMatrix, viewMatrix);
    mat4.invert(viewProjectionInverse, viewProjectionInverse);

    var worldPt = vec4.fromValues(x, y, z, 1);
    var myvec = vec4.create();
    vec4.transformMat4(worldPt, worldPt, viewProjectionInverse);
    if (worldPt[3] !== 0.0) {
      worldPt[0] = worldPt[0] / worldPt[3];
      worldPt[1] = worldPt[1] / worldPt[3];
      worldPt[2] = worldPt[2] / worldPt[3];
      worldPt[3] = 1.0;
    }

    return worldPt;
  };

  return this;
};

inherit(vglModule.renderer, vglModule.object);
