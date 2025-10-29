var inherit = require('./inherit');
var registerFileReader = require('./registry').registerFileReader;
var fileReader = require('./fileReader');

/**
 * Object specification for a geojsonReader.
 *
 * @typedef {geo.fileReader.spec} geo.geojsonReader.spec
 * @extends geo.fileReader.spec
 * @property {geo.pointFeature.styleSpec} [pointStyle] Default style for
 *   points.
 * @property {geo.pointFeature.styleSpec} [lineStyle] Default style for lines.
 * @property {geo.pointFeature.styleSpec} [polygonStyle] Default style for
 *   polygons.
 */

/**
 * Create a new instance of class geo.geojsonReader.
 *
 * @class
 * @alias geo.geojsonReader
 * @extends geo.fileReader
 * @param {geo.fileReader.spec} arg
 * @returns {geo.geojsonReader}
 */
var geojsonReader = function (arg) {
  'use strict';
  if (!(this instanceof geojsonReader)) {
    return new geojsonReader(arg);
  }

  var $ = require('jquery');
  var convertColor = require('./util').convertColor;
  var markerFeature = require('./markerFeature');
  var transform = require('./transform');

  var m_this = this,
      m_options = {
        ...arg,
        pointStyle: {
          fill: true,
          fillColor: '#ff7800',
          fillOpacity: 0.8,
          stroke: true,
          strokeColor: '#000',
          strokeWidth: 1,
          strokeOpacity: 1,
          radius: 8,
          ...arg.pointStyle
        },
        lineStyle: {
          strokeColor: '#ff7800',
          strokeWidth: 4,
          strokeOpacity: 0.5,
          strokeOffset: 0,
          lineCap: 'butt',
          lineJoin: 'miter',
          uniformLine: true,
          closed: false,
          ...arg.lineStyle
        },
        polygonStyle: {
          fill: true,
          fillColor: '#b0de5c',
          fillOpacity: 0.8,
          stroke: true,
          strokeColor: '#999999',
          strokeWidth: 2,
          strokeOpacity: 1,
          uniformPolygon: true,
          ...arg.polygonStyle
        }
      };

  fileReader.call(this, m_options);

  /**
   * Tells the caller if it can handle the given file by returning a boolean.
   *
   * @param {File|Blob|string|object} file This is either a `File` object, a
   *    `Blob` object, a string representation of a file, or an object
   *    representing data from a file.
   * @returns {boolean} `true` if this reader can read a file.
   */
  this.canRead = function (file) {
    if (file instanceof File || file instanceof Blob) {
      return !!(file.type === 'application/json' || (file.name && file.name.match(/\.json$/)));
    } else if (typeof file === 'string') {
      try {
        JSON.parse(file);
      } catch (e) {
        return false;
      }
      return true;
    }
    try {
      if (Array.isArray(m_this._featureArray(file))) {
        return true;
      }
    } catch (e) {}
    return false;
  };

  /**
   * Read or parse a file or object, then call a done function.
   *
   * @param {File|Blob|string|object} file This is either a `File` object, a
   *    `Blob` object, a string representation of a file, or an object
   *    representing data from a file.
   * @param {Function} done A callback function when the read is complete.
   *    This is called with `false` on error or the object that was read but
   *    not yet parsed.
   * @param {Function} [progress] A function which is passed `ProgressEvent`
   *    information from a `FileReader`.  This includes `loaded` and `total`
   *    each with a number of bytes.
   */
  this._readObject = function (file, done, progress) {
    var object;
    function onDone(fileString) {
      // if fileString is not a JSON string, expect it to be a URL.
      try {
        object = JSON.parse(fileString);
        done(object);
      } catch (err) {
        if (!object) {
          $.ajax({
            type: 'GET',
            url: fileString,
            dataType: 'text'
          }).done(function (data) {
            try {
              object = JSON.parse(data);
              done(object);
            } catch (err) {
              if (!object) {
                done(false);
              }
            }
          }).fail(function () {
            done(false);
          });
        }
      }
    }

    if (file instanceof File || file instanceof Blob) {
      m_this._getString(file, onDone, progress);
    } else if (typeof file === 'string') {
      onDone(file);
    } else {
      done(file);
    }
  };

  /**
   * Return an array of normalized geojson features.  This turns bare
   * geometries into features and multi-geometry features into single geometry
   * features.
   *
   * Returns an array of Point, LineString, or Polygon features.
   * @param {geojson.object} spec A parsed geojson object.
   * @returns {geojson.FeatureObject[]} An array of feature objects, none of
   *    which include multi-geometries, and none have empty geometries.
   */
  this._featureArray = function (spec) {
    var features, normalized = [];
    switch (spec.type) {
      case 'FeatureCollection':
        features = spec.features;
        break;

      case 'Feature':
        features = [spec];
        break;

      case 'GeometryCollection':
        features = spec.geometries.map(function (g) {
          return {
            type: 'Feature',
            geometry: g,
            properties: {}
          };
        });
        break;

      case 'Point':
      case 'LineString':
      case 'Polygon':
      case 'MultiPoint':
      case 'MultiLineString':
      case 'MultiPolygon':
        features = [{
          type: 'Feature',
          geometry: spec,
          properties: {}
        }];
        break;

      default:
        throw new Error('Invalid json type');
    }

    // flatten multi features
    features.forEach(function (feature) {
      Array.prototype.push.apply(normalized, m_this._feature(feature));
    });

    // remove features with empty geometries
    normalized = normalized.filter(function (feature) {
      return feature.geometry &&
        feature.geometry.coordinates &&
        feature.geometry.coordinates.length;
    });
    return normalized;
  };

  /**
   * Normalize a feature object turning multi geometry features into an array
   * of features, and single geometry features into an array containing one
   * feature.
   *
   * @param {geojson.object} spec A parsed geojson object.
   * @returns {geojson.FeatureObject[]} An array of feature objects, none of
   *    which include multi-geometries.
   */
  this._feature = function (spec) {
    if (spec.type !== 'Feature') {
      throw new Error('Invalid feature object');
    }
    switch (spec.geometry.type) {
      case 'Point':
      case 'LineString':
      case 'Polygon':
        return [spec];

      case 'MultiPoint':
      case 'MultiLineString':
      case 'MultiPolygon':
        return spec.geometry.coordinates.map(function (c) {
          return {
            type: 'Feature',
            geometry: {
              type: spec.geometry.type.replace('Multi', ''),
              coordinates: c
            },
            properties: spec.properties
          };
        });

      default:
        throw new Error('Invalid geometry type');
    }
  };

  /**
   * Convert from a geojson position array into a geojs position object.
   *
   * @param {number[]} p A coordinate in the form of an array with two or three
   *    components.
   * @returns {geo.geoPosition}
   */
  this._position = function (p) {
    return {
      x: p[0],
      y: p[1],
      z: p[2] || 0
    };
  };

  /**
   * Defines a style accessor the returns the given value of the property
   * object or a default value.
   *
   * @param {string} prop The property name.
   * @param {object} _default The default value.
   * @returns {Function} A style function for the property.
   */
  this._style = function (prop, _default) {
    var isColor = prop.toLowerCase().match(/color$/);
    if (isColor) {
      _default = convertColor(_default);
    }
    return function (v, j, d, i) {
      var p;
      if (d !== undefined && d.properties) {
        p = d.properties;
      } else {
        p = v.properties;
      }
      if (p !== undefined && p.hasOwnProperty(prop)) {
        return isColor ? convertColor(p[prop]) : p[prop];
      }
      return _default;
    };
  };

  /**
   * Reads the file and optionally calls a function when finished.  The `done`
   * function is called with a list of {@link geo.feature} on success or
   * `false` on failure.
   *
   * @param {File|Blob|string|object} file This is either a `File` object, a
   *    `Blob` object, a string representation of a file, or an object
   *    representing data from a file.
   * @param {Function} [done] An optional callback function when the read is
   *    complete.  This is called with `false` on error or a list of
   *    {@link geo.feature} on success.
   * @param {Function} [progress] A function which is passed `ProgressEvent`
   *    information from a `FileReader`.  This includes `loaded` and `total`
   *    each with a number of bytes.
   * @returns {Promise} A `Promise` that resolves with a list of
   *    {@link geo.feature} or is rejected if the reader fails.
   */
  this.read = function (file, done, progress) {
    var promise = new Promise(function (resolve, reject) {
      /**
       * Check if a feature is a circle or an ellipse.
       *
       * @param {geojson.object} f A geojson feature.
       * @returns {boolean} true if this should be rendered as an ellipse or
       *   circle.
       */
      function _isEllipse(f) {
        if (f.geometry.type !== 'Polygon' || f.geometry.coordinates.length !== 1 || f.geometry.coordinates[0].length !== 5) {
          return false;
        }
        return (
          (f.properties || {}).annotationType === 'ellipse' ||
          (f.properties || {}).annotationType === 'circle');
      }

      /**
       * Given a parsed GeoJSON object, convert it into features on the
       * reader's layer.
       *
       * @param {geojson.object|false} object Either a parse GeoJSON object or
       *    `false` for an error.
       */
      function _done(object) {
        if (object === false) {
          if (done) {
            done(object);
          }
          reject(new Error('Failed to parse GeoJSON'));
          return;
        }
        let features, feature;
        const allFeatures = [];

        try {
          features = m_this._featureArray(object);
        } catch (err) {
          reject(err);
          return;
        }

        // process points
        const points = features.filter(f => f.geometry.type === 'Point');
        if (points.length) {
          feature = m_this.layer().createFeature('point');
          if (feature) {
            feature
              .data(points)
              .position(d => m_this._position(d.geometry.coordinates))
              // create an object with each property in m_options.pointStyle,
              // mapping the values through the _style function.
              .style(
                [{}].concat(Object.keys(m_options.pointStyle)).reduce(
                  (styleObj, key) => ({
                    [key]: points.some(d => d.properties && d.properties[key] !== undefined) ?
                      m_this._style(key, m_options.pointStyle[key]) :
                      m_options.pointStyle[key],
                    ...styleObj
                  }
                  ))
              );
            allFeatures.push(feature);
          }
        }

        // process lines
        const lines = features.filter(f => f.geometry.type === 'LineString');
        if (lines.length) {
          feature = m_this.layer().createFeature('line');
          if (feature) {
            feature
              .data(lines)
              .line(d => d.geometry.coordinates)
              .position(m_this._position)
              // create an object with each property in m_options.lineStyle,
              // mapping the values through the _style function.
              .style(
                [{}].concat(Object.keys(m_options.lineStyle)).reduce(
                  (styleObj, key) => ({
                    [key]: lines.some(d => d.properties && d.properties[key] !== undefined) ?
                      m_this._style(key, m_options.lineStyle[key]) :
                      m_options.lineStyle[key],
                    ...styleObj
                  }
                  ))
              );
            allFeatures.push(feature);
          }
        }

        // process polygons
        const polygons = features.filter(f => f.geometry.type === 'Polygon' && !_isEllipse(f));
        if (polygons.length) {
          feature = m_this.layer().createFeature('polygon');
          if (feature) {
            feature
              .data(polygons)
              .polygon((d, i) => ({
                outer: d.geometry.coordinates[0],
                inner: d.geometry.coordinates.slice(1)
              }))
              .position(m_this._position)
              // create an object with each property in m_options.polygonStyle,
              // mapping the values through the _style function.
              .style(
                [{}].concat(Object.keys(m_options.polygonStyle)).reduce(
                  (styleObj, key) => ({
                    [key]: polygons.some(d => d.properties && d.properties[key] !== undefined) ?
                      m_this._style(key, m_options.polygonStyle[key]) :
                      m_options.polygonStyle[key],
                    ...styleObj
                  }
                  ))
              );
            allFeatures.push(feature);
          }
        }
        // handle ellipses and circle
        const ellipses = features.filter(_isEllipse);
        if (ellipses.length) {
          feature = m_this.layer().createFeature('marker');
          if (feature) {
            ellipses.forEach((d) => {
              const map = m_this.layer().map();
              const coord = transform.transformCoordinates(map.ingcs(), map.gcs(), d.geometry.coordinates[0]);
              const w = ((coord[0][0] - coord[1][0]) ** 2 + (coord[0][1] - coord[1][1]) ** 2) ** 0.5;
              const h = ((coord[0][0] - coord[3][0]) ** 2 + (coord[0][1] - coord[3][1]) ** 2) ** 0.5;
              const radius = Math.max(w, h) / 2 / map.unitsPerPixel(0);
              const aspect = w ? h / w : 1e20;
              const rotation = -Math.atan2(coord[1][1] - coord[0][1], coord[1][0] - coord[0][0]);
              const pos = transform.transformCoordinates(map.gcs(), map.ingcs(), {
                x: (coord[0][0] + coord[1][0] + coord[2][0] + coord[3][0]) / 4,
                y: (coord[0][1] + coord[1][1] + coord[2][1] + coord[3][1]) / 4
              });
              d._props = {
                pos: pos,
                radius: radius,
                aspect: aspect,
                rotation: rotation
              };
            });
            feature
              .data(ellipses)
              .position((d) => d._props.pos)
              // create an object with each property in m_options.polygonStyle,
              // mapping the values through the _style function.
              .style(
                [{}].concat(Object.keys(m_options.polygonStyle)).reduce(
                  (styleObj, key) => ({
                    [key]: ellipses.some(d => d.properties && d.properties[key] !== undefined) ?
                      m_this._style(key, m_options.polygonStyle[key]) :
                      m_options.polygonStyle[key],
                    radius: (d) => d._props.radius,
                    radiusIncludesStroke: false,
                    symbolValue: (d) => d._props.aspect,
                    rotation: (d) => d._props.rotation,
                    strokeOffset: 0,
                    rotateWithMap: true,
                    scaleWithZoom: markerFeature.scaleMode.fill,
                    ...styleObj
                  }
                  ))
              );
            allFeatures.push(feature);
          }
        }
        if (done) {
          done(allFeatures);
        }
        resolve(allFeatures);
      }

      m_this._readObject(file, _done, progress);
    });
    m_this.addPromise(promise);
    return promise;
  };
};

inherit(geojsonReader, fileReader);
registerFileReader('geojsonReader', geojsonReader);
// Also register under an alternate name (alias for backwards compatibility)
registerFileReader('jsonReader', geojsonReader);
module.exports = geojsonReader;
