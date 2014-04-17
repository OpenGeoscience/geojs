//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
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
geo.archiveLayerSource = function(id, name, path, config, vars, onError) {
  'use strict';

  if (!(this instanceof geo.archiveLayerSource) ) {
    return new geo.archiveLayerSource(id, name, path, config, vars, onError);
  }
  geo.layerSource.call(this, id, name, path);

  var m_config = config,
      m_vars = vars,
      m_time = -1,
      m_resultCache = null,
      m_onError = function(errorString) {};

  if (onError) {
    m_onError = onError;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get variable names for which source is producing the data
   *
   * @returns {String}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.variableNames = function() {
    return m_vars;
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return raw data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time, callback) {

    if (m_time === time) {
      console.log('[info] No new data as timestamp has not changed.');
      return m_resultCache;
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
      url: '/services/data/read',
      data: {
        expr: JSON.stringify(name),
        vars: JSON.stringify(vars),
        time: JSON.stringify(time)
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
          reader = vgl.geojsonReader();
          retVal = reader.readGJObject(jQuery.parseJSON(response.result.data[0]));
        }
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        errorString = "Error reading " + name + ": " + errorThrown;
        console.log(errorString);
        m_onError(errorString);
      }
    });

    if (callback) {
      callback(retVal);
    }
    m_resultCache = retVal;
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
      url: '/services/data/query',
      data: {
        expr: this.path(),
        vars: m_vars[0],
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
        errorString = "Error reading timerange for " + this.path() + ": " + errorThrown;
        console.log(errorString);
        m_onError(errorString);

      }
    });
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
   * Return scalar-range
   * @returns {Array}
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getScalarRange = function(varname) {
    // TODO This should be read from the archive
    var range = null,
        query = {'basename': this.path()},
        data = null, i, errorString;

    $.ajax({
      type: 'POST',
      url: '/services/mongo/' + m_config.server + '/' + m_config.database + '/'
        + m_config.collection,
      data: {
        query: JSON.stringify(query),
        fields: JSON.stringify(['name', 'basename', 'timeInfo', 'variables'])
      },
      dataType: 'json',
      async: false,
      success: function(response) {
        if (response.error !== null) {
          errorString = "[error] " + response.error ?
            response.error : "no results returned from server";
          console.log(errorString);
          m_onError(errorString);
        }

        // TODO We always should get JSON as the result.
        // NOTE It is possible that we will get multiple datasets but
        // for now we will just pick the top one
        data = response.result.data[0];
        for (i = 0; i < data.variables.length; ++i) {
          if (data.variables[i].name === varname) {
            range = data.variables[i].range;
            break;
          }
        }
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        errorString = "Error reading timerange for " + this.path() + ": " + errorThrown;
        console.log(errorString);
        m_onError(errorString);
      }
    });

    return range;
  };

  this.init();
  return this;
};

inherit(geo.archiveLayerSource, geo.layerSource);
