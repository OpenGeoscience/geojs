//////////////////////////////////////////////////////////////////////////////
/**
 * D3 specific subclass of object which adds an id property for d3 selections
 * on groups of objects by class id.
 */
//////////////////////////////////////////////////////////////////////////////

geo.d3.object = function (arg) {
  'use strict';
  // this is used to extend other geojs classes, so only generate
  // a new object when that is not the case... like if this === window
  if (!(this instanceof geo.object)) {
    return new geo.d3.object(arg);
  }
  geo.sceneObject.call(this);

  var m_id = 'd3-' + geo.d3.uniqueID(),
      m_this = this,
      s_draw = this.draw;

  this._d3id = function () {
    return m_id;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Returns a d3 selection for the feature elements
  */
  ////////////////////////////////////////////////////////////////////////////
  this.select = function () {
    return m_this.renderer().select(m_this._d3id());
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Redraw the object.
  */
  ////////////////////////////////////////////////////////////////////////////
  this.draw = function () {
    m_this._update();
    s_draw();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
  *  Removes the element from the svg and the renderer
  */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    return m_this.renderer()._removeFeature(m_this._d3id());
  };

  return this;
};

inherit(geo.d3.object, geo.sceneObject);
