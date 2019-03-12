/* quadFeature Color vertex shader */

attribute vec3 vertexPosition;
uniform float zOffset;
uniform vec3 vertexColor;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying mediump vec3 iVertexColor;

void main(void) {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
  gl_Position.z += zOffset;
  iVertexColor = vertexColor;
}

