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
 * Create a new instance of trackballInteractorStyle
 *
 * @class vglModule.trackballInteractorStyle
 * @returns {vglModule.trackballInteractorStyle}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.trackballInteractorStyle = function() {
  'use strict';

  if (!(this instanceof vglModule.trackballInteractorStyle)) {
    return new vglModule.trackballInteractorStyle();
  }
  ogs.vgl.interactorStyle.call(this);
  var m_that = this,
      m_leftMouseButtonDown = false,
      m_rightMouseButtonDown = false,
      m_middleMouseButtonDown = false,
      m_width,
      m_height,
      m_renderer,
      m_camera,
      m_outsideCanvas,
      m_coords,
      m_currentMousePos,
      m_focalPoint,
      m_focusWorldPt,
      m_focusDisplayPt,
      m_displayPt1,
      m_displayPt2,
      m_worldPt1,
      m_worldPt2,
      m_dx,
      m_dy,
      m_dz,
      m_mouseLastPos = {
        x: 0,
        y: 0
      };


  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function(event) {
    var canvas = m_that.viewer().canvas();
    if (event.target !== canvas) {
      return true;
    }
    m_width = m_that.viewer().renderWindow().windowSize()[0];
    m_height = m_that.viewer().renderWindow().windowSize()[1];
    m_renderer = m_that.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();
    m_outsideCanvas = false;
    m_coords = canvas.relMouseCoords(event);
    m_currentMousePos = {
      x: 0,
      y: 0
    };
    if ((m_coords.x < 0) || (m_coords.x > m_width)) {
      m_currentMousePos.x = 0;
      m_outsideCanvas = true;
    } else {
      m_currentMousePos.x = m_coords.x;
    }
    if ((m_coords.y < 0) || (m_coords.y > m_height)) {
      m_currentMousePos.y = 0;
      m_outsideCanvas = true;
    } else {
      m_currentMousePos.y = m_coords.y;
    }
    if (m_outsideCanvas === true) {
      return;
    }
    m_focalPoint = m_camera.focalPoint();
    m_focusWorldPt = vec4.fromValues(m_focalPoint[0], m_focalPoint[1], m_focalPoint[2], 1);
    m_focusDisplayPt = m_renderer.worldToDisplay(m_focusWorldPt, m_camera.viewMatrix(),
      m_camera.projectionMatrix(), m_width, m_height);
    m_displayPt1 = vec4.fromValues(
      m_currentMousePos.x, m_currentMousePos.y, m_focusDisplayPt[2], 1.0);
    m_displayPt2 = vec4.fromValues(
      m_mouseLastPos.x, m_mouseLastPos.y, m_focusDisplayPt[2], 1.0);
    m_worldPt1 = m_renderer.displayToWorld(
      m_displayPt1, m_camera.viewMatrix(), m_camera.projectionMatrix(), m_width, m_height);
    m_worldPt2 = m_renderer.displayToWorld(
      m_displayPt2, m_camera.viewMatrix(), m_camera.projectionMatrix(), m_width, m_height);

    m_dx = m_worldPt1[0] - m_worldPt2[0];
    m_dy = m_worldPt1[1] - m_worldPt2[1];
    m_dz = m_worldPt1[2] - m_worldPt2[2];

    if (m_middleMouseButtonDown) {
      m_camera.pan(-m_dx, -m_dy, -m_dz);
      $(m_that).trigger(vglModule.command.middleButtonPressEvent);
    }
    if (m_leftMouseButtonDown) {
      m_camera.rotate((m_mouseLastPos.x - m_currentMousePos.x),
      (m_mouseLastPos.y - m_currentMousePos.y));
      $(m_that).trigger(vglModule.command.leftButtonPressEvent);
    }
    if (m_rightMouseButtonDown) {
      m_camera.zoom(m_dy);
      $(m_that).trigger(vglModule.command.rightButtonPressEvent);
    }
    m_mouseLastPos.x = m_currentMousePos.x;
    m_mouseLastPos.y = m_currentMousePos.y;
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function(event) {
    var canvas = m_that.viewer().canvas();
    if (event.target !== canvas) {
      return true;
    }
    if (event.button === 0) {
      m_leftMouseButtonDown = true;
    }
    if (event.button === 1) {
      m_middleMouseButtonDown = true;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = true;
    }
    m_coords = canvas.relMouseCoords(event);
    if (m_coords.x < 0) {
      m_mouseLastPos.x = 0;
    } else {
      m_mouseLastPos.x = m_coords.x;
    }
    if (m_coords.y < 0) {
      m_mouseLastPos.y = 0;
    } else {
      m_mouseLastPos.y = m_coords.y;
    }
    return false;
  };

  // @note We never get mouse up from scroll bar: See the bug report here
  // http://bugs.jquery.com/ticket/8184
  /////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse up event
   *
   * @param event
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function(event) {
    var canvas = m_that.viewer().canvas();
    if (event.target !== canvas) {
      return true;
    }
    if (event.button === 0) {
      m_leftMouseButtonDown = false;
    }
    if (event.button === 1) {
      m_middleMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
    }
    return false;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Perform zoom based on the current zoom level
   *
   * @param options
   * @param useCurrent
   */
  /////////////////////////////////////////////////////////////////////////////
  this.zoom = function(options, useCurrent) {
    var m_renderer, m_camera, distance, currPosition;
    m_renderer = m_that.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();
    distance = 600 - (600 - (60 * options.zoom)) + 1;
    if (useCurrent === undefined || useCurrent === false) {
      m_camera.setPosition(options.center.lng(), options.center.lat(), distance);
      m_camera.setFocalPoint(options.center.lng(), options.center.lat(), 0.0);
    } else {
      currPosition = m_camera.position();
      m_camera.setPosition(currPosition[0], currPosition[1], distance);
      m_camera.setFocalPoint(currPosition[0], currPosition[1], 0.0);
    }
  };
  return this;
};
inherit(vglModule.trackballInteractorStyle, ogs.vgl.interactorStyle);
