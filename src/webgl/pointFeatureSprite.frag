/* pointFeature sprite fragment shader */

$pointFeatureFS

// the square/triangle shader defines unitVar

void main () {
  // No stroke or fill implies nothing to draw
  if (fillColorVar.a == 0.0 && strokeColorVar.a == 0.0)
    discard;
  float rad = 2.0 * length(gl_PointCoord - vec2(0.5));  // distinct for sprite
  pointFeatureFragment(rad);
}
