//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, jQuery, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * archiveLayerSource provides data to a layer
 *
 * onError function of the form:
 *
 *   function(String errorText)
 *
 * It allows the propgation of errors to the caller, so the user
 * can be provided with the appropriate error message.
 */
//////////////////////////////////////////////////////////////////////////////
geo.floodLayerSource = function(rise, bbox) {
  'use strict';

  if (!(this instanceof geo.floodLayerSource) ) {
    return new geo.floodLayerSource(rise, bbox);
  }
  geo.layerSource.call(this, 'dummy_id', 'flood', 'the path to nowhere');

  var m_time = -1,
      m_rise = rise,
      m_bbox = bbox,
      m_resultCache = null,
      m_featureLayer = null,
      m_dataResolution = null,
      m_currentQuery = null,
      m_currentBBox = null,
      m_resolutionChanged = false,
      m_that = this,
      m_panX = 0, m_panY = 0,
      m_refresh = true,
      m_scalarsRange = [0, 20],
      m_thresh = 2.0,
      m_clusterSize = 50;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get variable names for which source is producing the data
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.variableNames = function() {
    return ["Projected Level"];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get result cache
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resultCache = function () {
    return m_resultCache;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * PROTECTED Set result cache
   */
  ////////////////////////////////////////////////////////////////////////////
  this.p_setResultCache = function (resultCache) {
    m_resultCache = resultCache;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Perform any clean at deletion
   */
  ////////////////////////////////////////////////////////////////////////////
  this.destroy = function () {
    m_resultCache = null;
  };

  this.setLayer = function(featureLayer) {
    m_featureLayer = featureLayer;
  };

  this.featureLayer = function() {
    return m_featureLayer;
  }

//  var getPoints = function(id) {
//    var errorString,
//        pointUrl = '/services/floodmap/' + id,
//        reader, geoJson;
//    $.get(pointUrl, function(response) {
//        if (response.error !== null) {
//          errorString = "[error] " + response.error ?
//            response.error : "no results returned from server";
//          console.log(errorString);
//        } else {
//
//          console.log("Starting to read GeoJSON")
//
//          if (response.result.geoJson) {
//            reader = vgl.geojsonReader();
//            geoJson = reader.readGJObject(response.result.geoJson);
//            m_featureLayer.addData(geoJson, true);
//            m_featureLayer.redraw();
//          }
//
//          if (response.result.hasMore) {
//            getPoints(id);
//          }
//        }
//      }, 'json');
//  };

  var getCoursePoints = function(bbox, res, thresh, cluster, batch, clear, id) {
    var errorString,
        pointUrl = '/services/floodmap/points',
        reader, geoJson;

    batch = batch !== undefined ? batch : 0;
    clear = clear !== undefined ? clear : false;
    id = id !== undefined ? id : null;

    //  Reset current query id to prevent stale data being added to view
    if (id == null)
      m_currentQuery = null

    $.get(pointUrl,
          {
            'id': id,
            'bbox': JSON.stringify(bbox),
            rise: m_rise,
            'res': res,
            'thresh': thresh,
            'cluster': cluster,
            'batch': batch
          },
        function(response) {
        if (response.error !== null) {
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
        } else {


          if (id == null) {
            m_currentQuery = response.result.id;
          }

          if (response.result.id === m_currentQuery) {
            if (response.result.geoJson) {
              console.log("Starting to read GeoJSON")
              reader = vgl.geojsonReader();
              geoJson = reader.readGJObject(response.result.geoJson);

              m_featureLayer.addData(geoJson, !clear);
              m_that.updatePointSize();
              m_featureLayer.redraw();
              m_resolutionChanged = false;
            }

            if ( response.result.hasMore) {
              setTimeout(function() {

                console.log("id: " + response.result.id);

                getCoursePoints(bbox, response.result.res, thresh, cluster,
                    response.result.batch, false, response.result.id);
              }, 1000);
            }
          }
        }
      }, 'json');
  };

    var resolutionTable  = [
                             {end: 5,      resolution: 0.1},
                             {end: 7,     resolution: 0.05},
                             {end: 9,    resolution: 0.025},
                             {end: 11,   resolution: 0.0125},
                             {end: 13, resolution: 0.008333}
                           ];

  var selectResolution  = function(delta) {
    var i, res, start, step;

    res = 0.1;
    start = Number.MIN_VALUE;

    for (i=0; i< resolutionTable.length; i++) {
      step = resolutionTable[i];

      if (delta > start && delta <= step.end) {
        res = step.resolution;
        break;
      }
      start = step.end;
    }

    return res
  };


var Rectangle = function (x0, y0, x1, y1) {
  var m_ll = [x0, y0],
      m_tr = [x1, y1];

  this.lowerLeft = function() {
    return m_ll;
  };

  this.upperRight = function() {
    return m_tr;
  };

  this.getBoundingBox = function() {
    return [this.lowerLeft(), this.upperRight()]
  };

  this.contains = function(r) {
    var contains = true;

    contains = contains && r.lowerLeft()[0] >= this.lowerLeft()[0];
    contains = contains && r.lowerLeft()[1] >= this.lowerLeft()[1];
    contains = contains && r.upperRight()[0] <= this.upperRight()[0];
    contains = contains && r.upperRight()[1] <= this.upperRight()[1];

    return contains
  };

  this.width = function() {
    return m_tr[0] - m_ll[0]
  };

  this.height = function() {
    return m_tr[1] - m_ll[1];
  };
}

Rectangle.equal = function(a, b) {
  var equal = function(l1, l2) {
    return  l1[0] === l2[0] && l1[1] === l2[1];
  };

  return equal(a.lowerLeft(), b.lowerLeft()) && equal(a.upperRight, b.upperRight());
}

// [[x1, y1], [x2, y2]]
var intersection = function(a, b) {

    var aLeft, bLeft, aRight, bRight, aTop, bTop, aBottom, bBottom;

    aLeft = a[0][0];
    bLeft = b[0][0];

    aRight = a[1][0];
    bRight = b[1][0];

    aTop = a[1][1];
    bTop = b[1][1];

    aBottom = a[0][1];
    bBottom= b[0][1];

    var x0 = Math.max(aLeft, bLeft);
    var x1 = Math.min(aRight, bRight);

    if (x0 <= x1) {
      var y0 = Math.max(aBottom, bBottom);
      var y1 = Math.min(aTop, bTop);

      if (y0 <= y1) {
        return new Rectangle(x0, y0, x1, y1);
      }
    }

    return null;
  };

  this.fetchPoints = function() {
    var start, end, delta, res, clippedBBox, pointSpriteSize, clear = true,
    zoomLevel = this.featureLayer().container().zoom();

    res = selectResolution(zoomLevel);

    // Clip bounding box based on view extent
    start = this.featureLayer().container().displayToMap(0, $('#glcanvas').height())
    end = this.featureLayer().container().displayToMap($('#glcanvas').width(), 0);

    clippedBBox = intersection([[start.x, start.y], [end.x, end.y]],
                                [m_bbox[0], m_bbox[1]]);

    if (clippedBBox == null) {
      clippedBBox = new Rectangle(m_bbox[0][0], m_bbox[0][1],
                                  m_bbox[1][0], m_bbox[1][1]);
    }

    if (m_dataResolution === res && !m_refresh) {
      // If data resolution hasn't changed and we are in the currently selected
      // bounding box then just return
      if (m_currentBBox.contains(clippedBBox))
        return
      // Select using the new bounding box, appending to existing features
      clear = true
    }

    m_dataResolution = res;
    m_currentBBox = clippedBBox;
    m_panX = 0;
    m_panY = 0;

    m_resolutionChanged = true;

    getCoursePoints(clippedBBox.getBoundingBox(),
        m_dataResolution, m_thresh, m_clusterSize, 0, clear);
  };

  this.updatePointSize = function() {
    var canvasWidth, canvasHeight, start, factor, end, delta, deltaX, deltaY, pointSpriteSize;

    canvasWidth = $('#glcanvas').width();
    canvasHeight = $('#glcanvas').height();

    start = this.featureLayer().container().displayToMap(0, 0);
    end = this.featureLayer().container().displayToMap(canvasWidth, 0);

    deltaX = Math.abs(end.x - start.x);

    start = this.featureLayer().container().displayToMap(0, 0);
    end = this.featureLayer().container().displayToMap(0, canvasHeight);

    deltaY = Math.abs(end.y - start.y);
    delta = deltaX > deltaY ? deltaY : deltaX;

    factor = deltaX > deltaY ? canvasHeight : canvasWidth;

    // Calculate point sprite size
    pointSpriteSize = (m_dataResolution/delta)*factor;
    this.featureLayer().pointSpriteSize(pointSpriteSize);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time) {
    var that = this, start, end, delta, pointSpriteSize;

    // If this is our first pass then set things up
    if (m_dataResolution == null) {
      $(this.featureLayer().container())
      .off(geo.command.updateViewZoomEvent)
        .on(geo.command.updateViewZoomEvent, function() { that.fetchPoints(); });

      $(this.featureLayer().container().getInteractorStyle())
        .off(vgl.command.leftButtonPressEvent)
          .on(vgl.command.leftButtonPressEvent, function(event, x, y) {
                m_panX += x;
                m_panY += y;
                console.log(m_panX);

                if (Math.abs(m_panX) >= m_currentBBox.width()/4 ||
                    Math.abs(m_panY) >= m_currentBBox.height()/4) {
                  that.fetchPoints();
                }
              });
    }

    if (m_refresh) {
      this.fetchPoints();
      m_refresh = false;
    }

    if (!m_resolutionChanged)
      this.updatePointSize();

    return;

    $.ajax({
      type: 'POST',
      url: '/services/floodmap/points',
      data: {
        bbox: JSON.stringify(m_bbox),
        rise: 20
      },
      dataType: 'json',
      success: function(response) {
        if (response.error !== null) {
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
        } else {
          getPoints(response.result.id);
        }
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        errorString = "Error reading: " + errorThrown;
        console.log(errorString);
      }
    });

    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return metadata related to data
   */
   ////////////////////////////////////////////////////////////////////////////
  this.getMetaData = function(time) {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return spatial-range for the data
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getSpatialRange = function(varname) {
    return [0, 0];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set rise level of the flood
   */
  ////////////////////////////////////////////////////////////////////////////
  this.rise = function(rise) {
    if(rise !== undefined) {
      m_rise = rise
      // Need to trigger refresh
      m_refresh = true

      return this;
    }
    return m_rise;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update bounding box
   */
  ////////////////////////////////////////////////////////////////////////////
  this.boundingBox = function(bbox) {
    if(bbox  !== undefined) {
      m_bbox = bbox;
      // Need to trigger refresh
      m_refresh = true

      return this
    }
    return m_bbox;
  };

////////////////////////////////////////////////////////////////////////////
  /**
   * Update the K-means threshold
   */
  ////////////////////////////////////////////////////////////////////////////
  this.threshold = function(thresh) {
    if(thresh  !== undefined) {
      m_thresh = thresh;
      // Need to trigger refresh
      m_refresh = true

      return this
    }
    return m_thresh;
  };

////////////////////////////////////////////////////////////////////////////
  /**
   * Update the K-means cluster size
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clusterSize = function(cluster) {
    if(cluster  !== undefined) {
      m_clusterSize = cluster;
      // Need to trigger refresh
      m_refresh = true

      return this
    }
    return m_clusterSize;
  }


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set scalars range
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setScalarRange = function(varname, val) {
    /// TODO HACK
    m_scalarsRange = val.slice(0);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get scalars range
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getScalarRange = function(varname) {
    return m_scalarsRange;
  };

  this.init();
  return this;
};

inherit(geo.floodLayerSource, geo.layerSource);
