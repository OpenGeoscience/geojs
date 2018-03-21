var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');
var transform = require('./transform');

/**
 * Polygon feature specification.
 *
 * @typedef {geo.feature.spec} geo.polygonFeature.spec
 * @param {object|Function} [position] Position of the data.  Default is
 *   (data).
 * @param {object|Function} [polygon] Polygons from the data.  Default is
 *   (data).  Typically, the data is an array of polygons, each of which is of
 *   the form {outer: [(coordinates)], inner: [[(coordinates of first hole)],
 *   [(coordinates of second hole)], ...]}.  The inner record is optional.
 *   Alternately, if there are no holes, a polygon can just be an array of
 *   coordinates in the form of geo.geoPosition.  The first and last point of
 *   each polygon may be the same.
 * @param {object} [style] Style object with default style options.
 * @param {boolean|Function} [style.fill] True to fill polygon.  Defaults to
 *   true.
 * @param {geo.geoColor|Function} [style.fillColor] Color to fill each polygon.
 *   The color can vary by vertex.
 * @param {number|Function} [style.fillOpacity] Opacity for each polygon.  The
 *   opacity can vary by vertex.  Opacity is on a [0-1] scale.
 * @param {boolean|Function} [style.stroke] True to stroke polygon.  Defaults
 *   to false.
 * @param {geo.geoColor|Function} [style.strokeColor] Color to stroke each
 *   polygon.  The color can vary by vertex.
 * @param {number|Function} [style.strokeOpacity] Opacity for each polygon
 *   stroke.  The opacity can vary by vertex.  Opacity is on a [0-1] scale.
 * @param {number|Function} [style.strokeWidth] The weight of the polygon
 *   stroke in pixels.  The width can vary by vertex.
 * @param {boolean|Function} [style.uniformPolygon] Boolean indicating if each
 *   polygon has a uniform style (uniform fill color, fill opacity, stroke
 *   color, and stroke opacity).   Defaults to false.  Can vary by polygon.
 */

/**
 * Create a new instance of class polygonFeature.
 *
 * @class
 * @alias geo.polygonFeature
 * @extends geo.feature
 * @param {geo.polygonFeature.spec} arg
 * @returns {geo.polygonFeature}
 */
