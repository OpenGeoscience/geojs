var registerLayerAdjustment = require('../registry').registerLayerAdjustment;

var webgl_layer = function () {
  'use strict';

  var createRenderer = require('../registry').createRenderer;
  var geo_event = require('../event');
  var webglRenderer = require('./webglRenderer');

  var m_this = this,
      s_init = this._init,
      s_opacity = this.opacity,
      s_visible = this.visible,
      s_zIndex = this.zIndex;

  /**
   * Get or set the current layer opacity.  The opacity is in the range [0-1].
   *
   * @param {number} [opacity] If specified, set the opacity.  Otherwise,
   *    return the opacity.
   * @returns {number|this} The current opacity or the current layer.
   */
  this.opacity = function (opacity) {
    var result = s_opacity.apply(m_this, arguments);
    if (opacity !== undefined && m_this.initialized()) {
      m_this.map()._updateAutoshareRenderers();
    }
    return result;
  };

  /**
   * Get/Set visibility of the layer.
   *
   * @param {boolean} [val] If specified, change the visibility.  Otherwise,
   *    get it.
   * @returns {boolean|this} either the visibility (if getting) or the layer
   *    (if setting).
   */
  this.visible = function (val) {
    if (val === undefined) {
      return s_visible();
    }
    var origVal = s_visible(),
        result = s_visible.apply(m_this, arguments);
    if (origVal !== val && m_this.initialized()) {
      m_this.map().scheduleAnimationFrame(m_this._update, true);
      m_this.renderer()._render();
    }
    return result;
  };

  /**
   * Get or set the z-index of the layer.  The z-index controls the display
   * order of the layers in much the same way as the CSS z-index property.
   *
   * @param {number} [zIndex] The new z-index, or undefined to return the
   *    current z-index.
   * @param {boolean} [allowDuplicate] When setting the z index, if this is
   *    truthy, allow other layers to have the same z-index.  Otherwise,
   *    ensure that other layers have distinct z-indices from this one.
   * @returns {number|this}
   */
  this.zIndex = function (zIndex, allowDuplicate) {
    var result = s_zIndex.apply(m_this, arguments);
    if (zIndex !== undefined && m_this.initialized()) {
      /* If the z-index has changed, schedule rerendering the layer. */
      m_this.map().scheduleAnimationFrame(m_this._update, true);
      m_this.renderer()._render();
      m_this.map()._updateAutoshareRenderers();
    }
    return result;
  };

  /**
   * Move all of the objects associated with this layer to a different webgl
   * renderer.  This runs the _cleanup routine for any feature or child of the
   * layer (if it has one), removes all actors associated with this layer from
   * the existing renderer, then adds those actors to the new renderer and
   * calls `_update` on any feature that had a `_cleanup` routine.  If desired,
   * the old and new renderers are both asked to rerender.  If moving multiple
   * renderers for multiple layers, rerendering can be delayed.
   *
   * @param {geo.webgl.webglRenderer} newRenderer The renderer to move to.
   * @param {boolean} [rerender=false] If truthy, rerender after the switch.
   * @returns {this}
   */
  this.switchRenderer = function (newRenderer, rerender) {
    if (newRenderer instanceof webglRenderer && newRenderer !== m_this.renderer()) {
      var oldRenderer = m_this.renderer(),
          actors = [],
          updates = [];
      m_this.map().listSceneObjects([m_this]).forEach(function (obj) {
        if (obj._cleanup) {
          obj._cleanup();
          if (obj._update) {
            updates.push(obj);
          }
        }
        if (obj.actors) {
          actors = actors.concat(obj.actors());
        }
      });
      actors.forEach(function (actor) {
        oldRenderer.contextRenderer().removeActor(actor);
        newRenderer.contextRenderer().addActor(actor);
      });
      m_this._renderer(newRenderer);
      m_this._canvas(newRenderer.canvas());
      if (rerender && (actors.length || updates.length)) {
        oldRenderer._render();
        updates.forEach(function (obj) {
          obj._update();
        });
        newRenderer._render();
      }
    }
    return m_this;
  };

  /**
   * Initialize after the layer is added to the map.
   *
   * @returns {this}
   */
  this._init = function () {

    var map = m_this.map();
    if (!map._updateAutoshareRenderers) {
      /**
       * Update all webgl autoshareRenderer layers so that appropriate groups
       * of layers share renderers.  Each group must (a) be continguous in
       * z-space (not separated by a non-autoshare layer or a non-webgl layer),
       * and (b) have the same opacity.  The lowest layer in each group will
       * contain the actual canvas and context.  This rerenders as needed.
       */
      map._updateAutoshareRenderers = function () {
        var layers = map.sortedLayers(),
            renderer,
            used_canvases = [],
            canvases = [],
            rerender_list = [],
            opacity;
        layers.forEach(function (layer) {
          if (!layer.autoshareRenderer() || !layer.renderer() || layer.renderer().api() !== webglRenderer.apiname) {
            renderer = null;
          } else if (!renderer || layer.opacity() !== opacity) {
            if (!layer.node()[0].contains(layer.renderer().canvas()[0])) {
              layer.switchRenderer(createRenderer(webglRenderer.apiname, layer), false);
              rerender_list.push(layer.renderer());
            }
            renderer = layer.renderer();
            used_canvases.push(renderer.canvas()[0]);
            opacity = layer.opacity();
          } else {
            if (layer.renderer() !== renderer) {
              rerender_list.push(layer.renderer());
              canvases.push(layer.renderer().canvas()[0]);
              layer.switchRenderer(renderer, false);
              rerender_list.push(layer.renderer());
            }
          }
        });
        layers.forEach(function (layer) {
          if (rerender_list.indexOf(layer.renderer()) >= 0) {
            if (layer._update) {
              layer._update();
            }
          }
        });
        layers.forEach(function (layer) {
          if (rerender_list.indexOf(layer.renderer()) >= 0) {
            layer.renderer()._render();
            rerender_list = rerender_list.filter((val) => val !== layer.renderer());
          }
        });
        canvases.forEach(function (canvas) {
          if (used_canvases.indexOf(canvas) < 0) {
            canvas.remove();
            used_canvases.push(canvas);
          }
        });
      };

      map.geoOn(geo_event.layerAdd, () => map._updateAutoshareRenderers());
      map.geoOn(geo_event.layerRemove, () => map._updateAutoshareRenderers());
    }

    return s_init.apply(m_this, arguments);
  };

};

registerLayerAdjustment('webgl', 'all', webgl_layer);

module.exports = webgl_layer;
