/* markerFeature common fragment shader */

#ifdef GL_ES
  precision highp float;
#endif
varying float radiusVar;
varying vec4 fillColorVar;
varying vec4 strokeColorVar;
varying float strokeWidthVar;
varying float symbolVar;  /* contains some bit fields */
varying float symbolValueVar;
varying float rotationVar;
// the square/triangle shader defines unitVar
const int symbolEllipse = 0;
const int symbolFlowerBase = 1;
const int symbolFlowerMax = 16;
const int symbolTriangle = 16;
const int symbolStarBase = 17;
const int symbolStarMax = 16;
const int symbolRectangle = 32;
const int symbolCrossBase = 33;
const int symbolCrossMax = 16;
const int symbolOval = 48;
const int symbolJackBase = 49;
const int symbolJackMax = 16;
const int symbolDrop = 64;
const int symbolDropBase = 65;
const int symbolDropMax = 16;
const int symbolArrow = 80;
const int symbolArrowBase = 81;
const int symbolArrowMax = 16;
// Distance to antialias in pixels
const float antialiasDist = 1.5;

/* Compute the distance from a point to an arrow defined by the radiusVar and a
 * packed value containing
 *   headWidth: ratio to radius (0, 1]
 *   headLength: ratio to diameter (0, 1]
 *   stemWidth: ratio to headWidth [0, 1]
 *   sweep: boolean
 *
 * Enter: vec2 pos: the point in pixel coordinates.
 *        float packed: the packed value.
 * Exit:  float dist: the distance to the drop in pixels.  Negative is inside.
 */
float distanceToArrow(vec2 pos, float value) {
  bool sweep = value < 0.0;
  value = abs(value);
  float pack0 = (mod(value, 252.0) - 1.0) / 250.0;
  value = floor(value / 252.0);
  float pack1 = (mod(value, 252.0) - 1.0) / 250.0;
  value = floor(value / 252.0);
  float pack2 = (mod(value, 252.0) - 1.0) / 250.0;

  float headWidth = (pack0 > 0.0 ? pack0 : 2.0 / 3.0);
  float headEnd = 1.0 - 2.0 * (pack1 > 0.0 ? pack1 : 1.0 / 2.0);
  float stemWidth = headWidth * (pack2 >= 0.0 ? pack2 : 1.0 / 3.0);
  if (length(vec2(headWidth, headEnd)) > 1.0) {
    vec2 scaledHead = normalize(vec2(headWidth, headEnd));
    headWidth = scaledHead.x;
    headEnd = scaledHead.y;
  }
  float stemEnd = -cos(asin(stemWidth));

  headWidth *= radiusVar;
  headEnd *= radiusVar;
  stemWidth *= radiusVar;
  stemEnd *= radiusVar;
  pos.y = abs(pos.y);
  float stemDist = pos.y - stemWidth;
  float stemEndDist = stemEnd - pos.x;
  float B = (radiusVar - headEnd) / headWidth;
  float headDist = (pos.x + B * pos.y - radiusVar) / sqrt(1.0 + B * B);
  float headEndDist;
  if (sweep) {
    B = (radiusVar - headEnd) / 3.0 / headWidth;
    headEndDist = -(pos.x + B * pos.y - (radiusVar + headEnd * 2.0) / 3.0) / sqrt(1.0 + B * B);
  } else {
    headEndDist = headEnd - pos.x;
  }
  headEndDist = min(headEndDist, stemDist);
  return max(max(headDist, headEndDist), stemEndDist);
}

/* Compute the distance from a point to a drop defined by the radiusVar (the
 * semimajor axis) and ratio (between the minor and major radii).
 *
 * Enter: vec2 pos: the point in pixel coordinates.
 *        float ratio: ratio of minor / major axes.
 * Exit:  float dist: the distance to the drop in pixels.  Negative is inside.
 */
