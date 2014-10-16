//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

/*global File*/

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class jsonReader
 *
 * @class
 * @returns {geo.fileReader}
 */
//////////////////////////////////////////////////////////////////////////////
geo.jsonReader = function (arg) {
  'use strict';
  if (!(this instanceof geo.jsonReader)) {
    return new geo.jsonReader(arg);
  }

  var m_this = this, m_style = arg.style || {};

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
            type : 'GET',
            url : fileString,
            dataType : 'text'
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
      return [geo.latlng(coordinates[1], coordinates[0], elv)];
    }

    // return an array of latlng's for LineString, MultiPoint, etc...
    return coordinates.map(function (c) {
      return geo.latlng(c[1], c[0], c[2]);
    });
  };

  this._getStyle = function () {
    // TODO: convert json style object for features
    //return spec.properties || {};
    return {};
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
            allFeatures.push(m_this._addFeature(type, [coordinates], style));
          } else {
            allFeatures.push(m_this._addFeature(type, coordinates, style));
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

  this._addFeature = function (type, coordinates, style) {
    var _style = $.extend({}, m_style, style);
    return m_this.layer().createFeature(type)
      .data(coordinates)
      .position(function (d) {
        return {
          x: d.x(),
          y: d.y(),
          z: d.z()
        };
      })
      .style(_style);
  };

};

inherit(geo.jsonReader, geo.fileReader);

geo.registerFileReader('jsonReader', geo.jsonReader);
