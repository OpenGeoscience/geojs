//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, proj4, document, wflModule*/
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
  "use strict";
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
    var drawStyle = this.drawStyle();
    ctx.fillStyle = drawStyle.module.text.fill;
    ctx.font = drawStyle.module.text.font;
    ctx.fillText(this.data()['@name'], this.x() + width*2, this.y()+width);
  };

  function createElementFromType(placeholder) {
    //TODO: support other types of input for color, dates, etc.
    m_input_elem = document.createElement('input');
    m_input_elem.type = 'text';
    m_input_elem.placeholder = wflModule.utils.defaultValue(placeholder, "");
    $(m_input_elem).css({
      position: 'absolute',
      'pointer-events': 'auto'
    }).change(function() {
        m_that.module().addOrUpdateFunction(
          m_that.data()['@name'],
          $(this).val(),
          m_that.data().portSpecItem['@module']
        );
      });
    m_that.setElementValueFromData();
  }

  this.setPosition = function(x,y) {
    m_baseSetPosition(x,y);
    this.updateElementPosition(x,y);
  };

  this.updateElementPosition = function(x,y) {
    var translated = this.module().workflow().translated(),
      drawStyle = this.drawStyle();

    $(m_input_elem).css({
      top: y + translated.y - drawStyle.shadowBlur,
      left: x + translated.x + drawStyle.module.port.width +
        drawStyle.module.port.pad - drawStyle.shadowBlur
    });
  };

  this.show = function(inputContainer) {
    inputContainer.appendChild(m_input_elem);
    $(m_input_elem).show();
  };

  this.hide = function() {
    $(m_input_elem).hide();
    $(m_input_elem).detach();
  };

  this.setElementValueFromData = function() {
    $(m_input_elem).val(
      m_that.module().getFunctionValue(m_that.data()['@name']));
  };

  this.delete = function() {
    $(m_input_elem).remove();
  };

  createElementFromType(this.data()['@name']);

  return this;
};

inherit(wflModule.inputPort, wflModule.outputPort);
