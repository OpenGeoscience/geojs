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
 * Create a new instance of class inputPort
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {wflModule.inputPort}
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.inputPort = function(options, data) {
  "use strict"
  if (!(this instanceof wflModule.inputPort)) {
    return new wflModule.inputPort(options, data);
  }
  wflModule.outputPort.call(this, options, data);

  var m_that = this,
    m_input_elem,
    m_baseSetPosition = this.setPosition;

  this.getElement = function() {
    return m_input_elem;
  };

  this.drawName = function(ctx, width) {
    ctx.fillStyle = currentWorkflowStyle.module.text.fill;
    ctx.font = currentWorkflowStyle.module.text.font;
    ctx.fillText(this.data()['@name'], this.x() + width*2, this.y()+width);
  };

  function createElementFromType() {
    //TODO: support other types of input for color, dates, etc.
    m_input_elem = document.createElement('input');
    m_input_elem.type = 'text';
    $(m_input_elem).css({
      position: 'absolute'
    }).change(function() {
        //TODO: update functions in workflow JSON data
      });

    $('#canvasContainer').append(m_input_elem);
  }

  this.setPosition = function(x,y) {
    m_baseSetPosition(x,y);
    this.updateElementPosition(x,y);
  };

  this.updateElementPosition = function(x,y) {
    var translated = this.module().workflow().translated();

    $(m_input_elem).css({
      top: y + translated.y + currentWorkflowStyle.module.port.width*2,
      left: x + translated.x
    });
  };

  this.show = function() {
    $(m_input_elem).show();
  };

  this.hide = function() {
    $(m_input_elem).hide();
  };

  createElementFromType();

  return this;
};

inherit(wflModule.inputPort, wflModule.outputPort);
