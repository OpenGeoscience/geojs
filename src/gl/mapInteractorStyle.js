//////////////////////////////////////////////////////////////////////////////
/**
 * @module ggl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global ggl, geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, vec4, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of mapInteractorStyle
 *
 * @class geo.mapInteractorStyle
 * @returns {geo.mapInteractorStyle}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.mapInteractorStyle = function() {
  "use strict";
  if (!(this instanceof ggl.mapInteractorStyle)) {
    return new ggl.mapInteractorStyle();
  }
  vgl.interactorStyle.call(this);
  var m_map, m_this = this, m_mapZoomLevel = 3, m_leftMouseButtonDown = false,
      m_rightMouseButtonDown = false, m_middileMouseButtonDown = false,
      m_initRightBtnMouseDown = false, m_drawRegionMode = false,
      m_drawRegionLayer, m_clickLatLng, m_width, m_height,
      m_renderer, m_renderWindow, m_camera, m_outsideCanvas,
      m_currentMousePos, m_focusDisplayPoint, m_worldPt1,
      m_worldPt2, m_dx, m_dy, m_dz, m_zTrans, m_coords,
      m_mouseLastPos = { x: 0, y: 0 }, m_picker = new vgl.picker();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets map for this interactor, adds draw region layer if needed
   *
   * @param {geo.map} newMap optional
   * @returns {geo.mapInteractorStyle|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function(newMap) {
    if (typeof newMap !== 'undefined') {
      m_map = newMap;
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
  this.drawRegionMode = function(newValue) {
    if (typeof newValue !== 'undefined') {
      m_drawRegionMode = newValue;
      if(m_drawRegionLayer) {
        m_drawRegionLayer.setVisible(newValue);
      }
      m_map.draw();
      return m_this;
    }
    return m_drawRegionMode;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function(event) {
    var canvas = m_this.map(), xrot = null, a = null,
        angle = null, mouseWorldPoint, features, lastWorldPos, currWorldPos,
        lastZoom, evt, newMercPerPixel, oldMercPerPixel;

    /* TODO: Fix for layers
    if (!canvas || event.target !== canvas.node()) {
      return true;
    }
    */
    m_outsideCanvas = false;
    m_coords = m_this.viewer().relMouseCoords(event);
    m_currentMousePos = {
      x: 0,
      y: 0
    };
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
    if (m_outsideCanvas === true) {
      return true; // allow bubbling up the event
    }
    if (m_leftMouseButtonDown) {
      if(m_drawRegionMode) {
        mouseWorldPoint = m_map.displayToMap(m_currentMousePos.x,
          m_currentMousePos.y);
        m_this.setDrawRegion(m_clickLatLng.lat(), m_clickLatLng.lng(),
          mouseWorldPoint.y, mouseWorldPoint.x);
      } else {
        m_focusDisplayPoint = m_renderWindow.focusDisplayPoint();
        m_worldPt1 = m_renderWindow.displayToWorld(m_currentMousePos.x,
          m_currentMousePos.y, m_focusDisplayPoint);
        m_worldPt2 = m_renderWindow.displayToWorld(m_mouseLastPos.x,
          m_mouseLastPos.y, m_focusDisplayPoint);

        m_dx = m_worldPt1[0] - m_worldPt2[0];
        m_dy = m_worldPt1[1] - m_worldPt2[1];
        m_dz = m_worldPt1[2] - m_worldPt2[2];

        lastWorldPos = m_camera.position();
        m_camera.pan(-m_dx, -m_dy, -m_dz);
        currWorldPos = m_camera.position();

        evt = {type: geo.event.pan,
               last_display_pos: m_mouseLastPos,
               curr_display_pos: m_currentMousePos,
               last_world_pos: lastWorldPos,
               curr_world_pos: currWorldPos};

        $(m_this).trigger(evt);
      }
    }
    if (m_middileMouseButtonDown) {
      /// DO NOTHING AS OF NOW

      /// Limit Rotation to only X, and between 0 to 60
      // xrot = (m_mouseLastPos.y - m_currentMousePos.y);
      // a = m_camera.viewUpDirection();
      // angle = Math.atan2(a[2],a[1])*180/Math.PI;
      // if (xrot > 0 && angle < 60) {
      //   m_camera.rotate(0, xrot);
      // } else if (xrot < 0 && angle > 0) {
      //   m_camera.rotate(0, xrot);
      // }

      // evt = { type: geo.event.rotate,
      //         rot: xrot };
      // $(m_this).trigger(evt);
    }
    if (m_rightMouseButtonDown) {
      m_zTrans = (m_currentMousePos.y - m_mouseLastPos.y) / m_height;

      /// Calculate zoom scale here
      if (m_zTrans > 0) {
        m_camera.zoom(1 - Math.abs(m_zTrans));
      } else {
        m_camera.zoom(1 + Math.abs(m_zTrans));
      }
      m_renderer.resetCameraClippingRange();

      /// For now just trigger the render. Later on, we may want to
      /// trigger an external event
      m_renderer.render();
    }

    m_mouseLastPos.x = m_currentMousePos.x;
    m_mouseLastPos.y = m_currentMousePos.y;
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function(event) {
    var canvas = m_this.map(), point, plane;

    /* TODO: Fix for layers
    if (!canvas || event.target !== canvas.node()) {
      return true;
    }
    */
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
      m_mouseLastPos.x = 0;
    } else {
      m_mouseLastPos.x = m_coords.x;
    }
    if (m_coords.y < 0) {
      m_mouseLastPos.y = 0;
    } else {
      m_mouseLastPos.y = m_coords.y;
    }
    m_renderWindow = m_this.viewer().renderWindow();
    m_width = m_renderWindow.windowSize()[0];
    m_height = m_renderWindow.windowSize()[1];
    m_renderer = m_this.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();

    if(m_drawRegionMode && m_leftMouseButtonDown) {
      point = m_map.displayToMap(m_mouseLastPos.x, m_mouseLastPos.y);
      m_clickLatLng = geo.latlng(point.y, point.x);
      m_this.setDrawRegion(point.y, point.x, point.y, point.x);
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @NOTE We never get mouse up from scroll bar: See the bug report here
   * http://bugs.jquery.com/ticket/8184
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function(event) {
    var canvas = m_this.map(),
        width = null,
        height = null,
        num = null;

    /* TODO: Fix for layers
    if (!canvas || event.target !== canvas.node()) {
      return true;
    }
    */
    if (event.button === 0) {
      m_leftMouseButtonDown = false;
      width = m_this.viewer().renderWindow().windowSize()[0];
      height = m_this.viewer().renderWindow().windowSize()[1];
      m_renderer = m_this.viewer().renderWindow().activeRenderer();
      if(m_mouseLastPos.x >= 0 && m_mouseLastPos.x <= width &&
        m_mouseLastPos.y >= 0 && m_mouseLastPos.y <= height) {
        num = m_picker.pick(m_mouseLastPos.x, m_mouseLastPos.y, m_renderer);
      }
    }
    if (event.button === 1) {
      m_middileMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
      m_initRightBtnMouseDown = false;

      /// Now zoom
      m_this.zoom();
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle event when mouse goes out of canvas
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseOut = function(event) {
    if (m_leftMouseButtonDown) {
      m_leftMouseButtonDown = false;
    } else if (m_middileMouseButtonDown) {
      m_middileMouseButtonDown = false;
    } if (m_rightMouseButtonDown) {
      m_rightMouseButtonDown = false;
      m_initRightBtnMouseDown = false;

      /// Perform zoom when the mouse goes out of canvas as we
      /// are treating mouse out as right button up.
      m_this.zoom();
    }
    return false;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse wheel event
   *
   * @param event
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseWheel = function(event) {
    var delta = event.originalEvent.wheelDelta / 120.0;
    console.log('delta is ', delta);
    m_renderer = m_this.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();

    delta = Math.pow(1 + Math.abs(delta)/2 , delta > 0 ? 1 : -1);
    console.log('delta now is ', delta);
    m_this.zoom(delta);
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update view in response to a zoom request
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function(val) {
    var oldMercPerPixel, newMercPerPixel, evt;

    m_zTrans = (m_currentMousePos.y - m_mouseLastPos.y) / m_height;

    /// Compute meters per pixel here and based on that decide the
    /// zoom level
    m_worldPt1 = m_renderWindow.displayToWorld(0, 0, m_focusDisplayPoint);
    m_worldPt2 = m_renderWindow.displayToWorld(m_width, m_height,
                                               m_focusDisplayPoint);

    /// Computer mercator per pixel before changing the camera position
    oldMercPerPixel = (m_worldPt2[0] - m_worldPt1[0]) / m_width;

    /// Calculate zoom scale here
    if (val === undefined) {
      if (m_zTrans > 0) {
        m_camera.zoom(1 - Math.abs(m_zTrans));
      } else {
        m_camera.zoom(1 + Math.abs(m_zTrans));
      }
    } else {
      m_camera.zoom(val);
    }
    m_renderer.resetCameraClippingRange();

    m_worldPt1 = m_renderWindow.displayToWorld(0, 0, m_focusDisplayPoint);
    m_worldPt2 = m_renderWindow.displayToWorld(m_width, m_height,
                   m_focusDisplayPoint);

    /// Computer mercator per pixel as of now
    newMercPerPixel = (m_worldPt2[0] - m_worldPt1[0]) / m_width;

    /// Compute meters per pixel here and based on that decide the
    /// zoom level
    evt = { type: geo.event.zoom,
            curr_zoom: computeZoomLevel(newMercPerPixel),
            last_zoom: computeZoomLevel(oldMercPerPixel) };
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
  this.lastMousePosition = function(newPosition) {
    if(typeof newPosition !== 'undefined') {
      m_mouseLastPos = newPosition;
      return m_this;
    }
    return m_mouseLastPos;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets leftMouseDown for this interactor
   *
   * @param {Boolean} newValue optional
   * @returns {geo.mapInteractorStyle|Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.leftMouseDown = function(newValue) {
    if(typeof newValue !== 'undefined') {
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
  this.setDrawRegion = function(lat1, lon1, lat2, lon2) {
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
  this.getDrawRegion = function() {
    return m_drawRegionLayer.features()[0].getCoords();
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
  function computeZoomLevel(deltaMerc) {
    var i, metersPerPixel, metersPerPixelFull = 156412;
    metersPerPixel = geo.mercator.deg2rad(Math.abs(deltaMerc)) *
                     geo.mercator.r_major;
    for (i = 4; i < 20; ++i) {
      if (metersPerPixel > (metersPerPixelFull / Math.pow(2, i))) {
        return (i - 1);
      }
    }
  };


  return this;
};

inherit(ggl.mapInteractorStyle, vgl.interactorStyle);