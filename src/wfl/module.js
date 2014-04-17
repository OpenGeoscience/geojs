//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, jQuery, document, wflModule*/
//////////////////////////////////////////////////////////////////////////////

var nextFunctionId = wflModule.utils.createIdCounter();

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class module
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {wflModule.module}
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.module = function(options, data) {
  "use strict";
  if (!(this instanceof wflModule.module)) {
    return new wflModule.module(options, data);
  }
  vgl.object.call(this);

  /** @private */
  var m_that = this,
    m_data = data,
    m_registryMap = wflModule.utils.moduleRegistryMap,
    m_registry = m_registryMap[data['@package']][data['@name']],
    m_metrics,
    m_ports = m_registry.portSpec,
    m_inPorts = {},
    m_outPorts = {},
    m_inPortCount = 0,
    m_outPortCount = 0,
    m_selected = false,
    m_isHover,
    m_workflow = options.workflow;

  //ensure location values are floating point numbers
  data.location['@x'] = parseFloat(data.location['@x']);
  data.location['@y'] = parseFloat(data.location['@y']);

  if(!(m_ports instanceof Array)) {
    m_ports = [m_ports];
  }

  if(!this.hasOwnProperty('inputPortClass')) {
    this.inputPortClass = wflModule.port;
  }

  if(!this.hasOwnProperty('outputPortClass')) {
    this.outputPortClass = wflModule.port;
  }

  /**
   * @private createPorts - creates port objects from workflow json
   */
  function createPorts() {
    var i;
    for(i = 0; i < m_ports.length; i++) {
      if(m_ports[i]['@type'] !== 'output') {
        m_inPorts[m_ports[i]['@name']] = m_that.inputPortClass({
            module: m_that
          }, m_ports[i]);
        m_inPortCount++;
      } else {
        m_outPorts[m_ports[i]['@name']] = m_that.outputPortClass({
            module: m_that
          }, m_ports[i]);
        m_outPortCount++;
      }
    }
  }

  this.workflow = function() {
    return m_workflow;
  };

  this.inPortCount = function() {
    return m_inPortCount;
  };

  this.outPortCount = function() {
    return m_outPortCount;
  };

  /**
   * Compute context font metrics based on drawStyle
   * @param ctx {CanvasRenderingContext2D}
   * @param drawStyle {Object}
   * @returns {TextMetrics}
   */
  this.getFontMetrics = function(ctx, drawStyle) {
    var result;
    ctx.save();
    ctx.font = drawStyle.module.text.font;
    result = ctx.measureText(m_data['@name']);
    ctx.restore();
    return result;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Recompute drawing metrics for this module
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} drawStyle
   */
    ////////////////////////////////////////////////////////////////////////////
  this.recomputeMetrics = function(ctx, drawStyle) {
    var portWidth = drawStyle.module.port.width,
      totalPortWidth = portWidth + drawStyle.module.port.pad,
      inPortsWidth = m_inPortCount * totalPortWidth +
        drawStyle.module.text.xpad,
      outPortsWidth = m_outPortCount * totalPortWidth,
      fontMetrics = this.getFontMetrics(ctx, drawStyle),
      textWidth = fontMetrics.width + drawStyle.module.text.xpad * 2,
      moduleWidth = Math.max(inPortsWidth, outPortsWidth +
        drawStyle.module.text.xpad, textWidth, drawStyle.module.minWidth),
      textHeight = 12, //TODO: get real height based on text font
      moduleHeight = drawStyle.module.port.pad*4 + portWidth*2 +
        drawStyle.module.text.ypad*2 + textHeight,
      mx = Math.floor(m_data.location['@x'] - moduleWidth/2),
      my = -Math.floor(m_data.location['@y']),
      inPortX = mx + drawStyle.module.port.pad,
      outPortX = mx + moduleWidth - outPortsWidth,
      key;

    m_metrics = {
      mx: mx,
      my: my,
      totalPortWidth: totalPortWidth,
      inPortsWidth: inPortsWidth,
      fontMetrics: fontMetrics,
      textWidth: textWidth,
      moduleWidth: moduleWidth,
      textHeight: textHeight,
      moduleHeight: moduleHeight,
      inPortX: inPortX,
      inPortY: my + drawStyle.module.port.pad,
      outPortX: outPortX,
      outPortY: my + moduleHeight - drawStyle.module.port.pad - portWidth
    };

    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        m_inPorts[key].setPosition(inPortX, m_metrics.inPortY);
        inPortX += portWidth + drawStyle.module.port.pad;
      }
    }

    for(key in m_outPorts) {
      if(m_outPorts.hasOwnProperty(key)) {
        m_outPorts[key].setPosition(outPortX, m_metrics.outPortY);
        outPortX += portWidth + drawStyle.module.port.pad;
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
   * Get input ports for this module
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getInPorts = function() {
    return m_inPorts;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get output ports for this module
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getOutPorts = function() {
    return m_outPorts;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get registry for this module
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getRegistry = function() {
    return m_registry;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get data for this module
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function() {
    return m_data;
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

    var portWidth = drawStyle.module.port.width,
      mx = m_metrics.mx,
      my = m_metrics.my,
      key;

    //draw rectangle
    ctx.fillStyle = drawStyle.module.fill;
    ctx.strokeStyle = drawStyle.module.stroke;
    ctx.fillRect(mx, my, m_metrics.moduleWidth, m_metrics.moduleHeight);
    ctx.strokeRect(mx, my, m_metrics.moduleWidth, m_metrics.moduleHeight);

    //draw ports
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
    ctx.fillStyle = drawStyle.module.text.fill;
    ctx.font = drawStyle.module.text.font;
    ctx.fillText(
      m_data['@name'],
      mx + Math.floor((m_metrics.moduleWidth - m_metrics.fontMetrics.width)/2),
      my + m_metrics.textHeight + drawStyle.module.text.ypad
    );

  };

  this.contains = function(pos) {
    var metrics = this.getMetrics();
    return pos.x > metrics.mx && pos.x < metrics.mx + metrics.moduleWidth &&
      pos.y > metrics.my && pos.y < metrics.my + metrics.moduleHeight;
  };

  this.portByPos = function(pos) {
    var key;
    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        if (m_inPorts[key].contains(pos)) {
          return m_inPorts[key];
        }
      }
    }
    for(key in m_outPorts) {
      if(m_outPorts.hasOwnProperty(key)) {
        if (m_outPorts[key].contains(pos)) {
          return m_outPorts[key];
        }
      }
    }
    return null;
  };

  this.hide = function() {
    var key;
    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        m_inPorts[key].hide();
      }
    }
  };

  this.show = function(inputContainer) {
    var key;
    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        m_inPorts[key].show(inputContainer);
      }
    }
  };

  /**
   * Gets the value of a function on this module, or null.
   *
   * @param {String} name - the name of the function
   * @returns {String|null}
   */
  this.getFunctionValue = function(name) {
    var i, f;
    if(m_data.hasOwnProperty('function')) {
      if(!$.isArray(m_data.function)) {
        m_data.function = [m_data.function];
      }

      for(i = 0; i < m_data.function.length; i++) {
        f = m_data.function[i];
        if(f['@name'] === name) {
          return f.parameter['@val'];
        }
      }
    }
    return null;
  };

  this.toggleSelected = function() {
    m_selected = !m_selected;
  };

  this.isSelected = function() {
    return m_selected;
  };

  this.delete = function() {
    var j,
      moduleDataList = m_that.workflow().data().workflow.module,
      portName;

    //remove from worfklow json data
    for(j = 0; j < moduleDataList.length; j++) {
      if(m_that.data() === moduleDataList[j]) {
        moduleDataList.splice(j, 1);
        break;
      }
    }

    //delete input elements
    for(portName in m_inPorts) {
      if(m_inPorts.hasOwnProperty(portName)) {
        m_inPorts[portName].delete();
      }
    }

    //delete output elements
    for(portName in m_outPorts) {
      if(m_outPorts.hasOwnProperty(portName)) {
        m_outPorts[portName].delete();
      }
    }
  };

  /**
   * Adds new function or updates function value if it already exists
   *
   * @param name
   * @param value
   */
  this.addOrUpdateFunction = function(name, value, type) {
    var i, f;
    if(m_data.hasOwnProperty('function')) {
      if(!$.isArray(m_data.function)) {
        m_data.function = [m_data.function];
      }

      for(i = 0; i < m_data.function.length; i++) {
        f = m_data.function[i];
        if(f['@name'] === name) {
          f.parameter['@val'] = value.toString();
          return;
        }
      }
    } else {
      m_data.function = [];
    }

    m_data.function.push(this.newFunction(name, value, type));
  };

  this.newFunction = function(name, value, type, pos, alias, description) {
    var id = nextFunctionId();
    pos = wflModule.utils.defaultValue(pos, "0");
    alias = wflModule.utils.defaultValue(alias, "");
    description = wflModule.utils.defaultValue(description, "<no description>");
    return {
      "@name": name,
      "#tail": "\n    ",
      "@id": id,
      "@pos": pos,
      "#text": "\n      ",
      "parameter": {
        "@val": value ? value.toString() : "",
        "@name": description,
        "#tail": "\n    ",
        "@pos": "0",
        "@alias": alias,
        "@id": id,
        "@type": type
      }
    };
  };

  this.setHover = function(value) {
    m_isHover = value;
  };

  this.isHover = function() {
    return m_isHover;
  };

  this.updateElementPositions = function() {};

  createPorts();

  return this;
};

inherit(wflModule.module, vgl.object);
