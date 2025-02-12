/* lineFeature vertex shader */

#ifdef GL_ES
  precision highp float;
#endif
attribute vec3 pos;
attribute vec3 prev;
attribute vec3 next;
attribute vec3 far;
attribute float flags;

attribute vec3 strokeColor;
attribute float strokeOpacity;
attribute float strokeWidth;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float pixelWidth;
uniform float aspect;
uniform float miterLimit;
uniform float antialiasing;

varying vec4 strokeColorVar;
varying vec4 subpos;  /* px, py, length - px, width */
varying vec4 info;  /* near mode, far mode, offset */
varying vec4 angles; /* near angle cos, sin, far angle cos, sin */

const float PI = 3.14159265358979323846264;

vec4 viewCoord(vec3 c) {
  vec4 result = projectionMatrix * modelViewMatrix * vec4(c.xyz, 1.0);
  if (result.w != 0.0)  result = result / result.w;
  return result;
}

float atan2(float y, float x) {
  if (x > 0.0)  return atan(y / x);
  if (x < 0.0 && y >= 0.0)  return atan(y / x) + PI;
  if (x < 0.0)  return atan(y / x) - PI;
  return sign(y) * 0.5 * PI;
}

void main(void)
{
  /* If any vertex has been deliberately set to a negative opacity,
   * skip doing computations on it. */
  if (strokeOpacity < 0.0) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }
  /* convert coordinates.  We have four values, since we need to
   * calculate the angles between the lines formed by prev-pos and
   * pos-next, and between pos-next and next-far, plus know the angle
   *   (prev)---(pos)---(next)---(far) => A---B---C---D */
  vec4 A = viewCoord(prev);
  vec4 B = viewCoord(pos);
  vec4 C = viewCoord(next);
  vec4 D = viewCoord(far);
  // calculate line segment vector and angle
  vec2 deltaCB = C.xy - B.xy;
  if (deltaCB == vec2(0.0, 0.0)) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    return;
  }
  float lineLength = length(vec2(deltaCB.x, deltaCB.y / aspect)) / pixelWidth;
  // if lines reverse upon themselves and are not nearly the same length, skip
  // joins.  This is a heuristic; the correct method would to be to pass some
  // sort of length of the adjacent line to the fragment renderer and adjust
  // which fragments are rendered, but this is much more complex.
  float abLimit = length(vec2(A.x - B.x, (A.y - B.y) / aspect)) / pixelWidth;
  float dcLimit = length(vec2(D.x - C.x, (D.y - C.y) / aspect)) / pixelWidth;
  if (abLimit >= lineLength - antialiasing - strokeWidth * 0.5 && abLimit <= lineLength + antialiasing + strokeWidth * 0.5) {
    abLimit = 0.0001;
  } else {
    if (abLimit < lineLength)  abLimit = lineLength;
    abLimit = (strokeWidth - antialiasing) / (abLimit + antialiasing);
    if (abLimit < 0.0001) abLimit = 0.0001;
    if (abLimit > 0.1) abLimit = 0.1;
  }
  if (dcLimit >= lineLength - antialiasing - strokeWidth * 0.5 && dcLimit <= lineLength + antialiasing + strokeWidth * 0.5) {
    dcLimit = 0.0001;
  } else {
    if (dcLimit < lineLength)  dcLimit = lineLength;
    dcLimit = (strokeWidth - antialiasing) / (dcLimit + antialiasing);
    if (dcLimit < 0.0001) dcLimit = 0.0001;
    if (dcLimit > 0.1) dcLimit = 0.1;
  }
  float angleCB = atan2(deltaCB.y, deltaCB.x * aspect);
  // values we need to pass along
  strokeColorVar = vec4(strokeColor, strokeOpacity);
  // extract values from our flags field
  int vertex = int(mod(flags, 4.0));
  int nearMode = int(mod(floor(flags / 4.0), 8.0));
  int farMode = int(mod(floor(flags / 32.0), 8.0));
  // we use 11 bits of the flags for the offset, where -1023 to 1023
  // maps to -1 to 1.  The 11 bits are a signed value, so simply
  // selecting the bits will result in an unsigned values that may be
  // greater than 1, in which case we have to subtract appropriately.
  float offset = mod(floor(flags / 256.0), 2048.0) / 1023.0;
  if (offset > 1.0)  offset -= 2048.0 / 1023.0;
  // by default, offset by the width and don't extend lines.  Later,
  // calculate line extensions based on end cap and end join modes
  float yOffset = strokeWidth + antialiasing;
  if (vertex == 0)  yOffset *= -1.0;
  yOffset += strokeWidth * offset;
  float xOffset = 0.0;
  // end caps
  if (nearMode == 0) {
    xOffset = antialiasing;
  } else if (nearMode == 1 || nearMode == 2) {
    xOffset = strokeWidth + antialiasing;
  }

  // If joining lines, calculate the angles in screen space formed by
  // the near end (A-B-C) and far end (B-C-D), and determine how much
  // space is needed for the particular join.
  //   This could be changed: if the lines are not a uniform width and
  // offset, then the functional join angle is not simply half the
  // angle between the two lines, but rather half the angle of the
  // inside edge of the the two lines.
  float cosABC = 1.0, sinABC = 0.0, cosBCD = 1.0, sinBCD = 0.0;  // of half angles
  // handle near end
  if (nearMode >= 4) {
    float angleBA = atan2(B.y - A.y, (B.x - A.x) * aspect);
    if (A.xy == B.xy)  angleBA = angleCB;
    float angleABC = angleCB - angleBA;
    // ensure angle is in the range [-PI, PI], then take the half angle
    angleABC = (mod(angleABC + 3.0 * PI, 2.0 * PI) - PI) / 2.0;
    cosABC = cos(angleABC);  sinABC = sin(angleABC);
    // if this angle is close to flat, pass-through the join
    if (nearMode >= 4 && (cosABC > 0.999999 || cosABC < abLimit)) {
      nearMode = 3;
    }
    // miter, miter-clip
    if (nearMode == 4 || nearMode == 7) {
      if (cosABC < 0.000001 || 1.0 / cosABC > miterLimit) {
        if (nearMode == 4) {
          nearMode = 5;
        } else {
          xOffset = miterLimit * strokeWidth * (1.0 - offset * sign(sinABC)) + antialiasing;
        }
      } else {
        // we add an extra 1.0 to the xOffset to make sure that fragment
        // shader is doing the clipping
        xOffset = abs(sinABC / cosABC) * strokeWidth * (1.0 - offset * sign(sinABC)) + antialiasing + 1.0;
        nearMode = 4;
      }
    }
    // bevel or round join
    if (nearMode == 5 || nearMode == 6) {
      xOffset = strokeWidth * (1.0 - offset * sign(sinABC)) + antialiasing;
    }
  }

  // handle far end
  if (farMode >= 4) {
    float angleDC = atan2(D.y - C.y, (D.x - C.x) * aspect);
    if (D.xy == C.xy)  angleDC = angleCB;
    float angleBCD = angleDC - angleCB;
    // ensure angle is in the range [-PI, PI], then take the half angle
    angleBCD = (mod(angleBCD + 3.0 * PI, 2.0 * PI) - PI) / 2.0;
    cosBCD = cos(angleBCD);  sinBCD = sin(angleBCD);
    // if this angle is close to flat, pass-through the join
    if (farMode >= 4 && (cosBCD > 0.999999 || cosBCD < dcLimit)) {
      farMode = 3;
    }
    // miter, miter-clip
    if (farMode == 4 || farMode == 7) {
      if (cosBCD < 0.000001 || 1.0 / cosBCD > miterLimit) {
        if (farMode == 4)  farMode = 5;
      } else {
        farMode = 4;
      }
    }
  }

  // compute the location of a vertex to include everything that might
  // need to be rendered
  xOffset *= -1.0;
  gl_Position = vec4(
    B.x + (xOffset * cos(angleCB) - yOffset * sin(angleCB)) * pixelWidth,
    B.y + (xOffset * sin(angleCB) + yOffset * cos(angleCB)) * pixelWidth * aspect,
    B.z, 1.0);
  // store other values needed to determine which pixels to plot.
  if (vertex == 0 || vertex == 1) {
    subpos = vec4(xOffset, yOffset, lineLength - xOffset, strokeWidth);
    info = vec4(float(nearMode), float(farMode), offset, 0.0);
    angles = vec4(cosABC, sinABC, cosBCD, sinBCD);
  } else {
    subpos = vec4(lineLength - xOffset, -yOffset, xOffset, strokeWidth);
    info = vec4(float(farMode), float(nearMode), -offset, 0.0);
    angles = vec4(cosBCD, -sinBCD, cosABC, -sinABC);
  }
}
