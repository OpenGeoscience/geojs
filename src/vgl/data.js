var vgl = require('./vgl');

/**
 * Create a new instance of class data.
 *
 * @class
 * @alias vgl.data
 * @returns {vgl.data}
 */
vgl.data = function () {
  'use strict';

  if (!(this instanceof vgl.data)) {
    return new vgl.data();
  }

  /**
   * Return data type. Should be implemented by the derived class.
   */
  this.type = function () {
  };
};

vgl.data.raster = 0;
vgl.data.point = 1;
vgl.data.lineString = 2;
vgl.data.polygon = 3;
vgl.data.geometry = 10;
