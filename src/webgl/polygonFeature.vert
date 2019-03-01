/* polygonFeature vertex shader */

attribute vec3 pos;
attribute vec3 fillColor;
attribute float fillOpacity;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec4 fillColorVar;

void main(void)
{
  vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);
  if (clipPos.w != 0.0) {
    clipPos = clipPos/clipPos.w;
  }
  fillColorVar = vec4(fillColor, fillOpacity);
  gl_Position = clipPos;
}
