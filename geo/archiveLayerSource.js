//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, jQuery, document*/
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
geoModule.archiveLayerSource = function(name, vars, onError) {
  'use strict';

  if (!(this instanceof geoModule.archiveLayerSource) ) {
    return new geoModule.archiveLayerSource(name, vars, onError);
  }
  geoModule.layerSource.call(this);

  var m_name = name,
      m_vars = vars,
      m_time = null,
      m_onError = function(errorString) {};

  if (onError) {
    m_onError = onError;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time, callback) {

    if (m_time === time) {
      console.log('[info] No new data as timestamp has not changed.');
      return;
    }
    m_time = time;

    var asyncVal = false,
        retVal = [],
        errorString = null,
        reader = null;

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
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
          m_onError(errorString);
        } else {
          reader = ogs.vgl.geojsonReader();
          retVal = reader.readGJObject(jQuery.parseJSON(response.result.data[0]));
        }
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        errorString = "Error reading " + m_name + ": " + errorThrown;
        console.log(errorString);
        m_onError(errorString);
      }
    });

    if (callback) {
      callback(retVal);
    }
    return retVal;
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
   * Return time-range for the entire dataset
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getTimeRange = function(callback) {
    var timeRange = [],
        asyncVal = false,
        errorString = null;

    if (callback) {
      asyncVal = true;
    }

    $.ajax({
      type: 'POST',
      url: '/data/query',
      data: {
        expr: m_name,
        vars: m_vars,
        fields: ['timerange']
      },
      dataType: 'json',
      async: asyncVal,
      success: function(response) {
        if (response.error !== null) {
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
          m_onError(errorString);
        } else {
          // TODO implement this
          return null;
        }
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        errorString = "Error reading timerange for " + m_name + ": " + errorThrown;
        console.log(errorString);
        m_onError(errorString);

      }
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return spatial-range for the data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getSpatialRange = function() {
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return scalar-range
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getScalarRange = function(varname) {
    // TODO This should be read from the archive
    return [0, 200];
  };

  return this;
};

inherit(geoModule.archiveLayerSource, geoModule.layerSource);