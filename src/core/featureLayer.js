//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, */
/*jslint white: true, indent: 2, continue:true*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document, gl, vec3*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class featureLayer
 *
 * @class
 * @dec Layer to draw points, lines, and polygons on the map The polydata layer
 *      provide mechanisms to create and draw geometrical shapes such as points,
 *      lines, and polygons.
 * @returns {geo.featureLayer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.featureLayer = function(arg) {
  "use strict";
  if (!(this instanceof geo.featureLayer)) {
    return new geo.featureLayer(arg);
  }
  geo.layer.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_features = [];


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.create = function(featureName) {
    m_features.push(geo.createFeature(this.rendererApi(), featureName));

    return m_features[m_features.length - 1];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set drawables
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.features = function(val) {
    var i = 0;
    if (val === undefined) {
      return m_features;
    } else {
      m_features = val.slice(0);
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function() {
    var i;

    if (!this.source() && m_features.length === 0) {
      console.log('[info] No valid data source found.');
      return;
    }

    // TODO Fix this
    for (i = 0; i < m_features.length; ++i) {
        m_features[i].renderer(this.renderer());
    }

    for (i = 0; i < m_features.length; ++i) {
        m_features[i]._update()
      }
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw
   */
  ////////////////////////////////////////////////////////////////////////////
  this._draw = function() {
    this.renderer()._render();
  };

  return this;
};

inherit(geo.featureLayer, geo.layer);
