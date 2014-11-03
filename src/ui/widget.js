//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class widget
 *
 * @class
 * @returns {geo.widget}
 */
//////////////////////////////////////////////////////////////////////////////
geo.widget = function (arg) {
  'use strict';
  if (!(this instanceof geo.widget)) {
    return new geo.widget(arg);
  }
  geo.sceneObject.call(this, arg);

  var m_this = this,
      m_layer = arg.layer;

  this._init = function () {
    m_this.modified();
  };

  this._exit = function () {
    m_this.children().forEach(function (child) {
      child._exit();
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create feature give a name
   *
   * @returns {geo.Feature} Will return a new feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._createFeature = function (featureName, arg) {

    var newFeature = geo.createFeature(
      featureName, m_this, m_this.renderer(), arg);

    m_this.addChild(newFeature);
    m_this.modified();
    return newFeature;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._deleteFeature = function (feature) {
    m_this.removeChild(feature);

    return m_this;
  };

  this.layer = function () {
    return m_layer;
  };
};
inherit(geo.widget, geo.sceneObject);
