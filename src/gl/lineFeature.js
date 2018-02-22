var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var lineFeature = require('../lineFeature');

var MAX_MITER_LIMIT = 100;

/* Flags are passed to the vertex shader in a float.  Since a 32-bit float has
 * 24 bits of mantissa, including the sign bit, a maximum of 23 bits of flags
 * can be passed in a float without loss or complication. */
/* vertex flags specify which direction a vertex needs to be offset */
var flagsVertex = {  // uses 2 bits
  corner: 0,
  near: 1,
  far: 3
};
var flagsLineCap = {  // uses 3 bits with flagsLineJoin
  butt: 0,
  square: 1,
  round: 2
};
var flagsLineJoin = {  // uses 3 bits with flagsLineCap
  passthrough: 3,
  miter: 4,
  bevel: 5,
  round: 6,
  'miter-clip': 7
};
var flagsNearLineShift = 2, flagsFarLineShift = 5;
var flagsNearOffsetShift = 8;  // uses 11 bits
/* Fixed flags */
var flagsDebug = {  // uses 1 bit
  normal: 0,
  debug: 1
};

/**
 * Create a new instance of lineFeature.
 *
 * @class geo.gl.lineFeature
 * @extends geo.lineFeature
 * @param {geo.lineFeature.spec} arg
 * @returns {geo.gl.lineFeature}
 */
