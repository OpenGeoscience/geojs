//////////////////////////////////////////////////////////////////////////////
//
// visitor class
//
//////////////////////////////////////////////////////////////////////////////
var TraversalMode = {
  "TraverseNone" : 0x1,
  "TraverseParents" : 0x2,
  "TraverseAllChildren" : 0x4,
  "TraverseActiveChildren" : 0x8
};

var VisitorType = {
  "ActorVisitor" : 0x1,
  "UpdateVisitor" : 0x2,
  "EventVisitor" : 0x4,
  "CullVisitor" : 0x8
};

function visitor() {
  vglModule.object.call(this);
  this.m_visitorType = VisitorType.UpdateVisitor;
  this.m_traversalMode = TraversalMode.TraverseAllChildren;
  this.m_modelViewMatrixStack = [];
  this.m_projectionMatrixStack = [];
}

inherit(visitor, vglModule.object);

visitor.prototype.pushModelViewMatrix = function(mat) {
  this.m_modelViewMatrixStack.push(mat);
};
visitor.prototype.popModelViewMatrix = function() {
  this.m_modelViewMatrixStack.pop();
};

visitor.prototype.pushProjectionMatrix = function(mat) {
  this.m_projectionMatrixStack.push(mat);
};
visitor.prototype.popProjectionMatrix = function() {
  this.m_projectionMatrixStack.pop();
};

visitor.prototype.modelViewMatrix = function() {
  mvMat = mat4.create();
  mat4.identity(mvMat);

  for ( var i = 0; i < this.m_modelViewMatrixStack.length; ++i) {
    mat4.multiply(mvMat, this.m_modelViewMatrixStack[i], mvMat);
  }

  return mvMat;
};

// /
visitor.prototype.projectionMatrix = function() {
  projMat = mat4.create();
  mat4.identity(projMat);

  for ( var i = 0; i < this.m_modelViewMatrixStack.length; ++i) {
    mat4.multiply(mvMat, this.m_modelViewMatrixStack[i], projMat);
  }

  return projMat;
};

visitor.prototype.traverse = function(node) {
  if (node instanceof node) {
    if (this.m_traversalMode === TraversalMode.TraverseParents) {
      node.ascend(this);
    }
    else {
      node.traverse(this);
    }
  }
};

visitor.prototype.visit = function(node) {
  this.traverse(node);
};

visitor.prototype.visit = function(actor) {
  this.traverse(actor);
};