float distanceToDrop(vec2 pos, float ratio) {
  ratio = abs(ratio);
  if (ratio == 0.0 || ratio >= 1.0) {
    ratio = 1.0;
  }
  float r = radiusVar * ratio;
  float cx = radiusVar - r;
  float rad = distance(pos.xy, vec2(cx, 0.0)) - r;
  if (ratio < 0.5) {
    float x = radiusVar - r - r * r / cx;
    float y = sqrt(r * r - (cx - x) * (cx - x));
    float Bt = (cx - x) / y;
    if ((pos.x + Bt * abs(pos.y) - cx) / sqrt(1.0 + Bt * Bt) < 0.0) {
      float B = -x / y;
      return -(pos.x + B * abs(pos.y)) / sqrt(1.0 + B * B);
    }
  }
  return rad;
}

/* Compute the distance from a point to the ellipse defined by the radiusVar
 * (the semimajor axis) and ratio (between the minor and major axes).
 *
 * Enter: vec2 pos: the point in pixel coordinates.
 *        float ratio: ratio of minor / major axes.
 * Exit:  float dist: the distance to the ellipse in pixels.  Negative is
 *   inside.
 */
float distanceToEllipse(vec2 pos, float ratio) {
  // a and b are the semi-major and semi-minor axes
  // ratio is the between the minor and major axes.  If > 1, swap these and
  // rotate 90 degrees.
  if (ratio == 0.0) {
    ratio = 1.0;
  }
  float a = radiusVar, b = abs(radiusVar * ratio);
  if (b > a) {
    pos = vec2(pos.y, -pos.x);
    b = abs(radiusVar / ratio);
  }
  float a2 = a * a, b2 = b * b;
  // compute the distance to the ellipse.  See this discussion:
  // https://stackoverflow.com/questions/22959698
  float f = sqrt(a2 - b2),
        // this value will be positive if outside and negative if inside.  If
        // we used it directly, the stroke would be too thick along the long
        // edges of the ellipse
        d = (distance(pos, vec2(f, 0.0)) + distance(pos, vec2(-f, 0.0))) * 0.5 - a;
  // if we are outside of the ellipse, accuracy is not important, so return
  // early.
  if (d >= 0.0) {
    return d;
  }
  // work in one quadrant
  pos = abs(pos);
  // t (the angle from center) could start as `atan(pos.y, pos.x)`, but this
  // results in a slower solution near narrow ends
  float t = 0.7;
  float cost = cos(t), sint = sin(t), x = a * cost, y = b * sint;
  vec2 lastxy;
  for (int iter = 0; iter < 10; iter += 1) {
    lastxy = vec2(x, y);
    float ex = (a2 - b2) * pow(cost, 3.0) / a,
          ey = (b2 - a2) * pow(sint, 3.0) / b;
    vec2 r = vec2(x - ex, y - ey),
         q = vec2(pos.x - ex, pos.y - ey);
    float lenr = length(r);
    t += lenr * asin((r.x * q.y - r.y * q.x) / lenr / length(q)) / sqrt(a2 + b2 - x * x - y * y);
    t = clamp(t, 0.0, acos(0.0));
    cost = cos(t);
    sint = sin(t);
    x = a * cost;
    y = b * sint;
    if (distance(lastxy, vec2(x, y)) < 0.05) {
      break;
    }
  }
  return sign(d) * distance(pos, vec2(x, y));
}

/* Compute the distance from a point to an isosceles triangle.
 *
 * Enter: vec2 pos: the point in pixel coordinates.
 *        float ratio: length of the base compared to the other sides.
 * Exit:  float dist: the distance to the rectangle in pixels.  Negative is
 *   inside.
 */
float distanceToIsoscelesTriangle(vec2 pos, float ratio) {
  ratio = clamp(abs(ratio), 0.0, 2.0);
  if (ratio == 0.0 || ratio == 2.0) {
    ratio = 1.0;
  }
  float s1, s2, x0, x1, y1;
  if (ratio < sqrt(2.0)) {
    s1 = radiusVar * sqrt(4.0 - ratio * ratio); // length of equal sides
    s2 = s1 * ratio;
    y1 = s2 / 2.0;
    x0 = radiusVar;
    x1 = x0 - sqrt(s1 * s1 - y1 * y1);
  } else {
    s2 = radiusVar * 2.0;
    s1 = s2 / ratio;
    y1 = s2 / 2.0;
    x0 = sqrt(s1 * s1 - y1 * y1);
    x1 = 0.0;
  }
  float B = (x0 - x1) / y1;
  return max(x1 - pos.x, (pos.x + B * abs(pos.y) - x0) / sqrt(1.0 + B * B));
}

