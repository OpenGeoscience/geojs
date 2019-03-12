/* polygonFeature fragment shader */

#ifdef GL_ES
  precision highp float;
#endif
varying vec4 fillColorVar;

void main () {
  gl_FragColor = fillColorVar;
}
