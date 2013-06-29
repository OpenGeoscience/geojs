/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, white: true, indent: 2*/
/*global geoModule, vglModule, ogs, inherit, vec4, $*/

/**
 * Create a new instance of mapInteractorStyle
 *
 * @class geoModule.mapInteractorStyle
 * @returns {geoModule.mapInteractorStyle}
 */
geoModule.mapInteractorStyle = function() {
  "use strict";
  if (!(this instanceof geoModule.mapInteractorStyle)) {
    return new geoModule.mapInteractorStyle();
  }
  ogs.vgl.interactorStyle.call(this);
  var m_that = this,
      m_leftMouseButtonDown = false,
      m_rightMouseButtonDown = false,
      m_middileMouseButtonDown = false,
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
      m_map,
      m_dx,
      m_dy,
      m_dz,
      m_zTrans,
      m_mouseLastPos = {
        x: 0,
        y: 0
      };
  var m_picker = new ogs.vgl.picker();

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
    if (m_leftMouseButtonDown) {
      m_focalPoint = m_camera.focalPoint();

      m_focusWorldPt = vec4.fromValues(
        m_focalPoint[0], m_focalPoint[1], m_focalPoint[2], 1);
      m_focusDisplayPt = m_renderer.worldToDisplay(
        m_focusWorldPt, m_camera.viewMatrix(),
        m_camera.projectionMatrix(), m_width, m_height);

      m_displayPt1 = vec4.fromValues(
        m_currentMousePos.x, m_currentMousePos.y, m_focusDisplayPt[2], 1.0);
      m_displayPt2 = vec4.fromValues(
        m_mouseLastPos.x, m_mouseLastPos.y, m_focusDisplayPt[2], 1.0);

      m_worldPt1 = m_renderer.displayToWorld(
        m_displayPt1, m_camera.viewMatrix(), m_camera.projectionMatrix(),
        m_width, m_height);
      m_worldPt2 = m_renderer.displayToWorld(
        m_displayPt2, m_camera.viewMatrix(), m_camera.projectionMatrix(),
        m_width, m_height);

      m_dx = m_worldPt1[0] - m_worldPt2[0];
      m_dy = m_worldPt1[1] - m_worldPt2[1];
      m_dz = m_worldPt1[2] - m_worldPt2[2];
      m_camera.pan(-m_dx, -m_dy, -m_dz);
      $(m_that).trigger(vglModule.command.leftButtonPressEvent);
    }
    if (m_middileMouseButtonDown) {
      //Limit Rotation to only X, and between 0 to 60
      var xrot = (m_mouseLastPos.y - m_currentMousePos.y);
      var a = m_camera.viewUpDirection();
      var angle = Math.atan2(a[2],a[1])*180/Math.PI;
      if (xrot > 0 && angle < 60)
        m_camera.rotate(0, xrot);
      else if (xrot < 0 && angle > 0)
        m_camera.rotate(0, xrot);
      $(m_that).trigger(vglModule.command.middleButtonPressEvent);
    }
    if (m_rightMouseButtonDown) {
      m_zTrans = m_currentMousePos.y - m_mouseLastPos.y;
      m_camera.zoom(m_zTrans * 0.5);
      $(m_that).trigger(geoModule.command.updateViewZoomEvent);
      $(m_that).trigger(vglModule.command.rightButtonPressEvent);
    }
    m_mouseLastPos.x = m_currentMousePos.x;
    m_mouseLastPos.y = m_currentMousePos.y;
    return false;
  };

  this.handleMouseDown = function(event) {
    var canvas = m_that.viewer().canvas();
    if (event.target !== canvas) {
      return true;
    }
    if (event.state !== "down") {
      return;
    }
    if (event.button === 0) {
      m_leftMouseButtonDown = true;
    }
    if (event.button === 1) {
      m_middileMouseButtonDown = true;
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

  // @NOTE We never get mouse up from scroll bar: See the bug report here
  // http://bugs.jquery.com/ticket/8184
  this.handleMouseUp = function(event) {
    var canvas = m_that.viewer().canvas();
    if (event.target !== canvas) {
      return true;
    }
    if (event.state !== "up") {
      return true;
    }
    if (event.button === 0) {
      m_leftMouseButtonDown = false;
      var width = m_that.viewer().renderWindow().windowSize()[0];
      var height = m_that.viewer().renderWindow().windowSize()[1];
      var renderer = m_that.viewer().renderWindow().activeRenderer();
      if(m_mouseLastPos.x >= 0 && m_mouseLastPos.x <= width &&
         m_mouseLastPos.y >= 0 && m_mouseLastPos.y <= height) {
        var num = m_picker.pick(m_mouseLastPos.x, m_mouseLastPos.y, renderer);
      }
    }
    if (event.button === 1) {
      m_middileMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
    }
    return false;
  };


  this.setMap = function(map) {
    m_map = map;
  }

  this.zoom = function(options, useCurrent) {
    var m_renderer, m_camera, distance, currPosition;
    m_renderer = m_that.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();
    distance = 600;
    distance = 1100 - (600 - (60 * options.zoom)) + 1;
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
inherit(geoModule.mapInteractorStyle, ogs.vgl.interactorStyle);
