/* markerFeature sprite fragment shader */

$markerFeatureFS

// the square/triangle shader defines unitVar

void main(void) {
  // No stroke or fill implies nothing to draw
  if (fillColorVar.a == 0.0 && strokeColorVar.a == 0.0)
    discard;
  // for sprites, convert the position to [-radius,radius],[-radius,radius]
  vec2 pos = (gl_PointCoord.xy - 0.5) * 2.0 * radiusVar;
  if (markerFeatureFragment(vec3(pos, 0.0)) == 0.0)
    discard;
}
