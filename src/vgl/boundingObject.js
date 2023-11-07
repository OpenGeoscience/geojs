var vgl = require('./vgl');
var inherit = require('../inherit');
var timestamp = require('../timestamp');

/**
 * Create a new instance of class boundingObject.
 *
 * @class
 * @alias vgl.boundingObject
 * @extends vgl.object
 * @returns {vgl.boundingObject}
 */
vgl.boundingObject = function () {
  'use strict';

  if (!(this instanceof vgl.boundingObject)) {
    return new vgl.boundingObject();
  }
  vgl.object.call(this);

  var m_bounds = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      m_computeBoundsTimestamp = timestamp(),
      m_boundsDirtyTimestamp = timestamp();

  m_computeBoundsTimestamp.modified();
  m_boundsDirtyTimestamp.modified();

  /**
   * Get current bounds of the object.
   *
   * @returns {number[]} The min x, max x, min y, max y, min z, max z bounding
   *    range of the object.
   */
  this.bounds = function () {
    return m_bounds;
  };

  /**
   * Check if bounds are valid.
   *
   * @param {number[]} bounds The six value bounds of the object.
   * @returns {boolean} true if the bounds are valid.
   */
  this.hasValidBounds = function (bounds) {
    if (bounds[0] === Number.MAX_VALUE ||
        bounds[1] === -Number.MAX_VALUE ||
        bounds[2] === Number.MAX_VALUE ||
        bounds[3] === -Number.MAX_VALUE ||
        bounds[4] === Number.MAX_VALUE ||
        bounds[5] === -Number.MAX_VALUE) {
      return false;
    }

    return true;
  };

  /**
   * Set current bounds of the object.
   *
   * @param {number} minX Minimum x value.
   * @param {number} maxX Maximum x value.
   * @param {number} minY Minimum y value.
   * @param {number} maxY Maximum y value.
   * @param {number} minZ Minimum z value.
   * @param {number} maxZ Maximum z value.
   * @returns {boolean?} true if the bounds were set.
   */
  this.setBounds = function (minX, maxX, minY, maxY, minZ, maxZ) {
    if (!this.hasValidBounds([minX, maxX, minY, maxY, minZ, maxZ])) {
      return;
    }

    m_bounds[0] = minX;
    m_bounds[1] = maxX;
    m_bounds[2] = minY;
    m_bounds[3] = maxY;
    m_bounds[4] = minZ;
    m_bounds[5] = maxZ;

    this.modified();
    m_computeBoundsTimestamp.modified();

    return true;
  };

  /**
   * Reset bounds to default values.
   */
  this.resetBounds = function () {
    m_bounds[0] = Number.MAX_VALUE;
    m_bounds[1] = -Number.MAX_VALUE;
    m_bounds[2] = Number.MAX_VALUE;
    m_bounds[3] = -Number.MAX_VALUE;
    m_bounds[4] = Number.MAX_VALUE;
    m_bounds[5] = -Number.MAX_VALUE;

    this.modified();
  };

  /**
   * Compute bounds of the object.
   *
   * Should be implemented by the concrete class.
   */
  this.computeBounds = function () {
  };

  /**
   * Return bounds computation modification time.
   *
   * @returns {geo.timestamp}
   */
  this.computeBoundsTimestamp = function () {
    return m_computeBoundsTimestamp;
  };

  /**
   * Return bounds dirty timestamp.
   *
   * @returns {geo.timestamp}
   */
  this.boundsDirtyTimestamp = function () {
    return m_boundsDirtyTimestamp;
  };

  this.resetBounds();

  return this;
};

vgl.boundingObject.ReferenceFrame = {
  Relative : 0,
  Absolute : 1
};

inherit(vgl.boundingObject, vgl.object);
