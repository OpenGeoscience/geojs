/* contourFeature vertex shader */

#ifdef GL_ES
  precision highp float;
#endif
attribute vec3 pos;
attribute float value;
attribute float opacity;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying float valueVar;
varying float opacityVar;

void main(void)
{
  /* Don't use z values */
  vec4 scrPos = projectionMatrix * modelViewMatrix * vec4(pos.xy, 0, 1);
  if (scrPos.w != 0.0) {
    scrPos = scrPos / scrPos.w;
  }
  valueVar = value;
  opacityVar = opacity;
  gl_Position = scrPos;
}
