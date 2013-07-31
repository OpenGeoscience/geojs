//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, proj4, document*/
//////////////////////////////////////////////////////////////////////////////

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
