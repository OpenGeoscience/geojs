//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class interactorStyle
 *
 * @class vglModule.interactorStyle
 * interactorStyle is a base class for all interactor styles
 * @returns {vglModule.interactorStyle}
 */
////////////////////////////////////////////////////////////////////////////
vglModule.interactorStyle = function() {
  'use strict';

  if (!(this instanceof vglModule.interactorStyle)) {
    return new vglModule.interactorStyle();
  }
  vglModule.object.call(this);

  // Private member variables
  var m_that = this,
      m_viewer = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return viewer referenced by the interactor style
   *
   * @returns {null}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewer = function() {
    return m_viewer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set viewer for the interactor style
   *
   * @param viewer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setViewer = function(viewer) {
    if (viewer !== m_viewer) {
      m_viewer = viewer;
      $(m_viewer).on(vglModule.command.mousePressEvent, m_that.handleMouseDown);
      $(m_viewer).on(vglModule.command.mouseReleaseEvent, m_that.handleMouseUp);
      $(m_viewer).on(vglModule.command.mouseMoveEvent, m_that.handleMouseMove);
      $(m_viewer).on(vglModule.command.keyPressEvent, m_that.handleKeyPress);
      $(m_viewer).on(vglModule.command.mouseContextMenuEvent,
                     m_that.handleContextMenu);
      this.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function(event) {
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse up event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function(event) {
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function(event) {
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle key press event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleKeyPress = function(event) {
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle context menu event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleContextMenu = function(event) {
    return true;
  };

  return this;
};

inherit(vglModule.interactorStyle, vglModule.object);
