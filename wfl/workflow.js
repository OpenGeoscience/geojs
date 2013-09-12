//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, proj4, document, climatePipesStyle, wflModule*/

//////////////////////////////////////////////////////////////////////////////

var nextConnectionId = wflModule.utils.createIdCounter();
var nextWorkflowId = wflModule.utils.createIdCounter();
var nextLocationId = wflModule.utils.createIdCounter();
var nextModuleId = wflModule.utils.createIdCounter();
var nextPortId = wflModule.utils.createIdCounter();

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

  function blankWorkflowData(name, version, connections, modules, vistrail_id,
                             id) {
    name = wflModule.utils.defaultValue(name, 'untitled');
    version = wflModule.utils.defaultValue(version, '1.0.2');
    connections = wflModule.utils.defaultValue(connections, []);
    modules = wflModule.utils.defaultValue(modules, []);
    vistrail_id = wflModule.utils.defaultValue(vistrail_id, "");
    id = wflModule.utils.defaultValue(id, nextWorkflowId());
    return {
      "workflow": {
        "@name": name,
        "@version": version,
        "@{http://www.w3.org/2001/XMLSchema-instance}schemaLocation":
          "http://www.vistrails.org/workflow.xsd",
        "connection": connections,
        "module": modules,
        "@vistrail_id": vistrail_id,
        "@id": id
      }
    };
  }

  this.data = blankWorkflowData();
  this.modules = {};
  this.connections = {};
  this.drawStyle = climatePipesStyle;
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
  options = wflModule.utils.merge_options(wflModule.workflowOptions(), options);

  /** @private */
  var m_that = this,
    m_data = options.data,
    m_modules = options.modules,
    m_connections = options.connections,
    m_style = options.drawStyle,
    m_translated = options.translated,
    m_moduleClass = options.moduleClass,
    m_visible = false;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Generate modules from the workflow JSON data
   */
  ////////////////////////////////////////////////////////////////////////////
  this.generateModulesFromData = function() {
    var i, mid,
      maxId = 0,
      nextId = nextModuleId(),
      modules = m_data.workflow.module;

    for(i = 0; i < modules.length; i++) {
      mid = parseInt(modules[i]['@id'], 10);
      m_modules[mid] = m_moduleClass({workflow: m_that}, modules[i]);

      if(mid > maxId) {
        maxId = mid;
      }

      while (maxId > nextId) {
        nextId = nextModuleId();
      }
    }
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete selected modules and connections connected to them.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteSelectedModules = function() {
    var id;

    for(id in m_connections) {
      if(m_connections.hasOwnProperty(id)) {
        if(m_connections[id].sourceModule().isSelected() ||
          m_connections[id].targetModule().isSelected()) {
          m_connections[id].delete();
          delete m_connections[id];
        }
      }
    }

    for(id in m_modules) {
      if(m_modules.hasOwnProperty(id)) {
        if(m_modules[id].isSelected()) {
          m_modules[id].delete();
          delete m_modules[id];
        }
      }
    }
  };


  this.addNewModule = function(data, x, y) {
    var moduleInfo = JSON.parse(data),
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
    if(sourcePort.data()['@type'] === targetPort.data()['@type']) {
      wflModule.utils.debug("Must connect output to input");
      return;
    }

    if (sourceModule === targetModule) {
      wflModule.utils.debug(
        "Cannot make connection between ports on same module.");
    }

    var connection = {
        "@id": nextConnectionId(),
        "port": [
          {
            "@moduleName": targetModule.data()['@name'],
            "@name": targetPort.data()['@name'],
            "@signature": targetPort.data()['@sigstring'],
            "@id": nextPortId(),
            "@type": targetPort.data()['@type'],
            "@moduleId": targetModule.data()['@id']
          }, {
            "@moduleName": sourceModule.data()['@name'],
            "@name": sourcePort.data()['@name'],
            "@signature": sourcePort.data()['@sigstring'],
            "@id": nextPortId(),
            "@type": sourcePort.data()['@type'],
            "@moduleId": sourceModule.data()['@id']
          }
        ]
      },
      options = {vertical: m_moduleClass === wflModule.module, workflow: m_that};
    m_connections[connection['@id']] = wflModule.connection(options, connection);
    this.data().workflow.connection.push(connection);

  };

  this.generateConnectionsFromData = function() {
    var i,
      cid,
      maxId = 0,
      nextId = nextConnectionId(),
      connections = m_data.workflow.connection,
      options = {vertical: m_moduleClass === wflModule.module, workflow: m_that};

    for(i = 0; i < connections.length; i++) {
      cid = parseInt(connections[i]['@id'], 10);
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
    var key, pad, wx, wy, ww, wh;

    ctx.clearRect(-m_translated.x, -m_translated.y, ctx.canvas.width,
      ctx.canvas.height);

    //draw rectangle
    ctx.fillStyle = m_style.fill;
    ctx.lineWidth = m_style.lineWidth;
    ctx.strokeStyle = m_style.stroke;

    ctx.save();
    ctx.shadowBlur = m_style.shadowBlur;
    ctx.shadowColor = m_style.shadowColor;

    pad = ctx.shadowBlur;
    wx = pad - m_translated.x;
    wy = pad - m_translated.y;
    ww = ctx.canvas.width - pad*2;
    wh = ctx.canvas.height - pad*2;

    //translate to ensure fill pattern is consistent
    wflModule.utils.roundRect(ctx, wx, wy, ww, wh,
      m_style.cornerRadius, true, true);

    ctx.restore();

    //define clipping region
    ctx.save();

    wflModule.utils.roundRect(ctx, wx, wy, ww, wh,
      m_style.cornerRadius, false, false);
    ctx.clip();

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

    ctx.restore();
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

  this.show = function(inputContainer) {
    var key;
    this.setVisible(true);
    for(key in m_modules) {
      if(m_modules.hasOwnProperty(key)) {
        m_modules[key].show(inputContainer);
      }
    }
  };

  this.hide = function() {
    var key;
    this.setVisible(false);
    for(key in m_modules) {
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

  this.setData = function(data) {
    m_data = data;
    m_modules = {};
    m_connections = {};
    m_translated = {x:0, y:0};
    this.generateModulesFromData();
    this.generateConnectionsFromData();
  };

  this.updateElementPositions = function() {
    var key;
    for(key in m_modules) {
      m_modules[key].updateElementPositions();
    }
  };

  this.getModuleByName = function(name) {
    var key;
    for(key in m_modules) {
      if(m_modules.hasOwnProperty(key)) {
        if(m_modules[key].data()['@name'] === name) {
          return m_modules[key];
        }
      }
    }
    return null;
  };

  this.setDefaultWorkflowInputs = function(name, filepath, timestep) {
    this.getModuleByName('Dataset')
      .setInput('file', filepath);
    this.getModuleByName('Variable')
      .setInput('name', name);
    this.getModuleByName('Variable')
      .setInput('time', timestep);
  };

  if(options.data.hasOwnProperty('workflow')) {
    this.generateModulesFromData();
    this.generateConnectionsFromData();
  }

  return this;
};

inherit(wflModule.workflow, vglModule.object);
