/**
 * Create a new instance of mapInteractorStyle
 *
 * @class geoModule.mapInteractorStyle
 * @returns {geoModule.mapInteractorStyle}
 */
/*jslint devel: true, eqeq: true, forin: true, newcap: true, plusplus: true, todo: true, indent: 2 */
/*global geoModule, vglModule, ogs, inherit, vec4, $*/
geoModule.mapInteractorStyle = function() {
  "use strict";
  if (!(this instanceof geoModule.mapInteractorStyle)) {
    return new geoModule.mapInteractorStyle();
  }
  ogs.vgl.interactorStyle.call(this);
  var m_that = this, m_leftMouseButtonDown = false, m_rightMouseButtonDown = false, m_middileMouseButtonDown = false, m_mouseLastPos, width, height, renderer, camera, outsideCanvas, coords, currentMousePos, focalPoint, focusWorldPt, focusDisplayPt, displayPt1, displayPt2, worldPt1, worldPt2, dx, dy, dz, zTrans;
  m_mouseLastPos = {
    x: 0,
    y: 0
  };
  this.handleMouseMove = function(event) {
    var canvas = m_that.viewer().canvas();
    if (event.target !== canvas) {
      return true;
    }
    width = m_that.viewer().renderWindow().windowSize()[0];
    height = m_that.viewer().renderWindow().windowSize()[1];
    renderer = m_that.viewer().renderWindow().activeRenderer();
    camera = renderer.camera();
    outsideCanvas = false;
    coords = canvas.relMouseCoords(event);
    currentMousePos = {
      x: 0,
      y: 0
    };
    if ((coords.x < 0) || (coords.x > width)) {
      currentMousePos.x = 0;
      outsideCanvas = true;
    } else {
      currentMousePos.x = coords.x;
    }
    if ((coords.y < 0) || (coords.y > height)) {
      currentMousePos.y = 0;
      outsideCanvas = true;
    } else {
      currentMousePos.y = coords.y;
    }
    if (outsideCanvas === true) {
      return;
    }
    if (m_middileMouseButtonDown) {
      focalPoint = camera.focalPoint();
      focusWorldPt = vec4.fromValues(focalPoint[0], focalPoint[1], focalPoint[2], 1);
      focusDisplayPt = renderer.worldToDisplay(focusWorldPt, camera.viewMatrix(), camera.projectionMatrix(), width, height);
      displayPt1 = vec4.fromValues(currentMousePos.x, currentMousePos.y, focusDisplayPt[2], 1.0);
      displayPt2 = vec4.fromValues(m_mouseLastPos.x, m_mouseLastPos.y, focusDisplayPt[2], 1.0);
      worldPt1 = renderer.displayToWorld(displayPt1, camera.viewMatrix(), camera.projectionMatrix(), width, height);
      worldPt2 = renderer.displayToWorld(displayPt2, camera.viewMatrix(), camera.projectionMatrix(), width, height);
      dx = worldPt1[0] - worldPt2[0];
      dy = worldPt1[1] - worldPt2[1];
      dz = worldPt1[2] - worldPt2[2];
      camera.pan(-dx, -dy, -dz);
      $(m_that).trigger(vglModule.command.middleButtonPressEvent);
    }
    if (m_leftMouseButtonDown) {
      camera.rotate((m_mouseLastPos.x - currentMousePos.x), (m_mouseLastPos.y - currentMousePos.y));
      $(m_that).trigger(vglModule.command.leftButtonPressEvent);
    }
    if (m_rightMouseButtonDown) {
      zTrans = currentMousePos.y - m_mouseLastPos.y;
      camera.zoom(zTrans * 0.5);
      $(m_that).trigger(vglModule.command.rightButtonPressEvent);
    }
    m_mouseLastPos.x = currentMousePos.x;
    m_mouseLastPos.y = currentMousePos.y;
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
    coords = canvas.relMouseCoords(event);
    if (coords.x < 0) {
      m_mouseLastPos.x = 0;
    } else {
      m_mouseLastPos.x = coords.x;
    }
    if (coords.y < 0) {
      m_mouseLastPos.y = 0;
    } else {
      m_mouseLastPos.y = coords.y;
    }
    return false;
  };
  // @note We never get mouse up from scroll bar: See the bug report here
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
    }
    if (event.button === 1) {
      m_middileMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
    }
    return false;
  };
  this.zoom = function(options, useCurrent) {
    var renderer, camera, distance, currPosition;
    renderer = m_that.viewer().renderWindow().activeRenderer();
    camera = renderer.camera();
    distance = 600;
    distance = 600 - (600 - (60 * options.zoom)) + 1;
    if (useCurrent === undefined || useCurrent === false) {
      camera.setPosition(options.center.lng(), options.center.lat(), distance);
      camera.setFocalPoint(options.center.lng(), options.center.lat(), 0.0);
    } else {
      currPosition = camera.position();
      camera.setPosition(currPosition[0], currPosition[1], distance);
      camera.setFocalPoint(currPosition[0], currPosition[1], 0.0);
    }
  };
  return this;
};
inherit(geoModule.mapInteractorStyle, ogs.vgl.interactorStyle);
