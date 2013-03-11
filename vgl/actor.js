//////////////////////////////////////////////////////////////////////////////
//
// actor class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.actor = function() {

  if (!(this instanceof vglModule.actor)) {
    return new vglModule.actor();
  }

  vglModule.node.call(this);

  // / Initialize member variables
  var m_center = new Array(3);
  var m_rotation = new Array(4);
  var m_scale = new Array(3);
  var m_translation = new Array(3);
  var m_referenceFrame = 0;
  var m_mapper = 0;

  /**
   * Get center of transformations
   *
   */
  this.center = function() {
    return m_center;
  };

  /**
   * Set center of transformations
   *
   */
  this.setCenter = function(x, y, z) {
    m_center[0] = x;
    m_center[1] = y;
    m_center[2] = z;
  };

  /**
   * Get rotation defined by axis-angle (axis(x, y, z), angle)
   *
   */
  this.rotation = function() {
  };

  /**
   * Set rotation defined by axis-angle (angle in radians)
   *
   */
  this.setRotation = function(angle, x, y, z) {
  };

  /**
   * Get scale in x, y and z directions
   *
   */
  this.scale = function() {
  };

  /**
   * Set scale in x, y and z directions
   *
   */
  this.setScale = function(x, y, z) {
  };

  /**
   * Get translation in x, y and z directions
   *
   */
  this.translation = function() {
  };

  /**
   * Set translation in x, y and z directions
   *
   */
  this.setTranslation = function(x, y, z) {
  };

  /**
   * Get reference frame for the transformations. Possible values are Absolute
   * and Relative.
   *
   */
  this.referenceFrame = function() {
  };

  /**
   * Set reference frame for the transformations. Possible values are Absolute
   * and Relative.
   *
   */
  this.setReferenceFrame = function(referenceFrame) {
  };

  /**
   * Evaluate the transform associated with the actor.
   *
   * @returns Affine transformation for the vglModule.actor.
   */
  this.modelViewMatrix = function() {
    var mat = mat4.create();
    mat4.identity(mat);
    return mat;
  };

  /**
   * Return modelview matrix for the actor
   *
   * @returns mat4
   */
  this.matrix = function() {
    return this.modelViewMatrix();
  };

  /**
   * Return mapper where actor gets it behavior and data
   *
   * @returns vglModule.mapper
   */
  this.mapper = function() {
    return m_mapper;
  };

  /**
   * Connect an actor to its data source (mapper)
   *
   */
  this.setMapper = function(mapper) {
    m_mapper = mapper;
  };

  /**
   * TODO Implement this
   *
   */
  this.accept = function(visitor) {
  };

  /**
   * TODO Implement this
   *
   */
  this.ascend = function(visitor) {
  };

  /**
   * Compute object space to world space matrix
   *
   * TODO Implement this
   *
   */
  this.computeLocalToWorldMatrix = function(matrix, visitor) {
  };

  /**
   * Compute world space to object space matrix
   *
   * TODO Implement this
   *
   */
  this.computeWorldToLocalMatrix = function(matrix, visitor) {
  };

  /**
   * Compute actor bounds
   *
   */
  this.computeBounds = function() {
  };

  return this;
};

inherit(vglModule.actor, vglModule.node);
