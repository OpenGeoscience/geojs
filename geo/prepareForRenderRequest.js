//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

geoModule.prepareForRenderRequest = function(mapOptions, viewer, featureCollection) {
  "use strict";

  if (!(this instanceof geoModule.prepareForRenderRequest)) {
    return new geoModule.prepareForRenderRequest(mapOptions,
      viewer, featureCollection);
  }
  ogs.vgl.object.call(this);

   var m_mapOptions = mapOptions,
       m_viewer = viewer,
       m_featureCollection = featureCollection;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return map options instance
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mapOptions = function() {
    return m_mapOptions;
  };

  ///////////////////////////////////////////////////////////////////////////
  /**
   * Return viewer instance
   */
  ///////////////////////////////////////////////////////////////////////////
  this.viewer = function() {
    return m_viewer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return feature collection instance
   */
  ////////////////////////////////////////////////////////////////////////////
  this.featureCollection = function() {
    return m_featureCollection;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Make a request to draw scene again
   */
  ////////////////////////////////////////////////////////////////////////////
  this.requestRedraw = function() {
    $(this).trigger(geoModule.command.requestRedrawEvent);
  };
};

inherit(geoModule.prepareForRenderRequest, ogs.vgl.object);