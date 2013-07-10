/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
function merge_options(obj1,obj2){
  var obj3 = {};
  for (var attrName in obj1) { obj3[attrName] = obj1[attrName]; }
  for (var attrName in obj2) { obj3[attrName] = obj2[attrName]; }
  return obj3;
}

function merge_options_overwrite(obj1, obj2) {
  for (var attrName in obj2) { obj1[attrName] = obj2[attrName]; }
  return obj1;
}

function defaultValue(param, _default) {
  return typeof param !== 'undefined' ? param: _default;
}

function createIdCounter(initialId) {
  initialId = defaultValue(initialId, -1);
  return function() { initialId += 1; return initialId; };
}

var nextWorkflowId = createIdCounter();
var nextModuleId = createIdCounter();
var nextLocationId = createIdCounter();
var nextConnectionId = createIdCounter();
var nextPortId = createIdCounter();

//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.ui
 */
//////////////////////////////////////////////////////////////////////////////

/*jslint devel: true, forin: true, newcap: true, plusplus: true,
 white: true, indent: 2*/
/*global geoModule, ogs, inherit, $*/

//////////////////////////////////////////////////////////////////////////////
/**
 * Workflow options object specification
 */
//////////////////////////////////////////////////////////////////////////////
uiModule.workflowOptions = function() {
  "use strict";
  // Check against no use of new()
  if (!(this instanceof uiModule.workflowOptions)) {
    return new uiModule.workflowOptions();
  }

  this.data = {};
  this.modules = {};
  this.connections = {};
  this.style = climatePipesStyle;
  this.translated = {x:0, y:0};
  this.moduleClass = uiModule.inputModule;

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all workflow types ogs.ui.workflow.
 */
//////////////////////////////////////////////////////////////////////////////
uiModule.workflow = function(options) {
  "use strict";
  this.events = {
    "moduleAdded" : "moduleAdded",
    "connectionAdded" : "connectionAdded"
  };

  if (!(this instanceof uiModule.workflow)) {
    return new uiModule.workflow(options);
  }
  vglModule.object.call(this);

  options = typeof options !== 'undefined' ? options : {};
  options = merge_options(uiModule.workflowOptions(), options);

  /** @private */
  var m_that = this,
    m_data = options.data,
    m_modules = options.modules,
    m_connections = options.connections,
    m_style = options.style,
    m_translated = options.translated,
    m_moduleClass = options.moduleClass,
    m_visible = false;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Generate modules from the workflow JSON data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.generateModulesFromData = function() {
    var i = 0,
      maxId = 0,
      nextId = nextModuleId(),
      modules = m_data.workflow.module;

    for(; i < modules.length; i++) {
      var mid = parseInt(modules[i]['@id']);
      m_modules[mid] = m_moduleClass(null, modules[i]);

      if(mid > maxId) {
        maxId = mid;
      }

      while (maxId > nextId) {
        nextId = nextModuleId();
      }
    }
  };

  this.addNewModule = function(JSONdata, x, y) {
    var moduleInfo = JSON.parse(JSONdata),
      module = {
        "@name": moduleInfo['@name'],
        "@package": moduleInfo['@package'],
        "@version": moduleInfo['@packageVersion'],
        "@namespace": moduleInfo['@namespace'],
        "@cache": "1",
        "location": {
          "@x": parseFloat(x),
          "@y": -parseFloat(y),
          "@id": nextLocationId()
        },
        "@id": nextModuleId()
      };

    m_modules[module['@id']] = m_moduleClass(null, module);
    this.data().workflow.module.push(module);
  };

  this.generateConnectionsFromData = function() {

  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw the workflow onto given context.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
    ////////////////////////////////////////////////////////////////////////////
  this.draw = function(ctx) {
    var key;

    ctx.fillStyle = style.fill;
    ctx.fillRect(-m_translated.x, -m_translated.y, ctx.canvas.width, ctx.canvas.height);

    for(key in m_modules) {
      if(m_modules.hasOwnProperty(key)) {
        m_modules[key].draw(ctx, m_style);
      }
    }

    for(key in m_connections) {
      if(m_connections.hasOwnProperty(key)) {
        m_connections[key].draw(ctx, m_style);
      }
    }
  };

  this.resize = function() {
    if(m_visible) {
      var canvasContainer = $('#canvasContainer')[0],
        canvas =  $('#workspace')[0],
        rect = canvasContainer.getBoundingClientRect(),
        translated = this.translated(),
        ctx;
      canvas.width = rect.width - 20;
      canvas.height = rect.height - 20;
      ctx = canvas.getContext('2d');
      ctx.translate(translated.x, translated.y);
      this.draw(ctx);
    }
  };

  this.setVisible = function(visible) {
    m_visible = visible;
  };

  this.visible = function() {
    return m_visible;
  };

  this.translated = function() {
    return m_translated;
  };

  this.translate = function(ctx, x, y) {
    m_translated.x += x;
    m_translated.y += y;
    ctx.translate(x,y);
  };

  this.show = function() {
    this.setVisible(true);
    this.resize();
  };

  this.modules = function() {
    return m_modules;
  };

  this.data = function() {
    return m_data;
  };

  return this;
};

inherit(uiModule.workflow, vglModule.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class module
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {uiModule.module}
 */
//////////////////////////////////////////////////////////////////////////////
uiModule.module = function(options, data) {
  "use strict";
  if (!(this instanceof uiModule.module)) {
    return new uiModule.module(options, data);
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
    i = 0;

  //ensure location values are floating point numbers
  data.location['@x'] = parseFloat(data.location['@x']);
  data.location['@y'] = parseFloat(data.location['@y']);

  if(!(m_ports instanceof Array)) {
    m_ports = [m_ports];
  }

  if(!this.hasOwnProperty('inputPortClass')) {
    this.inputPortClass = uiModule.port;
  }

  if(!this.hasOwnProperty('outputPortClass')) {
    this.outputPortClass = uiModule.port;
  }

  for(; i < m_ports.length; i++) {
    if(m_ports[i]['@type'] != 'output') {
      m_inPorts[m_ports[i]['@id']] = this.inputPortClass(null, m_ports[i]);
      m_inPortCount++;
    } else {
      m_outPorts[m_ports[i]['@id']] = this.outputPortClass(null, m_ports[i]);
      m_outPortCount++;
    }
  }

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
   * @param {object} style
   */
    ////////////////////////////////////////////////////////////////////////////
  this.recomputeMetrics = function(ctx, style) {
    var portWidth = style.module.port.width,
      totalPortWidth = portWidth + style.module.port.pad,
      inPortsWidth = m_inPortCount * totalPortWidth + style.module.text.xpad,
      outPortsWidth = m_outPortCount * totalPortWidth,
      fontMetrics = ctx.measureText(m_data['@name']),
      textWidth = fontMetrics.width + style.module.text.xpad * 2,
      moduleWidth = Math.max(inPortsWidth, outPortsWidth+style.module.text.xpad,
        textWidth, style.module.minWidth),
      textHeight = 12, //TODO: get real height based on text font
      moduleHeight = style.module.port.pad*4 + portWidth*2 +
        style.module.text.ypad*2 + textHeight,
      mx = Math.floor(m_data.location['@x'] - moduleWidth/2),
      my = -Math.floor(m_data.location['@y']),
      inPortX = mx + style.module.port.pad,
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
      inPortY: my + style.module.port.pad,
      outPortX: outPortX,
      outPortY: my + moduleHeight - style.module.port.pad - portWidth
    };

    for(key in m_inPorts) {
      if(m_inPorts.hasOwnProperty(key)) {
        m_inPorts[key].setPosition(inPortX, m_metrics.inPortY);
        inPortX += portWidth + style.module.port.pad;
      }
    }

    for(key in m_outPorts) {
      if(m_outPorts.hasOwnProperty(key)) {
        m_outPorts[key].setPosition(outPortX, m_metrics.outPortY);
        outPortX += portWidth + style.module.port.pad;
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
  this.draw = function(ctx, style) {
    if(!m_metrics) {
      this.recomputeMetrics(ctx, style);
    }

    var portWidth = style.module.port.width,
      mx = m_metrics.mx,
      my = m_metrics.my,
      inPortX = m_metrics.inPortX,
      outPortX = m_metrics.outPortX,
      i,
      key;

    //draw rectangle
    ctx.fillStyle = style.module.fill;
    ctx.strokeStyle = style.module.stroke;
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
    ctx.fillStyle = style.module.text.fill;
    ctx.font = style.module.text.font;
    ctx.fillText(
      m_data['@name'],
      mx + Math.floor((m_metrics.moduleWidth - m_metrics.fontMetrics.width)/2),
      my + m_metrics.textHeight + style.module.text.ypad
    );

  };

  this.contains = function(pos) {
    var metrics = this.getMetrics();
    return pos.x > metrics.mx && pos.x < metrics.mx + metrics.moduleWidth &&
      pos.y > metrics.my && pos.y < metrics.my + metrics.moduleHeight;
  };

  this.portByPos = function(pos) {
    //todo
  };

  return this;
};

inherit(uiModule.module, vglModule.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class port
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {uiModule.port}
 */
//////////////////////////////////////////////////////////////////////////////
uiModule.port = function(options, data) {
  "use strict"
  if (!(this instanceof uiModule.port)) {
    return new uiModule.port(options, data);
  }
  vglModule.object.call(this);

  /** @private */
  var m_that = this,
    m_data = data,
    m_x = 0,
    m_y = 0;

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
    ctx.fillStyle = style.module.port.fill;
    ctx.strokeStyle = style.module.port.stroke;
    ctx.fillRect(m_x, m_y, width, width);
    ctx.strokeRect(m_x, m_y, width, width);
  };

  this.getName = function() {
    return this.data()['@name'];
  };

  return this;
};

inherit(uiModule.port, vglModule.object);

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class inputModule
 *
 * @class
 * @dec
 * @returns {uiModule.inputModule}
 */
//////////////////////////////////////////////////////////////////////////////
uiModule.inputModule = function(options, data) {
  "use strict";
  if (!(this instanceof uiModule.inputModule)) {
    return new uiModule.inputModule(options, data);
  }
  this.inputPortClass = uiModule.inputPort;
  this.outputPortClass = uiModule.outputPort;
  uiModule.module.call(this, options, data);

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
  }


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
      inPortX = m_metrics.inPortX,
      outPortX = m_metrics.outPortX,
      m_inPorts = this.getInPorts(),
      m_outPorts = this.getOutPorts(),
      i,
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

  return this;
};

inherit(uiModule.inputModule, uiModule.module);


//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class outputPort
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {uiModule.port}
 */
//////////////////////////////////////////////////////////////////////////////
uiModule.outputPort = function(options, data) {
  "use strict"
  if (!(this instanceof uiModule.outputPort)) {
    return new uiModule.outputPort(options, data);
  }
  uiModule.port.call(this, options, data);

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

inherit(uiModule.outputPort, uiModule.port);


//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class inputPort
 *
 * @class
 * @dec
 * @param {object} data
 * @returns {uiModule.inputPort}
 */
//////////////////////////////////////////////////////////////////////////////
uiModule.inputPort = function(options, data) {
  "use strict"
  if (!(this instanceof uiModule.inputPort)) {
    return new uiModule.inputPort(options, data);
  }
  uiModule.outputPort.call(this, options, data);

  var m_input_elem;

  this.drawName = function(ctx, width) {
    ctx.fillStyle = style.module.text.fill;
    ctx.font = style.module.text.font;
    ctx.fillText(this.data()['@name'], this.x() + width*2, this.y()+width);
  };

  function createElementFromType() {
    //todo
  }

  m_input_elem = createElementFromType();

  return this;
};

inherit(uiModule.inputPort, uiModule.outputPort);

uiModule.connectionOptions = function() {

  "use strict";
  // Check against no use of new()
  if (!(this instanceof uiModule.connectionOptions)) {
    return new uiModule.connectionOptions();
  }

  this.vertical = false;
  return this;

}

uiModule.connection = function(options, data) {
  "use strict"
  if (!(this instanceof uiModule.connection)) {
    return new uiModule.connection(options, data);
  }
  vglModule.object.call(this, options, data);

  options = typeof options !== 'undefined' ? options : {};
  options = merge_options(uiModule.connectionOptions(), options);

  var m_data = data,
    m_vertical = options.vertical;

  this.data = function() {
    return m_data;
  };

  this.draw = function(ctx, style) {
    this.drawCurve(ctx, style, this.computePositions());
  };

  this.drawCurve = function(ctx, style, posInfo) {
    var offsets = this.getCurveOffsets(style);
    ctx.beginPath();
    ctx.moveTo(posInfo.cx1, posInfo.cy1);
    ctx.bezierCurveTo(
      posInfo.cx1 + offsets.x1, posInfo.cy1 + offsets.y1,
      posInfo.cx2 + offsets.x2, posInfo.cy2 + offsets.y2,
      posInfo.cx2, posInfo.cy2
    );
    ctx.lineWidth = style.conn.lineWidth;

    // line color
    ctx.strokeStyle = style.conn.stroke;
    ctx.stroke();

  };

  this.getCurveOffsets = function(style) {
    return {
      x1:  m_vertical ? 0 : style.conn.bezierOffset,
      x2:  m_vertical ? 0 : style.conn.bezierOffset,
      y1: !m_vertical ? 0 : style.conn.bezierOffset,
      y2: !m_vertical ? 0 : style.conn.bezierOffset
    }
  };

  this.computePositions = function() {
    var sourceModule, targetModule, sourcePort, targetPort,
      centerOffset = Math.floor(style.module.port.width/2);
    for(var i = 0; i < m_data.port.length; i++) {
      var port = m_data.port[i];
      if(port['@type'] == 'source') {
        sourcePort = port;
        sourceModule = activeWorkflow.modules()[port['@moduleId']];
      } else {
        targetPort = port;
        targetModule = activeWorkflow.modules()[port['@moduleId']];
      }
    }

    return {
      cx1: moduleSourcePortX[sourceModule['@id']] + centerOffset,
      cy1: moduleSourcePortY[sourceModule['@id']][sourcePort['@name']] + centerOffset,
      cx2: moduleTargetPortX[targetModule['@id']] + centerOffset,
      cy2: moduleTargetPortY[targetModule['@id']][targetPort['@name']] + centerOffset
    };
  };

  return this;
};

inherit(uiModule.connection, vglModule.object);
