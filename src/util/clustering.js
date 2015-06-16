/**
 * @file
 * Using methods adapted from leaflet to cluster an array of positions
 * hierarchically given an array of length scales (zoom levels).
 */

(function () {
  'use strict';

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
    this._childCount = 0;  // Total number of points
    this._parent = null;

    // add the children provided in the constructor call
    (children || []).forEach(this._add.bind(this));
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
      pt._parent = this;
      inc = pt._count;
    } else {
      this._points.push(pt);
    }
    // increment the counter
    this._increment(inc);
  };

  /**
   * Increment the child counter for this and the parent.
   * @param {number} inc The value to increment by
   * @private
   */
  ClusterTree.prototype._increment = function (inc) {
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
    for (i = 0; i <= this._points.length; i += 1) {
      func.call(this, this._points[i], this._zoom);
    }
  };

  /**
   * @class geo.util.ClusterGroup
   *
   * This class manages clustering of an array of positions hierarchically.
   * The algorithm and code was adapted from the Leaflet marker cluster
   * plugin by David Leaver: https://github.com/Leaflet/Leaflet.markercluster
   *
   * @param {object} opts An options object
   * @param {number} maxZoom The maximimum zoom level to calculate
   * Others, scale factor (pixels/cluster), ...
   */
  function C(opts) {

    // store the options
    this._opts = $.extend({
      maxZoom: 18
    }, opts);

    // generate the initial datastructures
    this._clusters = []; // clusters at each zoom level
    this._points = [];   // unclustered points at each zoom level

    var zoom;
    for (zoom = this._opts.maxZoom; zoom >= 0; zoom -= 1) {
      this._clusters.push(
        new geo.util.DistanceGrid()
      );
      this._points.push(
        new geo.util.DistanceGrid()
      );
    }
  }

  /**
   * Add a position to the cluster group.
   * @protected
   */
  C.prototype._addPoint = function (point) {
    var zoom, closest;

    // start at the maximum zoom level and search for nearby
    //
    // 1.  existing clusters
    // 2.  unclustered points
    //
    // otherwise add the point as a new unclustered point
    for (zoom = this._opts.maxZoom; zoom >= 0; zoom -= 1) {
      closest = this._gridClusters[zoom].getNearObject(point);
    }
    
  };

  geo.util.ClusterGroup = C;
})();
