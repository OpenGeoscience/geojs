var vgl = require('./vgl');
var inherit = require('../inherit');
var vec3 = require('gl-vec3');
var mat4 = require('gl-mat4');

/**
 * Create a new instance of class actor.
 *
 * @class
 * @alias vgl.actor
 * @extends vgl.node
 * @returns {vgl.actor}
 */
vgl.actor = function () {
  'use strict';

  if (!(this instanceof vgl.actor)) {
    return new vgl.actor();
  }
  vgl.node.call(this);

  var m_this = this,
      m_transformMatrix = mat4.create(),
      m_referenceFrame = vgl.boundingObject.ReferenceFrame.Relative,
      m_mapper = null;

  /**
   * Get transformation matrix used by the actor.
   *
   * @returns {mat4} The transformation matrix.
   */
  this.matrix = function () {
    return m_transformMatrix;
  };

  /**
   * Get reference frame for the transformations.
   *
   * @returns {string} Possible values are Absolute or Relative
   */
  this.referenceFrame = function () {
    return m_referenceFrame;
  };

  /**
   * Return mapper where actor gets it behavior and data.
   *
   * @returns {vgl.mapper}
   */
  this.mapper = function () {
    return m_mapper;
  };

  /**
   * Connect an actor to its data source.
   *
   * @param {vgl.mapper} mapper The vlg mapper object.
   */
  this.setMapper = function (mapper) {
    if (mapper !== m_mapper) {
      m_mapper = mapper;
      m_this.boundsModified();
    }
  };

  /**
   * Compute actor bounds.
   */
  this.computeBounds = function () {
    if (m_mapper === null || m_mapper === undefined) {
      m_this.resetBounds();
      return;
    }

    var computeBoundsTimestamp = m_this.computeBoundsTimestamp(),
        mapperBounds, minPt, maxPt, newBounds;

    if (m_this.boundsDirtyTimestamp().getMTime() > computeBoundsTimestamp.getMTime() ||
      m_mapper.boundsDirtyTimestamp().getMTime() > computeBoundsTimestamp.getMTime()) {

      m_mapper.computeBounds();
      mapperBounds = m_mapper.bounds();

      minPt = [mapperBounds[0], mapperBounds[2], mapperBounds[4]];
      maxPt = [mapperBounds[1], mapperBounds[3], mapperBounds[5]];

      vec3.transformMat4(minPt, minPt, m_transformMatrix);
      vec3.transformMat4(maxPt, maxPt, m_transformMatrix);

      newBounds = [
        minPt[0] > maxPt[0] ? maxPt[0] : minPt[0],
        minPt[0] > maxPt[0] ? minPt[0] : maxPt[0],
        minPt[1] > maxPt[1] ? maxPt[1] : minPt[1],
        minPt[1] > maxPt[1] ? minPt[1] : maxPt[1],
        minPt[2] > maxPt[2] ? maxPt[2] : minPt[2],
        minPt[2] > maxPt[2] ? minPt[2] : maxPt[2]
      ];

      m_this.setBounds(newBounds[0], newBounds[1],
                       newBounds[2], newBounds[3],
                       newBounds[4], newBounds[5]);

      computeBoundsTimestamp.modified();
    }
  };

  return m_this;
};

inherit(vgl.actor, vgl.node);
