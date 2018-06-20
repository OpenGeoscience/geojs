// Set images for the transport controls.  Although some transport controls are
// defined within the Unicode list of codepoints, font support is unreliable.
// Images can be used, but using SVG graphics scales better.  By defining them
// in the code, they can be easily edited and base64 encoded for use as images
// (the base64 encoding is necessary is some older browsers, such as IE 11).
var svgControls = {
  rewind: 'M0 10L11 3 L11 8L20 3L20 17L11 12L11 17Z',
  back: 'M4 3L7 3 L7 8L16 3L16 17L7 12L7 17L4 17Z',
  pause: 'M5 2L9 2 L9 18L5 18ZM11 2L15 2L15 18L11 18Z',
  play: 'M17 10L3 2L3 18Z',
  step: 'M16 3L13 3 L13 8L4 3L4 17L13 12L13 17L16 17Z',
  ff: 'M20 10L9 3 L9 8L0 3L0 17L9 12L9 17Z'
};
// Each SVG image is a filled path.  The repeated contents can be in the code
// just once, adding the fill color and stroke.
Object.keys(svgControls).forEach(function (key) {
  $('#controls #' + key).attr('src', 'data:image/svg+xml;base64,' + btoa(
    '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="' +
    svgControls[key] + '" fill="black" stroke="transparent"/></svg>'));
});

// Create a map centered on the data area.
var map = geo.map({
  node: '#map',
  center: {x: -135, y: 45},
  // Set the maximum bounds to the data area.
  maxBounds: {left: -180, right: -50, top: 72, bottom: 17},
  // When the maximum bounds are explicitly set, the automatic calculation of
  // units per pixel is erroneous.  Specifically, this is the size of a pixel
  // in map projection coordinates (web Mercator) for the zoom-level 0 tile,
  // which, since we are using a global tile set (not one that is limited to
  // our bounds), is the size of the Earth's circumference divided by the level
  // 0 tile width.
  unitsPerPixel: geo.util.radiusEarth * Math.PI * 2 / 256,
  // Don't scroll the map infinitely to the left and right.
  clampBoundsX: true,
  // Try to start as zoomed out as possible.  Since clampZoom defaults to true,
  // this will fill the window as best possible unless the window is very
  // small.
  zoom: 0
});
// Create a background OSM tiled layer that has some opacity to make it easier
// to see the data.
map.createLayer('osm', {opacity: 0.5});
// Define many of our variables in the top scope so that various functions can
// use them.
var data, minyear, maxyear, year,
    layer, iso, contour, point, uiLayer, tooltip, tooltipElem,
    // This is the playback speed for the Play button
    playfps = 2,
    // These variables are used to track playback
    fps = 0, playstarttime, playstartyear, playdir;

// Show data for a specific year.  Also, adjust controls and display to reflect
// the year that is shown.
function set_year(y) {
  // If the data hasn't been loaded, do nothing.
  if (!data || !iso) {
    return;
  }
  // Some control can pass a string; convert it to an integer.
  y = parseInt(y, 10);
  // Set the global value so other functions know what year is being shown.
  year = y;
  if (!data.bins[y]) {
    // If there is no data for the specified year, hide any existing data.
    iso.visible(false);
    contour.visible(false);
    point.visible(false);
  } else {
    // Set the isolines and contours to use the current year's triangular mesh,
    // and set all features to use the current year's weather station values.
    iso.isoline('elements', data.bins[y].elements).data(data.bins[y].values).visible(true);
    contour.contour('elements', data.bins[y].elements).data(data.bins[y].values).visible(true);
    point.data(data.bins[y].values).visible(true);
  }
  // Show the changes
  layer.draw();
  // Show the current year in controls.
  $('#info').text(y);
  $('#scrubber').val(y);
  var i = parseInt(tooltipElem.attr('stationindex'));
  if (isFinite(i)) {
    tooltipTextFunc(data.bins[y] ? data.bins[y].values[i] : null, i);
  }
}

// On animation frame intervals, check if a different year should be shown.
function playInterval() {
  // Schedule another callback on the next animation frame.  This could use
  // window.requestAnimationFrame.  By using the map's scheduling function, it
  // ensures that various updates get called in a predictable order.
  map.scheduleAnimationFrame(playInterval);
  // If fps === 0, then we aren't actually playing, so don't update.
  if (fps) {
    var span = maxyear + 1 - minyear;
    var y = Math.floor((Date.now() - playstarttime) * fps / 1000) * playdir + playstartyear;
    // Adjust the year to our data range (positive modulo).
    y = (((y - minyear) % span) + span) % span + minyear;
    // Update the data if the year has changed.
    if (y !== year) {
      set_year(y);
    }
  }
}

// The data is the sum of all the rainfall for each weather station in 1/10 mm.
// Convert this to inches.
function valueFunc(d, i) {
  return d / 254;
}

// The weather station locations are stored separately from data values, since
// they are the same for each year.  Specifically, the longitude and latitude
// are the first and second entries, respectively, in the station record.
function posFunc(d, i) {
  // We don't need to use the data value, as that will be the current year's
  // rainfall.  The index of the record determines the station that is used.
  var node = data.nodes[i];
  return {x: node[0], y: node[1]};
}

// Format the data at a point for a tooltip and update the tooltip's text.
function tooltipTextFunc(d, i) {
  if (d === null || d === undefined) {
    tooltipElem.text('');
  } else {
    var stationName = data.nodes[i][2] || '';
    tooltipElem.text(valueFunc(d, i).toFixed(1) + 'in ' + stationName);
  }
}

