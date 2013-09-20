//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, proj4, document, wflModule*/
//////////////////////////////////////////////////////////////////////////////

wflModule.connectionOptions = function() {

  "use strict";
  // Check against no use of new()
  if (!(this instanceof wflModule.connectionOptions)) {
    return new wflModule.connectionOptions();
  }

  this.vertical = false;
  this.workflow = null;
  return this;

};

wflModule.connection = function(options, data) {
  "use strict";
  if (!(this instanceof wflModule.connection)) {
    return new wflModule.connection(options, data);
  }
  vglModule.object.call(this, options, data);

  options = typeof options !== 'undefined' ? options : {};
  options = wflModule.utils.merge_options(wflModule.connectionOptions(),
    options);

  var m_that = this,
    m_data = data,
    m_vertical = options.vertical,
    m_workflow = options.workflow,
    m_sourceModule,
    m_targetModule;

  this.data = function() {
    return m_data;
  };

  this.delete = function() {
    var j,
      connectionDataList = m_workflow.data().workflow.connection;

    //remove from workflow json data
    for(j = 0; j < connectionDataList.length; j++) {
      if(m_that.data() === connectionDataList[j]) {
        connectionDataList.splice(j, 1);
        break;
      }
    }
  };

  this.draw = function(ctx, currentWorkflowStyle) {
    this.drawCurve(ctx, currentWorkflowStyle, this.computePositions(currentWorkflowStyle));
  };

  this.drawCurve = function(ctx, currentWorkflowStyle, posInfo) {
    var offsets = this.getCurveOffsets(currentWorkflowStyle);
    ctx.beginPath();
    ctx.moveTo(posInfo.cx1, posInfo.cy1);
    ctx.bezierCurveTo(
      posInfo.cx1 + offsets.x1, posInfo.cy1 + offsets.y1,
      posInfo.cx2 + offsets.x2, posInfo.cy2 + offsets.y2,
      posInfo.cx2, posInfo.cy2
    );
    ctx.lineWidth = currentWorkflowStyle.conn.lineWidth;

    // line color
    ctx.strokeStyle = currentWorkflowStyle.conn.stroke;
    ctx.stroke();
  };

  this.getCurveOffsets = function(currentWorkflowStyle) {
    return {
      x1:  m_vertical ? 0 :  currentWorkflowStyle.conn.bezierOffset,
      x2:  m_vertical ? 0 : -currentWorkflowStyle.conn.bezierOffset,
      y1: !m_vertical ? 0 :  currentWorkflowStyle.conn.bezierOffset,
      y2: !m_vertical ? 0 : -currentWorkflowStyle.conn.bezierOffset
    };
  };

  function getSourceTargetModules() {
    var port,
      i;
    for(i = 0; i < m_data.port.length; i++) {
      port = m_data.port[i];
      if(port['@type'] === 'source' || port['@type'] === 'output') {
        m_sourceModule = m_workflow.modules()[port['@moduleId']];
      } else {
        m_targetModule = m_workflow.modules()[port['@moduleId']];
      }
    }
  }

  this.sourceModule = function() {
    if(typeof m_sourceModule === 'undefined') {
      getSourceTargetModules();
    }
    return m_sourceModule;
  };

  this.targetModule = function() {
    if(typeof m_targetModule === 'undefined') {
      getSourceTargetModules();
    }
    return m_targetModule;
  };

  this.computePositions = function(currentWorkflowStyle) {
    var sourceModule = m_that.sourceModule(),
      targetModule = m_that.targetModule(),
      sourcePort, targetPort,
      centerOffset = Math.floor(currentWorkflowStyle.module.port.width/2),
      i, port;

    for(i = 0; i < m_data.port.length; i++) {
      port = m_data.port[i];
      if(port['@type'] === 'source' || port['@type'] === 'output') {
        sourcePort = sourceModule.getOutPorts()[port['@name']];
      } else {
        targetPort = targetModule.getInPorts()[port['@name']];
      }
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
