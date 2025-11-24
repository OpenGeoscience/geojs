/* polygonPatternFeature vertex shader */

#ifdef GL_ES
  precision highp float;
#endif
uniform float pixelWidth;
uniform float aspect;
uniform float zoom;
uniform float rotationUniform;
attribute vec3 pos;
attribute vec3 fillColor;
attribute float fillOpacity;
attribute vec4 patternFillColor;
attribute vec4 patternStrokeColor;
/* Symbol props are strokeWidth, radius, symbol + flags, symbolValue */
attribute vec4 patternSymbolProps;
/* Position props are rotation, spacing, origin x, origin y */
attribute vec4 patternPositionProps;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec4 polyFillColorVar;
varying float radiusVar;
varying vec4 fillColorVar;
varying vec4 strokeColorVar;
varying float strokeWidthVar;
varying float symbolVar;  /* contains some bit fields */
varying float symbolValueVar;
varying float rotationVar;
varying vec3 patternPosVar;
const float PI = 3.14159265358979323846264;

void main(void)
{
  polyFillColorVar = vec4(fillColor, fillOpacity);
  /* This is _nearly_ the same as what is in markerFeatureVS.glsl, but the
   * attributes are named differently. */
  radiusVar = patternSymbolProps.y;
  strokeWidthVar = patternSymbolProps.x;
  int scaleMode = int(mod(patternSymbolProps.z, 4.0));
  float strokeOffset = mod(floor(patternSymbolProps.z / 16.0), 4.0) - 1.0;
  if (radiusVar < 0.0 || (patternFillColor.a < 0.0 && patternStrokeColor.a < 0.0)) {
    radiusVar = 0.0;
  } else {
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
  }
  fillColorVar = patternFillColor;
  strokeColorVar = patternStrokeColor;
  symbolVar = patternSymbolProps.z;
  symbolValueVar = patternSymbolProps.w;
  rotationVar = patternPositionProps.x;
  if (bool(mod(floor(symbolVar / 4.0), 2.0))) {
    rotationVar += rotationUniform;
  }
  /* This is distinct for polygonPattern */
  vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1.0);
  if (clipPos.w != 0.0) {
    clipPos = clipPos / clipPos.w;
  }
  if (radiusVar > 0.0) {
    vec4 origPos = projectionMatrix * modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    if (origPos.w != 0.0)
      origPos = origPos / origPos.w;
    patternPosVar.x = (clipPos.x - origPos.x) / pixelWidth;
    patternPosVar.y = -(clipPos.y - origPos.y) / pixelWidth / aspect;
    float spacing = patternPositionProps.y;
    if (scaleMode == 0) {
      patternPosVar.x -= patternPositionProps.z;
      patternPosVar.y -= patternPositionProps.w;
    } else {
      spacing = spacing * exp2(zoom);
      patternPosVar.x -= patternPositionProps.z * exp2(zoom);
      patternPosVar.y -= patternPositionProps.w * exp2(zoom);
    }
    if (rotationUniform != 0.0) {
      float cosR = cos(rotationUniform);
      float sinR = sin(rotationUniform);
      patternPosVar.xy = vec2(cosR * patternPosVar.x + sinR * patternPosVar.y, sinR * patternPosVar.x - cosR * patternPosVar.y);
    }
    patternPosVar.z = spacing;
  }
  gl_Position = clipPos;
}
