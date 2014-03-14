//////////////////////////////////////////////////////////////////////////////
/**
 * @module gd3
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global window, geo, gd3, ogs, vec4, inherit, d3, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class d3InteractorStyle
 *
 * @returns {gd3.d3InteractorStyle}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.d3InteractorStyle = function () {
  'use strict';
  if (!(this instanceof gd3.d3InteractorStyle)) {
    return new gd3.d3InteractorStyle();
  }

  var m_that = this,
      m_map,
      m_leftMouseButtonDown = false,    // false or the mouse position at button press
      m_rightMouseButtonDown = false,   // false or the mouse position at button press
      m_middileMouseButtonDown = false, // false or the mouse position at button press
      m_mouseZoomAlpha = 0.05,
      m_zoomFactor = 1.0;

  // helper function to subtract two positions
  function pointDelta(a, b) {
    var m_x = a.x() - b.x(),
        m_y = a.y() - b.y();
    return { x: function () { return m_x; },
             y: function () { return m_y; }
    };
  }

  // helper function to get a location object from a mouse event
  function eventPoint(event) {
    var m_x = event.pageX,
        m_y = event.pageY;
    return { x: function () { return m_x; },
             y: function () { return m_y; }
    };
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets map for this interactor, adds draw region layer if needed
   *
   * @param {geo.map} newMap optional
   * @returns {geo.baseInteractorStyle|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.map = function(newMap) {
    if(newMap !== undefined) {
      m_map = newMap;
      return m_that;
    }
    return m_map;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse down event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseDown = function(event) {

    // interpret core events into map actions
    
    var pt = eventPoint(event);
    
    // left mouse click is a drag
    if (event.mouseButton === geo.mouseButtons.leftMouseButton) {
      // store private variables
      m_leftMouseButtonDown = pt;
      
      // fire a panStart event...
      // $(m_map).trigger('panStart', {position: pt});

    // right mouse click is a zoom
    } else if (event.mouseButton === geo.mouseButtons.rightMouseButton) {
      // store private variables
      m_rightMouseButtonDown = pt;

      // fire a zoomStart event
      // ...
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse up event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseUp = function(event) {
    
    // interpret core events into map actions
    
    // left mouse click is a drag
    if (event.mouseButton === geo.mouseButtons.leftMouseButton) {
      // store private variables
      m_leftMouseButtonDown = false;
      
      // fire a panEnd event
      // ...

    // right mouse click is a zoom
    } else if (event.mouseButton === geo.mouseButtons.rightMouseButton) {
      // store private variables
      m_rightMouseButtonDown = false;

      // fire a zoomEnd event
      // ...

      // reset zoom factor
      m_zoomFactor = 1.0;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Handle mouse move event
   */
  ////////////////////////////////////////////////////////////////////////////
  this.handleMouseMove = function(event) {
    var delta,
        pt = eventPoint(event);

    // find out what the action means according to mouse buttons

    // left mouse click is a drag
    if (m_leftMouseButtonDown) {
      delta = pointDelta(pt, m_leftMouseButtonDown);
      $(m_map).trigger(geo.event.pan, {
        startPosition: m_leftMouseButtonDown,
        currentPosition: pt,
        delta: pointDelta(pt, m_leftMouseButtonDown)
      });
    }

    if (m_rightMouseButtonDown) {
      // How to we encode zoom factors for the renderer?
      delta = pointDelta(pt, m_rightMouseButtonDown);
      delta = (1.0 + delta.y()) * m_mouseZoomAlpha;
      m_zoomFactor = m_zoomFactor * delta;
      $(m_map).trigger(geo.event.zoom, {
        startFactor: 1.0,
        currentFactor: m_zoomFactor,
        delta: delta
      });
    }
  };

};
