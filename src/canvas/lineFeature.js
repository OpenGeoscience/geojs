var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var lineFeature = require('../lineFeature');

/**
 * Create a new instance of class lineFeature.
 *
 * @class geo.canvas.lineFeature
 * @extends geo.lineFeature
 * @param {geo.lineFeature.spec} arg
 * @returns {geo.canvas.lineFeature}
 */
var canvas_lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof canvas_lineFeature)) {
    return new canvas_lineFeature(arg);
  }

  var object = require('./object');

  arg = arg || {};
  lineFeature.call(this, arg);
  object.call(this);

  /**
   * @private
   */
  var m_this = this;

  /**
   * Render the data on the canvas.
   *
   * @protected
   * @param {object} context2d the canvas context to draw in.
   * @param {geo.map} map the parent map object.
   */
  this._renderOnCanvas = function (context2d, map) {
    var data = m_this.data(),
        posFunc = m_this.position(),
        lineFunc = m_this.line(),
        strokeWidthFunc = m_this.style.get('strokeWidth'),
        strokeColorFunc = m_this.style.get('strokeColor'),
        strokeOpacityFunc = m_this.style.get('strokeOpacity'),
        lineCapFunc = m_this.style.get('lineCap'),
        lineJoinFunc = m_this.style.get('lineJoin'),
        miterLimit = m_this.style.get('miterLimit')(data),
        closedFunc = m_this.style.get('closed'),
        last = {}, cur = {}, temp, line, pos, firstPos, j;

    data.forEach(function (d, i) {
      line = lineFunc(d, i);
      if (line.length < 2) {
        return;
      }
      cur.closed = closedFunc(d, i);
      cur.width = strokeWidthFunc(line[0], 0, d, i);
      cur.color = strokeColorFunc(line[0], 0, d, i);
      cur.opacity = strokeOpacityFunc(line[0], 0, d, i);
      cur.linecap = lineCapFunc(line[0], 0, d, i);
      cur.linejoin = lineJoinFunc(line[0], 0, d, i);
      cur.strokeStyle = 'rgba(' + (cur.color.g * 255) + ', ' +
          (cur.color.g * 255) + ', ' + (cur.color.b * 255) + ', ' +
          (cur.opacity !== undefined ? cur.opacity : 1) + ')';
      if (last.strokeStyle !== cur.strokeStyle || last.width !== cur.width ||
          last.linecap !== cur.linecap || last.linejoin !== cur.linejoin ||
          last.miterlimit !== cur.miterlimit) {
        if (last.strokeStyle !== undefined) {
          context2d.stroke();
        }
        context2d.beginPath();
        context2d.strokeStyle = cur.strokeStyle;
        context2d.lineWidth = cur.width;
        context2d.lineCap = cur.linecap;
        context2d.lineJoin = cur.linejoin;
        context2d.miterLimit = miterLimit;
      }
      for (j = 0; j < line.length; j += 1) {
        pos = m_this.featureGcsToDisplay(posFunc(line[j], j, d, i));
        if (!j) {
          firstPos = pos;
          context2d.moveTo(pos.x, pos.y);
        } else {
          context2d.lineTo(pos.x, pos.y);
        }
      }
      if (cur.closed) {
        context2d.lineTo(firstPos.x, firstPos.y);
      }
      temp = last;
      last = cur;
      cur = temp;
    });
    if (last.strokeStyle !== undefined) {
      context2d.stroke();
    }
  };

  this._init(arg);
  return this;
};

inherit(canvas_lineFeature, lineFeature);

// Now register it
var capabilities = {};
capabilities[lineFeature.capabilities.basic] = true;
capabilities[lineFeature.capabilities.multicolor] = false;

registerFeature('canvas', 'line', canvas_lineFeature, capabilities);

module.exports = canvas_lineFeature;
