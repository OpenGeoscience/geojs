/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of class viewer
 *
 * @class
 * @param canvas
 * @returns {vglModule.viewer}
 */
vglModule.viewer = function(canvas) {

  if (!(this instanceof vglModule.viewer)) {
    return new vglModule.viewer(canvas);
  }

  vglModule.object.call(this);

  /** @private */
  var m_that = this;

  /** @private */
  var m_canvas = canvas;

  /** @private */
  var m_ready = false;

  /** @private */
  var m_interactorStyle = null;

  /** @private */
  var m_renderer = vglModule.renderer();

  /** @private */
  var m_renderWindow = vglModule.renderWindow(m_canvas);
  m_renderWindow.addRenderer(m_renderer);

  this.canvas = function() {
    return m_canvas;
  };

  this.renderWindow = function() {
    return m_renderWindow;
  };

  this.init = function() {
    if (m_renderWindow !== null) {
      m_renderWindow.createWindow();
      m_ready = true;
    }
    else {
      console.log("[ERROR] No render window attached");
    }
  };

  this.interactorStyle = function() {
    return m_interactorStyle;
  };

  this.setInteractorStyle = function(style) {
    if (style !== m_interactorStyle) {
      m_interactorStyle = style;
      m_interactorStyle.setViewer(this);
      this.modified();
    }
  };

  this.handleMouseDown = function(event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.state = 'down';
      fixedEvent.type = vglModule.command.mousePressEvent;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  this.handleMouseUp = function(event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.state = 'up';
      fixedEvent.type = vglModule.command.mousePressEvent;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  this.handleMouseMove = function(event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vglModule.command.mouseMoveEvent;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  this.handleKeyPress = function(event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vglModule.command.keyPressEvent;
      $(m_that).trigger(fixedEvent);
    }

    return true;
  };

  this.handleContextMenu = function(event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vglModule.command.contextMenuEvent;
      $(m_that).trigger(fixedEvent);
    }

    return false;
  };

  this.relMouseCoords = function(event) {
    var totalOffsetX = 0,
        totalOffsetY = 0,
        canvasX = 0,
        canvasY = 0,
        currentElement = m_canvas;

    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    } while (currentElement = currentElement.offsetParent);

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
      x: canvasX,
      y: canvasY
    };
  };

  this.render = function() {
    m_renderWindow.render();
  };

  return this;
};

inherit(vglModule.viewer, vglModule.object);
