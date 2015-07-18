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
 * @class
 * @extends geo.object
 * @param {object} options Constructor options
 * @param {string} options.source A proj4 string for the source projection
 * @param {string} options.target A proj4 string for the target projection
 * @returns {geo.transform}
 */
//////////////////////////////////////////////////////////////////////////////

geo.transform = function (options) {
  'use strict';
  if (!(this instanceof geo.transform)) {
    return new geo.transform(options);
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
      return point.map(this._forward);
    }
    return this._forward(point);
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
      return point.map(this._inverse);
    }
    return this._inverse(point);
  };

  // Set defaults given by the constructor
  options = options || {};
  this.source(options.source);
  this.target(options.target);

  geo.object.call(this);
  return this;
};

/**
 * Transform an array of coordinates from one projection into
 * another.  The transformation will occur in place (modifying
 * the input coordinate array).
 *
 * @param {string}        srcPrj  The source projection
 * @param {string}        tgtPrj The destination projection
 * @param {geoPosition[]} coords   An array of coordinate objects
 *
 * @returns {geoPosition[]} The transformed coordinates
 */
geo.transform.transformCoordinates = function (srcPrj, tgtPrj, coords) {
  'use strict';

  var i, trans = geo.transform({source: srcPrj, target: tgtPrj});
  for (i = 0; i < coords.length; i += 1) {
    coords[i] = trans.forward(coords[i]);
  }
  return coords;
};

inherit(geo.transform, geo.object);
