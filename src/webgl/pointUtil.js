var pointFeature = require('../pointFeature');

/**
 * Extend a point-like feature with additional functions.
 *
 * @param {this} m_this The point-like feature.
 * @param {object} [arg] Feature defintion object that might specify the
 *      primitive shape.
 */
function pointUtil(m_this, arg) {
  arg = arg || {};

  m_this._primitiveShapeAuto = true;
  m_this._primitiveShape = pointFeature.primitiveShapes.auto;
  if (pointFeature.primitiveShapes[arg.primitiveShape] !== undefined) {
    m_this._primitiveShape = arg.primitiveShape;
  }
  m_this._primitiveShapeAuto = m_this._primitiveShape === pointFeature.primitiveShapes.auto;
  if (m_this._primitiveShapeAuto) {
    m_this._primitiveShape = pointFeature.primitiveShapes.sprite;
    m_this._primitiveShapeAuto = true;
  }

  /**
   * Given the current primitive shape and a basic size, return a set of
   * vertices that can be used for a generic point.
   *
   * @param {number} x The base x coordinate.  Usually 0.
   * @param {number} y The base y coordinate.  Usually 0.
   * @param {number} w The base width.  Usually 1.
   * @param {number} h The base height.  Usually 1.
   * @returns {number[]} A flat array of vertices in the form of
   *    `[x0, y0, x1, y1, ...]`.
   */
  m_this._pointPolygon = function (x, y, w, h) {
    var verts;
    switch (m_this._primitiveShape) {
      case pointFeature.primitiveShapes.triangle:
        /* Use an equilateral triangle.  While this has 30% more area than a
         * square, the reduction in vertices should help more than the
         * processing the additional fragments. */
        verts = [
          x, y - h * 2,
          x - w * Math.sqrt(3.0), y + h,
          x + w * Math.sqrt(3.0), y + h
        ];
        break;
      case pointFeature.primitiveShapes.square:
        /* Use a surrounding square split diagonally into two triangles. */
        verts = [
          x - w, y + h,
          x - w, y - h,
          x + w, y + h,
          x - w, y - h,
          x + w, y - h,
          x + w, y + h
        ];
        break;
      default: // sprite
        /* Point sprite uses only one vertex per point. */
        verts = [x, y];
        break;
    }
    return verts;
  };

  /**
   * Return the number of vertices used for each point.
   *
   * @returns {number}
   */
  m_this.verticesPerFeature = function () {
    var unit = m_this._pointPolygon(0, 0, 1, 1);
    return unit.length / 2;
  };

  /**
   * Get or set the primitiveShape.
   *
   * @param {geo.pointFeature.primitiveShapes} [primitiveShape] If specified,
   *   the new primitive shape.
   * @param {boolean} [currentShape] If truthy and getting the shape, return
   *   the shape currently in use if the shape is set to `auto`.  If falsy,
   *   return the specifiec primitiveShape, which may be `auto`.
   * @returns {geo.pointFeature.primitiveShapes|this} The primitiveShape or
   *   this instance of the feature.
   */
  m_this.primitiveShape = function (primitiveShape, currentShape) {
    if (primitiveShape === undefined) {
      return currentShape || !m_this._primitiveShapeAuto ? m_this._primitiveShape : pointFeature.primitiveShapes.auto;
    }
    if (pointFeature.primitiveShapes[primitiveShape] !== undefined) {
      var update = false;
      if (primitiveShape === pointFeature.primitiveShapes.auto) {
        update = !m_this._primitiveShapeAuto;
        m_this._primitiveShapeAuto = true;
      } else {
        update = m_this._primitiveShapeAuto || m_this._primitiveShape !== primitiveShape;
        m_this._primitiveShapeAuto = false;
        m_this._primitiveShape = primitiveShape;
      }
      if (update) {
        m_this.renderer().contextRenderer().removeActor(m_this.actors()[0]);
        m_this._init(true);
        m_this.modified();
      }
    }
    return m_this;
  };
}

module.exports = pointUtil;
