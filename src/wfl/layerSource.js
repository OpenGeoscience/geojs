//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, jQuery, document, wflModule*/
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
wflModule.layerSource = function(id, name, path, config, vars, workflow, onError) {
  'use strict';

  if (!(this instanceof wflModule.layerSource) ) {
    return new wflModule.layerSource(id, name, path, config, vars, workflow, onError);
  }
  geo.archiveLayerSource.call(this, id, name, path, config, vars, onError);

  var m_time = -1,
      m_that = this,
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
      return m_that.resultCache();
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
    if (!isNaN(parseFloat(m_time))) {  //make sure timestep is a number
      try {
        m_workflow.getModuleByName('Variable').setInput('time', m_time);
      } catch (e) {
        console.log('[info] Unable to set time on workflow');
      }
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
          reader = vgl.geojsonReader();
          retVal = reader.readGJObject(jQuery.parseJSON(response.result));
        }
      },
      error: function(jqXHR, textStatus, errorThrown ) {
        errorString = "Error reading " + this.name() + ": " + errorThrown;
        console.log(errorString);
        m_onError(errorString);
      }
    });

    if (callback) {
      callback(retVal);
    }

    m_that.p_setResultCache(retVal);
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

inherit(wflModule.layerSource, geo.archiveLayerSource);
