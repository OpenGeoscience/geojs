/* markerFeature sprite vertex shader */

$markerFeatureVS

void main(void)
{
  radiusVar = markerFeaturePrep();
  if (radiusVar == 0.0) {
    return;
  }
  // for sprite
  gl_Position = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;
  gl_PointSize = 2.0 * radiusVar;
}
