//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global window, vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class viewer
 *
 * @param canvas
 * @returns {vglModule.viewer}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.viewer = function(canvas) {
  'use strict';

  if (!(this instanceof vglModule.viewer)) {
    return new vglModule.viewer(canvas);
  }

  vglModule.object.call(this);

  var m_that = this,
      m_canvas = canvas,
      m_ready = false,
      m_interactorStyle = null,
      m_renderer = vglModule.renderer(),
      m_renderWindow = vglModule.renderWindow(m_canvas);

  m_renderWindow.addRenderer(m_renderer);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get canvas of the viewer
   *
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.canvas = function() {
    return m_canvas;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return render window of the viewer
   *
   * @returns {vglModule.renderWindow}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.renderWindow = function() {
    return m_renderWindow;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize the viewer
   *
   * This is a must call or otherwise render context may not initialized
   * properly.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.init = function() {
    if (m_renderWindow !== null) {
      m_renderWindow.createWindow();
      m_ready = true;
    }
    else {
      console.log("[ERROR] No render window attached");
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get interactor style of the viewer
   *
   * @returns {vglModule.interactorStyle}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.interactorStyle = function() {
    return m_interactorStyle;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set interactor style to be used by the viewer
   *
   * @param {vglModule.interactorStyle} style
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setInteractorStyle = function(style) {
    if (style !== m_interactorStyle) {
      m_interactorStyle = style;
      m_interactorStyle.setViewer(this);
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
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      // Only prevent default action for right mouse button
      if (event.button === 2) {
        fixedEvent.preventDefault();
      }
      fixedEvent.state = 'down';
      fixedEvent.type = vglModule.command.mousePressEvent;
      $(m_that).trigger(fixedEvent);
    }

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
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.state = 'up';
      fixedEvent.type = vglModule.command.mouseReleaseEvent;
      $(m_that).trigger(fixedEvent);
    }

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
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vglModule.command.mouseMoveEvent;
      $(m_that).trigger(fixedEvent);
    }

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
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vglModule.command.keyPressEvent;
      $(m_that).trigger(fixedEvent);
    }

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
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vglModule.command.contextMenuEvent;
      $(m_that).trigger(fixedEvent);
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get mouse coodinates related to canvas
   *
   * @param event
   * @returns {{x: number, y: number}}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.relMouseCoords = function(event) {
    var totalOffsetX = 0,
        totalOffsetY = 0,
        canvasX = 0,
        canvasY = 0,
        currentElement = m_canvas;

    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    } while (currentElement === currentElement.offsetParent);

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
      x: canvasX,
      y: canvasY
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Render
   */
  ////////////////////////////////////////////////////////////////////////////
  this.render = function() {
    m_renderWindow.render();
  };

  return this;
};

inherit(vglModule.viewer, vglModule.object);
