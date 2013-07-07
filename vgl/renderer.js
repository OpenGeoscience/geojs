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
  var m_backgroundColor = [0.0, 0.0, 0.0, 1.0];

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
  };

  /**
   * Get height of the renderer
   */
  this.height = function() {
    return m_height;
  };

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
  };

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
    var i = 0,
        renSt = null,
        children = null,
        actor = null,
        sortedActors = [];

    gl.clearColor(m_backgroundColor[0], m_backgroundColor[1],
      m_backgroundColor[2], m_backgroundColor[3]);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renSt = new vglModule.renderState();
    children = m_sceneRoot.children();

    renSt.m_projectionMatrix = m_camera.projectionMatrix();

    for ( i = 0; i < children.length; ++i) {
      actor = children[i];
      actor.computeBounds();
      if (actor.visible() === false) {
        continue;
      }

      sortedActors.push([actor.material().binNumber(), actor]);
    }

    // Now perform sorting
    sortedActors.sort(function(a, b) {return a[0] - b[0]});

    for ( i = 0; i < sortedActors.length; ++i) {
      actor = sortedActors[i][1];

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

    var vn = m_camera.directionOfProjection(),
        visibleBounds = m_camera.bounds(),
        center = [
          (visibleBounds[0] + visibleBounds[1]) / 2.0,
          (visibleBounds[2] + visibleBounds[3]) / 2.0,
          (visibleBounds[4] + visibleBounds[5]) / 2.0
        ],
        diagonals = [
          visibleBounds[1] - visibleBounds[0],
          visibleBounds[3] - visibleBounds[2],
          visibleBounds[5] - visibleBounds[4]
        ],
        radius = 0.0,
        aspect = m_camera.viewAspect(),
        angle = m_camera.viewAngle();

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

    // @todo Need to figure out what's happening here
    if (aspect >= 1.0) {
      angle = 2.0 * Math.atan(Math.tan(angle * 0.5) / aspect);
    } else {
      angle = 2.0 * Math.atan(Math.tan(angle * 0.5) * aspect);
    }

    var distance = radius / Math.sin(angle * 0.5),
        vup = m_camera.viewUpDirection();

    if (Math.abs(vec3.dot(vup, vn)) > 0.999) {
      m_camera.setViewUpDirection(-vup[2], vup[0], vup[1]);
    }

    m_camera.setFocalPoint(center[0], center[1], center[2]);
    m_camera.setPosition(center[0] + distance * -vn[0],
      center[1] + distance * -vn[1], center[2] + distance * -vn[2]);

    this.resetCameraClippingRange(visibleBounds);
  };

  /**
   * Recalculate camera's clipping range
   */
  this.resetCameraClippingRange = function(bounds) {
    var vn = m_camera.viewPlaneNormal(),
        position = m_camera.position(),
        a = -vn[0],
        b = -vn[1],
        c = -vn[2],
        d = -(a*position[0] + b*position[1] + c*position[2]),
        range = vec2.create(),
        dist = null;

    // Set the max near clipping plane and the min far clipping plane
    range[0] = a * bounds[0] + b * bounds[2] + c * bounds[4] + d;
    range[1] = 1e-18;

    // Find the closest / farthest bounding box vertex
    for (var k = 0; k < 2; k++ ) {
      for (var j = 0; j < 2; j++) {
        for (var i = 0; i < 2; i++) {
          dist = a * bounds[i] + b * bounds[2 + j] + c * bounds[4 + k] + d;
          range[0] = (dist < range[0]) ? (dist) : (range[0]);
          range[1] = (dist > range[1]) ? (dist) : (range[1]);
        }
      }
    }

    // Do not let the range behind the camera throw off the calculation.
    if (range[0] < 0.0) {
      range[0] = 0.0;
    }

    // Give ourselves a little breathing room
    range[0] = 0.99*range[0] - (range[1] - range[0])*0.5;
    range[1] = 1.01*range[1] + (range[1] - range[0])*0.5;

    // Make sure near is not bigger than far
    range[0] = (range[0] >= range[1])?(0.01*range[1]):(range[0]);

    // @todo
    // Make sure near is at least some fraction of far - this prevents near
    // from being behind the camera or too close in front. How close is too
    // close depends on the resolution of the depth buffer
    // if (!this->NearClippingPlaneTolerance)
    //   {
    //   this->NearClippingPlaneTolerance = 0.01;
    //   if (this->RenderWindow)
    //     {
    //     int ZBufferDepth = this->RenderWindow->GetDepthBufferSize();
    //     if ( ZBufferDepth > 16 )
    //       {
    //       this->NearClippingPlaneTolerance = 0.001;
    //       }
    //     }
    //   }

    // make sure the front clipping range is not too far from the far clippnig
    // range, this is to make sure that the zbuffer resolution is effectively
    // used
    // if (range[0] < this->NearClippingPlaneTolerance*range[1]) {
    //   range[0] = this->NearClippingPlaneTolerance*range[1];
    // }

    m_camera.setClippingRange(range[0], range[1]);
  };

  /**
   * Resize viewport given a width and height
   */
  this.resize = function(width, height) {
    // @note: where do m_x and m_y come from?
    this.positionAndResize(m_x, m_y, width, height);
  };

  /**
   * Resize viewport given a position, width and height
   */
  this.positionAndResize = function(x, y, width, height) {
    // TODO move this code to camera
    if (x < 0 || y < 0 || width < 0 || height < 0) {
      console.log('[error] Invalid position and resize values',
        x, y, width, height);
    }

    m_width = width;
    m_height = height;

    gl.viewport(x, y, m_width, m_height);
    m_camera.setViewAspect(m_width / m_height);
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
   * Add an array of actors to the collection
   */
  this.addActors = function(actors) {
    var i = null
    if (actors instanceof Array) {
      for (i = 0; i < actors.length; ++i) {
        m_sceneRoot.addChild(actors[i]);
      }
      this.modified();
    }
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
   * Remove actors from the collection
   */
  this.removeActors = function(actors) {
    if (!(actors instanceof Array)) {
      return false;
    }

    var i = null;
    for (i = 0; i < actors.length; ++i) {
      m_sceneRoot.removeChild(actors[i]);
    }
    this.modified();
    return true;
  };

  /**
   * Remove all actors for a renderer
   */
  this.removeAllActors = function() {
    m_sceneRoot.removeChildren();
  }

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
    var x = (2.0 * displayPt[0] / width) - 1,
        y = -(2.0 * displayPt[1] / height) + 1,
        z = displayPt[2];

    var viewProjectionInverse = mat4.create();
    mat4.multiply(viewProjectionInverse, projectionMatrix, viewMatrix);
    mat4.invert(viewProjectionInverse, viewProjectionInverse);

    var worldPt = vec4.fromValues(x, y, z, 1);
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
