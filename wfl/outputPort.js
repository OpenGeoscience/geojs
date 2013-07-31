//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, proj4, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class outputPort
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {wflModule.port}
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.outputPort = function(options, data) {
  "use strict"
  if (!(this instanceof wflModule.outputPort)) {
    return new wflModule.outputPort(options, data);
  }
  wflModule.port.call(this, options, data);

  var m_name_width = 0;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw the port onto given context.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
    ////////////////////////////////////////////////////////////////////////////
  this.draw = function(ctx, width) {
    ctx.fillStyle = style.module.port.fill;
    ctx.strokeStyle = style.module.port.stroke;
    ctx.fillRect(this.x(), this.y(), width, width);
    ctx.strokeRect(this.x(), this.y(), width, width);
    this.drawName(ctx, width);
  };

  this.drawName = function(ctx, width) {
    ctx.fillStyle = style.module.text.fill;
    ctx.font = style.module.text.font;
    if(m_name_width == 0) {
      var metrics = ctx.measureText(this.data()['@name']);
      m_name_width = metrics.width;
    }
    ctx.fillText(this.data()['@name'], this.x()-width-m_name_width,
      this.y()+width);
  };

  return this;
};

inherit(wflModule.outputPort, wflModule.port);