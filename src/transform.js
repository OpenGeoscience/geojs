var proj4 = require('proj4');

//////////////////////////////////////////////////////////////////////////////
/**
 * This purpose of this class is to provide a generic interface for computing
 * coordinate transformationss.  The interface is taken from the proj4js,
 * which also provides the geospatial projection implementation.  The
 * interface is intentionally simple to allow for custom, non-geospatial use
 * cases. For further details, see http://proj4js.org/
 *
 * The default transforms lat/long coordinates into web mercator
 * for use with standard tile sets.
 *
 * This class is intended to be extended in the future to support 2.5 and 3
 * dimensional transformations.  The forward/inverse methods take optional
 * z values that are ignored in current mapping context, but will in the
 * future perform more general 3D transformations.
 *
 * @class geo.transform
 * @param {object} options Constructor options
 * @param {string} options.source A proj4 string for the source projection
 * @param {string} options.target A proj4 string for the target projection
 * @returns {geo.transform}
 */
//////////////////////////////////////////////////////////////////////////////

var transform = function (options) {
  'use strict';
  if (!(this instanceof transform)) {
    return new transform(options);
  }

  var m_this = this,
      m_proj,   // The raw proj4js object
      m_source, // The source projection
      m_target; // The target projection

  /**
   * Generate the internal proj4 object.
   * @private
   */
  function generate_proj4() {
    m_proj = new proj4(
      m_this.source(),
      m_this.target()
    );
  }

  /**
   * Get/Set the source projection
   */
  this.source = function (arg) {
    if (arg === undefined) {
      return m_source || 'EPSG:4326';
    }
    m_source = arg;
    generate_proj4();
    return m_this;
  };

  /**
   * Get/Set the target projection
   */
  this.target = function (arg) {
    if (arg === undefined) {
      return m_target || 'EPSG:3857';
    }
    m_target = arg;
    generate_proj4();
    return m_this;
  };

  /**
   * Perform a forward transformation (source -> target)
   * @protected
   *
   * @param {object}   point      The point coordinates
   * @param {number}   point.x    The x-coordinate (i.e. longitude)
   * @param {number}   point.y    The y-coordinate (i.e. latitude)
   * @param {number}  [point.z=0] The z-coordinate (i.e. elevation)
   *
   * @returns {object} A point object in the target coordinates
   */
  this._forward = function (point) {
    var pt = m_proj.forward(point);
    pt.z = point.z || 0;
    return pt;
  };

  /**
   * Perform an inverse transformation (target -> source)
   * @protected
   *
   * @param {object}   point     The point coordinates
   * @param {number}   point.x   The x-coordinate (i.e. longitude)
   * @param {number}   point.y   The y-coordinate (i.e. latitude)
   * @param {number}  [point.z=0] The z-coordinate (i.e. elevation)
   *
   * @returns {object} A point object in the source coordinates
   */
  this._inverse = function (point) {
    var pt = m_proj.inverse(point);
    pt.z = point.z || 0;
    return pt;
  };

  /**
   * Perform a forward transformation (source -> target) in place
   *
   * @param {object[]} point      The point coordinates or array of points
   * @param {number}   point.x    The x-coordinate (i.e. longitude)
   * @param {number}   point.y    The y-coordinate (i.e. latitude)
   * @param {number}  [point.z=0] The z-coordinate (i.e. elevation)
   *
   * @returns {object} A point object or array in the target coordinates
   */
  this.forward = function (point) {
    if (Array.isArray(point)) {
      return point.map(m_this._forward);
    }
    return m_this._forward(point);
  };

  /**
   * Perform an inverse transformation (target -> source) in place
   * @protected
   *
   * @param {object[]} point      The point coordinates or array of points
   * @param {number}   point.x    The x-coordinate (i.e. longitude)
   * @param {number}   point.y    The y-coordinate (i.e. latitude)
   * @param {number}  [point.z=0] The z-coordinate (i.e. elevation)
   *
   * @returns {object} A point object in the source coordinates
   */
  this.inverse = function (point) {
    if (Array.isArray(point)) {
      return point.map(m_this._inverse);
    }
    return m_this._inverse(point);
  };

  // Set defaults given by the constructor
  options = options || {};
  try {
    this.source(options.source);
  } catch (err) {
    console.error('Can\'t use transform source: ' + options.source);
    this.source('EPSG:4326');
  }
  try {
    this.target(options.target);
  } catch (err) {
    console.error('Can\'t use transform target: ' + options.target);
    this.target('EPSG:3857');
  }

  return this;
};

