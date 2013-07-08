//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image, vec3*/
/*global vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create an instance of quadratic surface generator
 * in Cartesian coordinates by the equation
 * <code>(x / a)^2 + (y / b)^2 + (z / c)^2 = 1</code>. Used
 * primarily to create planetary bodies
 *
 * @constructor
 * @param {Number} [x=0]  Radius in X direction
 * @param {Number} [y=0]  Radius in Y direction
 * @param {Number} [z=0]  Radius in Z direction
 *
 * @returns {geoModule.ellipsoid}
 */
 //////////////////////////////////////////////////////////////////////////////
geoModule.ellipsoid = function(x, y, z) {
  "use strict";
  if (!(this instanceof geoModule.ellipsoid)) {
    return new geoModule.ellipsoid(x, y, z);
  }

  x = ogs.vgl.defaultValue(x, 0.0);
  y = ogs.vgl.defaultValue(y, 0.0);
  z = ogs.vgl.defaultValue(z, 0.0);

  if (x < 0.0 || y < 0.0 || z < 0.0) {
    return console.log('[error] Al radii components must be greater than zero');
  }

  var m_radii = new vec3.fromValues(x, y, z),
      m_radiiSquared = new vec3.fromValues(
        x * x, y * y, z * z),
      m_minimumRadius = Math.min(x, y, z),
      m_maximumRadius = Math.max(x, y, z);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return radii of ellipsoid
   */
  ////////////////////////////////////////////////////////////////////////////
  this.radii = function() {
    return m_radii;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return squared radii of the ellipsoid
   */
  ////////////////////////////////////////////////////////////////////////////
  this.radiiSquared = function() {
    return m_radiiSquared;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return maximum radius of the ellipsoid
   *
   * @return {Number} The maximum radius of the ellipsoid
   */
  ////////////////////////////////////////////////////////////////////////////
  this.maximumRadius = function() {
    return m_maximumRadius;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return minimum radius of the ellipsoid
   *
   * @return {Number} The maximum radius of the ellipsoid
   */
  ////////////////////////////////////////////////////////////////////////////
  this.minimumRadius = function() {
    return m_minimumRadius;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Computes the normal of the plane tangent to the surface of
   * the ellipsoid at the provided position
   *
   * @param {Number} lat The cartographic latitude for which
   *  to to determine the geodetic normal
   * @param {Number} lon The cartographic longitude for which
   *  to to determine the geodetic normal
   *
   * @return {vec3}
   *
   * @exception {DeveloperError} cartographic is required.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeGeodeticSurfaceNormal = function(lat, lon) {
    if (typeof lat === 'undefined' || typeof lon === 'undefined') {
      throw '[error] Valid latitude and longitude is required';
    }

    var cosLatitude = Math.cos(lat),
        result = vec3.create();

    result[0] = cosLatitude * Math.cos(lon);
    result[1] = cosLatitude * Math.sin(lon);
    result[2] = Math.sin(lat);

    vec3.normalize(result, result);
    return result;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Converts the provided geographic latitude, longitude,
   * and height to WGS84 coordinate system
   *
   * @param {Number} lat Latitude in radians
   * @param {Number} lon Longitude in radians
   * @param {Number} elev Elevation
   * @return {vec3} Position in the WGS84 coordinate system
   */
  ////////////////////////////////////////////////////////////////////////////
  this.transformPoint = function(lat, lon, elev) {
    lat = lat *  (Math.PI / 180.0);
    lon = lon * (Math.PI / 180.0);

    var n = this.computeGeodeticSurfaceNormal(lat, lon),
        k = vec3.create(),
        gamma  = Math.sqrt(vec3.dot(n, k)),
        result = vec3.create();

    vec3.multiply(k, m_radiiSquared, n);
    vec3.scale(k, k, 1/gamma);
    vec3.scale(n, n, elev);
    vec3.add(result, n,  k);
    return result;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Converts the provided geographic latitude, longitude,
   * and height to WGS84 coordinate system
   *
   * @param {ogs.vgl.geometryData} geom
   */
  ////////////////////////////////////////////////////////////////////////////
  this.transformGeometry = function(geom) {
    if (!geom) {
      throw '[error] Failed to transform to cartesian. Invalid geometry.';
    }

    var sourceData = geom.sourceData(ogs.vgl.vertexAttributeKeys.Position),
        sourceDataArray = sourceData.data(),
        noOfComponents =  sourceData.attributeNumberOfComponents(
          ogs.vgl.vertexAttributeKeys.Position),
        stride = sourceData.attributeStride(
          ogs.vgl.vertexAttributeKeys.Position),
        offset = sourceData.attributeOffset(
          ogs.vgl.vertexAttributeKeys.Position),
        sizeOfDataType = sourceData.sizeOfAttributeDataType(
          ogs.vgl.vertexAttributeKeys.Position),
        index = null,
        count = sourceDataArray.length * (1.0 / noOfComponents),
        gamma = null,
        n = null,
        j = 0,
        k = vec3.create(),
        result = vec3.create();

    stride /= sizeOfDataType;
    offset /= sizeOfDataType;

    if (noOfComponents !== 3) {
      throw ('[error] Requires positions with three components');
    }

    for (j = 0; j < count; ++j) {
      index = j * stride + offset;

      sourceDataArray[index] = sourceDataArray[index] * (Math.PI / 180.0);
      sourceDataArray[index + 1] = sourceDataArray[index + 1] * (Math.PI / 180.0);

      n = this.computeGeodeticSurfaceNormal(sourceDataArray[index + 1],
                                            sourceDataArray[index]);
      vec3.multiply(k, m_radiiSquared, n);
      gamma = Math.sqrt(vec3.dot(n, k));
      vec3.scale(k, k, 1/gamma);
      vec3.scale(n, n, sourceDataArray[index + 2]);
      vec3.add(result, n,  k);

      sourceDataArray[index] = result[0];
      sourceDataArray[index + 1] = result[1];
      sourceDataArray[index + 2] = result[2];
    }
  };

  return this;
};

////////////////////////////////////////////////////////////////////////////
/**
 * An Ellipsoid instance initialized to the WGS84 standard.
 * @memberof ellipsoid
 *
 */
////////////////////////////////////////////////////////////////////////////
geoModule.ellipsoid.WGS84 = ogs.vgl.freezeObject(
  geoModule.ellipsoid(6378137.0, 6378137.0, 6356752.3142451793));

////////////////////////////////////////////////////////////////////////////
/**
 * An Ellipsoid instance initialized to radii of (1.0, 1.0, 1.0).
 * @memberof ellipsoid
 */
////////////////////////////////////////////////////////////////////////////
geoModule.ellipsoid.UNIT_SPHERE = ogs.vgl.freezeObject(
  geoModule.ellipsoid(1.0, 1.0, 1.0));
