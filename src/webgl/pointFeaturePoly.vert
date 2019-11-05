/* pointFeature square/triangle vertex shader */

$pointFeatureVS

uniform float pixelWidth; // for non-sprite
uniform float aspect; // for non-sprite
attribute vec2 unit; // for non-sprite
varying vec3 unitVar; // for non-sprite

void main(void)
{
  radiusVar = pointFeaturePrep();
  if (radiusVar == 0.0) {
    return;
  }
  // for non-sprite
  unitVar = vec3(unit, 1.0);
  vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;
  if (p.w != 0.0) {
    p = p / p.w;
  }
  p += (radius + strokeWidthVar) *
       vec4 (unit.x * pixelWidth, unit.y * pixelWidth * aspect, 0.0, 1.0);
  gl_Position = vec4(p.xyz, 1.0);
}
