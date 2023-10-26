var $ = require('jquery');
var vgl = require('./vgl');
var inherit = require('../inherit');

/**
 * Create a new instance of class viewer.
 *
 * @class
 * @alias vgl.viewer
 * @extends vgl.object
 * @param {HTMLElement} canvas Canvas element associated with the viewer.
 * @param {object} options Options to send to the renderer.
 * @returns {vgl.viewer}
 */
vgl.viewer = function (canvas, options) {
  'use strict';

  if (!(this instanceof vgl.viewer)) {
    return new vgl.viewer(canvas, options);
  }

  vgl.object.call(this);

  var m_canvas = canvas,
      m_renderer = vgl.renderer(options),
      m_renderWindow = vgl.renderWindow(m_canvas);

  /**
   * Get canvas of the viewer.
   *
   * @returns {HTMLElement}
   */
  this.canvas = function () {
    return m_canvas;
  };

  /**
   * Return render window of the viewer.
   *
   * @returns {vgl.renderWindow}
   */
  this.renderWindow = function () {
    return m_renderWindow;
  };

  /**
   * Initialize the viewer.
   *
   * This is a must call or otherwise render context may not initialized
   * properly.
   */
  this.init = function () {
    if (m_renderWindow !== null) {
      m_renderWindow._setup();
    } else {
      console.log('[ERROR] No render window attached');
    }
  };

  /**
   * Remove the viewer.
   *
   * @param {vgl.renderState} renderState Current render state.
   */
  this.exit = function (renderState) {
    if (m_renderWindow !== null) {
      m_renderWindow._cleanup(renderState);
    } else {
      console.log('[ERROR] No render window attached');
    }
  };

  /**
   * Render.
   */
  this.render = function () {
    m_renderWindow.render();
  };

  /**
   * Bind canvas mouse events to their default handlers.
   */
  this.bindEventHandlers = function () {
    $(m_canvas).on('mousedown', this.handleMouseDown);
    $(m_canvas).on('mouseup', this.handleMouseUp);
    $(m_canvas).on('mousemove', this.handleMouseMove);
    $(m_canvas).on('mousewheel', this.handleMouseWheel);
    $(m_canvas).on('contextmenu', this.handleContextMenu);
  };

  /**
   * Undo earlier bound handlers for canvas mouse events.
   */
  this.unbindEventHandlers = function () {
    $(m_canvas).off('mousedown', this.handleMouseDown);
    $(m_canvas).off('mouseup', this.handleMouseUp);
    $(m_canvas).off('mousemove', this.handleMouseMove);
    $(m_canvas).off('mousewheel', this.handleMouseWheel);
    $(m_canvas).off('contextmenu', this.handleContextMenu);
  };

  /**
   * Initialize.
   */
  this._init = function () {
    this.bindEventHandlers();
    m_renderWindow.addRenderer(m_renderer);
  };

  this._init();
  return this;
};

inherit(vgl.viewer, vgl.object);
