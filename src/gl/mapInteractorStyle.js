//////////////////////////////////////////////////////////////////////////////
/**
 * @module ggl
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of mapInteractorStyle
 *
 * @class geo.mapInteractorStyle
 * @returns {geo.mapInteractorStyle}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.mapInteractorStyle = function () {
  "use strict";
  if (!(this instanceof ggl.mapInteractorStyle)) {
    return new ggl.mapInteractorStyle();
  }
  vgl.interactorStyle.call(this);
  var m_map,
    m_this = this,
    m_leftMouseButtonDown = false,
    m_rightMouseButtonDown = false,
    m_middileMouseButtonDown = false,
    m_initRightBtnMouseDown = false,
    m_drawRegionMode = false,
    m_drawRegionLayer,
    m_clickLatLng,
    m_width,
    m_height,
    m_renderer,
    m_renderWindow,
    m_camera,
    m_outsideCanvas,
    m_currentMousePos = { x : 0, y : 0 },
    m_focusDisplayPoint,
    m_zTrans,
    m_coords,
    m_lastMousePos = { x : 0, y : 0 },
    m_useLastDirection = false,
    m_lastDirection = null,
    m_picker = new vgl.picker(),
    m_updateRenderParamsTime = vgl.timestamp();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets map for this interactor, adds draw region layer if needed
   *
   * @param {geo.map} newMap optional
   * @returns {geo.mapInteractorStyle|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function (val) {
    if (val !== undefined) {
      m_map = val;
      return m_this;
    }
    return m_map;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets drawRegionMode for this interactor
   *
   * @param {Boolean} newValue optional
   * @returns {geo.mapInteractorStyle|Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.drawRegionMode = function (val) {
    if (val !== undefined) {
      m_drawRegionMode = val;
      if (m_drawRegionLayer) {
        m_drawRegionLayer.setVisible(val);
      }
      m_map.draw();
      return m_this;
    }
    return m_drawRegionMode;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Internal function to pan a camera associated with a renderer.
   *
   * @param {vgl.renderer} the renderer whose camera should be panned.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._panCamera = function (renderer) {
    var worldPt1, worldPt2, dx, dy, dz, focusDisplayPoint = renderer.focusDisplayPoint();

    worldPt1 = m_renderWindow.displayToWorld(m_currentMousePos.x,
      m_currentMousePos.y, focusDisplayPoint, renderer);
    worldPt2 = m_renderWindow.displayToWorld(m_lastMousePos.x,
      m_lastMousePos.y, focusDisplayPoint, renderer);

    dx = worldPt1[0] - worldPt2[0];
    dy = worldPt1[1] - worldPt2[1];
    dz = worldPt1[2] - worldPt2[2];

    renderer.camera().pan(-dx, -dy, -dz);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function (event) {
    /// Local vars
    var mouseWorldPoint,
        lastWorldPos,
        currWorldPos,
        evt,
        i,
        renderers;

    /// Update render params
    m_this.updateRenderParams();

    /// Compute current mouse position
    m_this._computeCurrentMousePos(event);

    if (m_outsideCanvas === true) {
      return true; // allow bubbling up the event
    }
    if (m_leftMouseButtonDown) {
      if (m_drawRegionMode) {
        mouseWorldPoint = m_map.displayToMap(m_currentMousePos.x,
          m_currentMousePos.y);
        m_this.setDrawRegion(m_clickLatLng.lat(), m_clickLatLng.lng(),
          mouseWorldPoint.y, mouseWorldPoint.x);
      } else {
        lastWorldPos = m_camera.position();
        // Pan all cameras associated with the render window.
        renderers = m_renderWindow.renderers();
        for (i = 0; i < renderers.length; i += 1) {
          m_this._panCamera(renderers[i]);
        }
        currWorldPos = m_camera.position();

        // TODO Do we need to emit an event for each ?
        evt = {type: geo.event.pan,
               last_display_pos: m_lastMousePos,
               curr_display_pos: m_currentMousePos,
               last_world_pos: lastWorldPos,
               curr_world_pos: currWorldPos};

        $(m_this).trigger(evt);
      }
    }
    if (m_middileMouseButtonDown) {
      /// DO NOTHING AS OF NOW
    }
    if (m_rightMouseButtonDown && m_height > 0) {
      if (m_lastDirection !== null) {
        m_useLastDirection = true;
      }

      m_this.zoom();
    }

    m_lastMousePos.x = m_currentMousePos.x;
    m_lastMousePos.y = m_currentMousePos.y;
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function (event) {
    var point;

    /// Update render parameters
    m_this.updateRenderParams();

     /// Compute current mouse position
    m_this._computeCurrentMousePos(event);

    if (event.button === 0) {
      m_leftMouseButtonDown = true;
    }
    if (event.button === 1) {
      m_middileMouseButtonDown = true;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = true;
    }

    m_coords = m_this.viewer().relMouseCoords(event);
    if (m_coords.x < 0) {
      m_lastMousePos.x = 0;
    } else {
      m_lastMousePos.x = m_coords.x;
    }
    if (m_coords.y < 0) {
      m_lastMousePos.y = 0;
    } else {
      m_lastMousePos.y = m_coords.y;
    }

    if (m_drawRegionMode && m_leftMouseButtonDown) {
      point = m_map.displayToMap(m_lastMousePos.x, m_lastMousePos.y);
      m_clickLatLng = geo.latlng(point.y, point.x);
      m_this.setDrawRegion(point.y, point.x, point.y, point.x);
    }

    m_lastMousePos.x = m_currentMousePos.x;
    m_lastMousePos.y = m_currentMousePos.y;

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @NOTE We never get mouse up from scroll bar: See the bug report here
   * http://bugs.jquery.com/ticket/8184
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function (event) {
    var width = null,
        height = null,
        num = null;

    /// Update render params
    m_this.updateRenderParams();

    if (event.button === 0) {
      m_leftMouseButtonDown = false;
      width = m_this.viewer().renderWindow().windowSize()[0];
      height = m_this.viewer().renderWindow().windowSize()[1];
      m_renderer = m_this.viewer().renderWindow().activeRenderer();
      if (m_lastMousePos.x >= 0 && m_lastMousePos.x <= width &&
          m_lastMousePos.y >= 0 && m_lastMousePos.y <= height) {
        num = m_picker.pick(m_lastMousePos.x, m_lastMousePos.y, m_renderer);
      }
    }
    if (event.button === 1) {
      m_middileMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
      m_initRightBtnMouseDown = false;
      m_useLastDirection = false;
      m_lastDirection = null;

      /// Compute current mouse position
      m_this._computeCurrentMousePos(event);
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when mouse goes out of canvas
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseOut = function () {
    /// Update render params
    m_this.updateRenderParams();

    if (m_leftMouseButtonDown) {
      m_leftMouseButtonDown = false;
    } else if (m_middileMouseButtonDown) {
      m_middileMouseButtonDown = false;
    }
    if (m_rightMouseButtonDown) {
      m_rightMouseButtonDown = false;
      m_initRightBtnMouseDown = false;

      /// Perform zoom when the mouse goes out of canvas as we
      /// are treating mouse out as right button up.
      m_this.zoom();
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse wheel event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseWheel = function (event) {
    /// Update render params
    m_this.updateRenderParams();

    var delta = event.originalEvent.wheelDeltaY / 120.0, deltaIsPositive,
                speed = 0.05;
    deltaIsPositive = delta >= 0.0 ? true : false;

    delta = Math.pow(1 + Math.abs(delta) / 2, delta > 0 ? -1 : 1);

    delta *= speed;

    /// Compute current mouse position
    m_this._computeCurrentMousePos(event);

    m_this.zoom(delta, !deltaIsPositive);
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle double click event
   *
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleDoubleClick = function () {
    m_this.zoom(0.5, false);
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Internal function to zoom cameras
   * @param {Number} optional value to zoom by
   */
  ////////////////////////////////////////////////////////////////////////////
  this._syncZoom = function (val, dir) {
    var i, renderers, pos, fp, cam, clipRange, gap, minGap = 0.01;

    /// Make sure we are uptodate with renderer and render window
    m_this.updateRenderParams();

    if (val) {
      m_camera.zoom(val, dir);
      if (dir) {
        pos = m_camera.position();
        fp = m_camera.focalPoint();
        m_camera.setFocalPoint(pos[0], pos[1], fp[2]);
      }
      m_renderer.resetCameraClippingRange();
    }

    pos = m_camera.position();
    fp = m_camera.focalPoint();
    gap = vec3.distance(pos, fp);

    if (!dir) {
      dir = m_camera.directionOfProjection();
    }

    clipRange = m_camera.clippingRange();

    if ((vec3.dot(dir, m_camera.directionOfProjection()) > 0) &&
        (Math.abs(gap) < minGap || clipRange[0] < minGap)) {
      pos[0] = fp[0] + minGap * dir[0];
      pos[1] = fp[1] + minGap * dir[1];
      pos[2] = fp[2] - minGap * dir[2];
      m_camera.setPosition(pos[0], pos[1], pos[2]);
      m_camera.setFocalPoint(pos[0], pos[1], fp[2]);
      m_renderer.resetCameraClippingRange();
    }

    pos = m_camera.position();
    fp = m_camera.focalPoint();

    renderers = m_renderWindow.renderers();
    for (i = 0; i < renderers.length; i += 1) {
      cam = renderers[i].camera();
      if (cam !== m_camera) {
        cam.setPosition(pos[0], pos[1], pos[2]);
        cam.setFocalPoint(fp[0], fp[1], fp[2]);
        renderers[i].resetCameraClippingRange();
        renderers[i].render();
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Internal function to zoom cameras
   * @param {Number} optional value to zoom by
   */
  ////////////////////////////////////////////////////////////////////////////
  this._syncReset = function () {
    var i, renderers, pos, fp, zoom, center, cam, clippingRange;

    /// Make sure we are uptodate with renderer and render window
    m_this.updateRenderParams();

    zoom = m_map.zoom();
    center = m_map.center();
    fp = m_camera.focalPoint();

    /// TODO: Call base layer - reference layer
    center = m_map.baseLayer().toLocal(geo.latlng(center[0], center[1]));

    if (center instanceof Object &&
        "x" in center &&
        "y" in center &&
        m_map.baseLayer() instanceof geo.osmLayer) {

      m_camera.setPosition(center.x, center.y, computeCameraDistance(zoom));
      m_camera.setFocalPoint(center.x, center.y, fp[2]);
      m_renderer.resetCameraClippingRange();
    }

    fp = m_camera.focalPoint();
    pos = m_camera.position();
    clippingRange = m_camera.clippingRange();

    renderers = m_renderWindow.renderers();

    /// TODO Check if we are allowed to transfrom the camera for this renderer
    for (i = 0; i < renderers.length; i += 1) {
      cam = renderers[i].camera();
      if (cam !== m_camera) {
        cam.setPosition(pos[0], pos[1], pos[2]);
        cam.setFocalPoint(fp[0], fp[1], fp[2]);
        cam.setClippingRange(clippingRange[0], clippingRange[1]);
        renderers[i].render();
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Internal function to zoom cameras
   * @param {Number} optional value to zoom by
   */
  ////////////////////////////////////////////////////////////////////////////
  this._syncPan = function () {
    /// TODO: Implement this
    // var i, renderers;
    // m_camera.zoom(val);
    // m_renderer.resetCameraClippingRange();

    // renderers = m_renderWindow.renderers();
    // for (i = 0; i < renderers.length; i++) {
    //   if (renderers[i].camera() !== m_camera) {
    //     renderers[i].camera().zoom(val);
    //     renderers[i].resetCameraClippingRange();
    //   }
    // }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update view in response to a zoom request
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function (val, zoomOut) {
    var evt, newZoomLevel, oldZoomLevel, cameraPos, cameraFp, newPos, clickedWorldPoint,
        direction, focusDisplayPoint, maxZoomedOutDist = 0, maxZoomedOut = false;

    /// Update render params
    m_this.updateRenderParams();

    m_zTrans = (m_currentMousePos.y - m_lastMousePos.y) / m_height;

    if (val === undefined) {
      val = 2.0 * Math.abs(m_zTrans);
    }

    oldZoomLevel = computeZoomLevel();

    focusDisplayPoint = m_renderer.focusDisplayPoint();
    clickedWorldPoint = m_renderWindow.displayToWorld(m_currentMousePos.x,
                        m_currentMousePos.y, focusDisplayPoint, m_renderer);
    cameraPos = m_camera.position();
    cameraFp = m_camera.focalPoint();
    direction = [clickedWorldPoint[0] - cameraPos[0],
                 clickedWorldPoint[1] - cameraPos[1],
                 clickedWorldPoint[2] - cameraPos[2]];

    vec3.normalize(direction, direction);

    if (m_useLastDirection) {
      direction = m_lastDirection.slice(0);
    } else {
      m_lastDirection = direction.slice(0);
    }

    if ((m_lastMousePos.y - m_currentMousePos.y) < 0 || zoomOut) {
      direction[0] = -direction[0];
      direction[1] = -direction[1];
      direction[2] = -direction[2];
    }

    if (cameraPos[2] * Math.sin(m_camera.viewAngle()) >= 360.0 && zoomOut) {
      maxZoomedOut = true;
    } else {
      this._syncZoom(val, direction);

      /// Compute meters per pixel here and based on that decide the
      /// zoom level
      newZoomLevel = computeZoomLevel();
    }

    /// Check again here:
    cameraPos = m_camera.position();
    cameraFp = m_camera.focalPoint();

    if (maxZoomedOut || (cameraPos[2] * Math.sin(m_camera.viewAngle()) >= 360.0)) {
      maxZoomedOut = false;
      maxZoomedOutDist = computeCameraDistance(0);

      /// Compute x and y positions based off the max zoomed out distance
      newPos = [(maxZoomedOutDist - cameraPos[2]) * direction[0] / direction[2],
                (maxZoomedOutDist - cameraPos[2]) * direction[1] / direction[2]];

      m_camera.setPosition(cameraPos[0] + newPos[0],
                           cameraPos[1] + newPos[1], maxZoomedOutDist);
      m_camera.setFocalPoint(cameraPos[0] + newPos[0],
                             cameraPos[1] + newPos[1], cameraFp[2]);
      m_renderer.resetCameraClippingRange();

      newZoomLevel = 0;

      /// Sync all other camera again.
      this._syncZoom();
    }

    evt = { type: geo.event.zoom,
            curr_zoom: newZoomLevel,
            last_zoom: oldZoomLevel };
    $(m_this).trigger(evt);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets the lastMousePosition for this interactor
   *
   * @param newPosition optional
   * @param {Number} newPosition.x
   * @param {Number} newPosition.y
   * @returns {geo.mapInteractorStyle|Object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.lastMousePosition = function (newPosition) {
    if (newPosition !== undefined) {
      m_lastMousePos = newPosition;
      return m_this;
    }
    return m_lastMousePos;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets leftMouseDown for this interactor
   *
   * @param {Boolean} newValue optional
   * @returns {geo.mapInteractorStyle|Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.leftMouseDown = function (newValue) {
    if (newValue !== undefined) {
      m_leftMouseButtonDown = newValue;
      return m_this;
    }
    return m_leftMouseButtonDown;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets the draw region coordinates for this interactor
   *
   * @param {Number} lat1
   * @param {Number} lon1
   * @param {Number} lat2
   * @param {Number} lon2
   * @returns {geo.mapInteractorStyle}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setDrawRegion = function (lat1, lon1, lat2, lon2) {
    // TODO
    // Use z-indexing or some other technique for the offsetting
    var evt, plane = geo.planeFeature(
      geo.latlng(lat1, lon1),
      geo.latlng(lat2, lon2),
      99
    );

    m_map.removeLayer(m_drawRegionLayer);

    m_drawRegionLayer = geo.featureLayer({
      "opacity": 0.5,
      "showAttribution": 1
    }, plane);

    m_map.addLayer(m_drawRegionLayer);

    /// TODO pass bounding box
    evt = jQuery.Event(geo.event.updateDrawRegionEvent);
    $(m_this).trigger(geo.command.updateDrawRegionEvent, evt);

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets the draw region coordinates for this interactor
   *
   * @returns {Array} [lat1, lon1, lat2, lon2]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getDrawRegion = function () {
    return m_drawRegionLayer.features()[0].getCoords();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute current mouse position
   *
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._computeCurrentMousePos = function (event) {
    if (event.pageX === undefined || event.pageY === undefined) {
      return;
    }

    /// Update render params
    m_this.updateRenderParams();

    m_outsideCanvas = false;

    m_coords = m_this.viewer().relMouseCoords(event);

    if ((m_coords.x < 0) || (m_coords.x > m_width)) { // off-by-one error
      m_currentMousePos.x = 0;
      m_outsideCanvas = true;
    } else {
      m_currentMousePos.x = m_coords.x;
    }
    if ((m_coords.y < 0) || (m_coords.y > m_height)) { // off-by-one error
      m_currentMousePos.y = 0;
      m_outsideCanvas = true;
    } else {
      m_currentMousePos.y = m_coords.y;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute current mouse position
   *
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateRenderParams = function () {
    m_renderWindow = m_this.viewer().renderWindow();
    m_width = m_renderWindow.windowSize()[0];
    m_height = m_renderWindow.windowSize()[1];
    m_renderer = m_this.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();
    m_focusDisplayPoint = m_renderWindow.focusDisplayPoint();
    m_updateRenderParamsTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset to default
   */
  ////////////////////////////////////////////////////////////////////////////
  this.reset = function () {
    var evt, zoom;

    if (!m_map) {
      return;
    }

    zoom = m_map.zoom();

    m_this._syncReset();

    evt = { type: geo.event.zoom,
            curr_zoom: zoom,
            last_zoom: zoom };
    $(m_this).trigger(evt);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute zoom level
   *
   * @param deltaMerc mercator/per pixel
   * @returns {Number} zoom level
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function computeZoomLevel() {
    var i, pos = m_camera.position(),
        width = (pos[2] * Math.sin(m_camera.viewAngle()));
    for (i = 0; i < 20; i += 1) {
      if (width >= (360.0 / Math.pow(2, i))) {
        /// We are forcing the minimum zoom level to 2 so that we can get
        /// high res imagery even at the zoom level 0 distance
        return i;
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute camera distance for a given zoom level
   *
   * @returns {Number} camera distance from the map
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function computeCameraDistance(zoomLevel) {
    var deg = 360.0 / Math.pow(2, zoomLevel);
    return (deg / Math.sin(m_camera.viewAngle()));
  }

  return this;
};

inherit(ggl.mapInteractorStyle, vgl.interactorStyle);
