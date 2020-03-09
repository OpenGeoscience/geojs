/* markerFeature square/triangle vertex shader */

$markerFeatureVS

uniform float pixelWidth; // for non-sprite
uniform float aspect; // for non-sprite
attribute vec2 unit; // for non-sprite
varying vec2 unitVar; // for non-sprite

void main(void)
{
  radiusVar = markerFeaturePrep();
  if (radiusVar == 0.0) {
    return;
  }
  // for non-sprite
  unitVar = unit * radiusVar;
  unitVar.y *= -1.0;
  vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;
  if (p.w != 0.0) {
    p = p / p.w;
  }
  p += radiusVar * vec4(unit.x * pixelWidth, unit.y * pixelWidth * aspect, 0.0, 1.0);
  gl_Position = vec4(p.xyz, 1.0);
}
