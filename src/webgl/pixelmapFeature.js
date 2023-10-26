var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pixelmapFeature = require('../pixelmapFeature');
var lookupTable2D = require('./lookupTable2D');
var util = require('../util');

/**
 * Create a new instance of class webgl.pixelmapFeature.
 *
 * @class
 * @alias geo.webgl.pixelmapFeature
 * @extends geo.pixelmapFeature
 * @param {geo.pixelmapFeature.spec} arg
 * @returns {geo.webgl.pixelmapFeature}
 */
var webgl_pixelmapFeature = function (arg) {
  'use strict';

  if (!(this instanceof webgl_pixelmapFeature)) {
    return new webgl_pixelmapFeature(arg);
  }
  pixelmapFeature.call(this, arg);

  var object = require('./object');
  object.call(this);

  const vgl = require('../vgl');
  const fragmentShader = require('./pixelmapFeature.frag');

  var m_quadFeature,
      m_quadFeatureInit,
      s_exit = this._exit,
      m_lookupTable,
      m_this = this;

  /**
   * If the specified coordinates are in the rendered quad, use the basis
   * information from the quad to determine the pixelmap index value so that it
   * can be included in the `found` results.
   *
   * @param {geo.geoPosition} geo Coordinate.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.feature.searchResult} An object with a list of features and
   *    feature indices that are located at the specified point.
   */
  this.pointSearch = function (geo, gcs) {
    if (m_quadFeature && m_this.m_info) {
      let result = m_quadFeature.pointSearch(geo, gcs);
      // use the last index by preference, since for tile layers, this is the
      // topmosttile
      let idxIdx = result.index.length - 1;
      for (; idxIdx >= 0; idxIdx -= 1) {
        if (result.extra[result.index[idxIdx]]._quad &&
            result.extra[result.index[idxIdx]]._quad.image) {
          const img = result.extra[result.index[idxIdx]]._quad.image;
          const basis = result.extra[result.index[idxIdx]].basis;
          const x = Math.floor(basis.x * img.width);
          const y = Math.floor(basis.y * img.height);
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d');
          context.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
          const pixel = context.getImageData(0, 0, 1, 1).data;
          const idx = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;
          result = {
            index: [idx],
            found: [m_this.data()[idx]]
          };
          return result;
        }
      }
    }
    return {index: [], found: []};
  };

  /**
   * Given the loaded pixelmap image, create a texture for the colors and a
   * quad that will use it.
   */
  this._computePixelmap = function () {
    var data = m_this.data() || [],
        colorFunc = m_this.style.get('color');

    let indexRange = m_this.indexModified(undefined, 'clear');
    let fullUpdate = m_this.dataTime().timestamp() >= m_this.buildTime().timestamp() || indexRange === undefined;
    if (!m_lookupTable) {
      m_lookupTable = lookupTable2D();
      m_lookupTable.setTextureUnit(1);
      fullUpdate = true;
    }
    let clrLen = Math.max(1, data.length);
    const maxWidth = m_lookupTable.maxWidth();
    if (clrLen > maxWidth && clrLen % maxWidth) {
      clrLen += maxWidth - (clrLen % maxWidth);
    }

    let colors;
    if (!fullUpdate) {
      colors = m_lookupTable.colorTable();
      fullUpdate = colors.length !== clrLen * 4;
      indexRange[0] = Math.max(0, indexRange[0]);
      indexRange[1] = Math.min(data.length, indexRange[1] + 1);
    }
    if (fullUpdate) {
      colors = new Uint8Array(clrLen * 4);
      indexRange = [0, data.length];
    }
    for (let i = indexRange[0]; i < indexRange[1]; i += 1) {
      const d = data[i];
      const color = util.convertColor(colorFunc.call(m_this, d, i));
      colors[i * 4] = color.r * 255;
      colors[i * 4 + 1] = color.g * 255;
      colors[i * 4 + 2] = color.b * 255;
      colors[i * 4 + 3] = color.a === undefined ? 255 : (color.a * 255);
    }
    m_this.m_info = {colors: colors};
    // check if colors haven't changed
    var oldcolors = m_lookupTable.colorTable();
    if (oldcolors && oldcolors.length === colors.length) {
      let idx = indexRange[0] * 4;
      for (; idx < indexRange[1] * 4; idx += 1) {
        if (colors[idx] !== oldcolors[idx]) {
          break;
        }
      }
      if (idx === indexRange[1] * 4) {
        return;
      }
    }
    m_lookupTable.colorTable(colors);
    /* If we haven't made a quad feature, make one now */
    if (!m_quadFeature) {
      m_quadFeature = m_this.layer().createFeature('quad', {
        selectionAPI: false,
        gcs: m_this.gcs(),
        visible: m_this.visible(undefined, true),
        nearestPixel: true
      });
      m_quadFeatureInit = false;
    }
    if (!m_quadFeatureInit) {
      m_this.dependentFeatures([m_quadFeature]);
      m_quadFeature.setShader('image_fragment', fragmentShader);
      m_quadFeature._hookBuild = (prog) => {
        const lutSampler = new vgl.uniform(vgl.GL.INT, 'lutSampler');
        lutSampler.set(m_lookupTable.textureUnit());
        prog.addUniform(lutSampler);
        const lutWidth = new vgl.uniform(vgl.GL.INT, 'lutWidth');
        lutWidth.set(m_lookupTable.width);
        prog.addUniform(lutWidth);
        const lutHeight = new vgl.uniform(vgl.GL.INT, 'lutHeight');
        lutHeight.set(m_lookupTable.height);
        prog.addUniform(lutHeight);
      };
      m_quadFeature._hookRenderImageQuads = (renderState, quads) => {
        m_lookupTable.bind(renderState, quads);
      };
      if (m_quadFeatureInit === false) {
        m_quadFeature.style({
          image: m_this.m_srcImage,
          position: m_this.style.get('position')})
        .data([{}])
        .draw();
      }
      m_quadFeatureInit = true;
    }
  };

  /**
   * Destroy.  Deletes the associated quadFeature.
   *
   * @returns {this}
   */
  this._exit = function () {
    if (m_quadFeature && m_this.layer()) {
      m_this.layer().deleteFeature(m_quadFeature);
      m_quadFeature = null;
      m_this.dependentFeatures([]);
    }
    s_exit();
    return m_this;
  };

  if (arg.quadFeature) {
    m_quadFeature = arg.quadFeature;
    if (m_quadFeature.nearestPixel) {
      m_quadFeature.nearestPixel(true);
    }
  }
  this._init(arg);
  return this;
};

inherit(webgl_pixelmapFeature, pixelmapFeature);

// Now register it
var capabilities = {};
capabilities[pixelmapFeature.capabilities.lookup] = true;

registerFeature('webgl', 'pixelmap', webgl_pixelmapFeature, capabilities);
module.exports = webgl_pixelmapFeature;