/**
 * Contains a reference to `proj4.defs`.  The functions serves two
 * purposes.
 *
 *   1. It is a key value mapping of all loaded projection definitions
 *   2. It is a function that will add additional definitions.
 *
 * See:
 *   http://proj4js.org/
 */
transform.defs = proj4.defs;

/**
 * Look up a projection definition from epsg.io
 * For the moment, we only handle `EPSG` codes.
 *
 * @param {string} projection A projection alias (e.g. EPSG:4326)
 * @returns {promise} Resolves with the proj4 definition
 */
transform.lookup = function (projection) {
  var $ = require('jquery');
  var code, defer = new $.Deferred(), parts;

  if (proj4.defs.hasOwnProperty(projection)) {
    return defer.resolve(proj4.defs[projection]);
  }

  parts = projection.split(':');
  if (parts.length !== 2 || parts[0].toUpperCase() !== 'EPSG') {
    return defer.reject('Invalid projection code').promise();
  }
  code = parts[1];

  return $.ajax({
    url: 'http://epsg.io/?q=' + code + '&format=json'
  }).then(function (data) {
    var result = (data.results || [])[0];
    if (!result || !result.proj4) {
      return defer.reject(data).promise();
    }

    proj4.defs(projection, result.proj4);
    return $.when(proj4.defs[projection]);
  });
};

/**
 * Transform an array of coordinates from one projection into another.  The
 * transformation may occur in place (modifying the input coordinate array),
 * depending on the input format.  The coordinates can be an object with x, y,
 * and (optionally z) or an array of 2 or 3 values, or an array of either of
 * those, or a single flat array with 2 or 3 components per coordinate.  Arrays
 * are always modified in place.  Individual point objects are not altered; new
 * point objects are returned unless no transform is needed.
 *
 * @param {string}        srcPrj The source projection
 * @param {string}        tgtPrj The destination projection
 * @param {geoPosition[]} coordinates An array of coordinate objects
 * @param {number}        numberOfComponents for flat arrays, either 2 or 3.
 *
 * @returns {geoPosition[]} The transformed coordinates
 */
