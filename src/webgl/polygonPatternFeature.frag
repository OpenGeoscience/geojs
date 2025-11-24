/* polygonFeature fragment shader */

$markerFeatureFS

varying vec4 polyFillColorVar;
varying vec3 patternPosVar;

void main () {

  float used = 0.0;
  if (fillColorVar.a != 0.0 || strokeColorVar.a != 0.0)
    used = markerFeatureFragment(patternPosVar);
  if (used != 1.0)
    gl_FragColor = polyFillColorVar * (1.0 - used) + gl_FragColor * used;
}