var gl_lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof gl_lineFeature)) {
    return new gl_lineFeature(arg);
  }
  arg = arg || {};
  lineFeature.call(this, arg);

  var vgl = require('vgl');
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');

  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      m_actor,
      m_mapper,
      m_material,
      m_pixelWidthUnif,
      m_aspectUniform,
      m_miterLimitUniform,
      m_antialiasingUniform,
      m_flagsUniform,
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      m_geometry,
      s_init = this._init,
      s_update = this._update;

  /**
   * Create the vertex shader for lines.
   *
   * @returns {vgl.shader}
   */
  function createVertexShader() {
    var vertexShaderSource = [
          '#ifdef GL_ES',
          '  precision highp float;',
          '#endif',
          'attribute vec3 pos;',
          'attribute vec3 prev;',
          'attribute vec3 next;',
          'attribute vec3 far;',
          'attribute float flags;',

          'attribute vec3 strokeColor;',
          'attribute float strokeOpacity;',
          'attribute float strokeWidth;',

          'uniform mat4 modelViewMatrix;',
          'uniform mat4 projectionMatrix;',
          'uniform float pixelWidth;',
          'uniform float aspect;',
          'uniform float miterLimit;',
          'uniform float antialiasing;',

          'varying vec4 strokeColorVar;',
          'varying vec4 subpos;',  /* px, py, length - px, width */
          'varying vec4 info;',  /* near mode, far mode, offset */
          'varying vec4 angles;', /* near angle cos, sin, far angle cos, sin */

          'const float PI = 3.14159265358979323846264;',

          'vec4 viewCoord(vec3 c) {',
          '  vec4 result = projectionMatrix * modelViewMatrix * vec4(c.xyz, 1);',
          '  if (result.w != 0.0)  result = result / result.w;',
          '  return result;',
          '}',

          'void main(void)',
          '{',
          /* If any vertex has been deliberately set to a negative opacity,
           * skip doing computations on it. */
          '  if (strokeOpacity < 0.0) {',
          '    gl_Position = vec4(2, 2, 0, 1);',
          '    return;',
          '  }',
          /* convert coordinates.  We have four values, since we need to
           * calculate the angles between the lines formed by prev-pos and
           * pos-next, and between pos-next and next-far, plus know the angle
           *   (prev)---(pos)---(next)---(far) => A---B---C---D */
          '  vec4 A = viewCoord(prev);',
          '  vec4 B = viewCoord(pos);',
          '  vec4 C = viewCoord(next);',
          '  vec4 D = viewCoord(far);',
          // calculate line segment vector and angle
          '  vec2 deltaCB = C.xy - B.xy;',
          '  if (deltaCB == vec2(0.0, 0.0)) {',
          '    gl_Position = vec4(2, 2, 0, 1);',
          '    return;',
          '  }',
          '  float angleCB = atan(deltaCB.y / aspect, deltaCB.x);',
          // values we need to pass along
          '  strokeColorVar = vec4(strokeColor, strokeOpacity);',
          // extract values from our flags field
          '  int vertex = int(mod(flags, 4.0));',
          '  int nearMode = int(mod(floor(flags / 4.0), 8.0));',
          '  int farMode = int(mod(floor(flags / 32.0), 8.0));',
          // we use 11 bits of the flags for the offset, where -1023 to 1023
          // maps to -1 to 1.  The 11 bits are a signed value, so simply
          // selecting the bits will result in an unsigned values that may be
          // greater than 1, in which case we have to subtract appropriately.
          '  float offset = mod(floor(flags / 256.0), 2048.0) / 1023.0;',
          '  if (offset > 1.0)  offset -= 2048.0 / 1023.0;',
          // by default, offset by the width and don't extend lines.  Later,
          // calculate line extensions based on end cap and end join modes
          '  float yOffset = strokeWidth + antialiasing;',
          '  if (vertex == 0 || vertex == 2)  yOffset *= -1.0;',
          '  yOffset += strokeWidth * offset;',
          '  float xOffset = 0.0;',
          // end caps
          '  if (nearMode == 0) {',
          '    xOffset = antialiasing;',
          '  } else if (nearMode == 1 || nearMode == 2) {',
          '    xOffset = strokeWidth + antialiasing;',
          '  }',

          // If joining lines, calculate the angles in screen space formed by
          // the near end (A-B-C) and far end (B-C-D), and determine how much
          // space is needed for the particular join.
          //   This could be changed: if the lines are not a uniform width and
          // offset, then the functional join angle is not simply half the
          // angle between the two lines, but rather half the angle of the
          // inside edge of the the two lines.
          '  float cosABC, sinABC, cosBCD, sinBCD;',  // of half angles
          // handle near end
          '  if (nearMode >= 4) {',
          '    float angleBA = atan((B.y - A.y) / aspect, B.x - A.x);',
          '    if (A.xy == B.xy)  angleBA = angleCB;',
          '    float angleABC = angleCB - angleBA;',
          // ensure angle is in the range [-PI, PI], then take the half angle
          '    angleABC = (mod(angleABC + PI, 2.0 * PI) - PI) / 2.0;',
          '    cosABC = cos(angleABC);  sinABC = sin(angleABC);',
          // if this angle is close to flat, pass-through the join
          '    if (nearMode >= 4 && cosABC > 0.999999) {',
          '      nearMode = 3;',
          '    }',
          // miter, miter-clip
          '    if (nearMode == 4 || nearMode == 7) {',
          '      if (cosABC == 0.0 || 1.0 / cosABC > miterLimit) {',
          '        if (nearMode == 4) {',
          '          nearMode = 5;',
          '        } else {',
          '          xOffset = miterLimit * strokeWidth * (1.0 - offset * sign(sinABC)) + antialiasing;',
          '        }',
          '      } else {',
          // we add an extra 1.0 to the xOffset to make sure that fragment
          // shader is doing the clipping
          '        xOffset = abs(sinABC / cosABC) * strokeWidth * (1.0 - offset * sign(sinABC)) + antialiasing + 1.0;',
          '        nearMode = 4;',
          '      }',
          '    }',
          // bevel or round join
          '    if (nearMode == 5 || nearMode == 6) {',
          '      xOffset = strokeWidth * (1.0 - offset * sign(sinABC)) + antialiasing;',
          '    }',
          '  }',

          // handle far end
          '  if (farMode >= 4) {',
          '    float angleDC = atan((D.y - C.y) / aspect, D.x - C.x);',
          '    if (D.xy == C.xy)  angleDC = angleCB;',
          '    float angleBCD = angleDC - angleCB;',
          // ensure angle is in the range [-PI, PI], then take the half angle
          '    angleBCD = (mod(angleBCD + PI, 2.0 * PI) - PI) / 2.0;',
          '    cosBCD = cos(angleBCD);  sinBCD = sin(angleBCD);',
          // if this angle is close to flat, pass-through the join
          '    if (farMode >= 4 && cosBCD > 0.999999) {',
          '      farMode = 3;',
          '    }',
          // miter, miter-clip
          '    if (farMode == 4 || farMode == 7) {',
          '      if (cosBCD == 0.0 || 1.0 / cosBCD > miterLimit) {',
          '        if (farMode == 4)  farMode = 5;',
          '      } else {',
          '        farMode = 4;',
          '      }',
          '    }',
          '  }',

          // compute the location of a vertex to include everything that might
          // need to be rendered
          '  xOffset *= -1.0;',
          '  gl_Position = vec4(',
          '    B.x + (xOffset * cos(angleCB) - yOffset * sin(angleCB)) * pixelWidth,',
          '    B.y + (xOffset * sin(angleCB) + yOffset * cos(angleCB)) * pixelWidth * aspect,',
          '    B.z, 1);',
          // store other values needed to determine which pixels to plot.
          '  float lineLength = length(vec2(deltaCB.x, deltaCB.y / aspect)) / pixelWidth;',

          '  if (vertex == 0 || vertex == 1) {',
          '    subpos = vec4(xOffset, yOffset, lineLength - xOffset, strokeWidth);',
          '    info = vec4(float(nearMode), float(farMode), offset, 0.0);',
          '    angles = vec4(cosABC, sinABC, cosBCD, sinBCD);',
          '  } else {',
          '    subpos = vec4(lineLength - xOffset, -yOffset, xOffset, strokeWidth);',
          '    info = vec4(float(farMode), float(nearMode), -offset, 0.0);',
          '    angles = vec4(cosBCD, -sinBCD, cosABC, -sinABC);',
          '  }',
          '}'
        ].join('\n'),
        shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
  }

  /**
   * Create the fragment shader for lines.
   *
   * @param {boolean} [allowDebug] If truthy, include code that can render
   *    in debug mode.  This is mildly less efficient, even if debugging is
   *    not turned on.
   * @returns {vgl.shader}
   */
  function createFragmentShader(allowDebug) {
    var fragmentShaderSource = [
          '#ifdef GL_ES',
          '  precision highp float;',
          '#endif',
          'varying vec4 strokeColorVar;',
          'varying vec4 subpos;',
          'varying vec4 info;',
          'varying vec4 angles;',
          'uniform float antialiasing;',
          'uniform float miterLimit;',
          'uniform float fixedFlags;',
          'void main () {',
          '  vec4 color = strokeColorVar;',
          allowDebug ? '  bool debug = bool(mod(fixedFlags, 2.0));' : '',
          '  float opacity = 1.0;',
          '  int nearMode = int(info.x);',
          '  int farMode = int(info.y);',
          '  float cosABC = angles.x;',
          '  float sinABC = angles.y;',
          '  float cosBCD = angles.z;',
          '  float sinBCD = angles.w;',
          // never render on the opposite side of a miter.  This uses a bit of
          // slop, via pow(smoothstep()) instead of step(), since there are
          // precision issues in this calculation.  This doesn't wholy solve
          // the precision issue; sometimes pixels are missed or double
          // rendered along the inside seam of a miter.
          '  if (nearMode >= 4) {',
          '    float dist = cosABC * subpos.x - sinABC * subpos.y;',
          '    opacity = min(opacity, pow(smoothstep(-0.02, 0.02, dist), 0.5));',
          '    if (opacity == 0.0) {',
          allowDebug ? 'if (debug) {color.r=255.0/255.0;gl_FragColor=color;return;}' : '',
          '      discard;',
          '    }',
          '  }',
          '  if (farMode >= 4) {',
          '    float dist = cosBCD * subpos.z - sinBCD * subpos.y;',
          '    opacity = min(opacity, pow(smoothstep(-0.02, 0.02, dist), 0.5));',
          '    if (opacity == 0.0) {',
          allowDebug ? 'if (debug) {color.r=254.0/255.0;gl_FragColor=color;return;}' : '',
          '      discard;',
          '    }',
          '  }',
          // butt or square cap
          '  if ((nearMode == 0 || nearMode == 1) && subpos.x < antialiasing) {',
          '    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.x + subpos.w * float(nearMode)));',
          '  }',
          '  if ((farMode == 0 || farMode == 1) && subpos.z < antialiasing) {',
          '    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.z + subpos.w * float(farMode)));',
          '  }',
          // round cap
          '  if (nearMode == 2 && subpos.x <= 0.0) {',
          '    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.w - sqrt(pow(subpos.x, 2.0) + pow(subpos.y - info.z * subpos.w, 2.0))));',
          '  }',
          '  if (farMode == 2 && subpos.z <= 0.0) {',
          '    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.w - sqrt(pow(subpos.z, 2.0) + pow(subpos.y - info.z * subpos.w, 2.0))));',
          '  }',
          // bevel and clip joins
          '  if ((nearMode == 5 || nearMode == 7) && subpos.x < antialiasing) {',
          '    float dist = (sinABC * subpos.x + cosABC * subpos.y) * sign(sinABC);',
          '    float w = subpos.w * (1.0 - info.z * sign(sinABC));',
          '    float maxDist;',
          '    if (nearMode == 5)  maxDist = cosABC * w;',
          '    else                maxDist = miterLimit * w;',
          '    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, maxDist + dist));',
          '  }',
          '  if ((farMode == 5 || farMode == 7) && subpos.z < antialiasing) {',
          '    float dist = (sinBCD * subpos.z + cosBCD * subpos.y) * sign(sinBCD);',
          '    float w = subpos.w * (1.0 - info.z * sign(sinBCD));',
          '    float maxDist;',
          '    if (farMode == 5)  maxDist = cosBCD * w;',
          '    else               maxDist = miterLimit * w;',
          '    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, maxDist + dist));',
          '  }',
          // round join
          '  if (nearMode == 6 && subpos.x <= 0.0) {',
          '    float w = subpos.w * (1.0 - info.z * sign(sinABC));',
          '    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, w - sqrt(pow(subpos.x, 2.0) + pow(subpos.y, 2.0))));',
          '  }',
          '  if (farMode == 6 && subpos.z <= 0.0) {',
          '    float w = subpos.w * (1.0 - info.z * sign(sinBCD));',
          '    opacity = min(opacity, smoothstep(-antialiasing, antialiasing, w - sqrt(pow(subpos.z, 2.0) + pow(subpos.y, 2.0))));',
          '  }',
          // antialias along main edges
          '  if (antialiasing > 0.0) {',
          '    if (subpos.y > subpos.w * (1.0 + info.z) - antialiasing) {',
          '      opacity = min(opacity, smoothstep(antialiasing, -antialiasing, subpos.y - subpos.w * (1.0 + info.z)));',
          '    }',
          '    if (subpos.y < subpos.w * (-1.0 + info.z) + antialiasing) {',
          '      opacity = min(opacity, smoothstep(-antialiasing, antialiasing, subpos.y - subpos.w * (-1.0 + info.z)));',
          '    }',
          '  }',
          '  if (opacity == 0.0) {',
          allowDebug ? 'if (debug) {color.r=253.0/255.0;gl_FragColor=color;return;}' : '',
          '    discard;',
          '  }',
          '  color.a *= opacity;',
          '  gl_FragColor = color;',
          '}'
        ].join('\n'),
        shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
  }

 /**
   * Create and style the data needed to render the lines.
   *
   * @param {boolean} onlyStyle if true, use the existing geoemtry and just
   *    recalculate the style.
   */
  function createGLLines(onlyStyle) {
    var data = m_this.data(),
        i, j, k, v, v2, lidx,
        numSegments = 0, len,
        lineItemList, lineItem, lineItemData,
        vert = [{}, {}], v1 = vert[1],
        pos, posIdx3, firstpos, firstPosIdx3,
        strokeWidthFunc = m_this.style.get('strokeWidth'), strokeWidthVal,
        strokeColorFunc = m_this.style.get('strokeColor'), strokeColorVal,
        strokeOpacityFunc = m_this.style.get('strokeOpacity'), strokeOpacityVal,
        lineCapFunc = m_this.style.get('lineCap'), lineCapVal,
        lineJoinFunc = m_this.style.get('lineJoin'), lineJoinVal,
        strokeOffsetFunc = m_this.style.get('strokeOffset'), strokeOffsetVal,
        miterLimit = m_this.style.get('miterLimit')(data),
        antialiasing = m_this.style.get('antialiasing')(data) || 0,
        order = m_this.featureVertices(),
        posBuf, prevBuf, nextBuf, farBuf, flagsBuf, indicesBuf,
        fixedFlags = (flagsDebug[m_this.style.get('debug')(data) ? 'debug' : 'normal'] || 0),
        strokeWidthBuf, strokeColorBuf, strokeOpacityBuf,
        dest, dest3,
        geom = m_mapper.geometryData(),
        closedFunc = m_this.style.get('closed'), closedVal, closed = [],
        updateFlags = true;

    closedVal = util.isFunction(m_this.style('closed')) ? undefined : (closedFunc() || false);
    lineCapVal = util.isFunction(m_this.style('lineCap')) ? undefined : (lineCapFunc() || 'butt');
    lineJoinVal = util.isFunction(m_this.style('lineJoin')) ? undefined : (lineJoinFunc() || 'miter');
    strokeColorVal = util.isFunction(m_this.style('strokeColor')) ? undefined : strokeColorFunc();
    strokeOffsetVal = util.isFunction(m_this.style('strokeOffset')) ? undefined : (strokeOffsetFunc() || 0);
    strokeOpacityVal = util.isFunction(m_this.style('strokeOpacity')) ? undefined : strokeOpacityFunc();
    strokeWidthVal = util.isFunction(m_this.style('strokeWidth')) ? undefined : strokeWidthFunc();

    if (miterLimit !== undefined) {
      /* We impose a limit no matter what, since otherwise the growth is
       * unbounded.  Values less than 1 make no sense, since we are using the
       * SVG definition of miter length. */
      m_miterLimitUniform.set(Math.max(1, Math.min(MAX_MITER_LIMIT, miterLimit)));
    }
    m_flagsUniform.set(fixedFlags);
    m_antialiasingUniform.set(antialiasing);

    if (!onlyStyle) {
      var position = [],
          posFunc = m_this.position();
      lineItemList = new Array(data.length);
      for (i = 0; i < data.length; i += 1) {
        lineItem = m_this.line()(data[i], i);
        lineItemList[i] = lineItem;
        if (lineItem.length < 2) {
          continue;
        }
        numSegments += lineItem.length - 1;
        for (j = 0; j < lineItem.length; j += 1) {
          pos = posFunc(lineItem[j], j, lineItem, i);
          position.push(pos.x);
          position.push(pos.y);
          position.push(pos.z || 0.0);
          if (!j) {
            firstpos = pos;
          }
        }
        if (lineItem.length > 2 && (closedVal === undefined ? closedFunc(data[i], i) : closedVal)) {
          /* line is closed */
          if (pos.x !== firstpos.x || pos.y !== firstpos.y ||
              pos.z !== firstpos.z) {
            numSegments += 1;
            closed[i] = 2;  /* first and last points are distinct */
          } else {
            closed[i] = 1;  /* first point is repeated as last point */
          }
        }
      }

      position = transform.transformCoordinates(
        m_this.gcs(), m_this.layer().map().gcs(), position, 3);
      len = numSegments * order.length;
      posBuf = util.getGeomBuffer(geom, 'pos', len * 3);
      prevBuf = util.getGeomBuffer(geom, 'prev', len * 3);
      nextBuf = util.getGeomBuffer(geom, 'next', len * 3);
      farBuf = util.getGeomBuffer(geom, 'far', len * 3);

      indicesBuf = geom.primitive(0).indices();
      if (!(indicesBuf instanceof Uint16Array) || indicesBuf.length !== len) {
        indicesBuf = new Uint16Array(len);
        geom.primitive(0).setIndices(indicesBuf);
      }
      // save some information to be reused when we update only style
      m_geometry = {
        numSegments: numSegments,
        closed: closed,
        lineItemList: lineItemList,
        lineCapVal: lineCapVal,
        lineJoinVal: lineJoinVal,
        strokeOffsetVal: strokeOffsetVal
      };
    } else {
      numSegments = m_geometry.numSegments;
      closed = m_geometry.closed;
      lineItemList = m_geometry.lineItemList;
      len = numSegments * order.length;
      updateFlags = (
        (lineCapVal !== m_geometry.lineCapVal || lineCapVal === undefined) ||
        (lineJoinVal !== m_geometry.lineJoinVal || lineJoinVal === undefined) ||
        (strokeOffsetVal !== m_geometry.strokeOffsetVal || strokeOffsetVal === undefined)
      );
    }

    flagsBuf = util.getGeomBuffer(geom, 'flags', len);
    strokeWidthBuf = util.getGeomBuffer(geom, 'strokeWidth', len);
    strokeColorBuf = util.getGeomBuffer(geom, 'strokeColor', len * 3);
    strokeOpacityBuf = util.getGeomBuffer(geom, 'strokeOpacity', len);

    for (i = posIdx3 = dest = dest3 = 0; i < data.length; i += 1) {
      lineItem = lineItemList[i];
      if (lineItem.length < 2) {
        continue;
      }
      firstPosIdx3 = posIdx3;
      for (j = 0; j < lineItem.length + (closed[i] === 2 ? 1 : 0); j += 1, posIdx3 += 3) {
        lidx = j;
        if (j === lineItem.length) {
          lidx = 0;
          posIdx3 -= 3;
        }
        lineItemData = lineItem[lidx];
        /* swap entries in vert so that vert[0] is the first vertex, and
         * vert[1] will be reused for the second vertex */
        if (j) {
          v1 = vert[0];
          vert[0] = vert[1];
          vert[1] = v1;
        }
        if (!onlyStyle) {
          v1.pos = j === lidx ? posIdx3 : firstPosIdx3;
          v1.prev = lidx ? posIdx3 - 3 : (closed[i] ?
              firstPosIdx3 + (lineItem.length - 3 + closed[i]) * 3 : posIdx3);
          v1.next = j + 1 < lineItem.length ? posIdx3 + 3 : (closed[i] ?
              (j !== lidx ? firstPosIdx3 + 3 : firstPosIdx3 + 6 - closed[i] * 3) :
              posIdx3);
        }
        v1.strokeWidth = strokeWidthVal === undefined ? strokeWidthFunc(lineItemData, lidx, lineItem, i) : strokeWidthVal;
        v1.strokeColor = strokeColorVal === undefined ? strokeColorFunc(lineItemData, lidx, lineItem, i) : strokeColorVal;
        v1.strokeOpacity = strokeOpacityVal === undefined ? strokeOpacityFunc(lineItemData, lidx, lineItem, i) : strokeOpacityVal;
        if (updateFlags) {
          v1.strokeOffset = (strokeOffsetVal === undefined ? strokeOffsetFunc(lineItemData, lidx, lineItem, i) : strokeOffsetVal) || 0;
          if (v1.strokeOffset) {
            /* we use 11 bits to store the offset, and we want to store values
             * from -1 to 1, so multiply our values by 1023, and use some bit
             * manipulation to ensure that it is packed properly */
            v1.posStrokeOffset = Math.round(2048 + 1023 * Math.min(1, Math.max(-1, v1.strokeOffset))) & 0x7FF;
            v1.negStrokeOffset = Math.round(2048 - 1023 * Math.min(1, Math.max(-1, v1.strokeOffset))) & 0x7FF;
          } else {
            v1.posStrokeOffset = v1.negStrokeOffset = 0;
          }
          if (!closed[i] && (!j || j === lineItem.length - 1)) {
            v1.flags = flagsLineCap[lineCapVal === undefined ? lineCapFunc(lineItemData, lidx, lineItem, i) : lineCapVal] || flagsLineCap.butt;
          } else {
            v1.flags = flagsLineJoin[lineJoinVal === undefined ? lineJoinFunc(lineItemData, lidx, lineItem, i) : lineJoinVal] || flagsLineJoin.miter;
          }
        }

        if (j) {
          for (k = 0; k < order.length; k += 1, dest += 1, dest3 += 3) {
            v = vert[order[k][0]];
            v2 = vert[1 - order[k][0]];
            if (!onlyStyle) {
              posBuf[dest3] = position[v.pos];
              posBuf[dest3 + 1] = position[v.pos + 1];
              posBuf[dest3 + 2] = position[v.pos + 2];
            }
            if (!order[k][0]) {
              if (!onlyStyle) {
                prevBuf[dest3] = position[v.prev];
                prevBuf[dest3 + 1] = position[v.prev + 1];
                prevBuf[dest3 + 2] = position[v.prev + 2];
                nextBuf[dest3] = position[v.next];
                nextBuf[dest3 + 1] = position[v.next + 1];
                nextBuf[dest3 + 2] = position[v.next + 2];
                farBuf[dest3] = position[v2.next];
                farBuf[dest3 + 1] = position[v2.next + 1];
                farBuf[dest3 + 2] = position[v2.next + 2];
              }
              if (updateFlags) {
                flagsBuf[dest] = (flagsVertex[order[k][1]] |
                  (v.flags << flagsNearLineShift) |
                  (v2.flags << flagsFarLineShift) |
                  (v.negStrokeOffset << flagsNearOffsetShift));
              }
            } else {
              if (!onlyStyle) {
                prevBuf[dest3] = position[v.next];
                prevBuf[dest3 + 1] = position[v.next + 1];
                prevBuf[dest3 + 2] = position[v.next + 2];
                nextBuf[dest3] = position[v.prev];
                nextBuf[dest3 + 1] = position[v.prev + 1];
                nextBuf[dest3 + 2] = position[v.prev + 2];
                farBuf[dest3] = position[v2.prev];
                farBuf[dest3 + 1] = position[v2.prev + 1];
                farBuf[dest3 + 2] = position[v2.prev + 2];
              }
              if (updateFlags) {
                flagsBuf[dest] = (flagsVertex[order[k][1]] |
                  (v.flags << flagsNearLineShift) |
                  (v2.flags << flagsFarLineShift) |
                  (v.posStrokeOffset << flagsNearOffsetShift));
              }
            }
            strokeWidthBuf[dest] = v.strokeWidth;
            strokeColorBuf[dest3] = v.strokeColor.r;
            strokeColorBuf[dest3 + 1] = v.strokeColor.g;
            strokeColorBuf[dest3 + 2] = v.strokeColor.b;
            strokeOpacityBuf[dest] = v.strokeOpacity;
          }
        }
      }
    }

    m_mapper.modified();
    if (!onlyStyle) {
      geom.boundsDirty(true);
      m_mapper.boundsDirtyTimestamp().modified();
    }
  }

  /**
   * Return the arrangement of vertices used for each line segment.  Each line
   * is rendered by two triangles.  This reports how the vertices of those
   * triangles are arranged.  Each entry is a triple: the line-end number, the
   * vertex use, and the side of the line that the vertex is on.
   *
   * @returns {array[]}
   */
  this.featureVertices = function () {
    return [[0, 'corner', -1], [0, 'near', 1], [1, 'far', -1],
            [1, 'corner', 1], [1, 'near', -1], [0, 'far', 1]];
  };

  /**
   * Return the number of vertices used for each line segment.
   *
   * @returns {number}
   */
  this.verticesPerFeature = function () {
    return m_this.featureVertices().length;
  };

  /**
   * Initialize.
   *
   * @param {geo.lineFeature.spec} arg The feature specification.
   * @returns {this}
   */
  this._init = function (arg) {
    var prog = vgl.shaderProgram(),
        vs = createVertexShader(),
        fs = createFragmentShader(((arg || {}).style || {}).debug !== undefined),
        // Vertex attributes
        posAttr = vgl.vertexAttribute('pos'),
        prvAttr = vgl.vertexAttribute('prev'),
        nxtAttr = vgl.vertexAttribute('next'),
        farAttr = vgl.vertexAttribute('far'),
        flagsAttr = vgl.vertexAttribute('flags'),
        strkWidthAttr = vgl.vertexAttribute('strokeWidth'),
        strkColorAttr = vgl.vertexAttribute('strokeColor'),
        strkOpacityAttr = vgl.vertexAttribute('strokeOpacity'),
        // Shader uniforms
        mviUnif = new vgl.modelViewUniform('modelViewMatrix'),
        prjUnif = new vgl.projectionUniform('projectionMatrix'),
        geom = vgl.geometryData(),
        // Sources
        posData = vgl.sourceDataP3fv({name: 'pos'}),
        prvPosData = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Four, {name: 'prev'}),
        nxtPosData = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Five, {name: 'next'}),
        farPosData = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Six, {name: 'far'}),
        flagsData = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Seven, {name: 'flags'}),
        strkWidthData = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.One, {name: 'strokeWidth'}),
        strkColorData = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Two, {name: 'strokeColor'}),
        strkOpacityData = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Three, {name: 'strokeOpacity'}),
        // Primitive indices
        triangles = vgl.triangles();

    m_pixelWidthUnif = new vgl.floatUniform('pixelWidth',
                          1.0 / m_this.renderer().width());
    m_aspectUniform = new vgl.floatUniform('aspect',
        m_this.renderer().width() / m_this.renderer().height());
    m_miterLimitUniform = new vgl.floatUniform('miterLimit', 10);
    m_antialiasingUniform = new vgl.floatUniform('antialiasing', 0);
    m_flagsUniform = new vgl.floatUniform('fixedFlags', 0);

    s_init.call(m_this, arg);
    m_material = vgl.material();
    m_mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(strkWidthAttr, vgl.vertexAttributeKeysIndexed.One);
    prog.addVertexAttribute(strkColorAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(strkOpacityAttr, vgl.vertexAttributeKeysIndexed.Three);
    prog.addVertexAttribute(prvAttr, vgl.vertexAttributeKeysIndexed.Four);
    prog.addVertexAttribute(nxtAttr, vgl.vertexAttributeKeysIndexed.Five);
    prog.addVertexAttribute(farAttr, vgl.vertexAttributeKeysIndexed.Six);
    prog.addVertexAttribute(flagsAttr, vgl.vertexAttributeKeysIndexed.Seven);

    prog.addUniform(mviUnif);
    prog.addUniform(prjUnif);
    prog.addUniform(m_pixelWidthUnif);
    prog.addUniform(m_aspectUniform);
    prog.addUniform(m_miterLimitUniform);
    prog.addUniform(m_antialiasingUniform);
    prog.addUniform(m_flagsUniform);

    prog.addShader(fs);
    prog.addShader(vs);

    m_material.addAttribute(prog);
    m_material.addAttribute(vgl.blend());

    m_actor = vgl.actor();
    m_actor.setMaterial(m_material);
    m_actor.setMapper(m_mapper);

    geom.addSource(posData);
    geom.addSource(prvPosData);
    geom.addSource(nxtPosData);
    geom.addSource(farPosData);
    geom.addSource(strkWidthData);
    geom.addSource(strkColorData);
    geom.addSource(strkOpacityData);
    geom.addSource(flagsData);
    geom.addPrimitive(triangles);
    m_mapper.setGeometryData(geom);
    return m_this;
  };

  /**
   * Return list of vgl actorss used for rendering.
   *
   * @returns {vgl.actor[]}
   */
  this.actors = function () {
    if (!m_actor) {
      return [];
    }
    return [m_actor];
  };

  /**
   * Build.  Create the necessary elements to render lines.
   *
   * There are several optimizations to do less work when possible.  If only
   * styles have changed, the geometry is not re-transformed.  If styles use
   * static values (rather than functions), they are only calculated once.  If
   * styles have not changed that would affect flags (lineCap, lineJoin, and
   * strokeOffset), the vertex flags are not recomputed -- this helps, as it is
   * a slow step due to most javascript interpreters not optimizing bit
   * operations.
   *
   * @returns {this}
   */
  this._build = function () {
    createGLLines(m_this.dataTime().getMTime() < m_this.buildTime().getMTime() && m_geometry);

    if (!m_this.renderer().contextRenderer().hasActor(m_actor)) {
      m_this.renderer().contextRenderer().addActor(m_actor);
    }
    m_this.buildTime().modified();
    return m_this;
  };

  /**
   * Update.  Rebuild if necessary.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() <= m_this.getMTime()) {
      m_this._build();
    }

    m_pixelWidthUnif.set(1.0 / m_this.renderer().width());
    m_aspectUniform.set(m_this.renderer().width() /
                        m_this.renderer().height());
    m_actor.setVisible(m_this.visible());
    m_actor.material().setBinNumber(m_this.bin());
    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Destroy.  Free used resources.
   */
  this._exit = function () {
    m_this.renderer().contextRenderer().removeActor(m_actor);
    m_actor = null;
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(gl_lineFeature, lineFeature);

var capabilities = {};
capabilities[lineFeature.capabilities.basic] = true;
capabilities[lineFeature.capabilities.multicolor] = true;

// Now register it
registerFeature('vgl', 'line', gl_lineFeature, capabilities);

module.exports = gl_lineFeature;
