//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class material
 *
 * @class
 * @returns {vglModule.material}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.material = function() {
  'use strict';

  if (!(this instanceof vglModule.material)) {
    return new vglModule.material();
  }
  vglModule.object.call(this);

  // / Private member variables
  var m_shaderProgram = new vglModule.shaderProgram(),
      m_binNumber = 100,
      m_textureAttributes = {},
      m_attributes = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return bin number for the material
   *
   * @default 100
   * @returns {number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.binNumber = function() {
    return m_binNumber;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set bin number for the material
   *
   * @param binNo
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setBinNumber = function(binNo) {
    m_binNumber = binNo;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if incoming attribute already exists in the material
   *
   * @param attr
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.exists = function(attr) {
    if (attr.type() === vglModule.materialAttribute.Texture) {
      return m_textureAttributes.hasOwnProperty(attr);
    }

    return m_attributes.hasOwnProperty(attr);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set a new attribute for the material
   *
   * This method replace any existing attribute except for textures as
   * materials can have multiple textures.
   *
   * @param attr
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setAttribute = function(attr) {
    if (attr.type() === vglModule.materialAttributeType.Texture &&
        m_textureAttributes[attr.textureUnit()] !== attr) {
      m_textureAttributes[attr.textureUnit()] = attr;
      this.modified();
      return true;
    }

    if (m_attributes[attr.type()] === attr) {
      return false;
    }

    // Shader is a very special attribute
    if (attr.type() === vglModule.materialAttributeType.ShaderProgram) {
      m_shaderProgram = attr;
    }

    m_attributes[attr.type()] = attr;
    this.modified();
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add a new attribute to the material.
   *
   * @param attr
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addAttribute = function(attr) {
    if (this.exists(attr)) {
      return false;
    }

    if (attr.type() === vglModule.materialAttributeType.Texture) {
      // TODO Currently we don't check if we are replacing or not.
      // It would be nice to have a flag for it.
      m_textureAttributes[attr.textureUnit()] = attr;
      this.modified();
      return true;
    }

    // Shader is a very special attribute
    if (attr.type() === vglModule.materialAttributeType.ShaderProgram) {
      m_shaderProgram = attr;
    }

    m_attributes[attr.type()] = attr;
    this.modified();
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return shader program used by the material
   *
   * @returns {vglModule.shaderProgram}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.shaderProgram = function() {
    return m_shaderProgram;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Activate the material
   *
   * @param renderState
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function(renderState) {
    this.bind(renderState);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Deactivate the material
   *
   * @param renderState
   */
  ////////////////////////////////////////////////////////////////////////////
  this.remove = function(renderState) {
    this.undoBind(renderState);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bind and activate material states
   *
   * @param renderState
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bind = function(renderState) {
    var key = null;

    for (key in m_attributes) {
      if (m_attributes.hasOwnProperty(key)) {
        m_attributes[key].bind(renderState);
      }
    }

    for (key in m_textureAttributes) {
      if (m_textureAttributes.hasOwnProperty(key)) {
        m_textureAttributes[key].bind(renderState);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Undo-bind and de-activate material states
   *
   * @param renderState
   */
  ////////////////////////////////////////////////////////////////////////////
  this.undoBind = function(renderState) {
    var key = null;
    for (key in m_attributes) {
      if (m_attributes.hasOwnProperty(key)) {
        m_attributes[key].undoBind(renderState);
      }
    }

    for (key in m_textureAttributes) {
      if (m_textureAttributes.hasOwnProperty(key)) {
        m_textureAttributes[key].undoBind(renderState);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Bind vertex data
   *
   * @param renderState
   * @param key
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bindVertexData = function(renderState, key) {
    var i = null;

    for (i in m_attributes) {
      if (m_attributes.hasOwnProperty(i)) {
        m_attributes[i].bindVertexData(renderState, key);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind vertex data
   *
   * @param renderState
   * @param key
   */
  ////////////////////////////////////////////////////////////////////////////
  this.undoBindVertexData = function(renderState, key) {
    var i = null;

    for (i in m_attributes) {
      if (m_attributes.hasOwnProperty(i)) {
        m_attributes.undoBindVertexData(renderState, key);
      }
    }
  };

  return this;
};

vglModule.material.RenderBin = {
  "Base" : 0,
  "Default" : 100,
  "Opaque" : 100,
  "Transparent" : 1000,
  "Overlay" : 10000
};

inherit(vglModule.material, vglModule.object);
