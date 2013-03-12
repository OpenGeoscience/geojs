/**
 * @class geoModule.mapInteractorStyle
 * @returns {geoModule.mapInteractorStyle}
 */
geoModule.mapInteractorStyle = function() {

  if (!(this instanceof geoModule.mapInteractorStyle)) {
    return new geoModule.mapInteractorStyle();
  }

  ogs.vgl.interactorStyle.call(this);

  var m_leftMouseButtonDown = false;
  var m_rightMouseButtonDown = false;
  var m_mouseLastPos = {
    x : 0,
    y : 0
  };

  this.handleMouseMove = function(event) {
    var width = this.viewer().renderWindow().windowSize()[0];
    var height = this.viewer().renderWindow().windowSize()[1];
    var renderer = this.viewer().renderWindow().activeRenderer();
    var camera = renderer.camera();

    var outsideCanvas = false;
    var coords = this.viewer().canvas().relMouseCoords(event);

    var currentMousePos = {
      x : 0,
      y : 0
    };

    if ((coords.x < 0) || (coords.x > width)) {
      currentMousePos.x = 0;
      outsideCanvas = true;
    }
    else {
      currentMousePos.x = coords.x;
    }

    if ((coords.y < 0) || (coords.y > height)) {
      currentMousePos.y = 0;
      outsideCanvas = true;
    }
    else {
      currentMousePos.y = coords.y;
    }

    if (outsideCanvas === true) {
      return;
    }

    if (m_leftMouseButtonDown) {

      var focalPoint = camera.focalPoint();
      var focusWorldPt = vec4.createFrom(focalPoint[0], focalPoint[1],
                                         focalPoint[2], 1);

      var focusDisplayPt = renderer.worldToDisplay(focusWorldPt, camera
          .viewMatrix(), camera.projectionMatrix(), width, height);

      var displayPt1 = vec4.createFrom(currentMousePos.x, currentMousePos.y,
                                       focusDisplayPt[2], 1.0);
      var displayPt2 = vec4.createFrom(m_mouseLastPos.x, m_mouseLastPos.y,
                                       focusDisplayPt[2], 1.0);

      var worldPt1 = renderer.displayToWorld(displayPt1, camera.viewMatrix(),
                                             camera.projectionMatrix(), width,
                                             height);
      var worldPt2 = renderer.displayToWorld(displayPt2, camera.viewMatrix(),
                                             camera.projectionMatrix(), width,
                                             height);

      dx = worldPt1[0] - worldPt2[0];
      dy = worldPt1[1] - worldPt2[1];

      camera.pan(-dx, -dy);
      $(this).trigger(this.events.leftButtonPressEvent);
    }

    if (m_rightMouseButtonDown) {
      zTrans = currentMousePos.y - m_mouseLastPos.y;
      camera.zoom(zTrans * 0.5);
      $(this).trigger(this.events.rightButtonPressEvent);
    }

    m_mouseLastPos.x = currentMousePos.x;
    m_mouseLastPos.y = currentMousePos.y;
  };

  this.handleMouseDown = function(event) {
    var canvas = this.viewer().canvas();

    if (event.button === 0) {
      m_leftMouseButtonDown = true;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = true;
    }
    if (event.button === 4) {
      middileMouseButtonDown = true;
    }

    coords = canvas.relMouseCoords(event);

    if (coords.x < 0) {
      m_mouseLastPos.x = 0;
    }
    else {
      m_mouseLastPos.x = coords.x;
    }

    if (coords.y < 0) {
      m_mouseLastPos.y = 0;
    }
    else {
      m_mouseLastPos.y = coords.y;
    }

    return false;
  };

  this.handleMouseUp = function(event) {
    if (event.button === 0) {
      m_leftMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
    }
    if (event.button === 4) {
      middileMouseButtonDown = false;
    }

    return false;
  };

  return this;
};

inherit(geoModule.mapInteractorStyle, ogs.vgl.interactorStyle);