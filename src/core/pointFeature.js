var inherit = require('../util').inherit;
var feature = require('./feature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pointFeature
 *
 * @class geo.pointFeature
 * @param {object} arg Options object
 * @param {boolean} arg.clustering Enable point clustering
 * @extends geo.feature
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var pointFeature = function (arg) {
  'use strict';
  if (!(this instanceof pointFeature)) {
    return new pointFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var timestamp = require('./timestamp');
  var clustering = require('../util/clustering');
  var geo_event = require('./event');
  var util = require('../util');
  var wigglemaps = require('../util/wigglemaps');

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set clustering option
   *
   * @returns {geo.pointFeature|boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clustering = function (val) {
    if (val === undefined) {
      return m_clustering;
    }
    if (m_clustering && !val) {
      // Throw out the cluster tree and reset the data
      m_clusterTree = null;
      m_clustering = false;
      s_data(m_allData);
      m_allData = null;
    } else if (!m_clustering && val) {
      // Generate the cluster tree
      m_clustering = true;
      m_this._clusterData();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Generate the clustering tree from positions.  This might be async in the
   * future.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._clusterData = function () {
    if (!m_clustering) {
      // clustering is not enabled, so this is a no-op
      return;
    }

    // set clustering options to default if an options argument wasn't supplied
    var opts = m_clustering === true ? {radius: 0.01} : m_clustering;

    // generate the cluster tree from the raw data
    var position = m_this.position();
    m_clusterTree = new clustering.ClusterGroup(
        opts, m_this.layer().width(), m_this.layer().height());

    m_allData.forEach(function (d, i) {

      // for each point in the data set normalize the coordinate
      // representation and add the point to the cluster treee
      var pt = util.normalizeCoordinates(position(d, i));
      pt.index = i;
      m_clusterTree.addPoint(pt);
    });

    // reset the last zoom state and trigger a redraw at the current zoom level
    m_lastZoom = null;
    m_this._handleZoom(m_this.layer().map().zoom());
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle zoom events for clustering.  This keeps track of the last
   * clustering level, and only regenerates the displayed points when the
   * zoom level changes.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._handleZoom = function (zoom) {
    // get the current zoom level rounded down
    var z = Math.floor(zoom);

    if (!m_clustering || z === m_lastZoom) {
      // short cut when there is nothing to do
      return;
    }

    // store the current zoom level privately
    m_lastZoom = z;

    // get the raw data elements for the points at the current level
    var data = m_clusterTree.points(z).map(function (d) {
      return m_allData[d.index];
    });

    // append the clusters at the current level
    m_clusterTree.clusters(z).forEach(function (d) {
      // mark the datum as a cluster for accessor methods
      d.__cluster = true;

      // store all of the data objects for each point in the cluster as __data
      d.__data = [];
      d.obj.each(function (e) {
        d.__data.push(m_allData[e.index]);
      });
      data.push(d);
    });

    // prevent recomputing the clustering and set the new data array
    m_ignoreData = true;
    m_this.data(data);
    m_this.layer().map().draw(); // replace with m_this.draw() when gl is fixed
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set position
   *
   * @returns {geo.pointFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else {
      val = util.ensureFunction(val);
      m_this.style('position', function (d, i) {
        if (d.__cluster) {
          return d;
        } else {
          return val(d, i);
        }
      });
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update the current range tree object.  Should be called whenever the
   * data changes.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._updateRangeTree = function () {
    if (m_rangeTreeTime.getMTime() >= m_this.dataTime().getMTime()) {
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
      var pt = position(d);
      pt.idx = i;

      // store the maximum point radius
      m_maxRadius = Math.max(
        m_maxRadius,
        radius(d, i) + (stroke(d, i) ? strokeWidth(d, i) : 0)
      );

      return pt;
    });

    m_rangeTree = new wigglemaps.RangeTree(pts);
    m_rangeTreeTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns an array of datum indices that contain the given point.
   * Largely adapted from wigglemaps pointQuerier:
   *
   * https://github.com/dotskapes/wigglemaps/blob/cf5bed3fbfe2c3e48d31799462a80c564be1fb60/src/query/PointQuerier.js
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pointSearch = function (p) {
    var min, max, data, idx = [], box, found = [], ifound = [], map, pt,
        corners,
        stroke = m_this.style.get('stroke'),
        strokeWidth = m_this.style.get('strokeWidth'),
        radius = m_this.style.get('radius');

    if (!m_this.selectionAPI()) {
      return [];
    }

    data = m_this.data();
    if (!data || !data.length) {
      return {
        found: [],
        index: []
      };
    }

    map = m_this.layer().map();
    pt = map.gcsToDisplay(p);
    // check all corners to make sure we handle rotations
    corners = [
      map.displayToGcs({x: pt.x - m_maxRadius, y: pt.y - m_maxRadius}),
      map.displayToGcs({x: pt.x + m_maxRadius, y: pt.y - m_maxRadius}),
      map.displayToGcs({x: pt.x - m_maxRadius, y: pt.y + m_maxRadius}),
      map.displayToGcs({x: pt.x + m_maxRadius, y: pt.y + m_maxRadius})
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
    box = new wigglemaps.Box(
      wigglemaps.vect(min.x, min.y),
      wigglemaps.vect(max.x, max.y)
    );
    m_this._updateRangeTree();
    m_rangeTree.search(box).forEach(function (q) {
      idx.push(q.idx);
    });

    // Filter by circular region
    idx.forEach(function (i) {
      var d = data[i],
          p = m_this.position()(d, i),
          dx, dy, rad, rad2;

      rad = radius(data[i], i);
      rad += stroke(data[i], i) ? strokeWidth(data[i], i) : 0;
      rad2 = rad * rad;
      p = map.gcsToDisplay(p);
      dx = p.x - pt.x;
      dy = p.y - pt.y;
      if (dx * dx + dy * dy <= rad2) {
        found.push(d);
        ifound.push(i);
      }
    });

    return {
      data: found,
      index: ifound
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns an array of datum indices that are contained in the given box.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.boxSearch = function (lowerLeft, upperRight) {
    var pos = m_this.position(),
        idx = [];
    // TODO: use the range tree
    m_this.data().forEach(function (d, i) {
      var p = pos(d);
      if (p.x >= lowerLeft.x &&
          p.x <= upperRight.x &&
          p.y >= lowerLeft.y &&
          p.y <= upperRight.y
      ) {
        idx.push(i);
      }
    });
    return idx;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Overloaded data method that updates the internal range tree on write.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function (data) {
    if (data === undefined) {
      return s_data();
    }
    if (m_clustering && !m_ignoreData) {
      m_allData = data;
      m_this._clusterData();
    } else {
      s_data(data);
    }
    m_ignoreData = false;
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Returns the bounding box for a given datum in screen coordinates as an
   * object: ::
   *
   *   {
   *     min: {
   *       x: value,
   *       y: value
   *     },
   *     max: {
   *       x: value,
   *       y: value
   *     }
   *   }
   *
   * @returns {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this._boundingBox = function (d) {
    var pt, radius;

    // get the position in geo coordinates
    pt = m_this.position()(d);

    // convert to screen coordinates
    pt = m_this.layer().map().gcsToDisplay(pt);

    // get the radius of the points (should we add stroke width?)
    radius = m_this.style().radius(d);

    return {
      min: {
        x: pt.x - radius,
        y: pt.y - radius
      },
      max: {
        x: pt.x + radius,
        y: pt.y + radius
      }
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
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
          sprites: false,
          sprites_image: null,
          position: function (d) { return d; }
        },
      arg.style === undefined ? {} : arg.style
    );

    if (arg.position !== undefined) {
      defaultStyle.position = arg.position;
    }

    m_this.style(defaultStyle);
    m_this.dataTime().modified();

    // bind to the zoom handler for point clustering
    m_this.geoOn(geo_event.zoom, function (evt) {
      m_this._handleZoom(evt.zoomLevel);
    });
  };

  return m_this;
};

/**
 * Object specification for a point feature.
 *
 * @extends geo.feature.spec // need to make a jsdoc plugin for this to work
 * @typedef geo.pointFeature.spec
 * @type {object}
 */

/**
 * Create a pointFeature from an object.
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.pointFeature.spec} spec The object specification
 * @returns {geo.pointFeature|null}
 */
pointFeature.create = function (layer, renderer, spec) {
  'use strict';

  spec.type = 'point';
  return feature.create(layer, spec);
};

inherit(pointFeature, feature);
module.exports = pointFeature;
