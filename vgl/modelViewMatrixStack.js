//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

function modelViewMatrixStack() {
  var mvMatrixStack = [];

  this.pushMatrix = function(mat) {
    var copy = mat4.create();
    mat4.set(mat, copy);
    mvMatrixStack.push(copy);
  };

  this.popMatrix = function() {
    if (mvMatrixStack.length === 0) {
      throw "Invalid popMatrix!";
    }
    mat = mvMatrixStack.pop();

    return mat;
  };
}
