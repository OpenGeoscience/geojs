// Not used now
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
