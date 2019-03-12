/* quadFeature Image fragment shader */

varying highp vec2 iTextureCoord;
uniform sampler2D sampler2d;
uniform mediump float opacity;
uniform highp vec2 crop;

void main(void) {
  mediump vec4 color = texture2D(sampler2d, iTextureCoord);
  if ((crop.s < 1.0 && iTextureCoord.s > crop.s) || (crop.t < 1.0 && 1.0 - iTextureCoord.t > crop.t)) {
    discard;
  }
  color.w *= opacity;
  gl_FragColor = color;
}

