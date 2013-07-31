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
 * Create a new instance of class inputModule
 *
 * @class
 * @dec
 * @returns {wflModule.inputModule}
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.inputModule = function(options, data) {
  "use strict";
  if (!(this instanceof wflModule.inputModule)) {
    return new wflModule.inputModule(options, data);
  }
  this.inputPortClass = wflModule.inputPort;
  this.outputPortClass = wflModule.outputPort;
  wflModule.workflowModule.call(this, options, data);

  /** @priave */
  var m_that = this,
    m_metrics,
    m_baseRecomputeMetrics = this.recomputeMetrics,
    m_baseGetMetrics = this.getMetrics;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Recompute drawing metrics for this module
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} style
   */
    ////////////////////////////////////////////////////////////////////////////

  this.recomputeMetrics = function(ctx, style) {
    m_baseRecomputeMetrics.call(this, ctx, style);
    var base_metrics = m_baseGetMetrics.call(this),
      new_metrics,
      maxInPortTextWidth = 0,
      maxOutPortTextWidth = 0,
      maxInPortTextKey,
      maxOutPortTextKey,
      portWidth = style.module.port.width,
      key;

    //find longest port name
    for(key in this.getInPorts()) {
      if(this.getInPorts().hasOwnProperty(key)) {
        if(this.getInPorts()[key].getName().length > maxInPortTextWidth) {
          maxInPortTextWidth = this.getInPorts()[key].getName().length;
          maxInPortTextKey = key;
        }
      }
    }

    for(key in this.getOutPorts()) {
      if(this.getOutPorts().hasOwnProperty(key)) {
        if(this.getOutPorts()[key].getName().length > maxOutPortTextWidth) {
          maxOutPortTextWidth = this.getOutPorts()[key].getName().length;
          maxOutPortTextKey = key;
        }
      }
    }

    var textHeight = 12, //TODO: get real height based on text font
      totalInPortHeight = style.module.port.inputHeight + textHeight +
        style.module.port.inputYPad + style.module.port.inpad,
      totalOutPortHeight = textHeight + style.module.port.outpad,
      inPortsHeight = this.inPortCount() * totalInPortHeight +
        style.module.text.xpad,
      outPortsHeight = this.outPortCount() * totalOutPortHeight;
    var
      fontMetrics = ctx.measureText(this.getData()['@name']),
      textWidth = fontMetrics.width + style.module.text.xpad * 2;
    var
      inPortFontMetrics = maxInPortTextKey ? ctx.measureText(
        this.getInPorts()[maxInPortTextKey]['@name']) : {width:0};
    var
      outPortFontMetrics = maxOutPortTextKey ? ctx.measureText(
        this.getOutPorts()[maxOutPortTextKey]['@name']) : {width:0},
      inPortsWidth = Math.max(inPortFontMetrics.width,
        style.module.port.inputWidth),
      outPortsWidth = outPortFontMetrics.width,
      moduleWidth = Math.max(
        inPortsWidth + outPortsWidth + portWidth*2 + style.module.port.pad*6,
        textWidth + style.module.text.xpad*2,
        style.module.minWidth
      ),
      moduleHeight = Math.max(
        inPortsHeight,
        outPortsHeight,
        style.module.minWidth
      ) + style.module.text.ypad*2 + textHeight,
      mx = Math.floor(this.getData().location['@x'] - moduleWidth/2),
      my = -Math.floor(this.getData().location['@y']),
      inPortY = my + style.module.port.pad + textHeight + portWidth*2,
      outPortY = my + moduleHeight - style.module.port.pad - portWidth;

    new_metrics = {
      mx: mx,
      my: my,
      fontMetrics: fontMetrics,
      textWidth: textWidth,
      moduleWidth: moduleWidth,
      textHeight: textHeight,
      moduleHeight: moduleHeight,
      inPortX: mx + style.module.port.pad,
      inPortY: inPortY,
      outPortX: mx + moduleWidth - style.module.port.pad - portWidth,
      outPortY: outPortY,
      outPortTextX: mx + inPortsWidth + portWidth + style.module.port.pad*4
    };

    merge_options_overwrite(base_metrics, new_metrics);
    m_metrics = base_metrics;

    //compute port positions
    for(key in this.getInPorts()) {
      if(this.getInPorts().hasOwnProperty(key)) {
        this.getInPorts()[key].setPosition(base_metrics.inPortX, inPortY);
        inPortY += style.module.port.inputHeight + textHeight +
          style.module.port.inputYPad + style.module.port.inpad;
      }
    }

    for(key in this.getOutPorts()) {
      if(this.getOutPorts().hasOwnProperty(key)) {
        this.getOutPorts()[key].setPosition(base_metrics.outPortX, outPortY);
        outPortY -= textHeight + style.module.port.outpad;
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get drawing metrics for this module
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getMetrics = function() {
    return m_metrics;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw the module onto given context.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
    ////////////////////////////////////////////////////////////////////////////
  this.draw = function(ctx, style) {

    if(!m_metrics) {
      this.recomputeMetrics(ctx, style);
    }

    var portWidth = style.module.port.width,
      mx = m_metrics.mx,
      my = m_metrics.my,
      m_inPorts = this.getInPorts(),
      m_outPorts = this.getOutPorts(),
      key;

    //draw rectangle
    ctx.fillStyle = style.module.fill;
    ctx.strokeStyle = style.module.stroke;
    ctx.fillRect(mx, my, m_metrics.moduleWidth, m_metrics.moduleHeight);
    ctx.strokeRect(mx, my, m_metrics.moduleWidth, m_metrics.moduleHeight);

    //draw ports
    ctx.fillStyle = style.module.port.fill;
    ctx.strokeStyle = style.module.port.stroke;
    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        m_inPorts[key].draw(ctx, portWidth);
      }
    }

    for(key in m_outPorts) {
      if(m_outPorts.hasOwnProperty(key)) {
        m_outPorts[key].draw(ctx, portWidth);
      }
    }

    //draw module name
    ctx.fillStyle = style.module.text.fill;
    ctx.font = style.module.text.font;
    ctx.fillText(
      this.getData()['@name'],
      mx + Math.floor((m_metrics.moduleWidth - m_metrics.fontMetrics.width)/2),
      my + m_metrics.textHeight + style.module.text.ypad);

  };

  this.updateElementPositions = function() {
    var key,
      m_inPorts = this.getInPorts();
    for(key in m_inPorts) {
      m_inPorts[key].updateElementPosition(
        m_inPorts[key].x(),
        m_inPorts[key].y()
      );
    }
  };

  this.setInput = function(name, value) {
    var key,
      m_inPorts = this.getInPorts();
    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        if(m_inPorts[key].data()['@name'] == name) {
          $(m_inPorts[key].getElement()).val(value);
        }
      }
    }
  };

  return this;
};

inherit(wflModule.inputModule, wflModule.workflowModule);