var polygonFeature = function (arg) {
  'use strict';
  if (!(this instanceof polygonFeature)) {
    return new polygonFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var util = require('./util');

  /**
   * @private
   */
  var m_this = this,
      m_lineFeature,
      s_init = this._init,
      s_exit = this._exit,
      s_data = this.data,
      s_draw = this.draw,
      s_modified = this.modified,
      s_style = this.style,
      m_coordinates = [];

  this.featureType = 'polygon';
  this._subfeatureStyles = {
    fillColor: true,
    fillOpacity: true,
    lineCap: true,
    lineJoin: true,
    strokeColor: true,
    strokeOffset: true,
    strokeOpacity: true,
    strokeWidth: true
  };

  /**
   * Get/set data.
   *
   * @param {object} [arg] if specified, use this for the data and return the
   *    feature.  If not specified, return the current data.
   * @returns {geo.polygonFeature|object}
   */
  this.data = function (arg) {
    var ret = s_data(arg);
    if (arg !== undefined) {
      m_coordinates = getCoordinates();
      this._checkForStroke();
    }
    return ret;
  };

  /**
   * Get the internal coordinates whenever the data changes.  Also compute the
   * extents of the outside of each polygon for faster checking if points are
   * in the polygon.
   *
   * @private
   * @param {object[]} [data=this.data()] The data to process.
   * @param {function} [posFunc=this.style.get('position')] The function to
   *    get the position of each vertex.
   * @param {function} [polyFunc=this.style.get('polygon')] The function to
   *    get each polygon.
   * @returns {object[]} An array of polygon positions.  Each has `outer` and
   *    `inner` if it has any coordinates, or is undefined.
   */
  function getCoordinates(data, posFunc, polyFunc) {
    data = data || m_this.data();
    posFunc = posFunc || m_this.style.get('position');
    polyFunc = polyFunc || m_this.style.get('polygon');
    var coordinates = data.map(function (d, i) {
      var poly = polyFunc(d, i);
      if (!poly) {
        return;
      }
      var outer, inner, range, coord, j, x, y;

      coord = poly.outer || (Array.isArray(poly) ? poly : []);
      outer = new Array(coord.length);
      for (j = 0; j < coord.length; j += 1) {
        outer[j] = posFunc.call(m_this, coord[j], j, d, i);
        x = outer[j].x || outer[j][0] || 0;
        y = outer[j].y || outer[j][1] || 0;
        if (!j) {
          range = {min: {x: x, y: y}, max: {x: x, y: y}};
        } else {
          if (x < range.min.x) { range.min.x = x; }
          if (y < range.min.y) { range.min.y = y; }
          if (x > range.max.x) { range.max.x = x; }
          if (y > range.max.y) { range.max.y = y; }
        }
      }
      inner = (poly.inner || []).map(function (hole) {
        coord = hole || [];
        var trans = new Array(coord.length);
        for (j = 0; j < coord.length; j += 1) {
          trans[j] = posFunc.call(m_this, coord[j], j, d, i);
        }
        return trans;
      });
      return {
        outer: outer,
        inner: inner,
        range: range
      };
    });
    return coordinates;
  }

  /**
   * Get the style for the stroke of the polygon.  Since polygons can have
   * holes, the number of stroke lines may not be the same as the number of
   * polygons.  If the style for a stroke is a function, this calls the
   * appropriate value for the polygon.  Any style set for a stroke line should
   * be wrapped in this function.
   *
   * @param {(object|function)?} styleValue The polygon's style value used for
   *    the stroke.  This should be m_this.style(<name of style>) and not
   *    m_this.style.get(<name of style>), as the result is more efficient if
   *    the style is not a function.
   * @returns {object|function} A style that can be used for the stroke.
   * @private
   */
  function linePolyStyle(styleValue) {
    if (util.isFunction(styleValue)) {
      return function (d) {
        return styleValue(d[0], d[1], d[2], d[3]);
      };
    } else {
      return styleValue;
    }
  }

  /**
   * Get/set polygon accessor.
   *
   * @param {object} [val] if specified, use this for the polygon accessor
   *    and return the feature.  If not specified, return the current polygon.
   * @returns {object|this} The current polygon or this feature.
   */
  this.polygon = function (val) {
    if (val === undefined) {
      return m_this.style('polygon');
    } else {
      m_this.style('polygon', val);
      m_this.dataTime().modified();
      m_this.modified();
      m_coordinates = getCoordinates();
    }
    return m_this;
  };

  /**
   * Get/Set position accessor.
   *
   * @param {object} [val] if specified, use this for the position accessor
   *    and return the feature.  If not specified, return the current
   *    position.
   * @returns {object|this} The current position or this feature.
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else {
      m_this.style('position', val);
      m_this.dataTime().modified();
      m_this.modified();
      m_coordinates = getCoordinates();
    }
    return m_this;
  };

  /**
   * Point search method for selection api.  Returns markers containing the
   * given point.
   *
   * @param {geo.geoPosition} coordinate point to search for in map interface
   *    gcs.
   * @returns {object} An object with `index`: a list of polygon indices, and
   *    `found`: a list of polygons that contain the specified coordinate.
   */
  this.pointSearch = function (coordinate) {
    var found = [], indices = [], irecord = {}, data = m_this.data(),
        map = m_this.layer().map(),
        pt = transform.transformCoordinates(map.ingcs(), m_this.gcs(), coordinate);
    m_coordinates.forEach(function (coord, i) {
      var inside = util.pointInPolygon(
        pt,
        coord.outer,
        coord.inner,
        coord.range
      );
      if (inside) {
        indices.push(i);
        irecord[i] = true;
        found.push(data[i]);
      }
    });
    if (m_lineFeature) {
      var lineFound = m_lineFeature.pointSearch(coordinate);
      lineFound.found.forEach(function (lineData) {
        if (lineData.length && lineData[0].length === 4 && !irecord[lineData[0][3]]) {
          indices.push(lineData[0][3]);
          irecord[lineData[0][3]] = true;
          found.push(data[lineData[0][3]]);
        }
      });
    }
    return {
      index: indices,
      found: found
    };
  };

  /**
   * Get/Set style used by the feature.  This calls the super function, then
   * checks if strokes are required.
   *
   * @param {string|object} [arg1] If `undefined`, return the current style
   *    object.  If a string and `arg2` is undefined, return the style
   *    associated with the specified key.  If a string and `arg2` is defined,
   *    set the named style to the specified value.  Otherwise, extend the
   *    current style with the values in the specified object.
   * @param {*} [arg2] If `arg1` is a string, the new value for that style.
   * @returns {object|this} Either the entire style object, the value of a
   *    specific style, or the current class instance.
   */
  this.style = function (arg1, arg2) {
    var result = s_style.apply(this, arguments);
    if (arg1 !== undefined && (typeof arg1 !== 'string' || arg2 !== undefined)) {
      this._checkForStroke();
    }
    return result;
  };

  this.style.get = s_style.get;

  /**
   * Get an outer or inner loop of a polygon and return the necessary data to
   * use it for a closed polyline.
   *
   * @param {object} item: the polygon.
   * @param {number} itemIndex: the index of the polygon
   * @param {Array} loop: the inner or outer loop.
   * @returns {Array} the loop with the data necessary to send to the position
   *    function for each vertex.
   */
  this._getLoopData = function (item, itemIndex, loop) {
    var line = [], i;

    for (i = 0; i < loop.length; i += 1) {
      line.push([loop[i], i, item, itemIndex]);
    }
    return line;
  };

  /**
   * Check if we need to add a line feature to the layer, and update it as
   * necessary.
   */
  this._checkForStroke = function () {
    if (s_style('stroke') === false) {
      if (m_lineFeature && m_this.layer()) {
        m_this.layer().deleteFeature(m_lineFeature);
        m_lineFeature = null;
        m_this.dependentFeatures([]);
      }
      return;
    }
    if (!m_this.layer()) {
      return;
    }
    if (!m_lineFeature) {
      m_lineFeature = m_this.layer().createFeature('line', {
        selectionAPI: false,
        gcs: m_this.gcs(),
        visible: m_this.visible(undefined, true)
      });
      m_this.dependentFeatures([m_lineFeature]);
    }
    var polyStyle = m_this.style();
    m_lineFeature.style({
      antialiasing: linePolyStyle(polyStyle.antialiasing),
      closed: true,
      lineCap: linePolyStyle(polyStyle.lineCap),
      lineJoin: linePolyStyle(polyStyle.lineJoin),
      miterLimit: linePolyStyle(polyStyle.miterLimit),
      strokeWidth: linePolyStyle(polyStyle.strokeWidth),
      strokeStyle: linePolyStyle(polyStyle.strokeStyle),
      strokeColor: linePolyStyle(polyStyle.strokeColor),
      strokeOffset: linePolyStyle(polyStyle.strokeOffset),
      strokeOpacity: util.isFunction(polyStyle.stroke) || !polyStyle.stroke ?
        function (d) {
          return m_this.style.get('stroke')(d[2], d[3]) ? m_this.style.get('strokeOpacity')(d[0], d[1], d[2], d[3]) : 0;
        } :
        linePolyStyle(polyStyle.strokeOpacity)
    });
    var data = this.data(),
        posVal = this.style('position');
    if (data !== m_lineFeature._lastData || posVal !== m_lineFeature._lastPosVal) {
      var lineData = [], i, polygon, loop,
          posFunc = this.style.get('position'),
          polyFunc = this.style.get('polygon');

      for (i = 0; i < data.length; i += 1) {
        polygon = polyFunc(data[i], i);
        if (!polygon) {
          continue;
        }
        loop = polygon.outer || (Array.isArray(polygon) ? polygon : []);
        if (loop.length >= 2) {
          lineData.push(m_this._getLoopData(data[i], i, loop));
          if (polygon.inner) {
            polygon.inner.forEach(function (loop) {
              if (loop.length >= 2) {
                lineData.push(m_this._getLoopData(data[i], i, loop));
              }
            });
          }
        }
      }
      m_lineFeature.position(function (d, i, item, itemIndex) {
        return posFunc(d[0], d[1], d[2], d[3]);
      });
      m_lineFeature.data(lineData);
      m_lineFeature._lastData = data;
      m_lineFeature._lastPosVal = posVal;
    }
  };

  /**
   * Redraw the object.
   *
   * @returns {object} The results of the superclass draw function.
   */
  this.draw = function () {
    var result = s_draw();
    if (m_lineFeature) {
      m_lineFeature.draw();
    }
    return result;
  };

  /**
   * When the feature is marked as modified, mark our sub-feature as
   * modified, too.
   *
   * @returns {object} The results of the superclass modified function.
   */
  this.modified = function () {
    var result = s_modified();
    if (m_lineFeature) {
      m_lineFeature.modified();
    }
    return result;
  };

  /**
   * Take a set of data, reduce the number of vertices per polygon using the
   * Ramer–Douglas–Peucker algorithm, and use the result as the new data.
   * This changes the instance's data, the position accessor, and the polygon
   * accessor.
   *
   * @param {array} data A new data array.
   * @param {number} [tolerance] The maximum variation allowed in map.gcs
   *    units.  A value of zero will only remove perfectly colinear points.  If
   *    not specified, this is set to a half display pixel at the map's current
   *    zoom level.
   * @param {function} [posFunc=this.style.get('position')] The function to
   *    get the position of each vertex.
   * @param {function} [polyFunc=this.style.get('polygon')] The function to
   *    get each polygon.
   * @returns {this}
   */
  this.rdpSimplifyData = function (data, tolerance, posFunc, polyFunc) {
    var map = m_this.layer().map(),
        mapgcs = map.gcs(),
        featuregcs = m_this.gcs(),
        coordinates = getCoordinates(data, posFunc, polyFunc);
    if (tolerance === undefined) {
      tolerance = map.unitsPerPixel(map.zoom()) * 0.5;
    }

    /* transform the coordinates to the map gcs */
    coordinates = coordinates.map(function (poly) {
      return {
        outer: transform.transformCoordinates(featuregcs, mapgcs, poly.outer),
        inner: poly.inner.map(function (hole) {
          return transform.transformCoordinates(featuregcs, mapgcs, hole);
        })
      };
    });
    data = data.map(function (d, idx) {
      var poly = coordinates[idx],
          elem = {};
      /* Copy element properties, as they might be used by styles */
      for (var key in d) {
        if (d.hasOwnProperty(key) && !(Array.isArray(d) && key >= 0 && key < d.length)) {
          elem[key] = d[key];
        }
      }
      if (poly && poly.outer.length >= 3) {
        // discard degenerate holes before anything else
        elem.inner = poly.inner.filter(function (hole) {
          return hole.length >= 3;
        });
        // simplify the outside of the polygon without letting it cross holes
        elem.outer = util.rdpLineSimplify(poly.outer, tolerance, true, elem.inner);
        if (elem.outer.length >= 3) {
          var allButSelf = elem.inner.slice();
          // simplify holes without crossing other holes or the outside
          elem.inner.map(function (hole, idx) {
            allButSelf[idx] = elem.outer;
            var result = util.rdpLineSimplify(hole, tolerance, true, allButSelf);
            allButSelf[idx] = result;
            return result;
          }).filter(function (hole) {
            return hole.length >= 3;
          });
          // transform coordinates back to the feature gcs
          elem.outer = transform.transformCoordinates(mapgcs, featuregcs, elem.outer);
          elem.inner = elem.inner.map(function (hole) {
            return transform.transformCoordinates(mapgcs, featuregcs, hole);
          });
        } else {
          elem.outer = elem.inner = [];
        }
      } else {
        elem.outer = [];
      }
      return elem;
    });

    /* Set the reduced polgons as the data and use simple accessors. */
    m_this.style('position', function (d) { return d; });
    m_this.style('polygon', function (d) { return d; });
    m_this.data(data);
    return m_this;
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    if (m_lineFeature && m_this.layer()) {
      m_this.layer().deleteFeature(m_lineFeature);
      m_lineFeature = null;
      m_this.dependentFeatures([]);
    }
    s_exit();
  };

  /**
   * Initialize.
   *
   * @param {geo.polygonFeature.spec} arg An object with options for the
   *    feature.
   */
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    var style = $.extend(
      {},
      {
        // default style
        fill: true,
        fillColor: {r: 0.0, g: 0.5, b: 0.5},
        fillOpacity: 1.0,
        stroke: false,
        strokeWidth: 1.0,
        strokeStyle: 'solid',
        strokeColor: {r: 0.0, g: 1.0, b: 1.0},
        strokeOpacity: 1.0,
        polygon: function (d) { return d; },
        position: function (d) { return d; }
      },
      arg.style === undefined ? {} : arg.style
    );

    if (arg.polygon !== undefined) {
      style.polygon = arg.polygon;
    }
    if (arg.position !== undefined) {
      style.position = arg.position;
    }
    m_this.style(style);

    this._checkForStroke();
  };

  /* Don't call _init here -- let subclasses call it */
  return this;
};

/**
 * Create a polygonFeature from an object.
 *
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.polygonFeature.spec} spec The object specification
 * @returns {geo.polygonFeature|null}
 */
polygonFeature.create = function (layer, spec) {
  'use strict';

  spec = spec || {};
  spec.type = 'polygon';
  return feature.create(layer, spec);
};

polygonFeature.capabilities = {
  /* core feature name -- support in any manner */
  feature: 'polygon'
};

inherit(polygonFeature, feature);
module.exports = polygonFeature;
