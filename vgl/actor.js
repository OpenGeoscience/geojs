/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of class actor
 *
 * @class
 * @returns {vglModule.actor}
 */
vglModule.actor = function() {

  if (!(this instanceof vglModule.actor)) {
    return new vglModule.actor();
  }

  vglModule.node.call(this);

  /** @private */
  var m_center = [];
  m_center.length = 3;

  /** @private */
  var m_rotation = [];
  m_rotation.length = 4;

  /** @private */
  var m_scale = [];
  m_scale.length = 3;

  /** @private */
  var m_translation = [];
  m_translation.length = 3;

  /** @private */
  var m_referenceFrame = null;

  /** @private */
  var m_mapper = null;

  /**
   * Get center of transformation
   *
   * @returns {Array}
   */
  this.center = function() {
    return m_center;
  };

  /**
   * Set center of transformation
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  this.setCenter = function(x, y, z) {
    m_center[0] = x;
    m_center[1] = y;
    m_center[2] = z;
  };

  /**
   * Get rotation defined by axis & angle (radians)
   *
   * @returns {Array}
   */
  this.rotation = function() {
  };

  /**
   * Set rotation defined by axis & angle (radians)
   *
   * @param {Number} angle
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  this.setRotation = function(angle, x, y, z) {
  };

  /**
   * Get scale in x, y and z directions
   *
   * @returns {Array}
   */
  this.scale = function() {
  };

  /**
   * Set scale in x, y and z directions
   *
   * @param {Number} x Scale in x direction
   * @param {Number} y Scale in y direction
   * @param {Number} z Scale in z direction
   */
  this.setScale = function(x, y, z) {
  };

  /**
   * Get translation in x, y and z directions
   *
   * @returns {Array}
   */
  this.translation = function() {
  };

  /**
   * Set translation in x, y and z directions
   *
   * @param {Number} x Translation in x direction
   * @param {Number} y Translation in y direction
   * @param {Number} z Translation in z direction
   */
  this.setTranslation = function(x, y, z) {
  };

  /**
   * Get reference frame for the transformations
   *
   * @returns {String} Possible values are Absolute or Relative
   */
  this.referenceFrame = function() {
  };

  /**
   * Set reference frame for the transformations
   *
   * @param {String} referenceFrame Possible values are (Absolute | Relative)
   */
  this.setReferenceFrame = function(referenceFrame) {
  };

  /**
   * Evaluate the transform associated with the actor.
   *
   * @returns {mat4}
   */
  this.modelViewMatrix = function() {
    var mat = mat4.create();
    mat4.identity(mat);
    return mat;
  };

  /**
   * Return model-view matrix for the actor
   *
   * @returns {mat4}
   */
  this.matrix = function() {
    return this.modelViewMatrix();
  };

  /**
   * Return mapper where actor gets it behavior and data
   *
   * @returns {vglModule.mapper}
   */
  this.mapper = function() {
    return m_mapper;
  };

  /**
   * Connect an actor to its data source
   *
   * @param {vglModule.mapper}
   */
  this.setMapper = function(mapper) {
    m_mapper = mapper;
  };

  /**
   * TODO Implement this
   */
  this.accept = function(visitor) {
  };

  /**
   * TODO Implement this
   */
  this.ascend = function(visitor) {
  };

  /**
   * Compute object space to world space matrix TODO Implement this
   */
  this.computeLocalToWorldMatrix = function(matrix, visitor) {
  };

  /**
   * Compute world space to object space matrix TODO Implement this
   */
  this.computeWorldToLocalMatrix = function(matrix, visitor) {
  };

  /**
   * Compute actor bounds TODO
   */
  this.computeBounds = function() {
  };

  return this;
};

inherit(vglModule.actor, vglModule.node);
