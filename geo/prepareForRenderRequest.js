//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

geoModule.prepareForRenderRequest = function(viewer, featureCollection) {
  "use strict";

  if (!(this instanceof geoModule.prepareForRenderRequest)) {
    return new geoModule.prepareForRenderRequest(viewer, featureCollection);
  }
  ogs.vgl.object.call(this);

   var m_viewer = viewer,
       m_featureCollection = featureCollection;

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
   * Make a request traverse scene for rendering purposes
   */
  ////////////////////////////////////////////////////////////////////////////
  this.requestPredraw = function() {
    $(this).trigger(geoModule.command.requestPredrawEvent);
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