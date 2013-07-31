//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class module
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {wflModule.workflowModule}
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.workflowModule = function(options, data) {
  "use strict";
  if (!(this instanceof wflModule.workflowModule)) {
    return new wflModule.workflowModule(options, data);
  }
  vglModule.object.call(this);

  /** @private */
  var m_that = this,
    m_data = data,
    m_registry = moduleRegistry[data['@package']][data['@name']],
    m_metrics,
    m_ports = m_registry.portSpec,
    m_inPorts = {},
    m_outPorts = {},
    m_inPortCount = 0,
    m_outPortCount = 0,
    i = 0,
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

  for(; i < m_ports.length; i++) {
    if(m_ports[i]['@type'] != 'output') {
      m_inPorts[m_ports[i]['@name']] = this.inputPortClass({module: m_that}, m_ports[i]);
      m_inPortCount++;
    } else {
      m_outPorts[m_ports[i]['@name']] = this.outputPortClass({module: m_that}, m_ports[i]);
      m_outPortCount++;
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Recompute drawing metrics for this module
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} currentWorkflowStyle
   */
    ////////////////////////////////////////////////////////////////////////////
  this.recomputeMetrics = function(ctx, currentWorkflowStyle) {
    var portWidth = currentWorkflowStyle.module.port.width,
      totalPortWidth = portWidth + currentWorkflowStyle.module.port.pad,
      inPortsWidth = m_inPortCount * totalPortWidth + currentWorkflowStyle.module.text.xpad,
      outPortsWidth = m_outPortCount * totalPortWidth,
      fontMetrics = ctx.measureText(m_data['@name']),
      textWidth = fontMetrics.width + currentWorkflowStyle.module.text.xpad * 2,
      moduleWidth = Math.max(inPortsWidth, outPortsWidth+currentWorkflowStyle.module.text.xpad,
        textWidth, currentWorkflowStyle.module.minWidth),
      textHeight = 12, //TODO: get real height based on text font
      moduleHeight = currentWorkflowStyle.module.port.pad*4 + portWidth*2 +
        currentWorkflowStyle.module.text.ypad*2 + textHeight,
      mx = Math.floor(m_data.location['@x'] - moduleWidth/2),
      my = -Math.floor(m_data.location['@y']),
      inPortX = mx + currentWorkflowStyle.module.port.pad,
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
      inPortY: my + currentWorkflowStyle.module.port.pad,
      outPortX: outPortX,
      outPortY: my + moduleHeight - currentWorkflowStyle.module.port.pad - portWidth
    };

    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        m_inPorts[key].setPosition(inPortX, m_metrics.inPortY);
        inPortX += portWidth + currentWorkflowStyle.module.port.pad;
      }
    }

    for(key in m_outPorts) {
      if(m_outPorts.hasOwnProperty(key)) {
        m_outPorts[key].setPosition(outPortX, m_metrics.outPortY);
        outPortX += portWidth + currentWorkflowStyle.module.port.pad;
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
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get input ports for this module
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getInPorts = function() {
    return m_inPorts;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get output ports for this module
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getOutPorts = function() {
    return m_outPorts;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get registry for this module
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getRegistry = function() {
    return m_registry;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get data for this module
   */
    ////////////////////////////////////////////////////////////////////////////
  this.getData = function() {
    return m_data;
  }


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw the module onto given context.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
    ////////////////////////////////////////////////////////////////////////////
  this.draw = function(ctx, currentWorkflowStyle) {
    if(!m_metrics) {
      this.recomputeMetrics(ctx, currentWorkflowStyle);
    }

    var portWidth = currentWorkflowStyle.module.port.width,
      mx = m_metrics.mx,
      my = m_metrics.my,
      inPortX = m_metrics.inPortX,
      outPortX = m_metrics.outPortX,
      i,
      key;

    //draw rectangle
    ctx.fillStyle = currentWorkflowStyle.module.fill;
    ctx.strokeStyle = currentWorkflowStyle.module.stroke;
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
    ctx.fillStyle = currentWorkflowStyle.module.text.fill;
    ctx.font = currentWorkflowStyle.module.text.font;
    ctx.fillText(
      m_data['@name'],
      mx + Math.floor((m_metrics.moduleWidth - m_metrics.fontMetrics.width)/2),
      my + m_metrics.textHeight + currentWorkflowStyle.module.text.ypad
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
    for(var key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        m_inPorts[key].hide();
      }
    }
  };

  this.show = function() {
    for(var key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        m_inPorts[key].show();
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
    if(m_data.hasOwnProperty('function')) {
      if(!$.isArray(m_data.function)) {
        m_data.function = [m_data.function];
      }

      for(var i = 0; i < m_data.function.length; i++) {
        var f = m_data.function[i];
        if(f['@name'] == name) {
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
    pos = defaultValue(pos, "0");
    alias = defaultValue(alias, "");
    description = defaultValue(description, "<no description>");
    return {
      "@name": name,
      "#tail": "\n    ",
      "@id": id,
      "@pos": pos,
      "#text": "\n      ",
      "parameter": {
        "@val": value.toString(),
        "@name": description,
        "#tail": "\n    ",
        "@pos": "0",
        "@alias": alias,
        "@id": id,
        "@type": type
      }
    };
  };

  this.updateElementPositions = function() {};

  return this;
};

inherit(wflModule.workflowModule, vglModule.object);
