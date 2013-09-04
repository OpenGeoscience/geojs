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
 * Type of traverse modes
 *
 * @type {{TraverseNone: number, TraverseParents: number,
 *         TraverseAllChildren: number, TraverseActiveChildren: number}}
 */
//////////////////////////////////////////////////////////////////////////////
var TraversalMode = {
  "TraverseNone" : 0x1,
  "TraverseParents" : 0x2,
  "TraverseAllChildren" : 0x4,
  "TraverseActiveChildren" : 0x8
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Types of visitor type
 *
 * @type {{ActorVisitor: number, UpdateVisitor: number, EventVisitor: number,
 *         CullVisitor: number}}
 */
//////////////////////////////////////////////////////////////////////////////
var VisitorType = {
  "ActorVisitor" : 0x1,
  "UpdateVisitor" : 0x2,
  "EventVisitor" : 0x4,
  "CullVisitor" : 0x8
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of visitor class
 *
 * @returns {vglModule.visitor}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.visitor = function() {
  'use strict';

  vglModule.object.call(this);

  var m_visitorType = VisitorType.UpdateVisitor,
      m_traversalMode = TraversalMode.TraverseAllChildren,
      m_modelViewMatrixStack = [],
      m_projectionMatrixStack = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Push incoming model-view matrix to the stack
   *
   * @param mat
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pushModelViewMatrix = function(mat) {
    this.m_modelViewMatrixStack.push(mat);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Pop model-view matrix from the stack
   */
  ////////////////////////////////////////////////////////////////////////////
  this..popModelViewMatrix = function() {
    this.m_modelViewMatrixStack.pop();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Push incoming projection matrix to the stack
   *
   * @param mat
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pushProjectionMatrix = function(mat) {
    this.m_projectionMatrixStack.push(mat);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Pop projection matrix from the stack
   */
  ////////////////////////////////////////////////////////////////////////////
  this.popProjectionMatrix = function() {
    this.m_projectionMatrixStack.pop();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get accumulated model-view matrix
   *
   * @returns {mat4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.modelViewMatrix = function() {
    var mvMat = mat4.create(),
        i;

    mat4.identity(mvMat);

    for (i = 0; i < this.m_modelViewMatrixStack.length; ++i) {
      mat4.multiply(mvMat, this.m_modelViewMatrixStack[i], mvMat);
    }

    return mvMat;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get accumulated projection matrix
   *
   * @returns {mat4}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.projectionMatrix = function() {
    var projMat = mat4.create(),
        i;

    mat4.identity(projMat);

    for (i = 0; i < this.m_modelViewMatrixStack.length; ++i) {
      mat4.multiply(mvMat, this.m_modelViewMatrixStack[i], projMat);
    }

    return projMat;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Traverse node and its children if any
   *
   * @param {vglModule.node} node
   */
  ////////////////////////////////////////////////////////////////////////////
  this.traverse = function(node) {
    if (node instanceof node) {
      if (this.m_traversalMode === TraversalMode.TraverseParents) {
        node.ascend(this);
      }
      else {
        node.traverse(this);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Start node traversal
   *
   * @param {vglModule.node} node
   */
  ////////////////////////////////////////////////////////////////////////////
  this.visit = function(node) {
    this.traverse(node);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Start actor traversal
   *
   * @param {vglModule.actor} actor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.visit = function(actor) {
    this.traverse(actor);
  };

  return this;
}
inherit(visitor, vglModule.object);