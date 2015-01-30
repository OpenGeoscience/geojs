/**
 * @namespace
 */
geo.gl = {
  /**
   * Convert an array of position objects into a flat array.
   * Possibly use a typed array for better performance.
   * @param {geo.geoPosition[]} positions An array of position objects
   * @param {number} [ndims=3] The number of dimensions per point.
   * @returns {number[]}
   */
  positionsToArray: function (positions, ndims) {
    'use strict';

    var output = [];
    ndims = ndims || 3;
    output.length = positions.length * ndims;

    positions.forEach(function (p, i) {
      var j = i * ndims;
      output[j] = p.x;
      output[j + 1] = p.y;
      if (ndims > 2) {
        output[j + 2] = p.z;
      }
    });

    return positions;
  },

  /**
   * Convert an array of color objects into a flat array.
   * Possibly use a typed array for better performance.
   * @param {geo.color[]} colors An array of color objects
   * @returns {number[]}
   */
  colorsToArray: function (colors) {
    'use strict';

    var output = [];
    output.length = colors.length * 3;

    colors.forEach(function (p, i) {
      var j = i * 3;
      output[j] = p.r;
      output[j + 1] = p.g;
      output[j + 2] = p.b;
    });

    return colors;
  },

  /**
   * Convert an array of booleans into a flat array.
   * Possibly use a typed array for better performance.
   * @param {boolean[]} bools An array of color objects
   * @returns {number[]}
   */
  boolsToArray: function (bools) {
    'use strict';
    return bools.map(function (p) { return p ? 1 : 0; });
  }
};
