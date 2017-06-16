/**
 * Using methods adapted from leaflet to cluster an array of positions
 * hierarchically given an array of length scales (zoom levels).
 */

var $ = require('jquery');
var vgl = require('vgl');

/**
 * This class manages a group of nearby points that are clustered as a
 * single object for display purposes.  The class constructor is private
 * and only meant to be created by the ClusterGroup object.
 *
 * This is a tree-like data structure.  Each node in the tree is a
 * cluster containing child clusters and unclustered points.
 *
 * @class
 * @private
 *
 * @param {geo.util.ClusterGroup} group The source cluster group
 * @param {number} zoom The zoom level of the current node
 * @param {object[]} children An array of ClusterTrees or point objects
 */
function ClusterTree(group, zoom, children) {
  this._group = group;
  this._zoom = zoom;
  this._points = [];     // Unclustered points
  this._clusters = [];   // Child clusters
  this._count = 0;       // Total number of points
  this._parent = null;
  this._coord = null;    // The cached coordinates
  var that = this;

  // add the children provided in the constructor call
  (children || []).forEach(function (c) {
    that._add(c);
  });
}

/**
 * Add a point or cluster as a child to the current cluster.
 * @param {object} pt A ClusterTree or point object
 * @private
 */
ClusterTree.prototype._add = function (pt) {
  var inc = 1;

  if (pt instanceof ClusterTree) {
    // add a child cluster
    this._clusters.push(pt);
    inc = pt._count;
  } else {
    this._points.push(pt);
  }
  pt._parent = this;

  // increment the counter
  this._increment(inc);
};

/**
 * Increment the child counter for this and the parent.
 * @param {number} inc The value to increment by
 * @private
 */
ClusterTree.prototype._increment = function (inc) {
  this._coord = null;
  this._count += inc;
  if (this._parent) {
    this._parent._increment(inc);
  }
};

/**
 * Return the total number of child points contained in the cluster.
 * @returns {number} Total points contained
 */
ClusterTree.prototype.count = function () {
  return this._count;
};

/**
 * Recursively call a function on all points contained in the cluster.
 * Calls the function with `this` as the current ClusterTree object, and
 * arguments to arguments the point object and the zoom level:
 *   func.call(this, point, zoom)
 */
ClusterTree.prototype.each = function (func) {
  var i;
  for (i = 0; i < this._points.length; i += 1) {
    func.call(this, this._points[i], this._zoom);
  }
  for (i = 0; i < this._clusters.length; i += 1) {
    this._clusters[i].each.call(
      this._clusters[i],
      func
    );
  }
};

/**
 * Get the coordinates of the cluster (the mean position of all the points
 * contained).  This is lazily calculated and cached.
 */
ClusterTree.prototype.coords = function () {
  var i, center = {x: 0, y: 0};
  if (this._coord) {
    return this._coord;
  }
  // first add up the points at the node
  for (i = 0; i < this._points.length; i += 1) {
    center.x += this._points[i].x;
    center.y += this._points[i].y;
  }

  // add up the contribution from the clusters
  for (i = 0; i < this._clusters.length; i += 1) {
    center.x += this._clusters[i].coords().x * this._clusters[i].count();
    center.y += this._clusters[i].coords().y * this._clusters[i].count();
  }

  return {
    x: center.x / this.count(),
    y: center.y / this.count()
  };
};

/**
 * This class manages clustering of an array of positions hierarchically.
 * The algorithm and code was adapted from the Leaflet marker cluster
 * plugin by David Leaver: https://github.com/Leaflet/Leaflet.markercluster
 *
 * @class
 * @alias geo.util.ClusterGroup
 * @param {object} opts An options object
 * @param {number} width The width of the window; used for scaling.
 * @param {number} height The height of the window; used for scaling.
 * @param {number} maxZoom The maximimum zoom level to calculate
 * @param {number} radius Proportional to the clustering radius in pixels
 */
