//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
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
geo.mapInteractorStyle = function() {
  "use strict";
  if (!(this instanceof geo.mapInteractorStyle)) {
    return new geo.mapInteractorStyle();
  }
  vgl.interactorStyle.call(this);
  var m_that = this,
      m_map,
      m_leftMouseButtonDown = false,
      m_rightMouseButtonDown = false,
      m_middileMouseButtonDown = false,
      m_drawRegionMode = false,
      m_drawRegionLayer,
      m_clickLatLng,
      m_width,
      m_height,
      m_renderer,
      m_renderWindow,
      m_camera,
      m_outsideCanvas,
      m_coords,
      m_currentMousePos,
      m_focusDisplayPoint,
      m_worldPt1,
      m_worldPt2,
      m_dx,
      m_dy,
      m_dz,
      m_zTrans,
      m_mouseLastPos = {
        x: 0,
        y: 0
      },
      m_picker = new vgl.picker();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets map for this interactor, adds draw region layer if needed
   *
   * @param {geo.map} newMap optional
   * @returns {geo.mapInteractorStyle|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function(newMap) {
    if(typeof newMap !== 'undefined') {
      m_map = newMap;
      return m_that;
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
    if(typeof newValue !== 'undefined') {
      m_drawRegionMode = newValue;
      if(m_drawRegionLayer) {
        m_drawRegionLayer.setVisible(newValue);
      }
      m_map.updateAndDraw();
      return m_that;
    }
    return m_drawRegionMode;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function(event) {
    var canvas = m_that.viewer().canvas(),
        xrot = null,
        a = null,
        angle = null,
        mouseWorldPoint,
        features;

    if (event.target !== canvas) {
      return true;
    }
    m_outsideCanvas = false;
    m_coords = canvas.relMouseCoords(event);
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
        m_that.setDrawRegion(m_clickLatLng.lat(), m_clickLatLng.lng(),
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

        m_camera.pan(-m_dx, -m_dy, -m_dz);
        $(m_that).trigger(geo.command.updateViewPositionEvent);
        $(m_that).trigger(vgl.command.leftButtonPressEvent);
      }
    }
    if (m_middileMouseButtonDown) {
      //Limit Rotation to only X, and between 0 to 60
      xrot = (m_mouseLastPos.y - m_currentMousePos.y);
      a = m_camera.viewUpDirection();
      angle = Math.atan2(a[2],a[1])*180/Math.PI;
      if (xrot > 0 && angle < 60) {
        m_camera.rotate(0, xrot);
      } else if (xrot < 0 && angle > 0) {
        m_camera.rotate(0, xrot);
      }
      $(m_that).trigger(vgl.command.middleButtonPressEvent);
    }
    if (m_rightMouseButtonDown) {
      m_zTrans = (m_currentMousePos.y - m_mouseLastPos.y) / m_height;

      // Calculate zoom scale here
      if (m_zTrans > 0) {
        m_camera.zoom(1 - Math.abs(m_zTrans));
      } else {
        m_camera.zoom(1 + Math.abs(m_zTrans));
      }

      $(m_that).trigger(geo.command.updateViewZoomEvent);
      $(m_that).trigger(vgl.command.rightButtonPressEvent);
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
    var canvas = m_that.viewer().canvas(),
      point,
      plane;
    if (event.target !== canvas) {
      return true;
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
    m_renderWindow = m_that.viewer().renderWindow();
    m_width = m_renderWindow.windowSize()[0];
    m_height = m_renderWindow.windowSize()[1];
    m_renderer = m_that.viewer().renderWindow().activeRenderer();
    m_camera = m_renderer.camera();

    if(m_drawRegionMode && m_leftMouseButtonDown) {
      point = m_map.displayToMap(m_mouseLastPos.x, m_mouseLastPos.y);
      m_clickLatLng = geo.latlng(point.y, point.x);
      m_that.setDrawRegion(point.y, point.x, point.y, point.x);
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
    var canvas = m_that.viewer().canvas(),
        width = null,
        height = null,
        renderer = null,
        num = null;

    if (event.target !== canvas) {
      return true;
    }
    if (event.button === 0) {
      m_leftMouseButtonDown = false;
      width = m_that.viewer().renderWindow().windowSize()[0];
      height = m_that.viewer().renderWindow().windowSize()[1];
      renderer = m_that.viewer().renderWindow().activeRenderer();
      if(m_mouseLastPos.x >= 0 && m_mouseLastPos.x <= width &&
        m_mouseLastPos.y >= 0 && m_mouseLastPos.y <= height) {
        num = m_picker.pick(m_mouseLastPos.x, m_mouseLastPos.y, renderer);
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update view in response to a zoom request
   */
  ////////////////////////////////////////////////////////////////////////////
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
      return m_that;
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
      return m_that;
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
    var plane = geo.planeFeature(
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

    $(m_that).trigger(geo.command.updateDrawRegionEvent);

    return m_that;
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

  return this;
};

inherit(geo.mapInteractorStyle, vgl.interactorStyle);

/* Local Variables:   */
/* mode: js           */
/* js-indent-level: 2 */
/* End:               */
