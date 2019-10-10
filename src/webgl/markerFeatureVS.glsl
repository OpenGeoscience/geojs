/* markerFeature common vertex shader */

#ifdef GL_ES
  precision highp float;
#endif
attribute vec3 pos;
attribute float radius;
attribute vec3 fillColor;
attribute float fillOpacity;
attribute vec3 strokeColor;
attribute float strokeOpacity;
attribute float strokeWidth;
attribute float symbol;  /* contains some bit fields */
attribute float symbolValue;
attribute float rotation;
uniform float zoom;
uniform float rotationUniform;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
// non-sprite has other definitions.
varying float radiusVar;
varying vec4 fillColorVar;
varying vec4 strokeColorVar;
varying float strokeWidthVar;
varying float symbolVar;  /* contains some bit fields */
varying float symbolValueVar;
varying float rotationVar;

float markerFeaturePrep(void)
{
  // No stroke or fill implies nothing to draw
  if (radius <= 0.0 || (strokeOpacity <= 0.0 && fillOpacity <= 0.0)) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return 0.0;
  }
  radiusVar = radius;
  strokeWidthVar = strokeWidth;
  int scaleMode = int(mod(symbol, 4.0));
  float strokeOffset = mod(floor(symbol / 16.0), 4.0) - 1.0;
  radiusVar += (strokeOffset + 1.0) / 2.0 * strokeWidthVar;
  if (scaleMode == 1) { // fill
    radiusVar = (radiusVar - strokeWidthVar) * exp2(zoom) + strokeWidthVar;
  } else if (scaleMode == 2) { // stroke
    radiusVar += strokeWidthVar * (exp2(zoom) - 1.0);
    strokeWidthVar *= exp2(zoom);
  } else if (scaleMode == 3) { // all
    radiusVar *= exp2(zoom);
    strokeWidthVar *= exp2(zoom);
  }
  fillColorVar = vec4(fillColor, fillOpacity);
  strokeColorVar = vec4(strokeColor, strokeOpacity);
  symbolVar = symbol;
  symbolValueVar = symbolValue;
  rotationVar = rotation;
  if (bool(mod(floor(symbolVar / 4.0), 2.0))) {
    rotationVar += rotationUniform;
  }
  return radiusVar;
}
