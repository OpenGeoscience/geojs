//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.wfl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, proj4, document*/
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