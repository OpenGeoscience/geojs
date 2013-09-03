//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

/**
 * Create a new instance of class picker
 *
 * @class vglModule.picker
 * @returns {vglModule.picker}
 */
vglModule.picker = function() {

  if (!(this instanceof vglModule.picker)) {
    return new vglModule.picker();
  }
  vglModule.object.call(this);

  var m_that = this;

  /** @private */
  var m_tolerance = 0.025; // 1/40th of the renderer window

  /** @private */
  var m_actors = [];

  /**
   * Get actors intersected
   */
  this.getActors = function() {
    return m_actors;
  };

  /**
   * Perform pick operation
   */
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
    var camera = renderer.camera();
    var width = renderer.width();
    var height = renderer.height();

    // Get focal point
    var fpoint = camera.focalPoint();
    var focusWorldPt = vec4.fromValues(fpoint[0], fpoint[1], fpoint[2], 1.0);
    var focusDisplayPt = renderer.worldToDisplay(
      focusWorldPt, camera.viewMatrix(),
      camera.projectionMatrix(), width, height);
    var displayPt = vec4.fromValues(selectionX, selectionY, focusDisplayPt[2], 1.0)

    // Convert selection point into world coordinates
    var worldPt = renderer.displayToWorld(displayPt, camera.viewMatrix(),
                                          camera.projectionMatrix(), width, height);

    // Compute the ray endpoints
    var cameraPos = camera.position();
    var ray = [];
    for (var i=0; i<3; ++i){
      ray[i] = worldPt[i] - cameraPos[i];
    }

    // Go through all actors and check if intersects
    var actors = renderer.sceneRoot().children();
    var t0 = 0.0, t1 = 1.0;
    var count = 0;

    for ( var i = 0; i < actors.length; ++i) {
      var actor = actors[i];
      if (actor.visible() === true) {
        var bb = actor.bounds();

        var tmin, tmax, tymin, tymax, tzmin, tzmax;
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
        if ((tmin > tymax) || (tymin > tmax))
          continue;

        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;
        if (ray[2] >= 0){
          tzmin = (bb[4] - cameraPos[2])/ray[2];
          tzmax = (bb[5] - cameraPos[2])/ray[2];
        } else {
          tzmin = (bb[5] - cameraPos[2])/ray[2];
          tzmax = (bb[4] - cameraPos[2])/ray[2];
        }
        if ((tmin > tzmax) || (tzmin > tmax))
          continue;

        if (tzmin > tmin) tmin = tzmin;
        if (tzmax < tmax) tmax = tzmax;
        //

        //we dont need to check t0,t1,
        //since we dont want check only a specific interval
        //if ((tmin < t1) && (tmax > t0))
        m_actors[count++] = actor;
      }
    }
    return count;
  };

  return this;
};

inherit(vglModule.picker, vglModule.object);
