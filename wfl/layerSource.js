//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, jQuery, document, wflModule*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * workflow layerSource retrieves its data by running a workflow
 *
 * onError function of the form:
 *
 *   function(String errorText)
 *
 * It allows the propgation of errors to the caller, so the user
 * can be provided with the appropriate error message.
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.layerSource = function(name, config, vars, workflow, onError) {
  'use strict';

  if (!(this instanceof wflModule.layerSource) ) {
    return new wflModule.layerSource(name, config, vars, workflow, onError);
  }
  geoModule.archiveLayerSource.call(this, name, config, vars, onError);

  var m_time = -1,
    m_name = name,
    m_onError = wflModule.utils.defaultValue(onError, function(errorString) {}),
    m_workflow = workflow;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return data by running workflow
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getData = function(time, callback) {

    var asyncVal = false,
      retVal = [],
      errorString = null,
      reader = null;

    if (m_time === time) {
      console.log('[info] No new data as timestamp has not changed.');
      return;
    }
    m_time = time;

    function replacer(key, value) {
      if(typeof value === 'number') {
        return value.toString();
      }
      return value;
    }

    if (callback) {
      asyncVal = true;
    }

    //set time function on workflow
    try {
      m_workflow.getModuleByName('Variable').setInput('time', m_time);
    } catch (e) {
      console.log('[info] Unable to set time on workflow');
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
  };

  return this;
};

inherit(wflModule.layerSource, geoModule.archiveLayerSource);
