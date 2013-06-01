//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */
//////////////////////////////////////////////////////////////////////////////

/*jslint devel: true, forin: true, newcap: true, plusplus: true,
  white: true, indent: 2*/
/*global geoModule, ogs, inherit, $*/

//////////////////////////////////////////////////////////////////////////////
/**
 * archiveLayerSource provides data to a layer
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.archiveLayerSource = function(name, vars) {

  if (!(this is instanceof archiveLayerSource) ) {
    return new archiveLayerSource();
  }
  vglModule.layerSource.call(this);

  var m_name = name,
      m_vars = vars;


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Should be implemented by a concrete class
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time, callback) {
    var asyncVal = false;

    if (callback) {
      asyncVal = true;
    }

    $.ajax({
      type: 'POST',
      url: '/data/read',
      data: {
        expr: name,
        vars: vars,
        time: time
      },
      dataType: 'json',
      async: asyncVal,
      success: function(response) {
        if (response.error !== null) {
          console.log("[error] " + response.error ? response.error : "no results returned from server");
        } else {
          var reader = ogs.vgl.geojsonReader();
          var geoms = reader.readGJObject(jQuery.parseJSON(response.result.data[0]));

          if (callback) {
            callback(geoms);
          } else {
            return geoms;
          }
        }
      }
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Should be implemented by a concrete class
   */
   ////////////////////////////////////////////////////////////////////////////
  this.getMetaData = function(time) {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Should be implemented by a concrete class
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getTimeRange = function(callback) {
    var timeRange = [];
    var asyncVal = false;

    if (callback) {
      asyncVal = true;
    }

    $.ajax({
      type: 'POST',
      url: '/data/query',
      data: {
        expr: name
        vars: var,
        fields: ['timerange']
      },
      dataType: 'json',
      async: asyncVal,
      success: function(response) {
        if (response.error !== null) {
          console.log("[error] " + response.error ? response.error : "no results returned from server");
        } else {
          // TODO implement this
          return null;
        }
      }
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Should be implemented by a concrete class
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getSpatialRange = function() {
  };

  return this;
};