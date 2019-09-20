/* markerFeature square/triangle fragment shader */

$markerFeatureFS

varying vec2 unitVar;  // distinct for square/triangle

void main() {
  if (fillColorVar.a == 0.0 && strokeColorVar.a == 0.0)
    discard;
  markerFeatureFragment(unitVar);
}
