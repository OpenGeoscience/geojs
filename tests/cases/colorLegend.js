var $ = require('jquery');
var createMap = require('../test-utils').createMap;
var colorbrewer = require('colorbrewer');

describe('color legend', function () {
  'use strict';

  var map;
  var container = null;
  var legendWidget = null;
  var uiLayer = null;
  var allCategories = [
    {
      name: 'Discrete ordinal',
      type: 'discrete',
      scale: 'ordinal',
      domain: ['beijing', 'new york', 'london', 'paris'],
      colors: ['red', 'green', 'blue', 'orange']
    },
    {
      name: 'Discrete linear',
      type: 'discrete',
      scale: 'linear',
      domain: [100, 1000],
      colors: colorbrewer.YlGnBu['9']
    },
    {
      name: 'Discrete sqrt',
      type: 'discrete',
      scale: 'sqrt',
      domain: [10000, 1000000],
      colors: colorbrewer.PRGn['11']
    },
    {
      name: 'Discrete quantile',
      type: 'discrete',
      scale: 'quantile',
      domain: [96, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164, 168, 172, 176, 180, 184, 188, 192, 196, 200],
      colors: colorbrewer.Greens['8']
    },
    {
      name: 'Discrete linear 2',
      type: 'discrete',
      scale: 'linear',
      domain: [0.1, 0.001],
      colors: colorbrewer.RdBu['8']
    },
    {
      name: 'Continuous pow',
      type: 'continuous',
      scale: 'pow',
      exponent: 1.1,
      domain: [100, 10000],
      colors: ['red', 'blue']
    },
    {
      name: 'Continuous sqrt',
      type: 'continuous',
      scale: 'sqrt',
      domain: [100, 1000],
      colors: ['purple', 'orange']
    },
    {
      name: 'Continuous log',
      type: 'continuous',
      scale: 'log',
      base: Math.E,
      domain: [100, 10000],
      colors: ['blue', 'olive']
    }
  ];

  beforeEach(function () {
    map = createMap();
    container = map.node();
    uiLayer = map.createLayer('ui');
    legendWidget = uiLayer.createWidget('colorLegend', {
      categories: [allCategories[0]]
    });
    map.draw();
  });

  it('Create basic color legend widget', function () {
    expect($(container).find('.legend').length).toBe(1);
  });

  it('Create color legend widget without initial categories', function () {
    uiLayer.removeChild(legendWidget);
    legendWidget._exit();
    legendWidget = uiLayer.createWidget('colorLegend', {
      categories: []
    });
    expect($(container).find('.legend').length).toBe(0);
  });

  it('Use unsupported scale', function () {
    expect(function () {
      legendWidget.categories([{
        name: '',
        type: 'discrete',
        scale: 'curvilinear',
        domain: [100, 1000],
        colors: colorbrewer.YlGnBu['9']
      }]);
    }).toThrow(new Error('unsupported scale'));

    expect(function () {
      legendWidget.categories([{
        name: '',
        type: 'continuous',
        scale: 'curvilinear',
        domain: [100, 1000],
        colors: colorbrewer.YlGnBu['9']
      }]);
    }).toThrow(new Error('unsupported scale'));
  });

  it('set new categories', function () {
    legendWidget.categories([allCategories[1], allCategories[2]]);
    expect($(container).find('.legend').length).toBe(2);
    expect(legendWidget.categories().length).toBe(2);
  });

  it('add remove categories', function () {
    legendWidget.addCategories([allCategories[1], allCategories[2]]);
    expect($(container).find('.legend').length).toBe(3);
    legendWidget.removeCategories([allCategories[1], allCategories[2]]);
    expect($(container).find('.legend').length).toBe(1);
  });

  it('test different kind of categories', function () {
    legendWidget.categories(allCategories);
    var legends = $(container).find('.legend');
    expect(legends.length).toBe(allCategories.length);
    expect($(legends[0]).find('svg>rect').length).toBe(4);
    expect($(legends[0]).find('svg>rect:first').attr('fill')).toBe('red');
    expect($(legends[0]).find('svg g.tick').length).toBe(4);

    expect($(legends[1]).find('svg>rect').length).toBe(9);
    expect($(legends[1]).find('svg g.tick').length).toBe(5);

    expect($(legends[2]).find('svg>rect').length).toBe(11);
    expect($(legends[2]).find('svg g.tick').length).toBe(6);
    expect($(legends[2]).find('svg g.tick:last text').text()).toBe('830k');

    expect($(legends[3]).find('svg>rect').length).toBe(8);
    expect($(legends[3]).find('svg g.tick').length).toBe(5);
    expect($(legends[3]).find('svg g.tick:eq(2) text').text()).toBe('150');

    expect($(legends[4]).find('svg>rect').length).toBe(8);
    expect($(legends[4]).find('svg>rect:first').attr('fill')).toBe(allCategories[4].colors[0]);
    expect($(legends[4]).find('svg g.tick:last text').text()).toBe('0.0');

    expect($(legends[5]).find('svg>rect').length).toBe(1);
    expect($(legends[5]).find('svg>rect:first').attr('fill').indexOf('url')).not.toBe(-1);
    expect($(legends[5]).find('svg g.tick').length).toBe(6);
    expect($(legends[5]).find('svg g.tick:first text').text()).toBe('0.00k');

    expect($(legends[6]).find('svg>rect').length).toBe(1);
    expect($(legends[6]).find('svg g.tick').length).toBe(5);

    expect($(legends[7]).find('svg>rect').length).toBe(1);
    expect($(legends[7]).find('svg g.tick').length).toBe(5);
    expect($(legends[7]).find('svg g.tick text').toArray().map(function (text) {
      return $(text).text();
    }).join(', ')).toBe('150, 400, 1.1k, 3.0k, 8.1k');
  });

  it('test mouse events', function () {
    function CreateEvent(eventType, params) {
      params = params || { bubbles: false, cancelable: false };
      var mouseEvent = document.createEvent('MouseEvent');
      mouseEvent.initMouseEvent(eventType, params.bubbles, params.cancelable, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      return mouseEvent;
    }

    Math.trunc = Math.trunc || function (x) {
      if (isNaN(x)) {
        return NaN;
      }
      if (x > 0) {
        return Math.floor(x);
      }
      return Math.ceil(x);
    };

    container[0].dispatchEvent(CreateEvent('mouseenter'));
    container[0].dispatchEvent(CreateEvent('mouseleave'));

    legendWidget.categories([allCategories[1], allCategories[6]]);
    var mousemove;
    var result;
    if (navigator.userAgent.indexOf('Firefox') > 0) {
      result = '320';
    } else {
      result = '319';
    }

    /*global MouseEvent*/
    try {
      mousemove = new MouseEvent('mousemove', { clientX: 134, clientY: 574 });
    } catch (e) {
      mousemove = CreateEvent('mousemove');
      mousemove.pageX = 134;
      mousemove.pageY = 574;
      result = '46';
    }
    var mouseout = CreateEvent('mouseout');
    var legends = $(container).find('.legend');
    $(legends[0]).find('svg>rect')[0].dispatchEvent(mousemove);
    $(legends[0]).find('svg>rect')[0].dispatchEvent(mouseout);
    expect($(container).find('.color-legend-popup').text()).toBe('100 - 200');
    $(legends[1]).find('svg>rect')[0].dispatchEvent(mousemove);
    expect($(container).find('.color-legend-popup').text()).toBe(result);
    $(legends[1]).find('svg>rect')[0].dispatchEvent(mouseout);
  });
});
