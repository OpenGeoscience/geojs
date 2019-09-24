/* pointFeature square/triangle fragment shader */

$pointFeatureFS

varying vec3 unitVar;  // distinct for square/triangle

void main () {
  if (fillColorVar.a == 0.0 && strokeColorVar.a == 0.0)
    discard;
  float rad = length(unitVar.xy); // distinct for square/triangle
  pointFeatureFragment(rad);
}
