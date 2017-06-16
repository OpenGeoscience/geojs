var inherit = require('./inherit');
var registerFileReader = require('./registry').registerFileReader;
var fileReader = require('./fileReader');

/**
* Create a new instance of class jsonReader
*
* @class geo.jsonReader
* @extends geo.fileReader
* @returns {geo.jsonReader}
*/
var jsonReader = function (arg) {
  'use strict';
  if (!(this instanceof jsonReader)) {
    return new jsonReader(arg);
  }

  var $ = require('jquery');
  var convertColor = require('./util').convertColor;

  var m_this = this;

  fileReader.call(this, arg);

  this.canRead = function (file) {
    if (file instanceof File) {
      return (file.type === 'application/json' || file.name.match(/\.json$/));
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

  this._readObject = function (file, done, progress) {
    var object;
    function onDone(fileString) {
      if (typeof fileString !== 'string') {
        done(false);
      }

      // We have two possibilities here:
      // 1) fileString is a JSON string or is
      // a URL.
      try {
        object = JSON.parse(fileString);
        done(object);
      } catch (e) {
        if (!object) {
          $.ajax({
            type: 'GET',
            url: fileString,
            dataType: 'text'
          }).done(function (data) {
            object = JSON.parse(data);
            done(object);
          }).fail(function () {
            done(false);
          });
        }
      }
    }

    if (file instanceof File) {
      m_this._getString(file, onDone, progress);
    } else if (typeof file === 'string') {
      onDone(file);
    } else {
      done(file);
    }
  };

  /**
   * Return an array of normalized geojson features.  This
   * will do the following:
   *
   * 1. Turn bare geometries into features
   * 2. Turn multi-geometry features into single geometry features
   *
   * Returns an array of Point, LineString, or Polygon features.
   * @protected
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
   * Normalize a feature object turning multi geometry features
   * into an array of features, and single geometry features into
   * an array containing one feature.
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
   */
  this._position = function (p) {
    return {
      x: p[0],
      y: p[1],
      z: p[2] || 0
    };
  };

  /**
   * Defines a style accessor the returns the given
   * value of the property object, or a default value.
   *
   * @protected
   * @param {string} prop The property name
   * @param {object} default The default value
   * @param {object} [spec] The argument containing the main property object
   * @param {function} [convert] An optional conversion function
   */
  this._style = function (prop, _default, spec, convert) {
    convert = convert || function (d) { return d; };
    _default = convert(_default);
    return function (d, i, e, j) {
      var p;
      if (spec && j !== undefined && spec[j] !== undefined) {
        p = spec[j].properties;
      } else {
        p = d.properties;
      }
      if (p !== undefined && p.hasOwnProperty(prop)) {
        return convert(p[prop]);
      }
      return _default;
    };
  };

  this.read = function (file, done, progress) {

    function _done(object) {
      var features, allFeatures = [], points, lines, polygons;

      features = m_this._featureArray(object);

      // process points
      points = features.filter(function (f) { return f.geometry.type === 'Point'; });
      if (points.length) {
        allFeatures.push(
          m_this.layer().createFeature('point')
            .data(points)
            .position(function (d) {
              return m_this._position(d.geometry.coordinates);
            })
            .style({
              fill: m_this._style('fill', true),
              fillColor: m_this._style('fillColor', '#ff7800', null, convertColor),
              fillOpacity: m_this._style('fillOpacity', 0.8),
              stroke: m_this._style('stroke', true),
              strokeColor: m_this._style('strokeColor', '#000000', null, convertColor),
              strokeWidth: m_this._style('strokeWidth', 1),
              strokeOpacity: m_this._style('strokeOpacity', 1),
              radius: m_this._style('radius', 8)
            })
        );
      }

      // process lines
      lines = features.filter(function (f) { return f.geometry.type === 'LineString'; });
      if (lines.length) {
        allFeatures.push(
          m_this.layer().createFeature('line')
            .data(lines)
            .line(function (d) {
              return d.geometry.coordinates;
            })
            .position(m_this._position)
            .style({
              strokeColor: m_this._style('strokeColor', '#ff7800', lines, convertColor),
              strokeWidth: m_this._style('strokeWidth', 4, lines),
              strokeOpacity: m_this._style('strokeOpacity', 0.5, lines),
              strokeOffset: m_this._style('strokeOffset', 0, lines),
              lineCap: m_this._style('lineCap', 'butt', lines),
              lineJoin: m_this._style('lineCap', 'miter', lines),
              closed: m_this._style('closed', false, lines)
            })
        );
      }

      // process polygons
      polygons = features.filter(function (f) { return f.geometry.type === 'Polygon'; });
      if (polygons.length) {
        allFeatures.push(
          m_this.layer().createFeature('polygon')
            .data(polygons)
            .polygon(function (d, i) {
              return {
                outer: d.geometry.coordinates[0],
                inner: d.geometry.coordinates.slice(1)
              };
            })
            .position(m_this._position)
            .style({
              fill: m_this._style('fill', true),
              fillColor: m_this._style('fillColor', '#b0de5c', polygons, convertColor),
              fillOpacity: m_this._style('fillOpacity', 0.8, polygons),
              stroke: m_this._style('stroke', true),
              strokeColor: m_this._style('strokeColor', '#999999', polygons, convertColor),
              strokeWidth: m_this._style('strokeWidth', 2, polygons),
              strokeOpacity: m_this._style('strokeOpacity', 1, polygons)
            })
        );
      }
      if (done) {
        done(allFeatures);
      }
    }

    m_this._readObject(file, _done, progress);
  };
};

inherit(jsonReader, fileReader);
registerFileReader('jsonReader', jsonReader);
module.exports = jsonReader;
