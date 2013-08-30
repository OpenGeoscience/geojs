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
  this.currentWorkflowStyle = climatePipesStyle;
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
    m_currentWorkflowStyle = options.currentWorkflowStyle,
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

    ctx.clearRect(-m_translated.x, -m_translated.y, ctx.canvas.width,
      ctx.canvas.height);

    //draw rectangle
    ctx.fillStyle = currentWorkflowStyle.fill;
    ctx.lineWidth = currentWorkflowStyle.lineWidth;
    ctx.strokeStyle = currentWorkflowStyle.stroke;

    ctx.save();
    ctx.shadowBlur = currentWorkflowStyle.shadowBlur;
    ctx.shadowColor = currentWorkflowStyle.shadowColor;

    var pad = ctx.shadowBlur,
      wx = pad - m_translated.x,
      wy = pad - m_translated.y,
      ww = ctx.canvas.width - pad*2,
      wh = ctx.canvas.height - pad*2;

    //translate to ensure fill pattern is consistent
    roundRect(ctx, wx, wy, ww, wh,
      currentWorkflowStyle.cornerRadius, true, true);

    ctx.restore();

    //define clipping region
    ctx.save();

    roundRect(ctx, wx, wy, ww, wh,
      currentWorkflowStyle.cornerRadius, false, false);
    ctx.clip();

    for(key in m_modules) {
      if(m_modules.hasOwnProperty(key)) {
        m_modules[key].draw(ctx, m_currentWorkflowStyle);
      }
    }

    for(key in m_connections) {
      if(m_connections.hasOwnProperty(key)) {
        m_connections[key].draw(ctx, m_currentWorkflowStyle);
      }
    }

    ctx.restore();
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
//    $('#modulediv').append($('#algorithm-select'));
//    $('#modulediv').append($('#moduletable'));
//    $('#algorithm-select').off('change').change(function() {
//      if(m_that.visible()) {
//        m_that.setData(staticWorkflows[$(this).val()]);
//        m_that.resize();
//      }
//    });
  };

  this.hide = function() {
    this.setVisible(false);
    for(var key in m_modules) {
      if(m_modules.hasOwnProperty(key)) {
        m_modules[key].hide();
      }
    }
    $('#algorithm-select').off('change');
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
