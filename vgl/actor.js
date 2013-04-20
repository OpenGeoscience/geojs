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
    this.boundsModified();
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
    this.boundsModified();
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
    this.boundsModified();
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
    if (mapper !== m_mapper) {
      m_mapper = mapper;
      this.boundsModified();
    }
  };

  /**
   * @todo
   */
  this.accept = function(visitor) {
  };

  /**
   * @todo
   */
  this.ascend = function(visitor) {
  };

  /**
   * Compute object space to world space matrix
   * @todo
   */
  this.computeLocalToWorldMatrix = function(matrix, visitor) {
  };

  /**
   * Compute world space to object space matrix
   * @todo
   */
  this.computeWorldToLocalMatrix = function(matrix, visitor) {
  };

  /**
   * Compute actor bounds
   */
  this.computeBounds = function() {
    if (m_mapper === null || m_mapper === undefined) {
      this.resetBounds();
      return;
    }

    var computeBoundsTimestamp = this.computeBoundsTimestamp();

    if (this.boundsDirtyTimestamp().getMTime() > computeBoundsTimestamp.getMTime() ||
      m_mapper.boundsDirtyTimestamp().getMTime() > computeBoundsTimestamp.getMTime()) {
      m_mapper.computeBounds();
      var mapperBounds = m_mapper.bounds();

      var minPt = [mapperBounds[0], mapperBounds[2], mapperBounds[4]];
      var maxPt = [mapperBounds[1], mapperBounds[3], mapperBounds[5]];

      var actorMatrix = this.modelViewMatrix();
      vec3.transformMat4(minPt, minPt, actorMatrix);
      vec3.transformMat4(maxPt, maxPt, actorMatrix);

      var newBounds = [
        minPt[0] > maxPt[0] ? maxPt[0] : minPt[0],
        minPt[0] > maxPt[0] ? minPt[0] : maxPt[0],
        minPt[1] > maxPt[1] ? maxPt[1] : minPt[1],
        minPt[1] > maxPt[1] ? minPt[1] : maxPt[1],
        minPt[2] > maxPt[2] ? maxPt[2] : minPt[2],
        minPt[2] > maxPt[2] ? minPt[2] : maxPt[2]
      ];

      this.setBounds(newBounds[0], newBounds[1],
                     newBounds[2], newBounds[3],
                     newBounds[4], newBounds[5]);

      computeBoundsTimestamp.modified();
    }
  };

  return this;
};

inherit(vglModule.actor, vglModule.node);
