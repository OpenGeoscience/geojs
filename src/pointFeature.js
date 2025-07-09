var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Object specification for a point feature.
 *
 * @typedef {geo.feature.spec} geo.pointFeature.spec
 * @extends geo.feature.spec
 * @property {geo.geoPosition|function} [position] Position of the data.
 *   Default is (data).
 * @property {geo.pointFeature.styleSpec} [style] Style object with default
 *   style options.
 * @property {boolean|geo.pointFeature.clusteringSpec} [clustering=false]
 *   Enable point clustering.
 * @property {string} [primitiveShape='auto'] For the webgl renderer, select
 *   the primitive shape.  This is one of `pointFeature.primitiveShapes`:
 *   `'auto'`, `'sprite'`, `'triangle'`, or `'square'`.  `sprite` uses the
 *   least memory but has a maximum size dependent on the GPU, `triangle` is
 *   fastest if the vertex shader is the bottleneck, and `square` is fastest if
 *   the fragment shader is the bottleneck.  `auto` will use `sprite` unless
 *   the largest point exceeds the size that can be rendered via GL points, and
 *   then it will switch to `triangle`.  The computation for `auto` uses some
 *   time, so using a specific primitive could be faster.
 * @property {boolean} [dynamicDraw=false] For the webgl renderer, if this is
 *   truthy, webgl source buffers can be modified and updated directly.
 *   truthy, webgl source buffers can be modified and updated directly.  This
 *   is not strictly necessary, as it is just a recommendation for the GPU.
 */

/**
 * Style specification for a point feature.
 *
 * @typedef {geo.feature.styleSpec} geo.pointFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @property {number|function} [radius=5] Radius of each point in pixels.  This
 *   is the fill radius inside of the stroke.
 * @property {boolean|function} [stroke=true] True to stroke point.
 * @property {geo.geoColor|function} [strokeColor] Color to stroke each point.
 * @property {number|function} [strokeOpacity=1] Opacity for each point's
 *   stroke.  Opacity is on a [0-1] scale.
 * @property {number|function} [strokeWidth=1.25] The weight of the point's
 *   stroke in pixels.
 * @property {boolean|function} [fill=true] True to fill point.
 * @property {geo.geoColor|function} [fillColor] Color to fill each point.
 * @property {number|function} [fillOpacity=1] Opacity for each point.  Opacity
 *   is on a [0-1] scale.
 * @property {number[]|function} [origin] Origin in map gcs coordinates used
 *   for to ensure high precision drawing in this location.  When called as a
 *   function, this is passed the point positions as a single continuous array
 *   in map gcs coordinates.  It defaults to the first point's position.
 */

/**
 * Point clustering specification.
 *
 * @typedef {object} geo.pointFeature.clusteringSpec
 * @property {number} [radius=10] This is size in pixels that determines how
 *   close points need to be to each other to be clustered.
 * @property {number} [maxZoom=18] Never cluster above this zoom level.  For a
 *   point feature associated with a layer and a map, this will default to the
 *   map's zoomRange().max value.
 */

/**
 * Create a new instance of class pointFeature.
 *
 * @class
 * @alias geo.pointFeature
 * @extends geo.feature
 * @param {geo.pointFeature.spec} arg
 * @returns {geo.pointFeature}
 */
