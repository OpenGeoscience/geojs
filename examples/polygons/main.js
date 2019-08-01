/* globals $, geo, utils */

var query = utils.getQuery();
var map = geo.map({
  node: '#map',
  center: {
    x: -88.0,
    y: 29
  },
  zoom: 4
});
if (query.map !== 'false') {
  map.createLayer('osm');
}
var layer = map.createLayer('feature', {
  renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
  features: query.renderer ? undefined : ['polygon']
});
var polygons = layer.createFeature('polygon', {selectionAPI: true});
var hoverColor = query.hover || 'blue';
var polyColor = query.color ? geo.util.convertColor(query.color) : undefined;
$.getJSON(query.url || '../../data/land_polygons.json').done(function (data) {
  polygons
    /* This is the default accessor, so we don't have to define it ourselves.
    .polygon(function (d) {
      return d;
    })
    */
    .position(function (d) {
      return {x: d[0], y: d[1]};
    })
    .data(data)
    .style({
      uniformPolygon: true,
      fillOpacity: query.opacity ? parseFloat(query.opacity) : 0.5,
      fillColor: function (d, idx, poly, polyidx) {
        return poly.hover ? hoverColor : (polyColor ? polyColor : {
          r: (polyidx % 256) / 255,
          g: polyidx / (data.length - 1),
          b: 0.25
        });
      },
      stroke: query.stroke !== 'false' ? function (poly, polyidx) {
        return poly.hover;
      } : false,
      strokeWidth: query.strokeWidth ? parseFloat(query.strokeWidth) : 1,
      strokeColor: {r: 0, g: 0, b: 0}
    })
    .geoOn(geo.event.feature.mouseover, function (evt) {
      if (!evt.data.hover) {
        evt.data.hover = true;
        this.modified();
        this.draw();
      }
    })
    .geoOn(geo.event.feature.mouseout, function (evt) {
      if (evt.data.hover) {
        evt.data.hover = false;
        this.modified();
        this.draw();
      }
    })
    .geoOn(geo.event.feature.brush, function (evt) {
      let mod = false;
      if (!evt.data.hover) {
        mod = true;
      }
      evt.data.hover = evt.eventID;
      if (evt.top) {
        let data = this.data();
        for (let i = 0; i < data.length; i += 1) {
          if (data[i].hover && data[i].hover !== evt.eventID) {
            data[i].hover = false;
            mod = true;
          }
        }
      }
      if (mod) {
        this.modified();
        this.draw();
      }
    })
    .geoOn(geo.event.feature.brushend, function (evt) {
      if (evt.data.hover) {
        evt.data.hover = false;
        this.modified();
        this.draw();
      }
    })
    .draw();
});
