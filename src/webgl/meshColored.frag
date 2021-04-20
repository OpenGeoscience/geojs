/* contourFeature fragment shader */

#ifdef GL_ES
  precision highp float;
#endif
uniform vec4 minColor;
uniform vec4 maxColor;
uniform float steps;
uniform bool stepped;
uniform sampler2D sampler2d;
varying float valueVar;
varying float opacityVar;

void main () {
  vec4 clr;
  if (valueVar < 0.0) {
    clr = minColor;
  } else if (valueVar > steps) {
    clr = maxColor;
  } else {
    float step;
    if (stepped) {
      step = floor(valueVar) + 0.5;
      if (step > steps) {
        step = steps - 0.5;
      }
    } else {
      step = valueVar + 0.5;
    }
    // our texture is padded on either end by a repeated value to ensure
    // we interpolate smoothly at the ends.
    clr = texture2D(sampler2d, vec2((step + 1.0) / (steps + 2.0), 0.0));
  }
  gl_FragColor = vec4(clr.rgb, clr.a * opacityVar);
}
