/*========================================================================
  VGL --- VTK WebGL Rendering Toolkit

  Copyright 2013 Kitware, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ========================================================================*/

//////////////////////////////////////////////////////////////////////////////
//
// renderState class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.renderState = function() {
  this.m_modelViewMatrix = mat4.create();
  this.m_projectionMatrix = null;
  this.m_material = null;
  this.m_mapper = null;
};

// ////////////////////////////////////////////////////////////////////////////
//
// renderer class
//
// ////////////////////////////////////////////////////////////////////////////

/**
 * renderer class provides key functionality to render a scene
 *
 */
vglModule.renderer = function() {

  if (!(this instanceof vglModule.renderer)) {
    return new vglModule.renderer();
  }

  vglModule.object.call(this);

  /** Private member variables */
  var m_width = 1280;
  var m_height = 1024;
  var m_clippingRange = [ 0.1, 1000.0 ];
  var m_sceneRoot = new vglModule.groupNode();
  var m_camera = new vglModule.camera();

  m_camera.addChild(m_sceneRoot);

  /** Public member methods */

  /**
   * Get scene root
   *
   */
  this.sceneRoot = function() {
    return m_sceneRoot;
  };

  /**
   * Get main camera of the renderer
   *
   */
  this.camera = function() {
    return m_camera;
  };

  /**
   * Get width of renderer
   *
   */
  this.width = function() {
    return m_width;
  };

  /**
   * Get height of renderer
   *
   */
  this.height = function() {
    return m_height;
  };

  /**
   * Render the scene
   *
   */
  this.render = function() {
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    perspectiveMatrix = m_camera.computeProjectionMatrix((m_width / m_height),
                                                         0.1, 10000.0);

    var renSt = new vglModule.renderState();
    renSt.m_projectionMatrix = perspectiveMatrix;
    var children = m_sceneRoot.children();
    for ( var i = 0; i < children.length; ++i) {
      var actor = children[i];
      mat4.multiply(m_camera.computeViewMatrix(), actor.matrix(),
                    renSt.m_modelViewMatrix);
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
   *
   */
  this.resetCameraClippingRange = function() {
    // TODO
  };

  /**
   * Resize viewport based on the new width and height of the window
   *
   */
  this.resize = function(width, height) {
    m_width = width;
    m_height = height;
    gl.viewport(0, 0, m_width, m_height);
  };

  /**
   * Add new actor to the collection.
   *
   */
  this.addActor = function(actor) {
    if (actor instanceof vglModule.actor) {
      m_sceneRoot.addChild(actor);
      return true;
    }

    return false;
  };

  /**
   * Remove the actor from the collection
   *
   */
  this.removeActor = function(actor) {
    if (actor in m_sceneRoot.children()) {
      m_sceneRoot.removeChild(actor);
      return true;
    }

    return false;
  };

  /**
   * Transform a point in the world space to display space
   *
   */
  vglModule.renderer.worldToDisplay = function(worldPt, viewMatrix,
                                               projectionMatrix, width, height) {
    var viewProjectionMatrix = mat4.create();
    mat4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix);

    // Transform world to clipping coordinates
    var clipPt = vec4.create();
    mat4.multiplyVec4(viewProjectionMatrix, worldPt, clipPt);

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

    return vec4.createFrom(winX, winY, winZ, winW);
  };

  /**
   * Transform a point in display space to world space
   *
   */
  vglModule.renderer.displayToWorld = function(displayPt, viewMatrix,
                                               projectionMatrix, width, height) {
    var x = (2.0 * displayPt[0] / width) - 1;
    var y = -(2.0 * displayPt[1] / height) + 1;
    var z = displayPt[2];

    var viewProjectionInverse = mat4.create();
    mat4.multiply(projectionMatrix, viewMatrix, viewProjectionInverse);
    mat4.inverse(viewProjectionInverse, viewProjectionInverse);

    var worldPt = vec4.createFrom(x, y, z, 1);
    mat4.multiplyVec4(viewProjectionInverse, worldPt, worldPt);

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
