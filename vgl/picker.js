//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class picker
 *
 * @class vglModule.picker
 * @returns {vglModule.picker}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.picker = function() {
  'use strict';

  if (!(this instanceof vglModule.picker)) {
    return new vglModule.picker();
  }
  vglModule.object.call(this);

  /** @private */
  var m_that = this,
      m_tolerance = 0.025,
      m_actors = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get actors intersected
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getActors = function() {
    return m_actors;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Perform pick operation
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pick = function(selectionX, selectionY, renderer) {
    // Check if variables are acceptable
    if (typeof(selectionX) === "undefined"){
      return 0;
    }
    if (typeof(selectionY) === "undefined"){
      return 0;
    }
    if (typeof(renderer) === "undefined"){
      return 0;
    }

    // Clean list of actors intersected previously
    m_actors = [];

    //
    var camera = renderer.camera(),
        width = renderer.width(),
        height = renderer.height(),
        fpoint = camera.focalPoint(),
        focusWorldPt = vec4.fromValues(fpoint[0], fpoint[1], fpoint[2], 1.0),
        focusDisplayPt = renderer.worldToDisplay(
          focusWorldPt, camera.viewMatrix(),
        camera.projectionMatrix(), width, height),
        displayPt = vec4.fromValues(selectionX,
                      selectionY, focusDisplayPt[2], 1.0),
        // Convert selection point into world coordinates
        worldPt = renderer.displayToWorld(displayPt, camera.viewMatrix(),
                    camera.projectionMatrix(), width, height),
        cameraPos = camera.position(), ray = [], actors, count, i, bb,
        tmin, tmax, tymin, tymax, tzmin, tzmax, actor;

    for (i = 0; i < 3; ++i){
      ray[i] = worldPt[i] - cameraPos[i];
    }

    // Go through all actors and check if intersects
    actors = renderer.sceneRoot().children();
    count = 0;

    for (i = 0; i < actors.length; ++i) {
      actor = actors[i];
      if (actor.visible() === true) {
        bb = actor.bounds();
        // Ray-aabb intersection - Smits' method
        if (ray[0] >= 0){
          tmin = (bb[0] - cameraPos[0])/ray[0];
          tmax = (bb[1] - cameraPos[0])/ray[0];
        } else {
          tmin = (bb[1] - cameraPos[0])/ray[0];
          tmax = (bb[0] - cameraPos[0])/ray[0];
        }
        if (ray[1] >= 0){
          tymin = (bb[2] - cameraPos[1])/ray[1];
          tymax = (bb[3] - cameraPos[1])/ray[1];
        } else {
          tymin = (bb[3] - cameraPos[1])/ray[1];
          tymax = (bb[2] - cameraPos[1])/ray[1];
        }
        if ((tmin > tymax) || (tymin > tmax)) {
          continue;
        }


        if (tymin > tmin) {
          tmin = tymin;
        }
        if (tymax < tmax) {
          tmax = tymax;
        }
        if (ray[2] >= 0) {
          tzmin = (bb[4] - cameraPos[2])/ray[2];
          tzmax = (bb[5] - cameraPos[2])/ray[2];
        } else {
          tzmin = (bb[5] - cameraPos[2])/ray[2];
          tzmax = (bb[4] - cameraPos[2])/ray[2];
        }
        if ((tmin > tzmax) || (tzmin > tmax)) {
          continue;
        }
        if (tzmin > tmin) {
          tmin = tzmin;
        }
        if (tzmax < tmax) {
          tmax = tzmax;
        }

        m_actors[count++] = actor;
      }
    }
    return count;
  };

  return this;
};

inherit(vglModule.picker, vglModule.object);