/* Compute the distance from a point to an oval defined by the radiusVar (the
 * semimajor axis) and ratio (between the minor and major axes).  Here an oval
 * is defined as two semicircles connected by straight line segments.
 *
 * Enter: vec2 pos: the point in pixel coordinates.
 *        float ratio: ratio of minor / major axes.
 * Exit:  float dist: the distance to the oval in pixels.  Negative is inside.
 */
float distanceToOval(vec2 pos, float ratio) {
  ratio = abs(ratio);
  if (ratio == 0.0 || ratio >= 1.0) {
    ratio = 1.0;
  }
  float minor = radiusVar * ratio;
  float center = radiusVar - minor;
  pos = abs(pos);
  if (pos.x <= center) {
    return pos.y - minor;
  }
  return distance(pos, vec2(center, 0.0)) - minor;
}

/* Compute the distance from a point to a rectangle defined by the radiusVar
 * (the semidiagonal) and ratio (between the minor and major axes).
 *
 * Enter: vec2 pos: the point in pixel coordinates.
 *        float ratio: ratio of minor / major axes.
 * Exit:  float dist: the distance to the rectangle in pixels.  Negative is
 *   inside.
 */
float distanceToRectangle(vec2 pos, float ratio) {
  ratio = abs(ratio);
  if (ratio == 0.0) {
    ratio = 1.0;
  }
  vec2 wh = normalize(vec2(1.0, abs(ratio))) * radiusVar;
  vec2 dist = abs(pos) - wh;
  return max(dist.x, dist.y);
}

/* Based on a repetition value, return a position for rotational symmetry.
 *
 * Enter: vec2 pos: the point in pixel coordinates.
 *        int repetitions: number of repetitions on the cross.
 * Exit:  float dist: a point in the primary position.
 */
vec2 rotationalSymmetry(vec2 pos, int repetitions) {
  float pi = acos(-1.0);
  float limit = pi / float(repetitions);
  float ang = atan(pos.y, pos.x);
  ang = mod(ang + pi * 2.0, limit * 2.0);
  if (ang > limit) {
    ang -= limit * 2.0;
  }
  return vec2(cos(ang), sin(ang)) * length(pos);
}

