/////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2, continue: true*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document, vec2, vec3, vec4, proj4*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Map options object specification
 */
//////////////////////////////////////////////////////////////////////////////
geo.mapOptions = {
  zoom: 0,
  center: geo.latlng(0.0, 0.0),
  gcs: 'EPSG:3857',
  display_gcs: 'EPSG:4326',
  country_boundaries: true,
  state_boundaries: false
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class map
 *
 * @class Creates a new map inside of the given HTML container (Typically DIV)
 * @returns {geo.map}
 */
//////////////////////////////////////////////////////////////////////////////
geo.map = function(node, options) {
  "use strict";
  if (!(this instanceof geo.map)) {
    return new geo.map(node, options);
  }
  vgl.object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private member variables
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_that = this,
      m_node = node,
      m_initialized = false,
      m_options = options,
      m_layers = {},
      m_activeLayer = null,
      m_mapLayer = null,
      m_featureCollection = geo.featureCollection(),
      m_renderTime = vgl.timestamp(),
      m_lastPrepareToRenderingTime = vgl.timestamp(),
      m_interactorStyle = null,
      m_viewer = null,
      m_renderer = null,
      m_updateRequest = null,
      m_prepareForRenderRequest = null,
      // Holds the time range, current time and layers ...
      m_animationState = { range: null, currentTime: null, layers: null},
      m_animationStep = null;

  m_renderTime.modified();

  if (!options.gcs) {
    m_options.gcs = 'EPSG:3857';
  }

  if (!options.display_gcs) {
    m_options.display_gcs = 'EPSG:4326';
  }

  if (!options.center) {
    m_options.center = geo.latlng(0.0, 0.0);
  }

  if (options.zoom === undefined) {
    m_options.zoom = 10;
  }

  // Initialize
  m_interactorStyle = geo.mapInteractorStyle();
  m_viewer = vgl.viewer(m_node);
  m_viewer.setInteractorStyle(m_interactorStyle);
  m_viewer.init();
  m_viewer.renderWindow().resize($(m_node).width(), $(m_node).height());
  m_renderer = m_viewer.renderWindow().activeRenderer();

  m_prepareForRenderRequest =
    geo.prepareForRenderRequest(m_options, m_viewer, m_featureCollection);
  m_updateRequest = geo.updateRequest(null, m_options, m_viewer, m_node);

  $(m_prepareForRenderRequest).on(geo.command.requestRedrawEvent,
    function(event) {
      m_that.draw();
  });
  $(m_updateRequest).on(geo.command.requestRedrawEvent,
    function(event) {
      m_that.draw();
  });

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update view based on the zoom
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function updateViewZoom(useCurrent) {
    m_interactorStyle.zoom(m_options, useCurrent);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute zoom level based on the camera distance and then perform update
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function computeZoom() {
    var camera = m_renderer.camera(), newLevel;

//    console.log('camera position is', camera.position()[2]);

    if (camera.position()[2] < 0.0625) {
      newLevel = 15;
    }
    else if (camera.position()[2] < 0.125) {
      newLevel = 14;
    }
    else if (camera.position()[2] < 0.25) {
      newLevel = 13;
    }
    else if (camera.position()[2] < 0.5) {
      newLevel = 12;
    }
    else if (camera.position()[2] < 1) {
      newLevel = 11;
    }
    else if (camera.position()[2] < 2) {
      newLevel = 10;
    }
    else if (camera.position()[2] < 4) {
      newLevel = 9;
    }
    else if (camera.position()[2] < 8) {
      newLevel = 8;
    }
    else if (camera.position()[2] < 16) {
      newLevel = 7;
    }
    else if (camera.position()[2] < 32) {
      newLevel = 6;
    }
    else if (camera.position()[2] < 64) {
      newLevel = 5;
    }
    else if (camera.position()[2] < 128) {
      newLevel = 4;
    }
    else if (camera.position()[2] < Number.MAX_VALUE) {
      newLevel = 3;
    }
    m_that.setZoom(newLevel);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update view extents
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function updateViewExtents() {
    m_that.update(m_updateRequest);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize the scene
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function initScene() {
    updateViewZoom();
    m_initialized = true;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize the scene (if not initialized) and then render the map
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function renderScene() {
    if (m_initialized === false) {
      initScene();
    }
    m_viewer.render();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset the animation time
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function resetAnimation() {
    m_animationState.currentTime = new Date(m_animationState.range.start.getTime());
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update the map and then request redraw
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function animateTimestep() {

    if (!m_animationState) {
      return;
    }

    var i, layers = m_animationState.layers;
    for (i = 0; i < layers.length; ++i) {
      layers[i].update(geo.updateRequest(
          m_animationState.currentTime.getTime()));
      geo.geoTransform.transformLayer(m_options.gcs, layers[i]);
    }
    $(m_that).trigger({
      type: geo.command.animateEvent,
      currentTime: m_animationState.currentTime,
      endTime: m_animationState.range.end
    });
    m_that.draw();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update legends for layers
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function updateLegends(width, height) {
    var noOfLayers = 0,
        heightPerLayer =  0,
        i = 1.5,
        layerName,
        layer = null;

    // First find out how many layers has legend
    for (layerName in m_layers) {
      layer = m_layers[layerName];
      if (layer.hasLegend()) {
        ++noOfLayers;
      }
    }

    if (noOfLayers > 0) {
      heightPerLayer = 100 > (height / noOfLayers) ?
                         (height / noOfLayers) : 100;
    } else {
      return;
    }

    for (layerName in m_layers) {
      if (m_layers.hasOwnProperty(layerName)) {
        layer = m_layers[layerName];
        if (!layer.hasLegend()) {
          continue;
        }

        layer.setLegendOrigin(
          [width - width * 0.25,
          height - i * heightPerLayer,
          0.0]);
        layer.setLegendWidth(width * 0.20);
        layer.setLegendHeight(heightPerLayer * 0.20);
        layer.updateLegend(true);
        ++i;
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Animate layers of a map
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function animateInternal() {
    var timeRange = m_animationState.range,
        newTime = new Date(timeRange.start.getTime()),
        endTime = timeRange.end,
        intervalId = null,
        stop = false,
        pause = false;

    geo.time.incrementTime(newTime, timeRange.units, timeRange.delta);
    if (newTime > timeRange.end) {
      console.log('[error] Invalid time range. Requires atleast \
        begin and end time');
      return;
    }

    $(m_that).on('animation-stop', function () {
      stop = true;
    });

    $(m_that).on('animation-pause', function () {
      pause = true;
    });

    function frame() {
      if (m_animationState.currentTime > endTime || stop) {
        clearInterval(intervalId);
        m_animationState.currentTime = null;
      }
      else if (pause) {
        clearInterval(intervalId);
      }
      else {
        animateTimestep();
        geo.time.incrementTime(m_animationState.currentTime,
          m_animationState.range.units, m_animationState.range.delta);
      }
    }

    // Update every 2 ms. Updating every ms might be too much.
    intervalId = setInterval(frame, 2);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Play next animation step and then pause
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function stepAnimationForwardInternal() {
    if (!m_animationState.currentTime) {
      resetAnimation();
    }

    var time = new Date(m_animationState.currentTime.getTime());
    geo.time.incrementTime(time, m_animationState.range.units,
        m_animationState.range.delta);

    if (time > m_animationState.range.end) {
      return;
    }

    m_animationState.currentTime = time;
    animateTimestep();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Play previous animation step and then pause
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function stepAnimationBackwardInternal() {

    if (!m_animationState) {
      return;
    }

    var time = new Date(m_animationState.currentTime.getTime());
    geo.time.incrementTime(time, m_animationState.range.units,
        -m_animationState.range.delta);

    if (time < m_animationState.range.start) {
      return;
    }

    m_animationState.currentTime = time;

    animateTimestep();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get map options
   */
  ////////////////////////////////////////////////////////////////////////////
  this.options = function() {
    return m_options;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the zoom level of the map
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function() {
    return m_options.zoom;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set zoom level of the map
   *
   * @param val [0-17]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setZoom = function(val) {
    if (val !== m_options.zoom) {
      m_options.zoom = val;
      $(this).trigger(geo.command.updateViewZoomEvent);
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add layer to the map
   *
   * @method addLayer
   * @param {geo.layer} layer to be added to the map
   * @return {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addLayer = function(layer) {
    if (layer !== null) {
      // TODO Check if the layer already exists
      if (!layer.binNumber() || layer.binNumber() === -1) {
        layer.setBinNumber(Object.keys(m_layers).length);
      }

      // Transform layer
      geo.geoTransform.transformLayer(m_options.gcs, layer);
      m_layers[layer.id()] = layer;

      updateLegends($(m_node).width(), $(m_node).height());
      this.modified();

      layer.container(this);

      $(layer).on(geo.command.queryResultEvent, function(event, queryResult) {
        $(m_that).trigger(event, queryResult);
        return true;
      });

      $(this).trigger({
        type: geo.command.addLayerEvent,
        layer: layer
      });

      return true;
    }
    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove layer from the map
   *
   * @method removeLayer
   * @param {geo.layer} layer that should be removed from the map
   * @return {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeLayer = function(layer) {
    if (layer !== null && typeof layer !== 'undefined') {
      delete m_layers[layer.id()];
      layer.destroy();
      m_renderer.removeActors(layer.features());
      updateLegends($(m_node).width(), $(m_node).height());
      this.modified();

      $(this).trigger({
        type: geo.command.removeLayerEvent,
        layer: layer
      });
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Toggle visibility of a layer
   *
   *  @method toggleLayer
   *  @param {geo.layer} layer
   *  @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.toggleLayer = function(layer) {
    if (layer !== null && typeof layer !== 'undefined') {
      layer.setVisible(!layer.visible());
      this.modified();
      $(this).trigger({
        type: geo.command.toggleLayerEvent,
        layer: layer
      });
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return current or active layer
   *
   * @returns {geo.layer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.activeLayer = function() {
    return m_activeLayer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Make a layer current or active for operations
   *
   * @method selectLayer
   * @param {geo.layer} layer
   * @returns {Boolean}
   *
   */
  ////////////////////////////////////////////////////////////////////////////
  this.selectLayer = function(layer) {
    if (typeof layer !== 'undefined' && m_activeLayer !== layer) {
      m_activeLayer = layer;
      this.modified();
      if (layer !== null) {
        $(this).trigger({
          type: geo.command.selectLayerEvent,
          layer: layer
        });
      } else {
        $(this).trigger({
          type: geo.command.unselectLayerEvent,
          layer: layer
        });
      }
      return true;
    }

    return false;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Find layer by layer id
   *
   * @method findLayerById
   * @param {String} layerId
   * @returns {geo.layer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.findLayerById = function(layerId) {
    if (m_layers.hasOwnProperty(layerId)) {
      return m_layers[layerId];
    }
    return null;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize map
   *
   * @param {Number} width
   * @param {Number} height
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function(width, height) {
    m_viewer.renderWindow().resize(width, height);

    updateLegends($(m_node).width(), $(m_node).height());
    this.updateAndDraw();

    $(this).trigger({
      type: geo.command.resizeEvent,
      width: width,
      height: height
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Toggle country boundaries
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.toggleCountryBoundaries = function() {
    var layer = null,
        reader = null,
        geoms = null,
        result = false;

    layer = this.findLayerById('country-boundaries');
    if (layer !== null) {
      layer.setVisible(!layer.visible());
      result = layer.visible();
    } else {
      // Load countries data first
      reader = vgl.geojsonReader();
      geoms = reader.readGJObject(geo.countries);
      // @todo if opacity is on layer, solid color should be too
      layer = geo.featureLayer({
        "opacity": 1,
        "showAttribution": 1,
        "visible": 1
      }, geo.compositeGeometryFeature(geoms, [1.0,0.5, 0.0]));

      layer.setName('country-boundaries');
      this.addLayer(layer);
      result = layer.visible();
    }

    return result;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Toggle us state boundaries
   *
   * @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.toggleStateBoundaries = function() {
    // @todo Implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layers
   */
  ////////////////////////////////////////////////////////////////////////////
  this.update = function() {
    computeZoom();

    // For now update all layers. In the future, we should be
    // able to perform updates based on the layer type
    var layerName = null;
    for (layerName in m_layers) {
      if (m_layers.hasOwnProperty(layerName)) {
        m_layers[layerName].update(m_updateRequest);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Prepare map for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.predraw = function() {
    var i = 0,
        layerName = 0;

    for (layerName in m_layers) {
      if (m_layers.hasOwnProperty(layerName)) {
        m_layers[layerName].predraw(m_prepareForRenderRequest);
      }
    }

    if (m_featureCollection.getMTime() >
        m_lastPrepareToRenderingTime.getMTime()) {

      // Remove expired features from the renderer
      for (layerName in m_layers) {
        m_renderer.removeActors(
          m_featureCollection.expiredFeatures(layerName));

        // Add new actors (Will do sorting by bin and then material later)
        m_renderer.addActors(
          m_featureCollection.newFeatures(layerName));
      }

      m_featureCollection.resetAll();
      m_lastPrepareToRenderingTime.modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Manually force to render map
   */
  ////////////////////////////////////////////////////////////////////////////
  this.draw = function() {
    m_that.predraw();
    renderScene();
    m_that.postdraw();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Prepare map for rendering
   */
  ////////////////////////////////////////////////////////////////////////////
  this.postdraw = function() {
    // TODO Implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update the map and then request a draw
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateAndDraw = function() {
    m_that.update();
    m_that.draw();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return current animation timestep
   *
   * @returns {number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.animationStep = function() {
    return m_animationStep;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Animate data give a time range
   *
   * @param selectedLayers
   * @param onRange
   */
  ////////////////////////////////////////////////////////////////////////////
  this.animateTimeRange = function(selectedLayers, onRange) {
    var delta = -1, stdDelta = -1, units = null,
        start = null, stdStart = null, end = null, stdEnd = null,
        rangesToProcess = selectedLayers.length,
        processTimeInfo = function(timeInfo) {
          var startDate;

          if (delta === -1 || timeInfo.stdDelta < stdDelta) {
            stdDelta = timeInfo.stdDelta;
            delta = timeInfo.nativeDelta;
            units = timeInfo.nativeUnits;
          }

          if (!start || timeInfo.stdTimeRange[0] < stdStart) {
            stdStart = timeInfo.stdTimeRange[0];
            start = timeInfo.dateRange[0];
          }

          if (!end || timeInfo.stdTimeRange[1] > stdEnd) {
            stdEnd = timeInfo.stdTimeRange[1];
            startDate = timeInfo.dateRange[0];
            end = new Date(Date.UTC(startDate[0], startDate[1]-1, startDate[2]));
            geo.time.incrementTime(end, timeInfo.nativeUnits,
                timeInfo.nativeDelta * timeInfo.numSteps);
          }

          --rangesToProcess;

          // Are we done processing? If so pass the information to the map
          // for animation.
          if (rangesToProcess === 0) {
            if (delta === -1 || units === null || end === null ||
                start === null ) {
              console.log('Unable to calculate time range.');
              return;
            }
            startDate = new Date(Date.UTC(start[0], start[1]-1, start[2]));
            onRange({start: startDate, end: end, delta: delta, units: units});
          }
        };

    // Iterate through the selected layers and calculate the range we are going
    // to animate over.
    $.each(selectedLayers, function(i, layer){
      // TODO this data should be part of the layer
      var dataset = $('#'+layer.id()).data('dataset');

      // Do we already have the range?
      if (dataset.timeInfo) {
        processTimeInfo(dataset.timeInfo);
      }
      else {
        console.log("Data does not have timeInfo");
      }
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Animate layers of a map
   */
  ////////////////////////////////////////////////////////////////////////////
  this.animate = function(layerIds) {
    // Save the animation state
    if (!m_animationState.currentTime) {

      var layers = [];

      // Looks layers
      $.each(layerIds, function(i, id) {
        var layer = m_that.findLayerById(id);
        layers.push(layer);
      });

      m_that.animateTimeRange(layers, function(timeRange) {
          m_animationState = {
            range: timeRange, currentTime: new Date(timeRange.start.getTime()),
            layers: layers
          };
          animateInternal();
      });
    }
    else {
      animateInternal();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Pause animation
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pauseAnimation = function() {
    $(this).trigger('animation-pause');
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Stop animation
   */
  ////////////////////////////////////////////////////////////////////////////
  this.stopAnimation = function(cleanState) {
    $(this).trigger('animation-stop');

    if (cleanState) {
      m_animationState = { range: null, currentTime: null, layers: null};
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Play next animation step and then pause
   */
  ////////////////////////////////////////////////////////////////////////////
  this.stepAnimationForward = function(layerIds) {
    if (!m_animationState.currentTime) {

      var layers = [];
      // Looks layers
      $.each(layerIds, function(i, id) {
        var layer = m_that.findLayerById(id);
        layers.push(layer);
      });


      m_that.animateTimeRange(layers, function(timeRange) {
          m_animationState = {
            range: timeRange, currentTime: new Date(timeRange.start.getTime()),
            layers: layers
          };
          stepAnimationForwardInternal();
      });
    }
    else {
      stepAnimationForwardInternal();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Play previous animation step and then pause
   */
  ////////////////////////////////////////////////////////////////////////////
  this.stepAnimationBackward = function(layerIds) {
    if (!m_animationState.currentTime) {

      var layers = [];
      // Looks layers
      $.each(layerIds, function(i, id) {
        var layer = m_that.findLayerById(id);
        layers.push(layer);
      });

      m_that.animateTimeRange(layers, function(timeRange) {
          m_animationState = {
            range: timeRange, currentTime: new Date(timeRange.start.getTime()),
            layers: layers
          };
          stepAnimationBackwardInternal();
      });
    }
    else {
      stepAnimationBackwardInternal();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert display coordinates to map coordinates
   *
   * @returns {'x': number, 'y': number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToMap = function(winX, winY) {
    var camera = m_renderer.camera(),
        width = m_renderer.width(),
        height = m_renderer.height(),
        fpoint = camera.focalPoint(),
        focusWorldPt = vec4.fromValues(fpoint[0], fpoint[1], fpoint[2], 1.0),
        focusDisplayPt = m_renderer.worldToDisplay(focusWorldPt, camera.viewMatrix(),
                                                    camera.projectionMatrix(),
                                                    width, height),
        displayPt = vec4.fromValues(winX, winY, focusDisplayPt[2], 1.0),
        worldPt = m_renderer.displayToWorld(displayPt,
                                            camera.viewMatrix(),
                                            camera.projectionMatrix(),
                                            width, height),
        // NOTE: the map is using (nearly) normalized web-mercator.
        // The constants below bring it to actual EPSG:3857 units.
        latlon = geo.mercator.m2ll(
          geo.mercator.deg2rad(worldPt[0]) * geo.mercator.r_major,
          geo.mercator.deg2rad(worldPt[1]) * geo.mercator.r_minor(true), true),
        location = {'x': latlon.lon, 'y': latlon.lat};

    return location;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Queries each layer for information at this location.
   *
   * @param location
   */
  ////////////////////////////////////////////////////////////////////////////
  this.queryLocation = function(location) {
    var layer = null,
        srcPrj = new proj4.Proj(m_options.display_gcs),
        event = location.event, layerName, dstPrj, point;

    for (layerName in m_layers) {
      layer = m_layers[layerName];
      dstPrj = new proj4.Proj(layer.gcs());
      point = new proj4.Point(location.x, location.y);
      proj4.transform(srcPrj, dstPrj, point);
      point.event = event;
      layer.queryLocation(point);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets the viewer for this map
   *
   * @param newViewer {vgl.viewer}
   * @returns {geo.map|vgl.viewer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.viewer = function(newViewer) {
    if(typeof newViewer !== 'undefined') {
      m_viewer = newViewer;
      return this;
    }
    return m_viewer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets mapLayer for this map
   *
   * @param {geo.layer} newMapLayer optional
   * @returns {geo.map|geo.layer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mapLayer = function(newMapLayer) {
    if(typeof newMapLayer !== 'undefined') {

      // The GCS of the layer must match the map
      if (this.gcs() === newMapLayer.gcs()) {
        throw "The layer has a GCS of '" + newMapLayer.gcs() +
              "' which does match the map GCS of '" +
              this.gcs() + "'";
      }

      m_mapLayer = newMapLayer;

      // Set the layer as the reference layer
      m_mapLayer.referenceLayer(true);

      return this;
    }
    return m_mapLayer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets the interactorStyle for this map
   *
   * @returns {vgl.interactorStyle]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getInteractorStyle = function() {
    return m_interactorStyle;
  };

  this.worldToDisplayGcs = function(x, y) {
    var gcsPoint,
        source,
        dest,
        transformedPoint;

    gcsPoint = m_mapLayer.worldToGcs(x, y);
    source = new proj4.Proj(this.options().gcs);
    dest = new proj4.Proj(this.options().display_gcs);
    transformedPoint = new proj4.Point(gcsPoint[0], gcsPoint[1]);

    proj4.transform(source, dest, transformedPoint);

    return [transformedPoint.x, transformedPoint.y];
  };

  // Bind events to handlers
  $(document).on("mousedown", m_viewer.handleMouseDown);
  $(document).on("mouseup", m_viewer.handleMouseUp);
  $(document).on("mousemove", m_viewer.handleMouseMove);
  document.oncontextmenu = m_viewer.handleContextMenu;
  HTMLCanvasElement.prototype.relMouseCoords = m_viewer.relMouseCoords;

  // Create map layer
  m_mapLayer = geo.openStreetMapLayer();
  m_mapLayer.referenceLayer(true);
  m_mapLayer.update(m_updateRequest);
  m_mapLayer.predraw(m_prepareForRenderRequest);
  this.addLayer(m_mapLayer);

  // Check if need to show country boundaries
  if (m_options.country_boundaries === true) {
    this.toggleCountryBoundaries();
  }

  $(m_interactorStyle).on(
    geo.command.updateViewZoomEvent, this.updateAndDraw);
  $(m_interactorStyle).on(
    geo.command.updateViewPositionEvent, this.updateAndDraw);
  $(m_interactorStyle).on(
    geo.command.updateDrawRegionEvent, this.updateAndDraw);

  $(this).on(geo.command.updateEvent, this.updateAndDraw);

  m_interactorStyle.map(this);

  return this;
};

inherit(geo.map, vgl.object);