transform.transformCoordinates = function (
        srcPrj, tgtPrj, coordinates, numberOfComponents) {
  'use strict';

  if (srcPrj === tgtPrj) {
    return coordinates;
  }

  var i, count, offset, xAcc, yAcc, zAcc, writer, output, projPoint,
      trans = transform({source: srcPrj, target: tgtPrj});

  /// Default Z accessor
  zAcc = function () {
    return 0.0;
  };

  /// Helper methods
  function handleArrayCoordinates() {
    if (coordinates[0] instanceof Array) {
      if (coordinates[0].length === 2) {
        xAcc = function (index) {
          return coordinates[index][0];
        };
        yAcc = function (index) {
          return coordinates[index][1];
        };
        writer = function (index, x, y) {
          output[index] = [x, y];
        };
      } else if (coordinates[0].length === 3) {
        xAcc = function (index) {
          return coordinates[index][0];
        };
        yAcc = function (index) {
          return coordinates[index][1];
        };
        zAcc = function (index) {
          return coordinates[index][2];
        };
        writer = function (index, x, y, z) {
          output[index] = [x, y, z];
        };
      } else {
        throw 'Invalid coordinates. Requires two or three components per array';
      }
    } else {
      if (coordinates.length === 2) {
        offset = 2;

        xAcc = function (index) {
          return coordinates[index * offset];
        };
        yAcc = function (index) {
          return coordinates[index * offset + 1];
        };
        writer = function (index, x, y) {
          output[index] = x;
          output[index + 1] = y;
        };
      } else if (coordinates.length === 3) {
        offset = 3;

        xAcc = function (index) {
          return coordinates[index * offset];
        };
        yAcc = function (index) {
          return coordinates[index * offset + 1];
        };
        zAcc = function (index) {
          return coordinates[index * offset + 2];
        };
        writer = function (index, x, y, z) {
          output[index] = x;
          output[index + 1] = y;
          output[index + 2] = z;
        };
      } else if (numberOfComponents) {
        if (numberOfComponents === 2 || numberOfComponents === 3) {
          offset = numberOfComponents;

          xAcc = function (index) {
            return coordinates[index];
          };
          yAcc = function (index) {
            return coordinates[index + 1];
          };
          if (numberOfComponents === 2) {
            writer = function (index, x, y) {
              output[index] = x;
              output[index + 1] = y;
            };
          } else {
            zAcc = function (index) {
              return coordinates[index + 2];
            };
            writer = function (index, x, y, z) {
              output[index] = x;
              output[index + 1] = y;
              output[index + 2] = z;
            };
          }
        } else {
          throw 'Number of components should be two or three';
        }
      } else {
        throw 'Invalid coordinates';
      }
    }
  }

  /// Helper methods
  function handleObjectCoordinates() {
    if (coordinates[0] &&
        'x' in coordinates[0] &&
        'y' in coordinates[0]) {
      xAcc = function (index) {
        return coordinates[index].x;
      };
      yAcc = function (index) {
        return coordinates[index].y;
      };

      if ('z' in coordinates[0]) {
        zAcc = function (index) {
          return coordinates[index].z;
        };
        writer = function (index, x, y, z) {
          output[i] = {x: x, y: y, z: z};
        };
      } else {
        writer = function (index, x, y) {
          output[index] = {x: x, y: y};
        };
      }
    } else if (coordinates && 'x' in coordinates && 'y' in coordinates) {
      xAcc = function () {
        return coordinates.x;
      };
      yAcc = function () {
        return coordinates.y;
      };

      if ('z' in coordinates) {
        zAcc = function () {
          return coordinates.z;
        };
        writer = function (index, x, y, z) {
          output = {x: x, y: y, z: z};
        };
      } else {
        writer = function (index, x, y) {
          output = {x: x, y: y};
        };
      }
    } else {
      throw 'Invalid coordinates';
    }
  }

  if (coordinates instanceof Array) {
    output = [];
    output.length = coordinates.length;
    count = coordinates.length;

    if (coordinates[0] instanceof Array ||
        coordinates[0] instanceof Object) {
      offset = 1;

      if (coordinates[0] instanceof Array) {
        handleArrayCoordinates();
      } else if (coordinates[0] instanceof Object) {
        handleObjectCoordinates();
      }
    } else {
      handleArrayCoordinates();
    }
  } else if (coordinates && coordinates instanceof Object) {
    count = 1;
    offset = 1;
    if (coordinates && 'x' in coordinates && 'y' in coordinates) {
      handleObjectCoordinates();
    } else {
      throw 'Coordinates are not valid';
    }
  }

  for (i = 0; i < count; i += offset) {
    projPoint = trans.forward({x: xAcc(i), y: yAcc(i), z: zAcc(i)});
    writer(i, projPoint.x, projPoint.y, projPoint.z);
  }
  return output;
};

/**
 * Apply an affine transformation consisting of a translation
 * then a scaling to the given coordinate array.  Note, the
 * transformation occurs in place so the input coordinate
 * object are mutated.
 *
 * (Possibly extend to support rotations as well)
 *
 * @param {object} def
 * @param {object} def.origin The transformed origin
 * @param {object} def.scale The transformed scale factor
 * @param {object[]} coords An array of coordinate objects
 *
 * @returns {object[]} The transformed coordinates
 */
transform.affineForward = function (def, coords) {
  'use strict';
  var i, origin = def.origin, scale = def.scale || {x: 1, y: 1, z: 1};
  for (i = 0; i < coords.length; i += 1) {
    coords[i].x = (coords[i].x - origin.x) * scale.x;
    coords[i].y = (coords[i].y - origin.y) * scale.y;
    coords[i].z = ((coords[i].z || 0) - (origin.z || 0)) * scale.z;
  }
  return coords;
};

/**
 * Apply an inverse affine transformation which is the
 * inverse to {@link geo.transform.affineForward}.  Note, the
 * transformation occurs in place so the input coordinate
 * object are mutated.
 *
 * (Possibly extend to support rotations as well)
 *
 * @param {object} def
 * @param {object} def.origin The transformed origin
 * @param {object} def.scale The transformed scale factor
 * @param {object[]} coords An array of coordinate objects
 *
 * @returns {object[]} The transformed coordinates
 */
transform.affineInverse = function (def, coords) {
  'use strict';
  var i, origin = def.origin, scale = def.scale || {x: 1, y: 1, z: 1};
  for (i = 0; i < coords.length; i += 1) {
    coords[i].x = coords[i].x / scale.x + origin.x;
    coords[i].y = coords[i].y / scale.y + origin.y;
    coords[i].z = (coords[i].z || 0) / scale.z + (origin.z || 0);
  }
  return coords;
};

module.exports = transform;
