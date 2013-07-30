//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.ui
 */
//////////////////////////////////////////////////////////////////////////////

/*jslint devel: true, forin: true, newcap: true, plusplus: true,
 white: true, indent: 2*/
/*global geoModule, ogs, inherit, $*/

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


function blankWorkflow(name, version, connections, modules, vistrail_id, id) {
  name = defaultValue(name, 'untitled');
  version = defaultValue(version, '1.0.2');
  connections = defaultValue(connections, []);
  modules = defaultValue(modules, []);
  vistrail_id = defaultValue(vistrail_id, "");
  id = defaultValue(id, nextWorkflowId());
  return {
    "workflow": {
      "@name": name,
      "@version": version,
      "@{http://www.w3.org/2001/XMLSchema-instance}schemaLocation": "http://www.vistrails.org/workflow.xsd",
      "connection": connections,
      "module": modules,
      "@vistrail_id": vistrail_id,
      "@id": id
    }
  };
}

//////////////////////////////////////////////////////////////////////////////
/**
 * Workflow options object specification
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.workflowOptions = function() {
  "use strict";
  // Check against no use of new()
  if (!(this instanceof wflModule.workflowOptions)) {
    return new wflModule.workflowOptions();
  }

  this.data = blankWorkflow();
  this.modules = {};
  this.connections = {};
  this.style = climatePipesStyle;
  this.translated = {x:0, y:0};
  this.moduleClass = wflModule.inputModule;

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Base class for all workflow types ogs.ui.workflow.
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.workflow = function(options) {
  "use strict";
  this.events = {
    "moduleAdded" : "moduleAdded",
    "connectionAdded" : "connectionAdded"
  };

  if (!(this instanceof wflModule.workflow)) {
    return new wflModule.workflow(options);
  }
  vglModule.object.call(this);

  options = typeof options !== 'undefined' ? options : {};
  options = merge_options(wflModule.workflowOptions(), options);

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
      m_modules[mid] = m_moduleClass({workflow: m_that}, modules[i]);

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

    m_modules[module['@id']] = m_moduleClass({workflow: m_that}, module);
    this.data().workflow.module.push(module);
  };

  this.addConnection = function(sourceModule, sourcePort, targetModule,
                                targetPort) {
    if(sourcePort.data()['@type'] == targetPort.data()['@type']) {
      debug("Must connect output to input");
      return;
    } else if (sourceModule == targetModule) {
      debug("Cannot make connection between ports on same module.")
    }
    var connection = {
        "@id": nextConnectionId(),
        "port": [
          {
            "@moduleName": targetModule.getData()['@name'],
            "@name": targetPort.data()['@name'],
            "@signature": targetPort.data()['@sigstring'],
            "@id": nextPortId(),
            "@type": targetPort.data()['@type'],
            "@moduleId": targetModule.getData()['@id']
          }, {
            "@moduleName": sourceModule.getData()['@name'],
            "@name": sourcePort.data()['@name'],
            "@signature": sourcePort.data()['@sigstring'],
            "@id": nextPortId(),
            "@type": sourcePort.data()['@type'],
            "@moduleId": sourceModule.getData()['@id']
          }
        ]
      },
      options = {vertical: m_moduleClass == wflModule.workflowModule, workflow: m_that};
    m_connections[connection['@id']] = wflModule.connection(options, connection);
    this.data().workflow.connection.push(connection);

  };

  this.generateConnectionsFromData = function() {
    var i = 0,
      maxId = 0,
      nextId = nextConnectionId(),
      connections = m_data.workflow.connection,
      options = {vertical: m_moduleClass == wflModule.workflowModule, workflow: m_that};

    for(; i < connections.length; i++) {
      var cid = parseInt(connections[i]['@id']);
      m_connections[cid] = wflModule.connection(options, connections[i]);

      if(cid > maxId) {
        maxId = cid;
      }

      while (maxId > nextId) {
        nextId = nextConnectionId();
      }
    }
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
    if(activeWorkflow) {
      activeWorkflow.hide();
    }
    activeWorkflow = this;
    this.setVisible(true);
    this.resize();
    for(var key in m_modules) {
      if(m_modules.hasOwnProperty(key)) {
        m_modules[key].show();
      }
    }
  };

  this.hide = function() {
    this.setVisible(false);
    for(var key in m_modules) {
      if(m_modules.hasOwnProperty(key)) {
        m_modules[key].hide();
      }
    }
  };

  this.modules = function() {
    return m_modules;
  };

  this.data = function() {
    return m_data;
  };

  this.updateElementPositions = function() {
    for(var key in m_modules) {
      m_modules[key].updateElementPositions();
    }
  };

  this.getModuleByName = function(name) {
    var key;
    for(key in m_modules) {
      if(m_modules.hasOwnProperty(key)) {
        if(m_modules[key].getData()['@name'] == name) {
          return m_modules[key];
        }
      }
    }
  };

  this.setDefaultWorkflowInputs = function(target) {
    this.getModuleByName('Dataset')
      .setInput('file', target.basename);
    this.getModuleByName('Variable')
      .setInput('name', target.name);
  };

  if(options.data.hasOwnProperty('workflow')) {
    this.generateModulesFromData();
    this.generateConnectionsFromData();
  }

  return this;
};

inherit(wflModule.workflow, vglModule.object);

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
    m_width = style.module.port.width,
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
    ctx.fillStyle = style.module.port.fill;
    ctx.strokeStyle = style.module.port.stroke;
    ctx.fillRect(m_x, m_y, width, width);
    ctx.strokeRect(m_x, m_y, width, width);
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
    ctx.fillStyle = style.module.text.fill;
    ctx.font = style.module.text.font;
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
      top: y + translated.y + style.module.port.width*2,
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

wflModule.connectionOptions = function() {

  "use strict";
  // Check against no use of new()
  if (!(this instanceof wflModule.connectionOptions)) {
    return new wflModule.connectionOptions();
  }

  this.vertical = false;
  this.workflow = null;
  return this;

}

wflModule.connection = function(options, data) {
  "use strict"
  if (!(this instanceof wflModule.connection)) {
    return new wflModule.connection(options, data);
  }
  vglModule.object.call(this, options, data);

  options = typeof options !== 'undefined' ? options : {};
  options = merge_options(wflModule.connectionOptions(), options);

  var m_data = data,
    m_vertical = options.vertical,
    m_workflow = options.workflow;

  this.data = function() {
    return m_data;
  };

  this.draw = function(ctx, style) {
    this.drawCurve(ctx, style, this.computePositions(style));
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
      x1:  m_vertical ? 0 :  style.conn.bezierOffset,
      x2:  m_vertical ? 0 : -style.conn.bezierOffset,
      y1: !m_vertical ? 0 :  style.conn.bezierOffset,
      y2: !m_vertical ? 0 : -style.conn.bezierOffset
    }
  };

  this.computePositions = function(style) {
    var sourceModule, targetModule, sourcePort, targetPort,
      centerOffset = Math.floor(style.module.port.width/2);
    for(var i = 0; i < m_data.port.length; i++) {
      var port = m_data.port[i];
      if(port['@type'] == 'source' || port['@type'] == 'output') {
        sourceModule = m_workflow.modules()[port['@moduleId']];
        sourcePort = sourceModule.getOutPorts()[port['@name']];
      } else {
        targetModule = m_workflow.modules()[port['@moduleId']];
        targetPort = targetModule.getInPorts()[port['@name']];
      }
    }

    if(!sourcePort || !targetPort) {
      var placeholder = 1;
    }

    return {
      cx1: sourcePort.x() + centerOffset,
      cy1: sourcePort.y() + centerOffset,
      cx2: targetPort.x() + centerOffset,
      cy2: targetPort.y() + centerOffset
    };
  };

  return this;
};

inherit(wflModule.connection, vglModule.object);
