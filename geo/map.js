/*========================================================================
  VGL --- VTK WebGL Rendering Toolkit

  Copyright 2013 Kitware, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ========================================================================*/

///////////////////////////////////////////////////////////////////////////////
/**
 * A latlng is a point in geographical coordinates: latitude and longitude
 *
 */
geoModule.latlng = function(lat, lng) {

  if (!(this instanceof geoModule.latlng)) {
    return new geoModule.latlng(lat, lng);
  }

  // / Member variables
  var m_lat = lat;
  var m_lng = lng;

  // / Member methods
  this.lat = function() {
    return m_lat;
  };

  this.lng = function() {
    return m_lng;
  };

  return this;
};

/**
 * Map options object specification
 *
 */
geoModule.mapOptions = function() {
  if (!(this instanceof geoModule.mapOptions)) {
    return new geoModule.mapOptions();
  }

  // / Member variables
  this.zoom = 10;
  this.center = geoModule.latlng(0.0, 0.0);
};

/**
 * Creates a new map inside of the given HTML container (Typically DIV)
 *
 */
geoModule.map = function(node, options) {

  if (!(this instanceof geoModule.map)) {
    return new geoModule.map(node, options);
  }

  // / Member variables
  var m_that = this;
  var m_node = node;
  var m_leftMouseButtonDown = false;
  var m_rightMouseButtonDown = false;
  var m_initialized = false;
  var m_mouseLastPos = {
    x : 0,
    y : 0
  };

  initWebGL(node);

  var m_options = options;

  if (!options.center) {
    m_options.center = geoModule.latlng(0.0, 0.0);
  }
  if (options.zoom === undefined) {
    m_options.zoom = 10;
  }

  // TODO For now using the JQuery
  $(this).on('CameraEvent', draw);

  var m_renderer = new ogs.vgl.renderer();
  var m_camera = m_renderer.camera();

  /**
   * Initialize the scene
   *
   */
  function initScene() {
    // TODO We got to get the orhto projection working
    var distance = 600;
    distance = 600 - (600 - (60 * m_options.zoom)) + 1;

    m_camera.setPosition(m_options.center.lng(), m_options.center.lat(),
    distance);
    m_camera.setFocalPoint(m_options.center.lng(), m_options.center.lat(), 0.0);

    m_initialized = true;
  }

  /**
   * Initialize the scene (if not initialized) and then render the map
   *
   * @param event
   */
  function draw(event) {
    if (m_initialized === false) {
      initScene();
    }
    m_renderer.render();
  }

  /**
   * Handle mouse events
   *
   * @param event
   */
  function relMouseCoords(event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do {
      totalOffsetX += currentElement.offsetLeft;
      totalOffsetY += currentElement.offsetTop;
    } while (currentElement === currentElement.offsetParent);

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
      x : canvasX,
      y : canvasY
    };
  }

  /**
   * Handle mouse event
   *
   */
  function handleMouseMove(event) {
    var canvas = m_node;

    var height = $(canvas).height();
    var width = $(canvas).width();

    var outsideCanvas = false;
    var coords = canvas.relMouseCoords(event);

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

      var focalPoint = m_camera.focalPoint();
      var focusWorldPt = vec4.createFrom(focalPoint[0], focalPoint[1],
      focalPoint[2], 1);

      var focusDisplayPt = ogs.vgl.renderer.worldToDisplay(focusWorldPt,
      m_camera.viewMatrix(), m_camera.projectionMatrix(), 1680, 1050);

      var displayPt1 = vec4.createFrom(currentMousePos.x, currentMousePos.y,
      focusDisplayPt[2], 1.0);
      var displayPt2 = vec4.createFrom(m_mouseLastPos.x, m_mouseLastPos.y,
      focusDisplayPt[2], 1.0);

      var worldPt1 = ogs.vgl.renderer.displayToWorld(displayPt1, m_camera
      .viewMatrix(), m_camera.projectionMatrix(), 1680, 1050);
      var worldPt2 = ogs.vgl.renderer.displayToWorld(displayPt2, m_camera
      .viewMatrix(), m_camera.projectionMatrix(), 1680, 1050);

      dx = worldPt1[0] - worldPt2[0];
      dy = worldPt1[1] - worldPt2[1];

      // Move the scene in the direction of movement of mouse;
      m_camera.pan(-dx, -dy);
      $(m_that).trigger('CameraEvent');
    }

    if (m_rightMouseButtonDown) {
      zTrans = currentMousePos.y - m_mouseLastPos.y;
      m_camera.zoom(zTrans * 0.5);
      $(m_that).trigger('CameraEvent');
    }

    m_mouseLastPos.x = currentMousePos.x;
    m_mouseLastPos.y = currentMousePos.y;
  }

  /**
   *
   */
  function handleMouseDown(event) {
    var canvas = m_node;

    if (event.button === 0) {
      m_leftMouseButtonDown = true;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = true;
    }
    if (event.button === 4) {
      // middileMouseButtonDown = true;
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
  }

  /**
   * Handle mouse up event
   *
   */
  function handleMouseUp(event) {
    if (event.button === 0) {
      m_leftMouseButtonDown = false;
    }
    if (event.button === 2) {
      m_rightMouseButtonDown = false;
    }
    if (event.button === 4) {
      // middileMouseButtonDown = false;
    }

    return false;
  }

  // TODO use zoom and center options

  var m_baseLayer = (function() {
    var mapActor = ogs.vgl.utils.createTexturePlane(-180.0, -90.0, 0.0, 180.0,
    -90.0, 0.0, -180.0, 90.0, 0.0);

    // Setup texture
    worldImage = new Image();

    var worldTexture = new vglModule.texture();
    worldTexture.setImage(worldImage);

    // TODO Currently hard-coded
    worldImage.src = "./data/land_shallow_topo_2048.png";
    mapActor.material().addAttribute(worldTexture);

    m_renderer.addActor(mapActor);

    document.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.oncontextmenu = function() {
      return false;
    };
    HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

    draw();

    return mapActor;
  })();

  /**
   * Add layer to the map
   *
   * @method addLayer
   * @param {geo.layer}
   *          layer to be added to the map
   * @return {Boolean}
   */
  this.addLayer = function(layer) {

    if (layer != null) {
      // TODO Check if the layer already exists
      // TODO Set the rendering order correctly
      m_renderer.addActor(layer.actor());
      m_renderer.render();

      return true;
    }

    return false;
  };

  /**
   * Remove layer from the map
   *
   * @method removeLayer
   * @param {geo.layer}
   *          layer that should be removed from the map
   * @return {Boolean}
   */
  this.removeLayer = function(layer) {
    if (!layer) {
      m_renderer.removeActor(layer);

      return true;
    }

    return false;
  };

  return this;
};
