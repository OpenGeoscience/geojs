/* lineFeature fragment shader */

#ifdef GL_ES
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif
#endif
varying vec4 strokeColorVar;
varying vec4 subpos;
varying vec4 info;
varying vec4 angles;
uniform float antialiasing;
uniform float miterLimit;
uniform float fixedFlags;

void main () {
  vec4 color = strokeColorVar;
  float opacity = 1.0;
  int nearMode = int(floor(info.x + 0.5));
  int farMode = int(floor(info.y + 0.5));
  float cosABC = angles.x;
  float sinABC = angles.y;
  float cosBCD = angles.z;
  float sinBCD = angles.w;
  // never render on the opposite side of a miter.  This uses a bit of
  // slop, via pow(smoothstep()) instead of step(), since there are
  // precision issues in this calculation.  This doesn't wholly solve
  // the precision issue; sometimes pixels are missed or double
  // rendered along the inside seam of a miter.
  if (nearMode >= 4) {
    float dist = cosABC * subpos.x - sinABC * subpos.y;
    opacity = min(opacity, pow(smoothstep(-0.02, 0.02, dist), 0.5));
    if (opacity == 0.0) {
      discard;
    }
  }
  if (farMode >= 4) {
    float dist = cosBCD * subpos.z - sinBCD * subpos.y;
    opacity = min(opacity, pow(smoothstep(-0.02, 0.02, dist), 0.5));
    if (opacity == 0.0) {
      discard;
    }
  }
  // butt or square cap
  if ((nearMode == 0 || nearMode == 1) && subpos.x < antialiasing) {
    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.x + subpos.w * float(nearMode)));
  }
  if ((farMode == 0 || farMode == 1) && subpos.z < antialiasing) {
    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.z + subpos.w * float(farMode)));
  }
  // round cap
  if (nearMode == 2 && subpos.x <= 0.0) {
    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.w - sqrt(pow(subpos.x, 2.0) + pow(subpos.y - info.z * subpos.w, 2.0))));
  }
  if (farMode == 2 && subpos.z <= 0.0) {
    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.w - sqrt(pow(subpos.z, 2.0) + pow(subpos.y - info.z * subpos.w, 2.0))));
  }
  // bevel and clip joins
  if ((nearMode == 5 || nearMode == 7) && subpos.x < antialiasing) {
    float dist = (sinABC * subpos.x + cosABC * subpos.y) * sign(sinABC);
    float w = subpos.w * (1.0 - info.z * sign(sinABC));
    float maxDist;
    if (nearMode == 5)  maxDist = cosABC * w;
    else                maxDist = miterLimit * w;
    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, maxDist + dist));
  }
  if ((farMode == 5 || farMode == 7) && subpos.z < antialiasing) {
    float dist = (sinBCD * subpos.z + cosBCD * subpos.y) * sign(sinBCD);
    float w = subpos.w * (1.0 - info.z * sign(sinBCD));
    float maxDist;
    if (farMode == 5)  maxDist = cosBCD * w;
    else               maxDist = miterLimit * w;
    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, maxDist + dist));
  }
  // round join
  if (nearMode == 6 && subpos.x <= 0.0) {
    float w = subpos.w * (1.0 - info.z * sign(sinABC));
    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, w - sqrt(pow(subpos.x, 2.0) + pow(subpos.y, 2.0))));
  }
  if (farMode == 6 && subpos.z <= 0.0) {
    float w = subpos.w * (1.0 - info.z * sign(sinBCD));
    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, w - sqrt(pow(subpos.z, 2.0) + pow(subpos.y, 2.0))));
  }
  // antialias along main edges
  if (antialiasing > 0.0) {
    if (subpos.y > subpos.w * (1.0 + info.z) - antialiasing) {
      opacity = min(opacity, smoothstep(antialiasing, -antialiasing, subpos.y - subpos.w * (1.0 + info.z)));
    }
    if (subpos.y < subpos.w * (-1.0 + info.z) + antialiasing) {
      opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.y - subpos.w * (-1.0 + info.z)));
    }
  }
  if (opacity == 0.0) {
    discard;
  }
  color.a *= opacity;
  gl_FragColor = color;
}
