// This example should be tried with different query strings.

var exampleDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  // Most map tile servers use EPSG:3857 (Web Mercator).  Using a tile server
  // with a different projection works correctly in all renderers.  Using a
  // different projection for the tiles and the map can work in the vgl
  // renderer, but may have problems as the tile density is not uniform or
  // regular.
  var gcsTable = {
    'EPSG:3857': 'EPSG:3857'
  };
  var gcsBounds = {};
  var gcsList = [
    'EPSG:3857', 'EPSG:3031', 'EPSG:3032', 'EPSG:3033', 'EPSG:3294',
    'EPSG:3408', 'EPSG:3409', 'EPSG:3410', 'EPSG:3411', 'EPSG:3412',
    'EPSG:3413', 'EPSG:3571', 'EPSG:3572', 'EPSG:3573', 'EPSG:3574',
    'EPSG:3575', 'EPSG:3576', 'EPSG:3786', 'EPSG:32661', 'EPSG:32662',
    'ESRI:53002', 'ESRI:53003', 'ESRI:53008', 'ESRI:53009', 'ESRI:53021',
    'ESRI:53027', 'ESRI:54002', 'ESRI:54003', 'ESRI:54009', 'ESRI:54021',
    'ESRI:54026', 'ESRI:54027', 'ESRI:102005', 'ESRI:102010', 'ESRI:102011',
    'ESRI:102016', 'ESRI:102017', 'ESRI:102018', 'ESRI:102019',
    'ESRI:102020', 'ESRI:102021', 'ESRI:102023', 'ESRI:102026',
    'ESRI:102029', 'ESRI:102031', 'ESRI:102032', 'IAU2000:39914',
    'IAU2000:39918', 'IAU2000:39920', 'IAU2000:39962', 'IAU2000:39972',
    'SR-ORG:7', 'SR-ORG:22', 'SR-ORG:4695', 'SR-ORG:6661', 'SR-ORG:6842',
    'SR-ORG:6882', 'SR-ORG:6888', 'SR-ORG:6890', 'SR-ORG:6891',
    'SR-ORG:6892', 'SR-ORG:6893', 'SR-ORG:6894', 'SR-ORG:6895',
    'SR-ORG:6896', 'SR-ORG:6897', 'SR-ORG:6898', 'SR-ORG:7250',
    'SR-ORG:8209', 'SR-ORG:8287'
  ];
  var capitals;

  $.when(
    /* Fetch projections */
    $.ajax({url: 'proj.json'}).done(function (resp) {
      $('#map-gcs option').slice(1).remove();
      resp.sort(function (a, b) {
        var sa = a.name.split(':'), sb = b.name.split(':');
        if (sa[0] !== sb[0]) {
          return sa[0] < sb[0] ? -1 : 1;
        }
        if (parseInt(sb[1], 10) > 0 && parseInt(sa[1], 10) > 0) {
          return parseInt(sa[1], 10) - parseInt(sb[1], 10);
        }
        return a.name < b.name ? -1 : 1;
      });
      $.each(resp, function (idx, proj) {
        gcsTable[proj.name] = proj.proj4;
        if (proj.bounds) {
          gcsBounds[proj.name] = proj.bounds;
        }
        var opt = $('<option/>').attr({value: proj.name}).text(
          proj.name + ' - ' + proj.desc);
        $('#map-gcs').append(opt);
      });
      var pos = 0;
      $.each(gcsList, function (idx, proj) {
        var opt = $('#map-gcs option[value="' + proj + '"]');
        if (opt.length) {
          opt.remove();
          $('#map-gcs option').eq(pos).before(opt);
          pos += 1;
        }
      });
      $('#map-gcs option').eq(pos).before($('<option/>').attr(
        {value: 'EPSG:3857'}).text('--------'));
      // select boxes with thousands of options cause performance issues.  To
      // see all of the projection options, disable the following line:
      $('#map-gcs option').slice(pos).remove();
    }),

    /* Fetch cities */
    $.ajax({url: 'capitals.json'}).done(function (resp) {
      capitals = resp;
    })

  ).then(function () {
    // Parse query parameters into an object for ease of access
    var query = document.location.search.replace(/(^\?)/, '').split(
      '&').map(function (n) {
      n = n.split('=');
      if (n[0]) {
        this[decodeURIComponent(n[0])] = decodeURIComponent(n[1]);
      }
      return this;
    }.bind({}))[0];

    // hide the controls if requested
    $('#controls').toggleClass('no-controls', query.controls === 'false');
    // populate the controls with the current settings
    $.each(query, function (key, value) {
      if (key.indexOf('"') < 0) {
        var ctl = $('#controls [param-name="' + key + '"]');
        if (ctl.is('[type="checkbox"]')) {
          ctl.prop('checked', value === 'true');
        } else {
          ctl.val(value);
        }
      }
    });
    $('#controls').on('change', change_controls);

    var range = geo.transform.transformCoordinates(
      'EPSG:4326', 'EPSG:3857', [{x: -180, y: 0}, {x: 180, y: 0}]);
    // Set map defaults to use our named node and have a reasonable center and
    // zoom level
    var gcs = query.gcs || 'EPSG:3857';
    var mapParams = {
      node: '#map',
      center: {x: 0, y: 0},
      zoom: 2.5,
      gcs: gcsTable[gcs] || gcs,
      unitsPerPixel: (range[1].x - range[0].x) / 256,
      clampBoundsX: false,
      clampBoundsY: false,
      clampZoom: false,
      discreteZoom: false
    };
    if (gcsBounds[gcs]) {
      mapParams.maxBounds = gcsBounds[gcs];
    }
    // Set the tile layer defaults to use the specified renderer and opacity
    var layerParams = {
      features: [geo.quadFeature.capabilities.imageFull],
      zIndex: 0,
      gcs: 'EPSG:3857',
      attribution: $('#url-list [value="' + $('#layer-url').val() + '"]').attr(
        'credit'),
      minLevel: query.minLevel ? parseInt(query.minLevel, 10) : 4,
      keepLower: true,
      wrapX: false,
      wrapY: false
    };
    // Allow a custom tile url, including subdomains.
    if (query.url) {
      layerParams.url = query.url;
    } else {
      layerParams.url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    // Create a map object
    var map = geo.map(mapParams);
    // Add the tile layer with the specified parameters
    var osmLayer = map.createLayer('osm', layerParams);
    // create a tool-tip layer
    var uiLayer = map.createLayer('ui', {zIndex: 2});
    var tooltip = uiLayer.createWidget('dom', {position: {x: 0, y: 0}});
    var tooltipElem = $(tooltip.canvas()).attr('id', 'tooltip').addClass(
      'hidden');
    // Create a layer with cities
    var pointLayer = map.createLayer('feature', {renderer: 'vgl', zIndex: 1});
    var pointFeature = pointLayer
      .createFeature('point', {
        selectionAPI: true,
        style: {
          fillColor: '#8080FF',
          fillOpacity: function (d) { return d.opacity ? d.opacity : 0.25; },
          strokeColor: 'black',
          strokeOpacity: function (d) {
            return d.strokeOpacity ? d.strokeOpacity : 0.25;
          }
        },
        visible: query.capitals !== 'false'
      })
      .data(capitals)
      .position(function (d) {
        return {x: d.longitude, y: d.latitude};
      })
      .geoOn(geo.event.feature.mouseclick, function (evt) {
        pointLayer.map().center({x: evt.data.longitude, y: evt.data.latitude});
      })
      .geoOn(geo.event.feature.mouseover, function (evt) {
        evt.data.opacity = 0.5;
        evt.data.strokeOpacity = 1;
        this.modified();
        this.draw();
        tooltip.position({x: evt.data.longitude, y: evt.data.latitude});
        tooltipElem.text(evt.data.city);
        tooltipElem.removeClass('hidden');
      })
      .geoOn(geo.event.feature.mouseout, function (evt) {
        evt.data.opacity = undefined;
        evt.data.strokeOpacity = undefined;
        this.modified();
        this.draw();
        tooltipElem.addClass('hidden');
      })
      .draw();

    // Make variables available as a global for easier debug
    exampleDebug.map = map;
    exampleDebug.mapParams = mapParams;
    exampleDebug.layerParams = layerParams;
    exampleDebug.osmLayer = osmLayer;
    exampleDebug.pointLayer = pointLayer;
    exampleDebug.pointFeature = pointFeature;
    exampleDebug.uiLayer = uiLayer;
    exampleDebug.tooltip = tooltip;
    exampleDebug.tooltipElem = tooltipElem;
    exampleDebug.gcsTable = gcsTable;
    exampleDebug.gcsBounds = gcsBounds;
    exampleDebug.gcsName = gcs;

    /**
     * Handle changes to our controls.
     *
     * @param evt jquery evt that triggered this call.
     */
    function change_controls(evt) {
      var ctl = $(evt.target),
          param = ctl.attr('param-name'),
          value = ctl.val();
      if (ctl.is('[type="checkbox"]')) {
        value = ctl.is(':checked') ? 'true' : 'false';
      }
      if (value === '' && ctl.attr('placeholder')) {
        value = ctl.attr('placeholder');
      }
      if (!param || value === query[param]) {
        return;
      }
      var processedValue = (ctl.is('[type="checkbox"]') ?
        (value === 'true') : value);
      switch (param) {
        case 'capitals':
          pointFeature.visible(processedValue);
          pointFeature.draw();
          break;
        case 'gcs':
          mapParams.gcs = gcsTable[processedValue] || 'EPSG:3857';
          map.gcs(mapParams.gcs);
          exampleDebug.gcsName = processedValue;
          osmLayer.clear();
          pointFeature.modified();
          map.draw();
          break;
        case 'url':
          var url = processedValue;
          if (layerParams.baseUrl) {
            delete layerParams.baseUrl;
          }
          layerParams[param] = processedValue;
          osmLayer.url(url);
          osmLayer.attribution($('#url-list [value="' + value + '"]').attr(
            'credit'));
          break;
        default:
          if (ctl.is('.layerparam')) {
            layerParams[param] = processedValue;
            if (param === 'url' && layerParams.baseUrl) {
              delete layerParams.baseUrl;
            }
            if (osmLayer[param]) {
              osmLayer[param](processedValue);
            }
          } else if (ctl.is('.mapparam')) {
            mapParams[param] = processedValue;
            if (map[param]) {
              map[param](processedValue);
            }
          } else {
            return;
          }
          break;
      }
      if (ctl.is('.layerparam') && ctl.attr('reload') === 'true') {
        map.deleteLayer(osmLayer);
        osmLayer = map.createLayer('osm', layerParams);
        exampleDebug.osmLayer = osmLayer;
      }
      // update the url to reflect the changes
      query[param] = value;
      if (value === '' || (ctl.attr('placeholder') &&
          value === ctl.attr('placeholder'))) {
        delete query[param];
      }
      var newurl = window.location.protocol + '//' + window.location.host +
          window.location.pathname + '?' + $.param(query);
      window.history.replaceState(query, '', newurl);
    }
  });
});
