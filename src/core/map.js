/////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2, continue: true*/

/*global vgl, geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global document, vec2, vec3, vec4, proj4*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class map
 *
 * @class Creates a new map inside of the given HTML container (Typically DIV)
 * @returns {geo.map}
 */
//////////////////////////////////////////////////////////////////////////////
geo.map = function(arg) {
  "use strict";
  if (!(this instanceof geo.map)) {
    return new geo.map(arg);
  }
  arg = arg || {};
  geo.object.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private member variables
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_x = 0,
      m_y = 0,
      m_width = 0,
      m_height = 0,
      m_node = $('#' + arg.node),
      m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs,
      m_uigcs = arg.uigcs === undefined ? "EPSG:4326" : arg.uigcs,
      m_center = arg.center === undefined ? [0.0, 0.0] :
                 arg.center,
      m_zoom = arg.zoom === undefined ? 10 : arg.zoom,
      m_layers = arg.layers === undefined ? [] : arg.layers,
      m_baseLayer = null,
      m_updateTime = vgl.timestamp(),
      m_drawTime = vgl.timestamp(),
      m_animationState = { range: null, currentTime: null, layers: null},
      m_animationStep = null;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Reset the animation time
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function resetAnimation() {
    // m_animationState.currentTime =
    //   new Date(m_animationState.range.start.getTime());
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update the map and then request redraw
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function animateTimestep() {
    // if (!m_animationState) {
    //   return;
    // }

    // var i, layers = m_animationState.layers;
    // for (i = 0; i < layers.length; ++i) {
    //   layers[i].update(geo.updateRequest(
    //       m_animationState.currentTime.getTime()));
    //   geo.geoTransform.transformLayer(m_options.gcs, layers[i]);
    // }
    // $(m_this).trigger({
    //   type: geo.command.animateEvent,
    //   currentTime: m_animationState.currentTime,
    //   endTime: m_animationState.range.end
    // });
    // m_this.draw();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Animate layers of a map
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function animateInternal() {
    // var timeRange = m_animationState.range,
    //     newTime = new Date(timeRange.start.getTime()),
    //     endTime = timeRange.end,
    //     intervalId = null,
    //     stop = false,
    //     pause = false;

    // geo.time.incrementTime(newTime, timeRange.units, timeRange.delta);
    // if (newTime > timeRange.end) {
    //   console.log('[error] Invalid time range. Requires atleast \
    //     begin and end time');
    //   return;
    // }

    // $(m_this).on('animation-stop', function () {
    //   stop = true;
    // });

    // $(m_this).on('animation-pause', function () {
    //   pause = true;
    // });

    // function frame() {
    //   if (m_animationState.currentTime > endTime || stop) {
    //     clearInterval(intervalId);
    //     m_animationState.currentTime = null;
    //   }
    //   else if (pause) {
    //     clearInterval(intervalId);
    //   }
    //   else {
    //     animateTimestep();
    //     geo.time.incrementTime(m_animationState.currentTime,
    //       m_animationState.range.units, m_animationState.range.delta);
    //   }
    // }

    // // Update every 2 ms. Updating every ms might be too much.
    // intervalId = setInterval(frame, 2);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Play next animation step and then pause
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function stepAnimationForwardInternal() {
    // if (!m_animationState.currentTime) {
    //   resetAnimation();
    // }

    // var time = new Date(m_animationState.currentTime.getTime());
    // geo.time.incrementTime(time, m_animationState.range.units,
    //     m_animationState.range.delta);

    // if (time > m_animationState.range.end) {
    //   return;
    // }

    // m_animationState.currentTime = time;
    // animateTimestep();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Play previous animation step and then pause
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function stepAnimationBackwardInternal() {
    // if (!m_animationState) {
    //   return;
    // }

    // var time = new Date(m_animationState.currentTime.getTime());
    // geo.time.incrementTime(time, m_animationState.range.units,
    //     -m_animationState.range.delta);

    // if (time < m_animationState.range.start) {
    //   return;
    // }

    // m_animationState.currentTime = time;

    // animateTimestep();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get root node of the map
   *
   * @returns {jquery object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.node = function() {
    return m_node;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set zoom level of the map
   *
   * @returns {Number|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function(val) {
    if (val === undefined ) {
      return m_zoom;
    } else {
      m_zoom = val;
      $(m_this).trigger(geo.event.zoom);
      this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set center of the map
   *
   * @returns {Array|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.center = function(val) {
    if (val === undefined ) {
      return m_center;
    } else {
      m_center = val.slice
      $(m_this).trigger(geo.event.center);
      this.modified();
      return m_this;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add layer to the map
   *
   * @method addLayer
   * @param {geo.layer} layer to be added to the map
   * @return {geom.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addLayer = function(layer) {
    if (layer !== null || layer !== undefined) {
      layer.container(this);

      if (layer.isReference() && m_gcs != null && m_gcs !== layer.gcs()) {
        throw "Reference layer gcs does not match with map gcs";
      } else {
        // TODO Add api to layer
        layer.transform(m_gcs);
      }
      layer._resize(m_x, m_y, m_width, m_height);
      m_layers.push(layer);
      this.modified();

      // TODO Fix this
      // $(this).trigger({
      //   type: geo.event.addLayer,
      //   target: layer
      // });
    }
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove layer from the map
   *
   * @method removeLayer
   * @param {geo.layer} layer that should be removed from the map
   * @return {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeLayer = function(layer) {
    var i;

    if (layer !== null && layer !== undefined) {

      for (i = 0; i < m_layers.length; ++i) {
        if (m_layers[i] === layer) {
          m_layers = m_layers.splice(i, 1);
        }
      }

      layer._exit();
      this.modified();
      $(this).trigger({
        type: geo.event.removeLayer,
        target: layer
      });
    }

    return this;
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
  this.toggle = function(layer) {
    if (layer !== null && layer !== undefined) {
      layer.visible(!layer.visible())
      m_this.modified();
      $(this).trigger({
        type: geo.event.toggle,
        target: layer
      });
    }
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize map
   *
   * @param {Number} x x-offset in display space
   * @param {Number} y y-offset in display space
   * @param {Number} w width in display space
   * @param {Number} h height in display space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function(x, y, w, h) {
    var i = 0;

    m_x = x;
    m_y  = y;
    m_width = w;
    m_height = h;

    for (; i <  m_layers.length; ++i) {
      m_layers[i]._resize(x, y, w, h);
    }

    $(this).trigger({
      type: geo.event.resize,
      target: m_this,
      x_offset: m_x,
      y_offset: m_y,
      width: w,
      height: h
    });

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert display coordinates to map coordinates
   *
   * @returns {'x': number, 'y': number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToMap = function(winX, winY) {
    return m_baseLayer.dislayToGcs(winX, winY);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert world coordinates to map ui gcs
   *
   * @returns {'x': number, 'y': number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToMap = function(x, y) {
    var gcsPoint,
        source,
        dest,
        transformedPoint;

    gcsPoint = m_baseLayer.worldToGcs(x, y);
    source = new proj4.Proj(this.options().gcs);
    dest = new proj4.Proj(this.options().display_gcs);
    transformedPoint = new proj4.Point(gcsPoint[0], gcsPoint[1]);

    proj4.transform(source, dest, transformedPoint);

    return [transformedPoint.x, transformedPoint.y];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Queries each layer for information at this location.
   *
   * @param location
   */
  ////////////////////////////////////////////////////////////////////////////
  this.query = function(arg) {
    // TODO Implement this
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets base layer for this map
   *
   * @param {geo.layer} baseLayer optional
   * @returns {geo.map|geo.layer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.baseLayer = function(baseLayer) {
    if(typeof baseLayer !== 'undefined') {

      // The GCS of the layer must match the map
      if (this.gcs() === baseLayer.gcs()) {
        throw "The layer has a GCS of '" + baseLayer.gcs() +
              "' which does match the map GCS of '" +
              this.gcs() + "'";
      }

      m_baseLayer = baseLayer;

      // Set the layer as the reference layer
      m_baseLayer.referenceLayer(true);

      return this;
    }
    return m_baseLayer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets the interactorStyle for this map
   *
   * @returns {vgl.interactorStyle]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.interactorStyle = function(style) {
    if (style === undefined) {
      return m_interactorStyle;
    } else {
      m_interactorStyle = style;
      this.modified();
    }
    return m_interactorStyle;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Manually force to render map
   */
  ////////////////////////////////////////////////////////////////////////////
  this.draw = function() {
    var i = 0;

    // TODO Fix this
    // $(this).trigger({
    //     type: geo.event.draw,
    //     target: m_this
    // });

    this._update();

    for (i = 0; i < m_layers.length; ++i) {
      m_layers[i]._draw();
    }

    // $(this).trigger({
    //     type: geo.event.draw_end,
    //     target: m_this
    // });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return current animation timestep
   *
   * @returns {number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.animationStep = function() {
    // return m_animationStep;
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
    // var delta = -1, stdDelta = -1, units = null,
    //     start = null, stdStart = null, end = null, stdEnd = null,
    //     rangesToProcess = selectedLayers.length,
    //     processTimeInfo = function(timeInfo) {
    //       var startDate;

    //       if (delta === -1 || timeInfo.stdDelta < stdDelta) {
    //         stdDelta = timeInfo.stdDelta;
    //         delta = timeInfo.nativeDelta;
    //         units = timeInfo.nativeUnits;
    //       }

    //       if (!start || timeInfo.stdTimeRange[0] < stdStart) {
    //         stdStart = timeInfo.stdTimeRange[0];
    //         start = timeInfo.dateRange[0];
    //       }

    //       if (!end || timeInfo.stdTimeRange[1] > stdEnd) {
    //         stdEnd = timeInfo.stdTimeRange[1];
    //         startDate = timeInfo.dateRange[0];
    //         end = new Date(Date.UTC(startDate[0], startDate[1]-1, startDate[2]));
    //         geo.time.incrementTime(end, timeInfo.nativeUnits,
    //             timeInfo.nativeDelta * timeInfo.numSteps);
    //       }

    //       --rangesToProcess;

    //       // Are we done processing? If so pass the information to the map
    //       // for animation.
    //       if (rangesToProcess === 0) {
    //         if (delta === -1 || units === null || end === null ||
    //             start === null ) {
    //           console.log('Unable to calculate time range.');
    //           return;
    //         }
    //         startDate = new Date(Date.UTC(start[0], start[1]-1, start[2]));
    //         onRange({start: startDate, end: end, delta: delta, units: units});
    //       }
    //     };

    // // Iterate through the selected layers and calculate the range we are going
    // // to animate over.
    // $.each(selectedLayers, function(i, layer){
    //   // TODO this data should be part of the layer
    //   var dataset = $('#'+layer.id()).data('dataset');

    //   // Do we already have the range?
    //   if (dataset.timeInfo) {
    //     processTimeInfo(dataset.timeInfo);
    //   }
    //   else {
    //     console.log("Data does not have timeInfo");
    //   }
    // });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Animate layers of a map
   */
  ////////////////////////////////////////////////////////////////////////////
  this.animate = function(layerIds) {
    // // Save the animation state
    // if (!m_animationState.currentTime) {

    //   var layers = [];

    //   // Looks layers
    //   $.each(layerIds, function(i, id) {
    //     var layer = m_this.findLayerById(id);
    //     layers.push(layer);
    //   });

    //   m_this.animateTimeRange(layers, function(timeRange) {
    //       m_animationState = {
    //         range: timeRange, currentTime: new Date(timeRange.start.getTime()),
    //         layers: layers
    //       };
    //       animateInternal();
    //   });
    // }
    // else {
    //   animateInternal();
    // }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Pause animation
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pauseAnimation = function() {
    // $(this).trigger('animation-pause');
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Stop animation
   */
  ////////////////////////////////////////////////////////////////////////////
  this.stopAnimation = function(cleanState) {
    // $(this).trigger('animation-stop');

    // if (cleanState) {
    //   m_animationState = { range: null, currentTime: null, layers: null};
    // }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Play next animation step and then pause
   */
  ////////////////////////////////////////////////////////////////////////////
  this.stepAnimationForward = function(layerIds) {
    // if (!m_animationState.currentTime) {

    //   var layers = [];
    //   // Looks layers
    //   $.each(layerIds, function(i, id) {
    //     var layer = m_this.findLayerById(id);
    //     layers.push(layer);
    //   });


    //   m_this.animateTimeRange(layers, function(timeRange) {
    //       m_animationState = {
    //         range: timeRange, currentTime: new Date(timeRange.start.getTime()),
    //         layers: layers
    //       };
    //       stepAnimationForwardInternal();
    //   });
    // }
    // else {
    //   stepAnimationForwardInternal();
    // }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Play previous animation step and then pause
   */
  ////////////////////////////////////////////////////////////////////////////
  this.stepAnimationBackward = function(layerIds) {
    // if (!m_animationState.currentTime) {

    //   var layers = [];
    //   // Looks layers
    //   $.each(layerIds, function(i, id) {
    //     var layer = m_this.findLayerById(id);
    //     layers.push(layer);
    //   });

    //   m_this.animateTimeRange(layers, function(timeRange) {
    //       m_animationState = {
    //         range: timeRange, currentTime: new Date(timeRange.start.getTime()),
    //         layers: layers
    //       };
    //       stepAnimationBackwardInternal();
    //   });
    // }
    // else {
    //   stepAnimationBackwardInternal();
    // }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize the map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function() {
    var i;

    if (m_node === undefined || m_node === null) {
      throw "Map require DIV node";
    }

    for (i = 0; i < m_layers.length; ++i) {
      if (i === 0) {
        this.baseLayer(m_layers[0]);
      }

      this.addLayer(m_layers[i]);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function() {
    var i = 0;
    for (i = 0; i < m_layers.length; ++i) {
      m_layers[i]._update();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit this map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function() {
    var i = 0;
    for (i = 0; i < m_layers.length; ++i) {
      m_layers[i]._exit();
    }
  };

  this._init();
  return this;
};

inherit(geo.map, geo.object);
