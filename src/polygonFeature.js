var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');
var transform = require('./transform');

/**
 * Polygon feature specification.
 *
 * @typedef {geo.feature.spec} geo.polygonFeature.spec
 * @extends geo.feature.spec
 * @property {geo.geoPosition|function} [position] Position of the data.
 *   Default is (data).
 * @property {geo.polygon|function} [polygon] Polygons from the data.  Default
 *   (data).
 * @property {geo.polygonFeature.styleSpec} [style] Style object with default
 *   style options.
 */

/**
 * Style specification for a polygon feature.
 *
 * @typedef {geo.lineFeature.styleSpec} geo.polygonFeature.styleSpec
 * @extends geo.lineFeature.styleSpec
 * @property {boolean|function} [fill=true] True to fill polygon.
 * @property {geo.geoColor|function} [fillColor] Color to fill each polygon.
 *   The color can vary by vertex.
 * @property {number|function} [fillOpacity] Opacity for each polygon.  The
 *   opacity can vary by vertex.  Opacity is on a [0-1] scale.
 * @property {boolean|function} [stroke=false] True to stroke polygon.
 * @property {boolean|function} [uniformPolygon=false] Boolean indicating if
 *   each polygon has a uniform style (uniform fill color, fill opacity, stroke
 *   color, and stroke opacity).  Can vary by polygon.
 * @property {boolean|function} [closed=true] Ignored.  Always `true`.
 * @property {number[]|function} [origin] Origin in map gcs coordinates used
 *   for to ensure high precision drawing in this location.  When called as a
 *   function, this is passed an array of items, each of which has a vertices
 *   property that is a single continuous array in map gcs coordinates.  It
 *   defaults to the first polygon's first vertex's position.
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
      m_this._checkForStroke();
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
   * @returns {geo.polygonObject[]} An array of polygon positions.  Each has
   *    `outer` and `inner` if it has any coordinates, or is `undefined`.
   */
  function getCoordinates(data, posFunc, polyFunc) {
    const fcs = m_this.gcs(),
        mapgcs = m_this.layer().map().gcs();
    data = data || m_this.data();
    posFunc = posFunc || m_this.style.get('position');
    polyFunc = polyFunc || m_this.style.get('polygon');
    var coordinates = data.map(function (d, i) {
      var poly = polyFunc(d, i);
      if (!poly) {
        return undefined;
      }
      var outer, inner, range, coord, j, x, y, mapouter, mapinner, maprange;

      coord = poly.outer || (Array.isArray(poly) ? poly : []);
      outer = new Array(coord.length);
      for (j = 0; j < coord.length; j += 1) {
        outer[j] = posFunc.call(m_this, coord[j], j, d, i);
        x = outer[j].x;
        y = outer[j].y;
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
      mapouter = transform.transformCoordinates(fcs, mapgcs, outer);
      mapinner = inner.map(part => transform.transformCoordinates(fcs, mapgcs, part));
      for (j = 0; j < mapouter.length; j += 1) {
        x = mapouter[j].x;
        y = mapouter[j].y;
        if (!j) {
          maprange = {min: {x: x, y: y}, max: {x: x, y: y}};
        } else {
          if (x < maprange.min.x) { maprange.min.x = x; }
          if (y < maprange.min.y) { maprange.min.y = y; }
          if (x > maprange.max.x) { maprange.max.x = x; }
          if (y > maprange.max.y) { maprange.max.y = y; }
        }
      }
      return {
        outer: outer,
        inner: inner,
        range: range,
        mapouter: mapouter,
        mapinner: mapinner,
        maprange: maprange
      };
    });
    return coordinates;
  }

  /**
   * Get the set of normalized polygon coordinates.
   *
   * @returns {geo.polygonObject[]} An array of polygon positions.  Each has
   *    `outer` and `inner` if it has any coordinates, or is `undefined`.
   */
  this.polygonCoordinates = function () {
    return m_coordinates;
  };

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
   * @param {object|function} [val] If not specified, return the current
   *    polygon accessor.  If specified, use this for the polygon accessor and
   *    return `this`.  If a function is given, the function is passed
   *    `(dataElement, dataIndex)` and returns a {@link geo.polygon}.
   * @returns {object|function|this} The current polygon accessor or this
   *    feature.
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
   * @param {geo.geoPosition|function} [val] If not specified, return the
   *    current position accessor.  If specified, use this for the position
   *    accessor and return `this`.  If a function is given, this is called
   *    with `(vertexElement, vertexIndex, dataElement, dataIndex)`.
   * @returns {geo.geoPosition|this} The current position or this feature.
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
   * @param {geo.geoPosition} coordinate point to search for.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {object} An object with `index`: a list of polygon indices, and
   *    `found`: a list of polygons that contain the specified coordinate.
   */
  this.pointSearch = function (coordinate, gcs) {
    var found = [], indices = [], irecord = {}, data = m_this.data(),
        map = m_this.layer().map();
    gcs = (gcs === null ? map.gcs() : (gcs === undefined ? map.ingcs() : gcs));
    var pt = transform.transformCoordinates(gcs, map.gcs(), coordinate);
    m_coordinates.forEach(function (coord, i) {
      var inside = util.pointInPolygon(
        pt,
        coord.mapouter,
        coord.mapinner,
        coord.maprange
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
   * Returns polygons that are contained in the given polygon.  This could fail
   * to return polygons that are less than their stroke width outside of the
   * specified polygon and whose vertices are not near the selected polygon.
   *
   * @param {geo.polygonObject} poly A polygon as an array of coordinates or an
   *    object with `outer` and optionally `inner` parameters.
   * @param {object} [opts] Additional search options.
   * @param {boolean} [opts.partial=false] If truthy, include polygons that are
   *    partially in the polygon, otherwise only include polygons that are fully
   *    within the region.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {object} An object with `index`: a list of polygon indices,
   *    `found`: a list of polygons within the polygon, and `extra`: an object
   *    with index keys containing an object with a `partial` key and a boolean
   *    value to indicate if the polygon is on the specified polygon's border.
   */
  this.polygonSearch = function (poly, opts, gcs) {
    var data = m_this.data(), indices = [], found = [], extra = {}, min, max,
        origPoly = poly, irecord = {},
        map = m_this.layer().map();
    gcs = (gcs === null ? map.gcs() : (gcs === undefined ? map.ingcs() : gcs));
    if (!poly.outer) {
      poly = {outer: poly, inner: []};
    }
    if (!data || !data.length || poly.outer.length < 3) {
      return {
        found: found,
        index: indices,
        extra: extra
      };
    }
    opts = opts || {};
    opts.partial = opts.partial || false;
    poly = {outer: transform.transformCoordinates(gcs, map.gcs(), poly.outer), inner: (poly.inner || []).map(inner => transform.transformCoordinates(gcs, map.gcs(), inner))};
    poly.outer.forEach(p => {
      if (!min) {
        min = {x: p.x, y: p.y};
        max = {x: p.x, y: p.y};
      }
      if (p.x < min.x) { min.x = p.x; }
      if (p.x > max.x) { max.x = p.x; }
      if (p.y < min.y) { min.y = p.y; }
      if (p.y > max.y) { max.y = p.y; }
    });
    m_coordinates.forEach(function (coord, idx) {
      if (!coord.mapouter.length || (coord.maprange &&
          (coord.maprange.max.x < min.x || coord.maprange.min.x > max.x ||
           coord.maprange.max.y < min.y || coord.maprange.min.y > max.y))) {
        return;
      }
      let inside, partial;
      // do something similar to the line's polygonSearch
      for (let r = -1; r < coord.mapinner.length && !partial; r += 1) {
        const record = r < 0 ? coord.mapouter : coord.mapinner[r];
        for (let i = 0, len = record.length, j = len - 1; i < len; j = i, i += 1) {
          const dist0 = util.distanceToPolygon2d(record[i], poly),
              dist1 = util.distanceToPolygon2d(record[j], poly);
          if (dist0 * dist1 < 0) {
            partial = true;
            break;
          }
          if (util.crossedLineSegmentPolygon2d(record[i], record[j], poly)) {
            partial = true;
            break;
          }
          if (dist0 > 0) {
            inside = true;
          }
        }
      }
      // check if the selection polygon is inside of this polygon.  Any point
      // is sufficient as otherwise the previous crossing test would have been
      // triggered.
      if (!inside && !partial && util.pointInPolygon(poly.outer[0], coord.mapouter, coord.mapinner, coord.maprange)) {
        partial = true;
      }
      if ((!opts.partial && inside && !partial) || (opts.partial && (inside || partial))) {
        indices.push(idx);
        found.push(data[idx]);
        extra[idx] = {
          partial: partial
        };
        irecord[idx] = true;
      }
    });
    if (m_lineFeature) {
      var lineFound = m_lineFeature.polygonSearch(origPoly, opts);
      lineFound.found.forEach(function (lineData, idx) {
        if (lineData.length && lineData[0].length === 4) {
          if (!irecord[lineData[0][3]]) {
            indices.push(lineData[0][3]);
            irecord[lineData[0][3]] = true;
            found.push(data[lineData[0][3]]);
            extra[lineFound.index[idx]] = {partial: false};
          }
          if (lineFound.extra[lineFound.index[idx]].partial) {
            extra[lineData[0][3]].partial = true;
          }
        }
      });
    }
    return {
      found: found,
      index: indices,
      extra: extra
    };
  };

  /**
   * Get/Set style used by the feature.  This calls the super function, then
   * checks if strokes are required.
   *
   * See the <a href="#.styleSpec">style specification
   * <code>styleSpec</code></a> for available styles.
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
    var result = s_style.apply(m_this, arguments);
    if (arg1 !== undefined && (typeof arg1 !== 'string' || arg2 !== undefined)) {
      m_this._checkForStroke();
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
    var polyStyle = m_this.style(),
        strokeOpacity;
    if (util.isFunction(polyStyle.stroke) || !polyStyle.stroke) {
      var strokeFunc = m_this.style.get('stroke'),
          strokeOpacityFunc = m_this.style.get('strokeOpacity');
      strokeOpacity = function (d) {
        return strokeFunc(d[2], d[3]) ? strokeOpacityFunc(d[0], d[1], d[2], d[3]) : 0;
      };
    } else {
      strokeOpacity = linePolyStyle(polyStyle.strokeOpacity);
    }
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
      strokeOpacity: strokeOpacity,
      uniformLine: linePolyStyle(polyStyle.uniformPolygon)
    });
    var data = m_this.data(),
        posVal = m_this.style('position');
    if (data !== m_lineFeature._lastData || posVal !== m_lineFeature._lastPosVal) {
      var lineData = [], i, polygon, loop,
          posFunc = m_this.style.get('position'),
          polyFunc = m_this.style.get('polygon');

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
   * Update the timestamp to the next global timestamp value.  Mark
   * sub-features as modified, too.
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
   *    units.  A value of zero will only remove perfectly collinear points.
   *    If not specified, this is set to a half display pixel at the map's
   *    current zoom level.
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
    m_this.style('position', util.identityFunction);
    m_this.style('polygon', util.identityFunction);
    m_this.data(data);
    return m_this;
  };

  /**
   * If the selectionAPI is on, then setting
   * `this.geoOn(geo.event.feature.mouseover_order, this.mouseOverOrderClosestBorder)`
   * will make it so that the mouseon events prefer the polygon with the
   * closet border, including hole edges.
   *
   * @param {geo.event} evt The event; this should be triggered from
   *    {@link geo.event.feature.mouseover_order}.
   */
  this.mouseOverOrderClosestBorder = function (evt) {
    var data = evt.feature.data(),
        map = evt.feature.layer().map(),
        pt = transform.transformCoordinates(map.ingcs(), evt.feature.gcs(), evt.mouse.geo),
        coor = evt.feature.polygonCoordinates(),
        dist = {};
    evt.over.index.forEach(function (di, idx) {
      var poly = coor[di], mindist;
      poly.outer.forEach(function (line1, pidx) {
        var line2 = poly.outer[(pidx + 1) % poly.outer.length];
        var dist = util.distance2dToLineSquared(pt, line1, line2);
        if (mindist === undefined || dist < mindist) {
          mindist = dist;
        }
      });
      poly.inner.forEach(function (inner) {
        inner.forEach(function (line1, pidx) {
          var line2 = inner[(pidx + 1) % inner.length];
          var dist = util.distance2dToLineSquared(pt, line1, line2);
          if (mindist === undefined || dist < mindist) {
            mindist = dist;
          }
        });
      });
      dist[di] = mindist;
    });
    evt.over.index.sort(function (i1, i2) {
      return dist[i1] - dist[i2];
    }).reverse();
    // this isn't necessary, but ensures that other event handlers have
    // consistent information
    evt.over.index.forEach(function (di, idx) {
      evt.over.found[idx] = data[di];
    });
  };

  /**
   * Return the polygons as a polygon list: an array of polygons, each of which
   * is an array of polylines, each of which is an array of points, each of
   * which is a 2-tuple of numbers.
   *
   * @param {geo.util.polyop.spec} [opts] Ignored.
   * @returns {geo.polygonList} A list of polygons.
   */
  this.toPolygonList = function (opts) {
    const polyFunc = m_this.style.get('polygon');
    const posFunc = m_this.style.get('position');
    return m_this.data().map((d, i) => {
      const polygon = polyFunc(d, i);
      const outer = polygon.outer || (Array.isArray(polygon) ? polygon : []);
      if (outer.length < 3) {
        return [];
      }
      const resp = [outer.map((p, j) => {
        const pos = posFunc(p, j, d, i);
        return [pos.x, pos.y];
      })];
      if (polygon.inner) {
        polygon.inner.forEach((h) => {
          resp.push(h.map((p, j) => {
            const pos = posFunc(p, j, d, i);
            return [pos.x, pos.y];
          }));
        });
      }
      return resp;
    });
  };

  /**
   * Set the data, position accessor, and polygon accessor to use a list of
   * polygons.
   *
   * @param {geo.polygonList} poly A list of polygons.
   * @param {geo.util.polyop.spec} [opts] Ignored.
   * @returns {this}
   */
  this.fromPolygonList = function (poly, opts) {
    m_this.style({
      position: (p) => ({x: p[0], y: p[1]}),
      polygon: (p) => ({outer: p[0], inner: p.slice(1)})
    });
    m_this.data(poly);
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
        polygon: util.identityFunction,
        position: (d) => Array.isArray(d) ? {x: d[0], y: d[1], z: d[2] || 0} : d,
        origin: (items) => {
          for (let i = 0; i < items.length; i += 1) {
            if (items[i].vertices.length >= 3) {
              return items[i].vertices.slice(0, 3);
            }
          }
          return [0, 0, 0];
        }
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

    m_this._checkForStroke();
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
