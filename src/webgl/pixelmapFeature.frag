/* pixelmapFeature fragment shader */

varying highp vec2 iTextureCoord;
uniform sampler2D sampler2d;
uniform sampler2D lutSampler;
uniform int lutWidth;
uniform int lutHeight;
uniform mediump float opacity;
uniform highp vec2 crop;

void main(void) {
  if ((crop.s < 1.0 && iTextureCoord.s > crop.s) || (crop.t < 1.0 && 1.0 - iTextureCoord.t > crop.t)) {
    discard;
  }
  // to add anti-aliasing, we would need to know the current pixel size
  // (probably computed in the vertex shader) and then sample the base image at
  // multiple points, then average the output color.
  highp vec4 lutValue = texture2D(sampler2d, iTextureCoord);
  highp vec2 lutCoord;
  lutCoord.s = (
    mod(
      // add 0.5 to handle float imprecision
      floor(lutValue.r * 255.0 + 0.5) +
      floor(lutValue.g * 255.0 + 0.5) * 256.0,
      float(lutWidth)
    // center in pixel
    ) + 0.5) / float(lutWidth);
  // Our image is top-down, so invert the coordinate
  lutCoord.t = 1.0 - (
    floor(
      (
        // add 0.5 to handle float imprecision
        floor(lutValue.r * 255.0 + 0.5) +
        floor(lutValue.g * 255.0 + 0.5) * 256.0 +
        floor(lutValue.b * 255.0 + 0.5) * 256.0 * 256.0
        // We may want an option to use the alpha channel to allow more indices
      ) / float(lutWidth)
    // center in pixel
    ) + 0.5) / float(lutHeight);
  if (lutCoord.t < 0.0) {
    discard;
  }
  mediump vec4 color = texture2D(lutSampler, lutCoord);

  color.a *= opacity;
  gl_FragColor = color;
}
