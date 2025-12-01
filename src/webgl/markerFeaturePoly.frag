/* markerFeature square/triangle fragment shader */

$markerFeatureFS

varying vec2 unitVar;  // distinct for square/triangle

void main() {
  if (fillColorVar.a == 0.0 && strokeColorVar.a == 0.0)
    discard;
  if (markerFeatureFragment(vec3(unitVar, 0.0)) == 0.0)
    discard;
}
