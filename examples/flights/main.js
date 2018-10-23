/* globals colorbrewer, utils */

// Key:
// - opacity: time (full opacity is recent, faded is old)
// - color: velocity (blue-yellow-red corresponds to slow-medium-fast)
// - width: altitude (thicker is higher)

/* Available query parameters:
 *
 * map: 'dark' (default) or 'light'.  'dark' is a low-opacity stamen map.
 *    'light' is a full-opacity OSM map.
 * select: 'true' (default) or 'false'.  If 'false', don't highlight tracks on
 *    mouse-over.
 * scale: 'true' (default) or 'false'.  If 'false', all tracks are a solid
 *    color.  Otherwise, they are shaded blue-yellow-red based on velocity
 *    where blue is the slowest and red is the fastest, autoscaled for the
 *    available data.
 * opacity: 'true' (default) or 'false'.  If 'false', all tracks are the same
 *    opacity.  Otherwise, recent data is high opacity than older data.
 * data: undefined (default), 'true', or a url.  If 'true', load a file
 *    called 'flightdata.json'.  If a url, load the flight data from that url.
 *    Otherwise, collect data live.
 * interval: a time in seconds, default 30.  When collecting live data, this is
 *    the polling and update interval.
 * keep: 3600 (default) or a time in seconds.  If specified and collecting live
 *    data, only keep this duration of data.  If 0, keep all data.
 */

var query = utils.getQuery();

var map, layer, feature, ranges, data;
// We use a d3 color scale, but getting colors from it is slow.  Since we use a
// 10-part piecewise linear scale (with 11 specification values), we can use a
// 10 * 256 + 1 size array to use pre-computed colors with surity that it has
// all possible values for 8-bit color displays.  We can manually interpolate
// to use the scale array.
var d3Scale = d3.scale.linear()
      .range(colorbrewer.RdYlBu[11])
      .domain([1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0]),
    d3ScaleParts = 10 * 256,
    scale = [...Array(d3ScaleParts + 1)].map(
      (_, idx) => geo.util.convertColor(d3Scale(idx / d3ScaleParts)));

/**
 * Redraw the display, optionally updating the data.  If the data is updated
 * and does not have precomputed ranges, compute them.
 *
 * @param {object[]} drawData The data to plot.  This can have a `ranges`
 *    property.
 */
function draw(drawData) {
  if (drawData) {
    data = drawData;
    ranges = data.ranges;
    if (!ranges) {
      ranges = {};
      ['time', 'z', 'v', 'vz'].forEach(function (key) {
        ranges[key] = {min: data[0][key][0], max: data[0][key][0]};
        data.forEach(function (line) {
          for (var i = 0; i < line[key].length; i += 1) {
            ranges[key].min = Math.min(ranges[key].min, line[key][i]);
            ranges[key].max = Math.max(ranges[key].max, line[key][i]);
          }
        });
      });
    }
    feature.data(data);
  }
  feature.draw();
}

// Create a map object
map = geo.map({
  node: '#map',
  center: {
    x: -75,
    y: 40
  },
  zoom: 7
});

// Add the default osm layer
map.createLayer('osm');

if (query.map !== 'light') {
  map.layers()[0]
    .url('http://{s:abcd}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png')
    .opacity(0.25)
    .attribution('Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>');
  $('#map').addClass('dark');
}
// Make sure our attribution reports on the data source.
map.layers()[0].attribution(map.layers()[0].attribution() + '.  Flight data from <a href="http://www.opensky-network.org">The OpenSky Network</a>');

// Create a feature layer to draw on.
layer = map.createLayer('feature', {features: [geo.lineFeature.capabilities.multicolor]});

// Create a line feature
feature = layer.createFeature('line', {selectionAPI: query.select !== 'false'})
  // For the line accessor, we can return any array that is the length of the
  // number of verticies in the line.
  .line(function (d) {
    return d.time;
  })
  .position(function (d, i, l, li) {
    return {x: data[li].lon[i], y: data[li].lat[i]};
  })
  .style({
    'strokeColor': function (d, i, l, li) {
      if (query.scale === 'false') {
        // d3 scales are slow
        // return d3Scale(0);
        return scale[0];
      }
      var val = (data[li].v[i] - ranges.v.min) / (ranges.v.max - ranges.v.min);
      // d3 scales are slow
      // return d3Scale(val);
      val = Math.round(d3ScaleParts * val);
      return val < 0 ? scale[0] : val > d3ScaleParts ? scale[d3ScaleParts] : scale[val];
    },
    'strokeWidth': function (d, i, l, li) {
      var width = 0.5 + 4.5 * (data[li].z[i] - ranges.z.min) / (ranges.z.max - ranges.z.min);
      if (data[li].hover) {
        width = width * 2 + 1;
      }
      return width;
    },
    'strokeOpacity': function (d, i, l, li) {
      if (data[li].hover) {
        return 1;
      }
      if (query.opacity === 'false') {
        return 0.25;
      }
      var opac = 0.05 + 0.70 * (data[li].time[i] - ranges.time.min) / (ranges.time.max - ranges.time.min);
      return opac;
    },
    lineCap: 'round',
    lineJoin: 'round'
  })
  .geoOff(geo.event.feature.mouseover)
  .geoOff(geo.event.feature.mouseout)
  .geoOn(geo.event.feature.mouseover, function (evt) {
    if (!evt.top) { return; }
    data.forEach(function (d) {
      d.hover = false;
    });
    evt.data.hover = true;
    this.modified();
    feature.draw();
  });

// Override how we get the style function for strokeColor to avoid overwrapping
// it with the convertColor function.  This is purely for speed.
var originalStyleGet = feature.style.get;
feature.style.get = function (key) {
  if (key === 'strokeColor') {
    return feature.style('strokeColor');
  }
  return originalStyleGet.apply(this, arguments);
};

if (query.data) {
  // Load fixed data.  If you show live data, you can save it for use as fixed
  // data by pasting the following into the console:
  // ``var link = document.createElement('a');
  // var url = URL.createObjectURL(new Blob([JSON.stringify(feature.data())]));
  // link.setAttribute('href', url);
  // link.setAttribute('download', 'flightdata.json');
  // var event = document.createEvent('MouseEvents');
  // event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false,
  // false, false, false, 0, null);
  // link.dispatchEvent(event);``
  $.ajax({
    url: query.data === 'true' ? 'flightdata.json' : query.data,
    success: draw
  });
} else {
  // Ask a web worker to collect data.  See
  // <a href="worker.html">worker.html</a> for annotated source.
  var worker = new Worker('worker.js');
  worker.onmessage = function (evt) {
    draw(evt.data);
  };
  var interval = parseInt(query.interval);
  worker.postMessage({
    interval: interval > 0 ? interval * 1000 : 30000,
    keep: (query.keep === undefined ? 3600 : query.keep) * 1000
  });
}
