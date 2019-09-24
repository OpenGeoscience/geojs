/* pointFeature sprite vertex shader */

$pointFeatureVS

void main(void)
{
  radiusVar = pointFeaturePrep();
  if (radiusVar == 0.0) {
    return;
  }
  // for sprite
  gl_Position = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;
  gl_PointSize = 2.0 * (radius + strokeWidthVar);
}
