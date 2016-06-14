var inherit = require('../inherit');
var sceneObject = require('../sceneObject');

//////////////////////////////////////////////////////////////////////////////
/**
 * Canvas specific subclass of object which rerenders when the object is drawn.
 * @class geo.canvas.object
 * @extends geo.sceneObject
 */
//////////////////////////////////////////////////////////////////////////////

var canvas_object = function (arg) {
  'use strict';

  var object = require('../object');

  // this is used to extend other geojs classes, so only generate
  // a new object when that is not the case... like if this === window
  if (!(this instanceof object)) {
    return new canvas_object(arg);
  }
  sceneObject.call(this);

  var m_this = this,
      s_draw = this.draw;

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Redraw the object.
  */
  ////////////////////////////////////////////////////////////////////////////
  this.draw = function () {
    m_this._update();
    m_this.renderer()._render();
    s_draw();
    return m_this;
  };

  return this;
};

inherit(canvas_object, sceneObject);
module.exports = canvas_object;

