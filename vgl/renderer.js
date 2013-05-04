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
  var m_backgroundColor = [1.0, 1.0, 1.0, 1.0];

  /** @private */
  var m_sceneRoot = new vglModule.groupNode();

  /** @private */
  var m_camera = new vglModule.camera();
  m_camera.addChild(m_sceneRoot);

  /** @private */
  var m_width = 0;

  /** @private */
  var m_height = 0;

  /**
   * Get width of the renderer
   */
  this.width = function() {
    return m_width;
  }

  /**
   * Get height of the renderer
   */
  this.height = function() {
    return m_height;
  }

  /**
   * Get background color
   */
  this.backgroundColor = function() {
    return m_backgroundColor;
  };

  /**
   * Set background color
   */
  this.setBackgroundColor = function(r, g, b, a) {
    m_backgroundColor[0] = r;
    m_backgroundColor[1] = g;
    m_backgroundColor[2] = b;
    m_backgroundColor[3] = a;

    this.modified();
  }

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
    gl.clearColor(m_backgroundColor[0], m_backgroundColor[1],
      m_backgroundColor[2], m_backgroundColor[3]);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    perspectiveMatrix = m_camera.projectionMatrix();

    var renSt = new vglModule.renderState();
    renSt.m_projectionMatrix = perspectiveMatrix;
    var children = m_sceneRoot.children();
    for ( var i = 0; i < children.length; ++i) {
      var actor = children[i];
      actor.computeBounds();
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
   * Automatically set up the camera based on visible actors
   */
  this.resetCamera = function() {
    m_camera.computeBounds();

    var vn = m_camera.directionOfProjection();
    var visibleBounds = m_camera.bounds();

    // console.log('visibleBounds ', visibleBounds);

    var center = [
      (visibleBounds[0] + visibleBounds[1]) / 2.0,
      (visibleBounds[2] + visibleBounds[3]) / 2.0,
      (visibleBounds[4] + visibleBounds[5]) / 2.0];

    // console.log('center ', center);

    var diagonals = [
      visibleBounds[1] - visibleBounds[0],
      visibleBounds[3] - visibleBounds[2],
      visibleBounds[5] - visibleBounds[4],
    ];

    var radius = 0.0;
    if (diagonals[0] > diagonals[1]) {
      if (diagonals[0] > diagonals[2]) {
        radius = diagonals[0] / 2.0;
      } else {
        radius = diagonals[2] / 2.0;
      }
    } else {
      if (diagonals[1] > diagonals[2]) {
        radius = diagonals[1] / 2.0;
      } else {
        radius = diagonals[2] / 2.0;
      }
    }

    var aspect = m_camera.viewAspect();
    var angle = m_camera.viewAngle();

    // @todo Need to figure out what's happening here
    if (aspect >= 1.0) {
      angle = 2.0 * Math.atan(Math.tan(angle * 0.5) / aspect);
    } else {
      angle = 2.0 * Math.atan(Math.tan(angle * 0.5) * aspect);
    }

    var distance =  radius / Math.sin(angle * 0.5);

    var vup = m_camera.viewUpDirection();

    if (Math.abs(vec3.dot(vup, vn)) > 0.999) {
      m_camera.setViewDirection(-vup[2], vup[0], vup[1]);
    }

    m_camera.setFocalPoint(center[0], center[1], center[2]);
    m_camera.setPosition(center[0] + distance * -vn[0],
      center[1] + distance * -vn[1], center[2] + distance * -vn[2]);
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
