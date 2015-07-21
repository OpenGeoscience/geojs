/*global File*/
//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class jsonReader
 *
 * @class
 * @extends geo.fileReader
 * @returns {geo.jsonReader}
 */
//////////////////////////////////////////////////////////////////////////////
geo.jsonReader = function (arg) {
  'use strict';
  if (!(this instanceof geo.jsonReader)) {
    return new geo.jsonReader(arg);
  }

  var m_this = this, m_style = arg.style || {};
  m_style = $.extend({
      'strokeWidth': 2,
      'strokeColor': {r: 0, g: 0, b: 0},
      'strokeOpacity': 1,
      'fillColor': {r: 1, g: 0, b: 0},
      'fillOpacity': 1
    }, m_style);

  geo.fileReader.call(this, arg);

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

  this._featureArray = function (spec) {
    if (spec.type === 'FeatureCollection') {
      return spec.features || [];
    }
    if (spec.type === 'GeometryCollection') {
      throw 'GeometryCollection not yet implemented.';
    }
    if (Array.isArray(spec.coordinates)) {
      return spec;
    }
    throw 'Unsupported collection type: ' + spec.type;
  };

  this._featureType = function (spec) {
    var geometry = spec.geometry || {};
    if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
      return 'point';
    }
    if (geometry.type === 'LineString') {
      return 'line';
    }
    if (geometry.type === 'Polygon') {
      return 'polygon';
    }
    if (geometry.type === 'MultiPolygon') {
      return 'multipolygon';
    }
    return null;
  };

  this._getCoordinates = function (spec) {
    var geometry = spec.geometry || {},
        coordinates = geometry.coordinates || [], elv;

    if ((coordinates.length === 2 || coordinates.length === 3) &&
        (isFinite(coordinates[0]) && isFinite(coordinates[1]))) {

      // Do we have a elevation component
      if (isFinite(coordinates[2])) {
        elv = coordinates[2];
      }

      // special handling for single point coordinates
      return [{x: coordinates[0], y: coordinates[1], z: elv}];
    }

    // need better handling here, but we can plot simple polygons
    // by taking just the outer linearring
    if (Array.isArray(coordinates[0][0])) {
      coordinates = coordinates[0];
    }

    // return an array of points for LineString, MultiPoint, etc...
    return coordinates.map(function (c) {
      return {
        x: c[0],
        y: c[1],
        z: c[2]
      };
    });
  };

  this._getStyle = function (spec) {
    return spec.properties;
  };

  this.read = function (file, done, progress) {

    function _done(object) {
      var features, allFeatures = [];

      features = m_this._featureArray(object);

      features.forEach(function (feature) {
        var type = m_this._featureType(feature),
            coordinates = m_this._getCoordinates(feature),
            style = m_this._getStyle(feature);
        if (type) {
          if (type === 'line') {
            style.fill = style.fill || false;
            allFeatures.push(m_this._addFeature(
              type,
              [coordinates],
              style,
              feature.properties
            ));
          } else if (type === 'point') {
            style.stroke = style.stroke || false;
            allFeatures.push(m_this._addFeature(
              type,
              coordinates,
              style,
              feature.properties
            ));
          } else if (type === 'polygon') {
            style.fill = style.fill === undefined ? true : style.fill;
            style.fillOpacity = (
              style.fillOpacity === undefined ? 0.25 : style.fillOpacity
            );
            // polygons not yet supported
            allFeatures.push(m_this._addFeature(
              'line',
              [coordinates],
              style,
              feature.properties
            ));
          } else if (type === 'multipolygon') {
            style.fill = style.fill === undefined ? true : style.fill;
            style.fillOpacity = (
              style.fillOpacity === undefined ? 0.25 : style.fillOpacity
            );

            coordinates = feature.geometry.coordinates.map(function (c) {
              return c[0].map(function (el) {
                return {
                  x: el[0],
                  y: el[1],
                  z: el[2]
                };
              });
            });

            allFeatures.push(m_this._addFeature(
                'line',
                coordinates,
                style,
                feature.properties
            ));
          }
        } else {
          console.log('unsupported feature type: ' + feature.geometry.type);
        }
      });

      if (done) {
        done(allFeatures);
      }
    }

    m_this._readObject(file, _done, progress);
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build the data array for a feature given the coordinates and properties
   * from the geojson.
   *
   * @private
   * @param {Object[]} coordinates Coordinate data array
   * @param {Object} properties Geojson properties object
   * @param {Object} style Global style defaults
   * @returns {Object[]}
   */
  //////////////////////////////////////////////////////////////////////////////
  this._buildData = function (coordinates, properties, style) {
    return coordinates.map(function (coord) {
      return {
        coordinates: coord,
        properties: properties,
        style: style
      };
    });
  };

  this._addFeature = function (type, coordinates, style, properties) {
    var _style = $.extend({}, m_style, style);
    var feature = m_this.layer().createFeature(type)
      .data(m_this._buildData(coordinates, properties, style))
      .style(_style);

    if (type === 'line') {
      feature.line(function (d) { return d.coordinates; });
    } else {
      feature.position(function (d) { return d.coordinates; });
    }
    return feature;
  };

};

inherit(geo.jsonReader, geo.fileReader);

geo.registerFileReader('jsonReader', geo.jsonReader);