function C(opts, width, height) {

  var DistanceGrid = require('./distanceGrid');

  // store the options
  this._opts = $.extend({
    maxZoom: 18,
    radius: 0.05
  }, opts);
  this._opts.width = this._opts.width || width || 256;
  this._opts.height = this._opts.height || height || 256;

  // generate the initial datastructures
  this._clusters = {}; // clusters at each zoom level
  this._points = {};   // unclustered points at each zoom level

  var zoom, scl;
  for (zoom = this._opts.maxZoom; zoom >= 0; zoom -= 1) {
    scl = this._scaleAtLevel(zoom, this._opts.width, this._opts.height);
    this._clusters[zoom] = new DistanceGrid(scl);
    this._points[zoom] = new DistanceGrid(scl);
  }
  this._topClusterLevel = new ClusterTree(this, -1);
}

/**
 * Returns a characteristic distance scale at a particular zoom level.  This
 * scale is used to control the clustering radius.  When the renderer supports
 * it, this call should be replaced by a calculation involving the view port
 * size in point coordinates at a particular zoom level.
 * @private
 */
C.prototype._scaleAtLevel = function (zoom, width, height) {
  return vgl.zoomToHeight(zoom, width, height) / 2 * this._opts.radius;
};

/**
 * Add a position to the cluster group.
 * @protected
 */
C.prototype.addPoint = function (point) {
  var zoom, closest, parent, newCluster, lastParent, z;
  /*
   * start at the maximum zoom level and search for nearby
   *
   * 1.  existing clusters
   * 2.  unclustered points
   *
   * otherwise add the point as a new unclustered point
   */
  for (zoom = this._opts.maxZoom; zoom >= 0; zoom -= 1) {

    // find near cluster
    closest = this._clusters[zoom].getNearObject(point);
    if (closest) {
      // add the point to the cluster and return
      closest._add(point);
      return;
    }

    // find near point
    closest = this._points[zoom].getNearObject(point);
    if (closest) {
      parent = closest._parent;
      if (parent) {
        // remove the point from the parent
        for (z = parent._points.length - 1; z >= 0; z -= 1) {
          if (parent._points[z] === closest) {
            parent._points.splice(z, 1);
            parent._increment(-1);
            break;
          }
        }
      }

      if (!parent) {
        $.noop();
      }
      // create a new cluster with these two points
      newCluster = new ClusterTree(this, zoom, [closest, point]);
      this._clusters[zoom].addObject(newCluster, newCluster.coords());

      // create intermediate parent clusters that don't exist
      lastParent = newCluster;
      for (z = zoom - 1; z > parent._zoom; z -= 1) {
        lastParent = new ClusterTree(this, z, [lastParent]);
        this._clusters[z].addObject(lastParent, lastParent.coords());
      }
      parent._add(lastParent);

      // remove closest from this zoom level and any above (replace with newCluster)
      for (z = zoom; z >= 0; z -= 1) {
        if (!this._points[z].removeObject(closest, closest)) {
          break;
        }
      }

      return;
    }

    // add an unclustered point
    this._points[zoom].addObject(point, point);
  }

  // otherwise add to the top
  this._topClusterLevel._add(point);
};

/**
 * Return the unclustered points contained at a given zoom level.
 * @param {number} zoom The zoom level
 * @return {object[]} The array of unclustered points
 */
C.prototype.points = function (zoom) {
  zoom = Math.min(Math.max(Math.floor(zoom), 0), this._opts.maxZoom - 1);
  return this._points[Math.floor(zoom)].contents();
};

/**
 * Return the clusters contained at a given zoom level.
 * @param {number} zoom The zoom level
 * @return {ClusterTree[]} The array of clusters
 */
C.prototype.clusters = function (zoom) {
  zoom = Math.min(Math.max(Math.floor(zoom), 0), this._opts.maxZoom - 1);
  return this._clusters[Math.floor(zoom)].contents();
};

module.exports = C;
