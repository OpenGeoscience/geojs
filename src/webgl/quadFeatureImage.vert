/* quadFeature Image vertex shader */

attribute vec3 vertexPosition;
attribute vec2 textureCoord;
uniform float zOffset;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying highp vec2 iTextureCoord;

void main(void) {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
  gl_Position.z += zOffset;
  iTextureCoord = textureCoord;
}

