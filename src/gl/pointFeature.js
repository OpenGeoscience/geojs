//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.gl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ggl, inherit, document$*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @returns {ggl.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.pointFeature = function(arg) {
  "use strict";
  if (!(this instanceof geo.pointFeature)) {
    return new geo.pointFeature(arg);
  }
  arg = arg || {};
  geo.pointFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_actor = vgl.utils.createPoints(this.positions(),
                this.style().colors),
      m_buildTime = vgl.timestamp(),
      m_updateTime = vgl.timestamp();

  function build() {
    m_buildTime.modified();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function() {
    if (this.dataTimestamp().getMTime() > m_buildTime.getMTime()) {
      build();
    }

    if (m_updateTime.getMTime() < this.getMTime()) {
      if (this.style.color instanceof vgl.lookupTable) {
        vgl.utils.updateColorMappedMaterial(this.material(),
          this.style.color);
      }
      m_updateTime.modified();
    }
  };

  return this;
};

inherit(geo.pointFeature, geo.feature);