float markerFeatureFragment(vec3 posAndSpacing) {
  vec2 pos = posAndSpacing.xy;
  float spacing = posAndSpacing.z;
  // square lattice
  if (spacing > 0.0) {
    pos.x = mod(pos.x + spacing * 0.5, spacing) - spacing * 0.5;
    pos.y = mod(pos.y + spacing * 0.5, spacing) - spacing * 0.5;
  }
  // triangular lattice
  if (spacing < 0.0) {
    spacing = spacing * -1.0;
    float cz = (2.0 * pos.y) / (sqrt(3.0) * spacing);
    float cx = pos.x / spacing - 0.5 * cz;
    float cy = -cx - cz;
    float rx = floor(cx + 0.5);
    float ry = floor(cy + 0.5);
    float rz = floor(cz + 0.5);
    float dx = abs(rx - cx);
    float dy = abs(ry - cy);
    float dz = abs(rz - cz);
    if (dx > dy && dx > dz) {
      rx = -ry - rz;
    } else if (dy > dz) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }
    vec2 center = vec2(spacing * (rx + 0.5 * rz), (sqrt(3.0) * spacing * 0.5) * rz);
    pos = pos - center;
  }
  // rad is a value in pixels from the edge of the symbol where negative is
  // inside the shape
  float rad = length(pos.xy) - radiusVar;
  // never allow points outside of the main radius
  if (rad > 0.0) {
    return 0.0;
  }
  // apply clockwise rotation
  if (rotationVar != 0.0) {
    float cosr = cos(rotationVar), sinr = sin(rotationVar);
    pos = vec2(pos.x * cosr + pos.y * sinr, -pos.x * sinr + pos.y * cosr);
  }

  int symbol = int(floor(symbolVar / 64.0));
  bool isimage = bool(mod(floor(symbolVar / 8.0), 2.0));
  vec4 fillColor, strokeColor;
  float endStep;

  float ratio = symbolValueVar;
  // When ratio is 0, it usually gets changed to 1; some shapes could have
  // better defaults
  /* Symbol shapes */
  if (symbol == symbolTriangle) {
    rad = distanceToIsoscelesTriangle(pos, ratio);
  } else if (symbol == symbolRectangle) {
    rad = distanceToRectangle(pos, ratio);
  } else if (symbol == symbolOval) {
    rad = distanceToOval(pos, ratio);
  } else if (symbol == symbolDrop) {
    rad = distanceToDrop(pos, ratio);
  } else if (symbol == symbolArrow) {
    rad = distanceToArrow(pos, ratio);
  } else if (symbol >= symbolCrossBase && symbol <= symbolCrossBase + symbolCrossMax - 2) {
    rad = distanceToRectangle(rotationalSymmetry(pos, symbol - symbolCrossBase + 2), ratio);
  } else if (symbol >= symbolFlowerBase && symbol <= symbolFlowerBase + symbolFlowerMax - 2) {
    rad = distanceToEllipse(rotationalSymmetry(pos, symbol - symbolFlowerBase + 2), ratio);
  } else if (symbol >= symbolStarBase && symbol <= symbolStarBase + symbolStarMax - 2) {
    rad = distanceToIsoscelesTriangle(rotationalSymmetry(pos, symbol - symbolStarBase + 2), ratio);
  } else if (symbol >= symbolJackBase && symbol <= symbolJackBase + symbolJackMax - 2) {
    rad = distanceToOval(rotationalSymmetry(pos, symbol - symbolJackBase + 2), ratio);
  } else if (symbol >= symbolDropBase && symbol <= symbolDropBase + symbolDropMax - 2) {
    rad = distanceToDrop(rotationalSymmetry(pos, symbol - symbolDropBase + 2), ratio);
  } else if (symbol >= symbolArrowBase && symbol <= symbolArrowBase + symbolArrowMax - 2) {
    rad = distanceToArrow(rotationalSymmetry(pos, symbol - symbolArrowBase + 2), ratio);
  } else { // default - circle or ellipse; a value of 0 or 1 is a circle
    if (ratio != 0.0 && ratio != 1.0) {
      rad = distanceToEllipse(pos, ratio);
    }
  }

  if (rad >= 0.0) {
    return 0.0;
  }
  // If there is no stroke, the fill region should transition to nothing
  if (strokeColorVar.a == 0.0 || strokeWidthVar <= 0.0) {
    strokeColor = vec4(fillColorVar.rgb, 0.0);
    endStep = 0.0;
  } else {
    strokeColor = strokeColorVar;
    endStep = -strokeWidthVar;
  }
  // Likewise, if there is no fill, the stroke should transition to nothing
  if (fillColorVar.a == 0.0) {
    fillColor = vec4(strokeColorVar.rgb, 0.0);
  } else {
    fillColor = fillColorVar;
  }
  float alpha = 1.0;
  if (rad <= endStep) {
    float step = smoothstep(endStep - antialiasDist, endStep, rad);
    vec4 color = mix(fillColor, strokeColor, step);
    float step2 = smoothstep(-antialiasDist, 0.0, rad);
    gl_FragColor = mix(color, vec4(color.rgb, 0.0), step2);
    if (color.a > 0.0)
      alpha = gl_FragColor.a / color.a;
  } else {
    float step = smoothstep(-antialiasDist, 0.0, rad);
    gl_FragColor = mix(strokeColor, vec4(strokeColor.rgb, 0.0), step);
    if (strokeColor.a > 0.0)
      alpha = gl_FragColor.a / strokeColor.a;
  }
  return alpha;
}
