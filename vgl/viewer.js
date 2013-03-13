/**
 * @class vglModule.viewer
 * @param canvas
 * @returns {vglModule.viewer}
 */
vglModule.viewer = function(canvas) {

  if (!(this instanceof vglModule.viewer)) {
    return new vglModule.viewer(canvas);
  }

  vglModule.object.call(this);

  // Private member variables
  var m_that = this;
  var m_canvas = canvas;
  var m_ready = false;
  var m_interactorStyle = null;
  var m_renderer = vglModule.renderer();
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
  };

  this.handleMouseUp = function(event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.state = 'up';
      fixedEvent.type = vglModule.command.mousePressEvent;
      $(m_that).trigger(fixedEvent);
    }
  };

  this.handleMouseMove = function(event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vglModule.command.mouseMoveEvent;
      $(m_that).trigger(fixedEvent);
    }
  };

  this.handleKeyPress = function(event) {
    if (m_ready === true) {
      var fixedEvent = $.event.fix(event || window.event);
      fixedEvent.preventDefault();
      fixedEvent.type = vglModule.command.keyPressEvent;
      $(m_that).trigger(fixedEvent);
    }
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

  this.render = function() {
    m_renderWindow.render();
  };

  return this;
};

inherit(vglModule.viewer, vglModule.object);