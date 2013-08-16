//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, jQuery, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * workflowLayerSource retrieves its data by running a workflow
 *
 * onError function of the form:
 *
 *   function(String errorText)
 *
 * It allows the propgation of errors to the caller, so the user
 * can be provided with the appropriate error message.
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.workflowLayerSource = function(name, vars, workflow, onError) {
  'use strict';

  if (!(this instanceof wflModule.workflowLayerSource) ) {
    return new wflModule.workflowLayerSource(name, vars, workflow, onError);
  }
  geoModule.archiveLayerSource.call(this, name, vars, onError);

  var m_time = -1,
    m_name = name,
    m_onError = defaultValue(onError, function(errorString) {}),
    m_workflow = workflow;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return data by running workflow
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time, callback) {

    if (m_time === time) {
      console.log('[info] No new data as timestamp has not changed.');
      return;
    }
    m_time = time;

    var replacer = function(key, value) {
      if(typeof value === 'number') {
        return value+'';
      }
      return value;
    };

    var asyncVal = false,
      retVal = [],
      errorString = null,
      reader = null;

    if (callback) {
      asyncVal = true;
    }

    $.ajax({
      type: 'POST',
      url: '/services/vistrail/execute/',
      data: {
        workflowJSON: JSON.stringify(m_workflow.data(), replacer, 2)
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
          retVal = reader.readGJObject(jQuery.parseJSON(response.result));
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

  /**
   *
   * @returns {wflModule.workflow}
   */
  this.workflow = function() {
    return m_workflow;
  }

  return this;
};

inherit(wflModule.workflowLayerSource, geoModule.archiveLayerSource);