var pointFeature = function (arg) {
  'use strict';
  if (!(this instanceof pointFeature)) {
    return new pointFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var timestamp = require('./timestamp');
  var ClusterGroup = require('./util/clustering');
  var geo_event = require('./event');
  var util = require('./util');
  var KDBush = require('kdbush');
  KDBush = KDBush.__esModule ? KDBush.default : KDBush;

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init,
      m_rangeTree = null,
      m_rangeTreeTime = timestamp(),
      s_data = this.data,
      m_maxRadius = 0,
      m_clustering = arg.clustering,
      m_clusterTree = null,
      m_allData = [],
      m_lastZoom = null,
      m_ignoreData = false; // flag to ignore data() calls made locally

  this.featureType = 'point';

  /**
   * Get/Set clustering option.
   *
   * @param {boolean|geo.pointFeature.clusteringSpec} [val] If not specified,
   *   return the current value.  If specified and falsy, turn off clustering.
   *   If `true`, use a default clustering with `radius` set to `0.01`.
   *   Otherwise, turn on clustering with these options.
   * @returns {geo.pointFeature.clusteringSpec|boolean|this}
   */
  this.clustering = function (val) {
    if (val === undefined) {
      return m_clustering;
    }
    if (m_clustering && !val) {
      // Throw out the cluster tree and reset the data
      m_clusterTree = null;
      m_clustering = false;
      s_data(m_allData);
    } else if (val && m_clustering !== val) {
      // Generate the cluster tree
      m_clustering = val;
      m_this._clusterData();
    }
    return m_this;
  };

  /**
   * Generate the clustering tree from positions.  This might be async in the
   * future.
   */
  this._clusterData = function () {
    if (!m_clustering) {
      // clustering is not enabled, so this is a no-op
      return;
    }

    // set clustering options to default if an options argument wasn't supplied
    var opts = m_clustering === true ? {radius: 10} : m_clustering;
    if (!opts.maxZoom && this.layer() && this.layer().map()) {
      opts = Object.assign({}, opts);
      opts.maxZoom = this.layer().map().zoomRange().max;
    }

    // generate the cluster tree from the raw data
    var position = m_this.position();

    var map = m_this.layer().map(),
        scrCenter = map.gcsToDisplay(map.center(undefined, null), null),
        center = map.displayToGcs(scrCenter, m_this.gcs()),
        offset = map.displayToGcs({x: scrCenter.x + opts.radius, y: scrCenter.y}, m_this.gcs()),
        radiusInGcsAtZoom = Math.pow(Math.pow(offset.y - center.y, 2) + Math.pow(offset.x - center.x, 2), 0.5),
        zoom = map.zoom(),
        radiusInGcsAtZoom0 = radiusInGcsAtZoom * Math.pow(2, zoom);
    opts = Object.assign({}, opts, {radius: radiusInGcsAtZoom0});
    m_clusterTree = new ClusterGroup(opts);

    m_allData.forEach(function (d, i) {

      // for each point in the data set normalize the coordinate
      // representation and add the point to the cluster tree
      var pt = util.normalizeCoordinates(position(d, i));
      pt.index = i;
      m_clusterTree.addPoint(pt);
    });

    // reset the last zoom state and trigger a redraw at the current zoom level
    m_lastZoom = null;
    m_this._handleZoom(map.zoom());
  };

  /**
   * Handle zoom events for clustering.  This keeps track of the last
   * clustering level, and only regenerates the displayed points when the
   * zoom level changes.
   *
   * @param {number} zoom The new zoom level.
   */
  this._handleZoom = function (zoom) {
    // get the current zoom level rounded down
    var z = Math.floor(zoom);

    if (!m_clustering || z === m_lastZoom) {
      // short cut when there is nothing to do
      return;
    }

    // store the current zoom level privately
    m_lastZoom = z;

    const points = m_clusterTree.points(z);
    const clusters = m_clusterTree.clusters(z);
    const data = new Array(points.length + clusters.length);
    for (let pidx = 0; pidx < points.length; pidx += 1) {
      data[pidx] = m_allData[points[pidx].index];
    }

    // append the clusters at the current level
    for (let cidx = 0, didx = points.length; cidx < clusters.length; cidx += 1, didx += 1) {
      const d = clusters[cidx];
      // mark the datum as a cluster for accessor methods
      d.__cluster = true;

      // store all of the data objects for each point in the cluster as __data
      d.__data = new Array(d.obj.length);
      for (let idx = 0; idx < d.obj.length; idx += 1) {
        d.__data[idx] = m_allData[d.obj[idx].index];
      }
      data[didx] = d;
    }

    // prevent recomputing the clustering and set the new data array
    m_ignoreData = true;
    m_this.data(data);
  };

  /**
   * Get/Set position.
   *
   * @param {function|geo.geoPosition} [val] If not specified, return the
   *    position accessor, which is guaranteed to be a function.  If specified,
   *    wrap the value in an function that handles clustering if it is enabled
   *    and set the position accessor to that function.
   * @returns {this|function}
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else {
      var isFunc = util.isFunction(val);
      m_this.style('position', function (d, i) {
        if (d !== null && d !== undefined && d.__cluster) {
          return d;
        } else if (isFunc) {
          return val(d, i);
        } else {
          return val;
        }
      });
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Update the current range tree object.  Should be called whenever the
   * data changes.
   */
  this._updateRangeTree = function () {
    if (m_rangeTreeTime.timestamp() >= m_this.dataTime().timestamp() && m_rangeTreeTime.timestamp() >= m_this.timestamp()) {
      return;
    }
    var pts, position,
        radius = m_this.style.get('radius'),
        stroke = m_this.style.get('stroke'),
        strokeWidth = m_this.style.get('strokeWidth');

    position = m_this.position();

    m_maxRadius = 0;

    // create an array of positions in geo coordinates
    pts = m_this.data().map(function (d, i) {
      var pt = position(d, i);

      // store the maximum point radius
      m_maxRadius = Math.max(
        m_maxRadius,
        radius(d, i) + (stroke(d, i) ? strokeWidth(d, i) : 0)
      );

      return [pt.x, pt.y];
    });

    m_rangeTree = new KDBush(pts.length);
    for (const [x, y] of pts) {
      m_rangeTree.add(x, y);
    }
    m_rangeTree.finish();
    m_rangeTreeTime.modified();
  };

  /**
   * Returns an array of datum indices that contain the given point.
   * Largely adapted from wigglemaps pointQuerier:
   * https://github.com/dotskapes/wigglemaps/blob/cf5bed3fbfe2c3e48d31799462a80c564be1fb60/src/query/PointQuerier.js
   * This does not take into account clustering.
   *
   * @param {geo.geoPosition} p point to search for.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {object} An object with `index`: a list of point indices, and
   *    `found`: a list of points that contain the specified coordinate.
   */
  this.pointSearch = function (p, gcs) {
    var min, max, data, idx = [], found = [], ifound = [], map, pt,
        fgcs = m_this.gcs(), // this feature's gcs
        corners,
        fill = m_this.style.get('fill'),
        stroke = m_this.style.get('stroke'),
        strokeWidth = m_this.style.get('strokeWidth'),
        radius = m_this.style.get('radius');

    data = m_this.data();
    if (!data || !data.length) {
      return {
        found: [],
        index: []
      };
    }

    // We need to do this before we find corners, since the max radius is
    // determined then
    m_this._updateRangeTree();

    map = m_this.layer().map();
    pt = map.gcsToDisplay(p, gcs);
    // check all corners to make sure we handle rotations
    corners = [
      map.displayToGcs({x: pt.x - m_maxRadius, y: pt.y - m_maxRadius}, fgcs),
      map.displayToGcs({x: pt.x + m_maxRadius, y: pt.y - m_maxRadius}, fgcs),
      map.displayToGcs({x: pt.x - m_maxRadius, y: pt.y + m_maxRadius}, fgcs),
      map.displayToGcs({x: pt.x + m_maxRadius, y: pt.y + m_maxRadius}, fgcs)
    ];
    min = {
      x: Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
      y: Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)
    };
    max = {
      x: Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
      y: Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y)
    };

    // Find points inside the bounding box
    idx = m_rangeTree.range(min.x, min.y, max.x, max.y);

    idx = Uint32Array.from(idx).sort();
    // Filter by circular region
    idx.forEach(function (i) {
      var d = data[i],
          hasstroke = stroke(data[i], i);
      if (!hasstroke && !fill(data[i], i)) {
        return;
      }
      var p = m_this.position()(d, i),
          dx, dy, rad, rad2;
      rad = radius(data[i], i);
      rad += hasstroke ? strokeWidth(data[i], i) : 0;
      if (rad) {
        rad2 = rad * rad;
        p = map.gcsToDisplay(p, fgcs);
        dx = p.x - pt.x;
        dy = p.y - pt.y;
        if (dx * dx + dy * dy <= rad2) {
          found.push(d);
          ifound.push(i);
        }
      }
    });

    return {
      found: found,
      index: ifound
    };
  };

  /**
   * Returns an array of datum indices that are contained in the given polygon.
   * This does not take clustering into account.
   *
   * @param {geo.polygonObject} poly A polygon as an array of coordinates or an
   *    object with `outer` and optionally `inner` parameters.
   * @param {object} [opts] Additional search options.
   * @param {boolean} [opts.partial] If truthy, include points that are
   *    partially in the polygon, otherwise only include points that are fully
   *    within the region.  If 'center', only points whose centers are inside
   *    the polygon are returned.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {object} An object with `index`: a list of point indices,
   *    `found`: a list of points within the polygon, and `extra`: an object
   *    with index keys containing an object with a `partial` key and a boolean
   *    value to indicate if the point is on the polygon's border and a
   *    `distance` key to indicate how far within the polygon the point is
   *    located.
   */
  this.polygonSearch = function (poly, opts, gcs) {
    var fgcs = m_this.gcs(), // this feature's gcs
        found = [],
        ifound = [],
        extra = {},
        map = m_this.layer().map(),
        data = m_this.data(),
        fill = m_this.style.get('fill'),
        stroke = m_this.style.get('stroke'),
        strokeWidth = m_this.style.get('strokeWidth'),
        radius = m_this.style.get('radius'),
        idx, min, max, corners;
    if (!poly.outer) {
      poly = {outer: poly, inner: []};
    }
    if (poly.outer.length < 3 || !data || !data.length) {
      return {
        found: [],
        index: [],
        extra: {}
      };
    }
    opts = opts || {};
    opts.partial = opts.partial || false;
    poly = {outer: map.gcsToDisplay(poly.outer, gcs), inner: (poly.inner || []).map(inner => map.gcsToDisplay(inner, gcs))};
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
    // We need to do this before we find corners, since the max radius is
    // determined then
    m_this._updateRangeTree();
    corners = [
      map.displayToGcs({x: min.x - m_maxRadius, y: min.y - m_maxRadius}, fgcs),
      map.displayToGcs({x: max.x + m_maxRadius, y: min.y - m_maxRadius}, fgcs),
      map.displayToGcs({x: max.x + m_maxRadius, y: max.y + m_maxRadius}, fgcs),
      map.displayToGcs({x: min.x - m_maxRadius, y: max.y + m_maxRadius}, fgcs)
    ];
    min = {
      x: Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
      y: Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)
    };
    max = {
      x: Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
      y: Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y)
    };
    // Find points inside the bounding box.  Only these could be in the polygon
    idx = m_rangeTree.range(min.x, min.y, max.x, max.y);
    // sort by index
    idx = Uint32Array.from(idx).sort();
    // filter points within the polygon
    idx.forEach(function (i) {
      var d = data[i],
          hasstroke = stroke(data[i], i);
      if (!hasstroke && !fill(data[i], i)) {
        return;
      }
      let p = m_this.position()(d, i);
      let rad = radius(data[i], i);
      rad += hasstroke ? strokeWidth(data[i], i) : 0;
      if (rad) {
        p = map.gcsToDisplay(p, fgcs);
        const dist = util.distanceToPolygon2d(p, poly);
        if (dist >= rad || (dist >= 0 && opts.partial === 'center') || (dist >= -rad && opts.partial && opts.partial !== 'center')) {
          found.push(d);
          ifound.push(i);
          extra[i] = {partial: dist < rad, distance: dist};
        }
      }
    });
    return {
      found: found,
      index: ifound,
      extra: extra
    };
  };

  /**
   * Overloaded data method that updates the internal range tree on write.
   * Get/Set the data array for the feature.
   *
   * @param {array} [data] A new data array or `undefined` to return the
   *    existing array.
   * @returns {array|this}
   */
  this.data = function (data) {
    if (data === undefined) {
      return s_data();
    }
    if (!m_ignoreData) {
      m_allData = data;
    }
    if (m_clustering && !m_ignoreData) {
      m_this._clusterData();
    } else {
      s_data(data);
    }
    m_ignoreData = false;
    return m_this;
  };

  /**
   * Initialize.
   *
   * @param {geo.pointFeature.spec} arg The feature specification.
   * @returns {this}
   */
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    var defaultStyle = util.deepMerge(
      {},
      {
        radius: 5.0,
        stroke: true,
        strokeColor: { r: 0.851, g: 0.604, b: 0.0 },
        strokeWidth: 1.25,
        strokeOpacity: 1.0,
        fillColor: { r: 1.0, g: 0.839, b: 0.439 },
        fill: true,
        fillOpacity: 0.8,
        position: (d) => Array.isArray(d) ? {x: d[0], y: d[1], z: d[2] || 0} : d,
        origin: (p) => (p.length >= 3 ? p.slice(0, 3) : [0, 0, 0])
      },
      arg.style === undefined ? {} : arg.style
    );

    if (arg.position !== undefined) {
      defaultStyle.position = arg.position;
    }

    m_this.style(defaultStyle);
    if (defaultStyle.position) {
      m_this.position(defaultStyle.position);
    }
    m_this.dataTime().modified();

    // bind to the zoom handler for point clustering
    m_this.geoOn(geo_event.zoom, function (evt) {
      m_this._handleZoom(evt.zoomLevel);
    });
    return m_this;
  };

  return m_this;
};

/**
 * Create a pointFeature from an object.
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.pointFeature.spec} spec The object specification
 * @returns {geo.pointFeature|null}
 */
pointFeature.create = function (layer, spec) {
  'use strict';

  spec = spec || {};
  spec.type = 'point';
  return feature.create(layer, spec);
};

pointFeature.capabilities = {
  /* core feature name -- support in any manner */
  feature: 'point',
  /* support for stroke properties */
  stroke: 'point.stroke'
};

/**
 * Support primitive shapes
 * @enum {string}
 */
pointFeature.primitiveShapes = {
  auto: 'auto',
  sprite: 'sprite',
  triangle: 'triangle',
  square: 'square'
};

inherit(pointFeature, feature);
module.exports = pointFeature;
