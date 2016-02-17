//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class quadFeature
 *
 * @class
 * @param {Object} arg Options object
 * @extends geo.quadFeature
 * @returns {geo.canvas.quadFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.canvas.quadFeature = function (arg) {
  'use strict';

  if (!(this instanceof geo.canvas.quadFeature)) {
    return new geo.canvas.quadFeature(arg);
  }
  geo.quadFeature.call(this, arg);

  var m_this = this,
      s_exit = this._exit,
      s_init = this._init,
      s_update = this._update,
      m_quads;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build this feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var mapper, mat, prog, srctex, geom;

    if (!m_this.position()) {
      return;
    }
    m_quads = this._generateQuads();
  };

  /**
   * Render all of the color quads using a single mapper.
   *
   * @param renderState: the render state used for the render.
   */
  this._renderColorQuads = function (renderState) {
      // ....
      // Not implemented yet.
  };

  /**
   * Render all of the image quads using a single mapper.
   *
   * @param renderState: the render state used for the render.
   */
  this._renderImageQuads = function (context2d, map) {
    if (!m_quads.imgQuads.length) {
      return;
    }

    $.each(m_quads.imgQuads, function (idx, quad) {
      var w = quad.image.width,
          h = quad.image.height;
      // Canvas transform is affine, so quad has to be a parallelogram
      // Also, canvas has no way to render z.

      // Tiles should be rendered from low res to high res.  Except for
      // computing their size, I see no way of finding out the level of
      // these quads.
      var p0 = map.gcsToDisplay({x:quad.pos[0], y:quad.pos[1]},null),
          p3 = map.gcsToDisplay({x:quad.pos[9], y:quad.pos[10]},null),
          p2 = map.gcsToDisplay({x:quad.pos[6], y:quad.pos[7]},null);
      context2d.setTransform((p3.x-p2.x)/w, (p3.y-p2.y)/h,
                             (p0.x-p2.x)/w, (p0.y-p2.y)/h,
                             p2.x, p2.y);

      context2d.drawImage(quad.image, 0, 0);
      /*
      if (quad.opacity !== opacity) {
        opacity = quad.opacity;
      }
      */
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    }

    m_this.updateTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    s_init.call(m_this, arg);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {

    s_exit.call(m_this);
  };

  m_this._init(arg);
  return this;
};

inherit(geo.canvas.quadFeature, geo.quadFeature);

// Now register it
geo.registerFeature('canvas', 'quad', geo.canvas.quadFeature);
