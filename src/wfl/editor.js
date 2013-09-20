//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image, wflModule*/
/*global vglModule, proj4, document, climatePipesStyle, window*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * editor options object specification
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.editorOptions = function() {
  "use strict";
  // Check against no use of new()
  if (!(this instanceof wflModule.editorOptions)) {
    return new wflModule.editorOptions();
  }

  this.div = document.createElement('div');
  this.drawStyle = climatePipesStyle;

  return this;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * workflowEditor houses a canvas for drawing the workflow and a list of
 * draggable modules.
 */
//////////////////////////////////////////////////////////////////////////////
wflModule.editor = function(options) {
  "use strict";
  this.events = {
    "moduleAdded" : "moduleAdded",
    "connectionAdded" : "connectionAdded"
  };

  if (!(this instanceof wflModule.editor)) {
    return new wflModule.editor(options);
  }
  vglModule.object.call(this);

  options = typeof options !== 'undefined' ? options : {};
  options = wflModule.utils.merge_options(wflModule.editorOptions(), options);

  if(typeof options.div === 'string') {
    options.div = document.getElementById(options.div);
  }

  /** @private */
  var m_that = this,
    m_mainDiv = options.div,
    m_style = options.drawStyle,
    m_moduleDiv = document.createElement('div'),
    m_moduleTable = document.createElement('table'),
    m_canvasContainer = document.createElement('div'),
    m_canvasInput = document.createElement('div'),
    m_canvas = document.createElement('canvas'),
    m_context,
    m_workflow;

  this.setWorkflow = function(workflow) {
    m_workflow = workflow;
  };

  this.workflow = function() {
    return m_workflow;
  };

  function refreshContext() {
    m_context = m_canvas.getContext('2d');
  }

  refreshContext();

  this.resize = function() {
    var rect = m_canvasContainer.getBoundingClientRect(),
      translated = m_workflow.translated();

    m_canvas.width = rect.width;
    m_canvas.height = rect.height;

    refreshContext();

    m_context.translate(translated.x, translated.y);
    m_that.drawWorkflow();
  };

  this.show = function() {
    m_that.resize();
    m_workflow.show(m_canvasInput);
  };

  function addDraggableStyleSheetRule() {
    //add draggable style rule
    var stylesheet = document.styleSheets[0],
      selector = "[draggable]",
      rule = [
        '{-moz-user-select: none;',
        '-khtml-user-select: none;',
        '-webkit-user-select: none;',
        'user-select: none;',
        '-khtml-user-drag: element;',
        '-webkit-user-drag: element;',
        'cursor: move;}'
      ].join(''),
      pos;

    if (stylesheet.insertRule) {
      try {
        pos = stylesheet.cssRules ? stylesheet.cssRules.length : 0;
        stylesheet.insertRule(selector + rule, pos);
      } catch (e) {
        if (stylesheet.addRule) {
          stylesheet.addRule(selector, rule, -1);
        }
      }
    } else if (stylesheet.addRule) {
      stylesheet.addRule(selector, rule, -1);
    }
  }

  function setupDom() {
    m_moduleTable.appendChild(document.createElement('tBody'));

    m_moduleDiv.appendChild(m_moduleTable);

    m_canvasContainer.appendChild(m_canvas);
    m_canvasContainer.appendChild(m_canvasInput);

    m_mainDiv.appendChild(m_moduleDiv);
    m_mainDiv.appendChild(m_canvasContainer);
  }

  function setupCSS() {
    $(m_moduleDiv).css({
      height: '100%',
      width: 225,
      overflow: 'auto',
      float: 'left'
    });

    $(m_canvasContainer).css({
      position: 'relative',
      height: '100%',
      overflow: 'hidden'
    });

    $(m_canvasInput).css({
      position: 'absolute',
      top: m_style.shadowBlur,
      left: m_style.shadowBlur,
      bottom: m_style.shadowBlur,
      right: m_style.shadowBlur,
      overflow: 'hidden',
      'pointer-events': 'none'
    });
  }

  function addTextureFillToStyle() {
    var modulePattern = new Image(),
      workflowPattern = new Image();

    //give modules a texture fill
    modulePattern.onload = function() {
      m_style.module.fill = m_context.createPattern(modulePattern,
        'repeat');
    };
    modulePattern.src = '/common/img/squairy_light.png';

    workflowPattern.onload = function() {
      m_style.fill = m_context.createPattern(workflowPattern, 'repeat');
    };
    workflowPattern.src = '/common/img/tweed.png';
  }

  function ctxMousePos(event) {
    var totalOffsetX = 0,
      totalOffsetY = 0,
      currentElement = m_canvas,
      translated = m_workflow.translated();

    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
      currentElement = currentElement.offsetParent;
    }
    while (currentElement);

    return {
      x: event.pageX - totalOffsetX - translated.x,
      y: event.pageY - totalOffsetY - translated.y
    };
  }

  function setupDragAndDrop() {
    var $canvas = $(m_canvas);

    $canvas.on('dragover', function(e) {
      if (e.originalEvent) { //jQuery
        e = e.originalEvent;
      }

      if (e.preventDefault) {
        e.preventDefault();
      }

      e.dataTransfer.dropEffect = 'copy';
    });

    $canvas.on('drop', function(e) {
      var ctxPos;

      if (e.originalEvent) { //jQuery
        e = e.originalEvent;
      }

      if (e.preventDefault) {
        e.preventDefault();
      }

      // this / e.target is current target element.

      if (e.stopPropagation) {
        e.stopPropagation(); // stops the browser from redirecting.
      }

      ctxPos = ctxMousePos(e);

      m_workflow.addNewModule(
        e.dataTransfer.getData("Text"),
        ctxPos.x,
        ctxPos.y
      );
      m_workflow.show(m_canvasInput); //makes newly added input elements visible

      m_that.drawWorkflow();

      return false;
    });
  }

  function addModuleToList(moduleInfo, $moduleTableBody) {
    var $text = $(document.createElement('div')),
      $td = $(document.createElement('td')),
      $tr = $(document.createElement('tr'));

    $text.append(moduleInfo['@name'])
      .attr('draggable', 'true')
      .data('moduleInfo', moduleInfo)
      .on('dragstart', function(e) {
        if (e.originalEvent) { //jQuery
          e = e.originalEvent;
        }
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData("Text",
          JSON.stringify($(this).data('moduleInfo')));

        wflModule.utils.debug(e);
      });

    $moduleTableBody.append($tr.append($td.append($text)));
  }

  function setupWorkflowModuleList() {
    var $moduleTableBody = $(m_moduleTable).find('tbody:last'),
      pkg,
      identifier,
      moduleInfo,
      i,
      j;

    for(i = 0; i < wflModule.registry.package.length; i++) {
      pkg = wflModule.registry.package[i];
      identifier = pkg['@identifier'];
      if(!wflModule.utils.moduleRegistryMap.hasOwnProperty(identifier)) {
        wflModule.utils.moduleRegistryMap[identifier] = {};
      }
      if(pkg.hasOwnProperty('moduleDescriptor')) {
        for(j = 0; j < pkg.moduleDescriptor.length; j++) {
          moduleInfo = pkg.moduleDescriptor[j];
          wflModule.utils.moduleRegistryMap[identifier][moduleInfo['@name']] =
            moduleInfo;
          addModuleToList(moduleInfo, $moduleTableBody);
        }
      }
    }
  }

  function setupInteraction() {
    var $canvas = $(m_canvas),
      panning,
      firstPoint,
      lastPoint,
      lastPanEvent,
      draggingPort,
      draggingPortPos,
      draggingPortModule,
      draggingModule,
      tempConnection = wflModule.connection();

    $canvas.mousedown(function (e) {
      var modules = m_workflow.modules(),
        key,
        module;

      firstPoint = lastPoint = ctxMousePos(e);

      // find modules
      for(key in modules) {
        if(modules.hasOwnProperty(key)) {
          module = modules[key];
          if(module.contains(lastPoint)) {
            draggingPort = module.portByPos(lastPoint);
            if(draggingPort) {
              draggingPortPos = lastPoint;
              draggingPortModule = module;
            } else {
              draggingModule = module;
            }
            return;
          }
        }
      }

      // find connections

      // else initiate pan
      panning = true;
      lastPanEvent = e;
    });

    $canvas.mousemove(function (e) {
      // if dragging module

      if(draggingModule) {
        var newPoint = ctxMousePos(e);
        draggingModule.data().location['@x'] += newPoint.x - lastPoint.x;
        draggingModule.data().location['@y'] -= newPoint.y - lastPoint.y;
        draggingModule.recomputeMetrics($canvas[0].getContext('2d'), m_style);
        lastPoint = newPoint;
        m_workflow.draw(m_context);
      } else if (draggingPort) {
        lastPoint = ctxMousePos(e);
        m_workflow.draw(m_context);
        tempConnection.drawCurve(m_context, m_style, {
          cx1: draggingPortPos.x,
          cy1: draggingPortPos.y,
          cx2: lastPoint.x,
          cy2: lastPoint.y
        });
      } else if (panning) {
        m_workflow.translate(
          this.getContext('2d'),
          e.clientX - lastPanEvent.clientX,
          e.clientY - lastPanEvent.clientY
        );
        lastPanEvent = e;
        m_that.drawWorkflow();
        m_workflow.updateElementPositions();
      }
    });

    $canvas.mouseup(function (e) {
      panning = false;
      if( draggingPort ) {
        var port,
          modules = m_workflow.modules(),
          key,
          module;

        for(key in modules) {
          if(modules.hasOwnProperty(key)) {
            module = modules[key];
            if(module.contains(lastPoint)) {
              port = module.portByPos(lastPoint);
              if(port) {
                m_workflow.addConnection(
                  draggingPortModule,
                  draggingPort,
                  module,
                  port
                );
                break;
              }
            }
          }
        }
        draggingPort = null;
        draggingPortModule = null;
        draggingPortPos = null;
        m_that.drawWorkflow();
      } else if (draggingModule) {
        if(firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y) {
          draggingModule.toggleSelected();
          m_that.drawWorkflow();
        }
      }
      draggingModule = null;
    });

    $canvas.mouseout(function (e) {
      panning = false;
    });
  }

  function setup() {
    addDraggableStyleSheetRule();
    setupDom();
    setupCSS();
    addTextureFillToStyle();
    setupDragAndDrop();
    setupWorkflowModuleList();
    setupInteraction();
  }

  this.drawWorkflow = function() {
    m_workflow.draw(m_context, m_style);
  };

  setup();

  return this;
};

inherit(wflModule.editor, vglModule.object);