//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */
//////////////////////////////////////////////////////////////////////////////

/*jslint devel: true, forin: true, newcap: true, plusplus: true,
   white: true, indent: 2*/
/*global geoModule, ogs, inherit, $*/

geoModule.mapDrawVisitor = function(viewer, featureCollection) {
  "use strict";

  if (!(this instanceof geoModule.mapDrawVisitor)) {
    return new geoModule.mapDrawVisitor(viewer, featureCollection);
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
   * Make a request to travere scene tree for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.requestRenderTraversal = function() {
    $(this).trigger(geoModule.command.requestRenderTraversalEvent);
  };
};

inherit(geoModule.mapDrawVisitor, ogs.vgl.object);