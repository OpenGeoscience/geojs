/* quadFeature Color fragment shader */

varying mediump vec3 iVertexColor;
uniform mediump float opacity;

void main(void) {
  gl_FragColor = vec4(iVertexColor, opacity);
}
