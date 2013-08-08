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
 * Create a new instance of class port
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {wflModule.port}
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.port = function(options, data) {
  "use strict"
  if (!(this instanceof wflModule.port)) {
    return new wflModule.port(options, data);
  }
  vglModule.object.call(this);

  /** @private */
  var m_that = this,
    m_data = data,
    m_x = 0,
    m_y = 0,
    m_width = currentWorkflowStyle.module.port.width,
    m_module = options.module;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set x and y position
   *
   * @param {Number} x
   * @param {Number} y
   */
    ////////////////////////////////////////////////////////////////////////////
  this.setPosition = function(x, y) {
    m_x = x;
    m_y = y;
  };

  this.module = function() {
    return m_module;
  };

  this.x = function() {
    return m_x;
  };

  this.y = function() {
    return m_y;
  };

  this.data = function() {
    return m_data;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw the port onto given context.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
    ////////////////////////////////////////////////////////////////////////////
  this.draw = function(ctx, width) {
    ctx.fillStyle = currentWorkflowStyle.module.port.fill;
    ctx.strokeStyle = currentWorkflowStyle.module.port.stroke;
    ctx.fillRect(m_x, m_y, width, width);
    ctx.strokeRect(m_x, m_y, width, width);
  };

  this.drawAsCircle = function(ctx, width) {
    ctx.fillStyle = currentWorkflowStyle.module.port.fill;
    ctx.strokeStyle = currentWorkflowStyle.module.port.stroke;
    ctx.lineWidth = currentWorkflowStyle.module.port.lineWidth;

    var radius = width/2;
    ctx.beginPath();
    ctx.arc(m_x+radius, m_y+radius, radius, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  this.getName = function() {
    return this.data()['@name'];
  };

  this.contains = function(pos) {
    if(pos.x >= m_x) {
      if(pos.y >= m_y) {
        if(pos.x <= m_x + m_width) {
          if(pos.y <= m_y + m_width) {
            return true;
          }
        }
      }
    }
    return false;
  };

  this.hide = function() {};
  this.show = function() {};

  return this;
};

inherit(wflModule.port, vglModule.object);
