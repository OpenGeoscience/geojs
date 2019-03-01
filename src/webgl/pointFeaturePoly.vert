/* pointFeature square/triangle vertex shader */

#ifdef GL_ES
  precision highp float;
#endif
attribute vec3 pos;
attribute float radius;
attribute vec3 fillColor;
attribute vec3 strokeColor;
attribute float fillOpacity;
attribute float strokeWidth;
attribute float strokeOpacity;
attribute float fill;
attribute float stroke;
uniform float pixelWidth;
uniform float aspect;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec4 fillColorVar;
varying vec4 strokeColorVar;
varying float radiusVar;
varying float strokeWidthVar;
varying float fillVar;
varying float strokeVar;
attribute vec2 unit; // for non-sprite
varying vec3 unitVar; // for non-sprite

void main(void)
{
  strokeWidthVar = strokeWidth;
  // No stroke or fill implies nothing to draw
  if (stroke < 1.0 || strokeWidth <= 0.0 || strokeOpacity <= 0.0) {
    strokeVar = 0.0;
    strokeWidthVar = 0.0;
  }
  else
    strokeVar = 1.0;
  if (fill < 1.0 || radius <= 0.0 || fillOpacity <= 0.0)
    fillVar = 0.0;
  else
    fillVar = 1.0;
  /* If the point has no visible pixels, skip doing computations on it. */
  if (fillVar == 0.0 && strokeVar == 0.0) {
    gl_Position = vec4(2, 2, 0, 1);
    return;
  }
  fillColorVar = vec4 (fillColor, fillOpacity);
  strokeColorVar = vec4 (strokeColor, strokeOpacity);
  radiusVar = radius;
  // for non-sprite
  unitVar = vec3 (unit, 1.0);
  vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;
  if (p.w != 0.0) {
    p = p / p.w;
  }
  p += (radius + strokeWidthVar) *
       vec4 (unit.x * pixelWidth, unit.y * pixelWidth * aspect, 0.0, 1.0);
  gl_Position = vec4(p.xyz, 1.0);
}
