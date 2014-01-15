//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, */
/*jslint white: true, indent: 2, continue:true*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document, gl, vec3*/
//////////////////////////////////////////////////////////////////////////////

geo.floodLayer = function() {
  "use strict";
  if (!(this instanceof geo.floodLayer)) {
    return new geo.floodLayer();
  }

  /** @private */
  var m_super = callSuper(geo.featureLayer, this),
      m_that = this,
      m_pointSize = 10;

  this.updatePointSize = function(pointSize) {
    var i, features = this.features();
    for(i=0; i< features.length; i++) {
      features[i].material().shaderProgram().uniform("pointSize").set(pointSize)
    }
  };

  this.addData = function(data, append) {
    var i, features;

    append = append !== undefined ? append : false;

    m_super.addData.call(this, data, append);
    // Now set the point size
    this.updatePointSize(m_pointSize);
  };

  this.pointSpriteSize = function(pointSize) {

    if(pointSize !== undefined && pointSize != m_pointSize) {
      m_pointSize = pointSize;
      this.updatePointSize(pointSize);
      return this;
    }

    return m_pointSize;
  };

  this.redraw = function() {
    this.container().draw();
  };
};

inherit(geo.floodLayer, geo.featureLayer);
