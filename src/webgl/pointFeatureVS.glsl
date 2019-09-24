/* pointFeature common vertex shader */

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
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec4 fillColorVar;
varying vec4 strokeColorVar;
varying float radiusVar;
varying float strokeWidthVar;

float pointFeaturePrep() {
  strokeWidthVar = strokeWidth;
  fillColorVar = vec4(fillColor, fillOpacity);
  strokeColorVar = vec4(strokeColor, strokeOpacity);
  // No stroke or fill implies nothing to draw
  if (stroke < 1.0 || strokeWidth <= 0.0 || strokeOpacity <= 0.0) {
    strokeColorVar.a = 0.0;
    strokeWidthVar = 0.0;
  }
  if (fill < 1.0 || radius <= 0.0 || fillOpacity <= 0.0)
    fillColorVar.a = 0.0;
  /* If the point has no visible pixels, skip doing computations on it. */
  if (fillColorVar.a == 0.0 && strokeColorVar.a == 0.0) {
    gl_Position = vec4(2, 2, 0, 1);
    return 0.0;
  }
  return radius;
}