// Create a feature layer for the isoline, contour, and point information.
layer = map.createLayer('feature', {features: ['isoline']});
// Create a UI layer to show a tooltip above individual stations.
uiLayer = map.createLayer('ui');
// Create a dom widget to show the tooltip.  For now, hide the tooltip.
tooltip = uiLayer.createWidget('dom', {position: {x: 0, y: 0}});
tooltipElem = $(tooltip.canvas()).attr('id', 'tooltip').hide();

// Create a contour feature first so that it is visually on the bottom.
contour = layer.createFeature('contour', {
  contour: {
    stepped: false,
    /*
    rangeValues: [0, 25, 50, 75, 100, 125, 150],
    // Use a colorbrewer color scale
    colorRange: ['#f0f9e8', '#ccebc5', '#a8ddb5', '#7bccc4', '#43a2ca', '#0868ac'],
    // For values about the specified range, use the top color.
    maxColor: '#0868ac',
    */
    rangeValues: [0, 5, 10, 15, 25, 50, 75, 80, 120, 200],
    colorRange: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
    maxColor: '#081d58',
    maxOpacity: 1
  },
  style: {
    opacity: 0.5,
    position: posFunc,
    value: valueFunc
  }
});
// Create an isoline feature with lines every 10 inches and labels on all lines.
iso = layer.createFeature('isoline', {
  isoline: {
    spacing: 10,
    label: true,
    labelText: function (value) {
      return value.value + 'in';
    }
  },
  style: {
    position: posFunc,
    value: valueFunc,
    opacity: 0.5
  }
});
// Create a point feature with no opacity.  These are just used for so that
// when the mouse is above them we show a tool tip.
point = layer.createFeature('point', {
  selectionAPI: true,
  style: {
    stroke: false,
    radius: function (d, i) {
      // If this point doesn't have any data for the current year, dont' give
      // it a radius, either.  This prevents the tooltip from interacting with
      // it.
      return d === null || d === undefined ? 0 : 5;
    },
    fillColor: 'black',
    fillOpacity: 0,
    position: posFunc
  }
}).geoOn(geo.event.feature.mouseon, function (evt) {
  // When the mouse is over a point, if we have data for the current year, show
  // the name of the station and the year's rainfall.
  if (evt.data === null) {
    tooltipElem.attr('stationindex', '');
    tooltipElem.hide();
  } else {
    tooltip.position(posFunc(evt.data, evt.index));
    tooltipElem.attr({'stationdata': evt.data, 'stationindex': evt.index});
    tooltipElem.text(tooltipTextFunc(evt.data, evt.index));

    tooltipElem.show();
  }
}).geoOn(geo.event.feature.mouseoff, function (evt) {
  // When the mouse mouses outside of the point, hide the tooltip.
  tooltipElem.attr('stationindex', '');
  tooltipElem.hide();
});

// Specify the file that contains the data.
var url = '../../data/noaa_prcp.json';
// Get the data file.  This is added to the map's promise list so that
// map.onIdle will only occur when the data is loaded.
map.addPromise($.get(url).then(function (loadedData) {
  // Store the data in a global variable so we can use it in other functions.
  data = loadedData;
  // Get the minimum and maximum years for which we have data.  Set the
  // scrubber to use these years.
  minyear = Math.min.apply(Math, Object.keys(data.bins));
  maxyear = Math.max.apply(Math, Object.keys(data.bins));
  $('#scrubber').attr({
    min: minyear,
    max: maxyear
  });
  // Report where our data comes from
  layer.attribution('Rainfall data from <a href="https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt">ncdc.noaa.gov/pub/data/ghcn/daily</a>');
  // Start by showing a specific year.
  set_year(2010);
  // Handle animations as needed.
  map.scheduleAnimationFrame(playInterval);
}));

// When the scrubber moves, show the year based on the scrubber position.
$('#scrubber').on('change input', function (evt) {
  set_year($('#scrubber').val());
  // We store the new year and current time so if we are actively playing, it
  // will play from the scrubbed point.
  playstartyear = year;
  playstarttime = Date.now();
});

// Handle the transport buttons
$('#controls img').click(function (evt) {
  // If the data hasn't been loaded, do nothing.
  if (!data || !iso) {
    return;
  }
  var y;
  switch ($(evt.target).attr('id')) {
    // The one-frame-back button stops playback and backs up a frame.
    case 'back':
      fps = 0;
      y = year - 1;
      set_year(y < minyear ? maxyear : y);
      break;
    // The fast-forward button doubles playback speed.  If we aren't currently
    // playing fast or this would make things very fast, go to twice the
    // ordinary play speed.
    case 'ff':
      playdir = 1;
      playstartyear = year;
      playstarttime = Date.now();
      if (fps < playfps * 2 || fps >= 60) {
        fps = playfps * 2;
      } else {
        fps *= 2;
      }
      break;
    // Pause just stops the playback.
    case 'pause':
      fps = 0;
      break;
    // Play always plays at the same speed.
    case 'play':
      playdir = 1;
      playstartyear = year;
      playstarttime = Date.now();
      fps = playfps;
      break;
    // Rewind plays in reverse, doubling the speed each time it is selected.
    // If we aren't currently rewinding or this would be very fast, go to the
    // ordinary play speed in reverse.
    case 'rewind':
      playdir = -1;
      playstartyear = year;
      playstarttime = Date.now();
      if (!fps || fps >= 60) {
        fps = playfps;
      } else {
        fps *= 2;
      }
      break;
    // The one-frame-forward button stops playback and advances one frame.
    case 'step':
      fps = 0;
      y = year + 1;
      set_year(y > maxyear ? minyear : y);
      break;
  }
});
