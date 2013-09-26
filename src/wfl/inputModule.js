//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, proj4, document, wflModule*/
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
  wflModule.module.call(this, options, data);

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
   * @param {object} currentWorkflowStyle
   */
    ////////////////////////////////////////////////////////////////////////////

  this.recomputeMetrics = function(ctx, currentWorkflowStyle) {
    m_baseRecomputeMetrics.call(this, ctx, currentWorkflowStyle);
    var base_metrics = m_baseGetMetrics.call(this),
      new_metrics,
      portWidth = currentWorkflowStyle.module.port.width,
      key,
      textHeight = 15, //TODO: get real height based on text font
      totalInPortHeight = currentWorkflowStyle.module.port.inputHeight +
        textHeight + currentWorkflowStyle.module.port.inputYPad +
        currentWorkflowStyle.module.port.inpad,
      totalOutPortHeight = textHeight + currentWorkflowStyle.module.port.outpad,
      inPortsHeight = this.inPortCount() * totalInPortHeight +
        currentWorkflowStyle.module.text.xpad,
      outPortsHeight = this.outPortCount() * totalOutPortHeight,
      fontMetrics = ctx.measureText(this.data()['@name']),
      textWidth = fontMetrics.width + currentWorkflowStyle.module.text.xpad * 2,
      inPortsWidth = this.getInPorts().length > 0 ?
        this.getInPorts()[0].getElement().width :
          currentWorkflowStyle.module.port.inputWidth,
      moduleWidth = Math.max(
        inPortsWidth + portWidth*2 + currentWorkflowStyle.module.port.pad*4,
        textWidth + currentWorkflowStyle.module.text.xpad*2,
        currentWorkflowStyle.module.minWidth
      ),
      moduleHeight = Math.max(
        inPortsHeight,
        outPortsHeight,
        currentWorkflowStyle.module.minWidth
      ) + currentWorkflowStyle.module.text.ypad*2 + textHeight,
      mx = Math.floor(this.data().location['@x'] - moduleWidth/2),
      my = -Math.floor(this.data().location['@y']),
      inPortY = my + currentWorkflowStyle.module.port.pad + textHeight +
        portWidth*2,
      outPortY = my + moduleHeight - currentWorkflowStyle.module.port.pad -
        portWidth;

    new_metrics = {
      mx: mx,
      my: my,
      fontMetrics: fontMetrics,
      textWidth: textWidth,
      moduleWidth: moduleWidth,
      textHeight: textHeight,
      moduleHeight: moduleHeight,
      inPortX: mx + currentWorkflowStyle.module.port.pad,
      inPortY: inPortY,
      outPortX: mx + moduleWidth -
        currentWorkflowStyle.module.port.pad - portWidth,
      outPortY: outPortY,
      outPortTextX: mx + inPortsWidth + portWidth +
        currentWorkflowStyle.module.port.pad*4
    };

    wflModule.utils.merge_options_in_place(base_metrics, new_metrics);
    m_metrics = base_metrics;

    //compute port positions
    for(key in this.getInPorts()) {
      if(this.getInPorts().hasOwnProperty(key)) {
        this.getInPorts()[key].setPosition(base_metrics.inPortX, inPortY);
        inPortY += currentWorkflowStyle.module.port.inputHeight + textHeight +
          currentWorkflowStyle.module.port.inputYPad +
          currentWorkflowStyle.module.port.inpad;
      }
    }

    for(key in this.getOutPorts()) {
      if(this.getOutPorts().hasOwnProperty(key)) {
        this.getOutPorts()[key].setPosition(base_metrics.outPortX, outPortY);
        outPortY -= textHeight + currentWorkflowStyle.module.port.outpad;
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
  this.draw = function(ctx, drawStyle) {

    if(!m_metrics) {
      this.recomputeMetrics(ctx, drawStyle);
    }

    var mStyle = drawStyle.module,
      portWidth = mStyle.port.width,
      mx = m_metrics.mx,
      my = m_metrics.my,
      m_inPorts = this.getInPorts(),
      m_outPorts = this.getOutPorts(),
      key;

    //draw rectangle
    ctx.fillStyle = mStyle.fill;
    ctx.lineWidth = mStyle.lineWidth;
    ctx.strokeStyle = this.isSelected() ? mStyle.selectedStroke : mStyle.stroke;

    ctx.save();
    if(this.isHover()) {
      ctx.shadowBlur = mStyle.shadowBlur;
      ctx.shadowColor = mStyle.shadowColor;
    }

    //translate to ensure fill pattern is consistent
    ctx.translate(mx,my);
    wflModule.utils.roundRect(ctx, 0, 0, m_metrics.moduleWidth,
      m_metrics.moduleHeight, mStyle.cornerRadius, true, true);

    ctx.restore();

    //draw ports
    ctx.fillStyle = mStyle.port.fill;
    ctx.strokeStyle = mStyle.port.stroke;
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
    ctx.fillStyle = mStyle.text.fill;
    ctx.font = mStyle.text.font;
    ctx.fillText(
      this.data()['@name'],
      mx + Math.floor((m_metrics.moduleWidth - m_metrics.fontMetrics.width)/2),
      my + m_metrics.textHeight + mStyle.text.ypad);

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
      port,
      portSpec,
      portType,
      m_inPorts = this.getInPorts();
    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        port = m_inPorts[key];
        if(port.data()['@name'] === name) {
          $(port.getElement()).val(value);
          portSpec = port.data().portSpecItem;
          //portType = [portSpec['@package'], '.', portSpec['@module']].join('');
          portType = portSpec['@module'];
          this.addOrUpdateFunction(name, value, portType);
          return;
        }
      }
    }
  };

  return this;
};

inherit(wflModule.inputModule, wflModule.module);
