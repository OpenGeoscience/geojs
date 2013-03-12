/**
 * @class vglModule.interactorStyle
 * @returns {vglModule.interactorStyle}
 */
vglModule.interactorStyle = function() {

  if (!(this instanceof vglModule.interactorStyle)) {
    return new vglModule.interactorStyle();
  }
  vglModule.object.call(this);

  // Private member variables
  this.events = {
    keyPressEvent : "keyPressEvent",
    configureEvent : "configureEvent",
    enableEvent : "enableEvent",
    mouseWheelBackwardEvent : "mouseWheelBackwardEvent",
    keyReleaseEvent : "keyReleaseEvent",
    middleButtonPressEvent : "middleButtonPressEvent",
    startInteractionEvent : "startInteractionEvent",
    enterEvent : "enterEvent",
    rightButtonPressEvent : "rightButtonPressEvent",
    middleButtonReleaseEvent : "middleButtonReleaseEvent",
    charEvent : "charEvent",
    disableEvent : "disableEvent",
    endInteractionEvent : "endInteractionEvent",
    mouseMoveEvent : "mouseMoveEvent",
    mouseWheelForwardEvent : "mouseWheelForwardEvent",
    exposeEvent : "exposeEvent",
    timerEvent : "timerEvent",
    leftButtonPressEvent : "leftButtonPressEvent",
    leaveEvent : "leaveEvent",
    rightButtonReleaseEvent : "rightButtonReleaseEvent",
    leftButtonReleaseEvent : "leftButtonReleaseEvent"
  };

  var m_viewer = null;

  this.viewer = function() {
    return m_viewer;
  };

  this.setViewer = function(viewer) {
    if (viewer !== m_viewer) {
      m_viewer = viewer;
      this.modified();
    }
  };

  this.handleMouseDown = function(event) {
  };

  this.handleMouseUp = function(event) {
  };

  this.handleMouseMove = function(event) {
  };

  this.handleContextMenu = function(event) {
    return false;
  };

  return this;
};

inherit(vglModule.interactorStyle, vglModule.object);