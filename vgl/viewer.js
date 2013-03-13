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
  var m_canvas = canvas;
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
    return m_interactorStyle.handleMouseDown(event);
  };

  this.handleMouseUp = function(event) {
    return m_interactorStyle.handleMouseUp(event);
  };

  this.handleMouseMove = function(event) {
    return m_interactorStyle.handleMouseMove(event);
  };

  this.handleContextMenu = function(event) {
    return m_interactorStyle.handleContextMenu(event);
  };

  this.render = function() {
    m_renderWindow.render();
  };

  return this;
};

inherit(vglModule.viewer, vglModule.object);