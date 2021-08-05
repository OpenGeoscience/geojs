/* quadFeature Image vertex shader */

attribute vec3 vertexPosition;
attribute vec2 textureCoord;
uniform float zOffset;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying highp vec2 iTextureCoord;
uniform highp vec4 cropsource;

void main(void) {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
  gl_Position.z += zOffset;
  if (cropsource.p > cropsource.s && cropsource.q > cropsource.t && (cropsource.p < 1.0 || cropsource.s > 0.0 || cropsource.q < 1.0 || cropsource.t > 0.0)) {
    iTextureCoord.s = textureCoord.s * (cropsource.p - cropsource.s) + cropsource.s;
    iTextureCoord.t = textureCoord.t * (cropsource.q - cropsource.t) + cropsource.t;
  } else {
    iTextureCoord = textureCoord;
  }
}
