/* pointFeature common fragment shader */

#ifdef GL_ES
  precision highp float;
#endif
varying vec4 fillColorVar;
varying vec4 strokeColorVar;
varying float radiusVar;
varying float strokeWidthVar;

void pointFeatureFragment(float rad) {
  vec4 strokeColor, fillColor;
  float endStep;
  // No stroke or fill implies nothing to draw
  if (rad > 1.0)
    discard;
  // If there is no stroke, the fill region should transition to nothing
  if (strokeColorVar.a == 0.0) {
    strokeColor = vec4(fillColorVar.rgb, 0.0);
    endStep = 1.0;
  } else {
    strokeColor = strokeColorVar;
    endStep = radiusVar / (radiusVar + strokeWidthVar);
  }
  // Likewise, if there is no fill, the stroke should transition to nothing
  if (fillColorVar.a == 0.0)
    fillColor = vec4(strokeColor.rgb, 0.0);
  else
    fillColor = fillColorVar;
  // Distance to antialias over.  First number is in pixels
  float antialiasDist = 1.5 / (radiusVar + strokeWidthVar);
  if (rad < endStep) {
    float step = smoothstep(max(0.0, endStep - antialiasDist), endStep, rad);
    vec4 color = mix(fillColor, strokeColor, step);
    float step2 = smoothstep(max(0.0, 1.0 - antialiasDist), 1.0, rad);
    gl_FragColor = mix(color, vec4(color.rgb, 0.0), step2);
  } else {
    float step = smoothstep(max(0.0, 1.0 - antialiasDist), 1.0, rad);
    gl_FragColor = mix(strokeColor, vec4(strokeColor.rgb, 0.0), step);
  }
}
