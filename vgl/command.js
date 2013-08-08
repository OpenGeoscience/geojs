/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of class command
 *
 * @class command
 * @returns {vglModule.command}
 */
vglModule.command = function() {

  if (!(this instanceof vglModule.command)) {
    return new vglModule.command();
  }
  vglModule.object.call(this);

  return this;
};

inherit(vglModule.command, vglModule.object);

/**
 * Event types
 */
vglModule.command.keyPressEvent = "keyPressEvent";
vglModule.command.mousePressEvent = "mousePressEvent";
vglModule.command.mouseReleaseEvent = "mouseReleaseEvent";
vglModule.command.contextMenuEvent = "contextMenuEvent";
vglModule.command.configureEvent = "configureEvent";
vglModule.command.enableEvent = "enableEvent";
vglModule.command.mouseWheelBackwardEvent = "mouseWheelBackwardEvent";
vglModule.command.keyReleaseEvent = "keyReleaseEvent";
vglModule.command.middleButtonPressEvent = "middleButtonPressEvent";
vglModule.command.startInteractionEvent = "startInteractionEvent";
vglModule.command.enterEvent = "enterEvent";
vglModule.command.rightButtonPressEvent = "rightButtonPressEvent";
vglModule.command.middleButtonReleaseEvent = "middleButtonReleaseEvent";
vglModule.command.charEvent = "charEvent";
vglModule.command.disableEvent = "disableEvent";
vglModule.command.endInteractionEvent = "endInteractionEvent";
vglModule.command.mouseMoveEvent = "mouseMoveEvent";
vglModule.command.mouseWheelForwardEvent = "mouseWheelForwardEvent";
vglModule.command.exposeEvent = "exposeEvent";
vglModule.command.timerEvent = "timerEvent";
vglModule.command.leftButtonPressEvent = "leftButtonPressEvent";
vglModule.command.leaveEvent = "leaveEvent";
vglModule.command.rightButtonReleaseEvent = "rightButtonReleaseEvent";
vglModule.command.leftButtonReleaseEvent = "leftButtonReleaseEvent";
