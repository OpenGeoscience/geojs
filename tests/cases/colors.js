/* global $ */

describe('geo.util.convertColor', function () {
  'use strict';

  var geo = require('../test-utils').geo;
  var closeToEqual = require('../test-utils').closeToEqual;

  var tests = {
    // #rrggbb
    '#000000': {r: 0, g: 0, b: 0},
    '#ffffff': {r: 1, g: 1, b: 1},
    '#1256ab': {r: 18 / 255, g: 86 / 255, b: 171 / 255},
    // #rrggbbaa
    '#00000000': {r: 0, g: 0, b: 0, a: 0},
    '#ffffffff': {r: 1, g: 1, b: 1, a: 1},
    '#1256ab43': {r: 18 / 255, g: 86 / 255, b: 171 / 255, a: 67 / 255},
    // #rgb
    '#000': {r: 0, g: 0, b: 0},
    '#fff': {r: 1, g: 1, b: 1},
    '#26b': {r: 2 / 15, g: 6 / 15, b: 11 / 15},
    // # rgba
    '#0001': {r: 0, g: 0, b: 0, a: 1 / 15},
    '#fff2': {r: 1, g: 1, b: 1, a: 2 / 15},
    '#26b3': {r: 2 / 15, g: 6 / 15, b: 11 / 15, a: 3 / 15},
    // css color names
    'red': {r: 1, g: 0, b: 0},
    'green': {r: 0, g: 128 / 255, b: 0},
    'blue': {r: 0, g: 0, b: 1},
    'steelblue': {r: 70 / 255, g: 130 / 255, b: 180 / 255},
    'SteelBlue': {r: 70 / 255, g: 130 / 255, b: 180 / 255},
    'STEELBLUE': {r: 70 / 255, g: 130 / 255, b: 180 / 255},
    // rgb() and rgba()
    'rgb(18, 86, 171)': {r: 18 / 255, g: 86 / 255, b: 171 / 255},
    'rgb(18 86 171)': {r: 18 / 255, g: 86 / 255, b: 171 / 255},
    'rgba(18 86 171)': {r: 18 / 255, g: 86 / 255, b: 171 / 255},
    'rgb(  18 ,86,171 )': {r: 18 / 255, g: 86 / 255, b: 171 / 255},
    'rgb(10% 35% 63.2%)': {r: 0.1, g: 0.35, b: 0.632},
    'rgb(18 120% 300)': {r: 18 / 255, g: 1, b: 1},
    'rgba(18 86 171 0.3)': {r: 18 / 255, g: 86 / 255, b: 171 / 255, a: 0.3},
    'rgb(18 86 171 0.3)': {r: 18 / 255, g: 86 / 255, b: 171 / 255, a: 0.3},
    'rgba(10% 35% 63.2% 40%)': {r: 0.1, g: 0.35, b: 0.632, a: 0.4},
    'rgba(10% 35% 63.2% / 40%)': {r: 0.1, g: 0.35, b: 0.632, a: 0.4},
    'rgba(100e-1% .35e2% 6.32e1% 40%)': {r: 0.1, g: 0.35, b: 0.632, a: 0.4},
    'RGBA(100E-1% .35E2% 6.32E1% 40%)': {r: 0.1, g: 0.35, b: 0.632, a: 0.4},
    // hsl() and hsla()
    'hsl(120, 100%, 25%)': {r: 0, g: 0.5, b: 0},
    'hsla(120, 100%, 25%)': {r: 0, g: 0.5, b: 0},
    'hsl(120, 100%, 25%, 0.3)': {r: 0, g: 0.5, b: 0, a: 0.3},
    'hsla(120, 100%, 25%, 30%)': {r: 0, g: 0.5, b: 0, a: 0.3},
    'hsla(120, 100%, 25%/30%)': {r: 0, g: 0.5, b: 0, a: 0.3},
    'hsl(120deg 100% 25%)': {r: 0, g: 0.5, b: 0},
    'hsl(133.33grad 100% 25%)': {r: 0, g: 0.5, b: 0},
    'hsl(2.0944rad 100% 25%)': {r: 0, g: 0.5, b: 0},
    'HSL(2.0944RAD 100% 25%)': {r: 0, g: 0.5, b: 0},
    'hsl(.33333turn 100% 25%)': {r: 0, g: 0.5, b: 0},
    'hsl(207 44% 49%)': {r: 0.2744, g: 0.51156, b: 0.7056},
    'hsl(207 100% 50%)': {r: 0, g: 0.55, b: 1},
    // transparent
    'transparent': {r: 0, g: 0, b: 0, a: 0},
    'TRANSPARENT': {r: 0, g: 0, b: 0, a: 0},
    // unknown strings
    'none': 'none'
  };

  describe('From strings', function () {
    $.each(tests, function (key, value) {
      it(key, function () {
        var c = geo.util.convertColor(key);
        expect(closeToEqual(c, value, 4));
      });
    });
  });

  describe('From hex value', function () {
    it('0x000000', function () {
      var c = geo.util.convertColor(0x000000);
      expect(c).toEqual({
        r: 0,
        g: 0,
        b: 0
      });
    });
    it('0xffffff', function () {
      var c = geo.util.convertColor(0xffffff);
      expect(c).toEqual({
        r: 1,
        g: 1,
        b: 1
      });
    });
    it('0x1256ab', function () {
      var c = geo.util.convertColor(0x1256ab);
      expect(c).toEqual({
        r: 18 / 255,
        g: 86 / 255,
        b: 171 / 255
      });
    });
  });
  describe('Pass through unknown colors', function () {
    it('object', function () {
      var c = geo.util.convertColor({
        r: 0,
        g: 1,
        b: 1
      });
      expect(c).toEqual({
        r: 0,
        g: 1,
        b: 1
      });
    });
    it('undefined', function () {
      expect(geo.util.convertColor(undefined)).toBe(undefined);
    });
  });
});

describe('geo.util.convertColorToHex', function () {
  'use strict';

  var geo = require('../test-utils').geo;

  describe('From hex string', function () {
    it('#000000', function () {
      var c = geo.util.convertColorToHex('#000000');
      expect(c).toEqual('#000000');
    });
    it('#ffffff', function () {
      var c = geo.util.convertColorToHex('#ffffff');
      expect(c).toEqual('#ffffff');
    });
    it('#1256aB', function () {
      var c = geo.util.convertColorToHex('#1256aB');
      expect(c).toEqual('#1256ab');
    });
  });
  describe('From short hex string', function () {
    it('#000', function () {
      var c = geo.util.convertColorToHex('#000');
      expect(c).toEqual('#000000');
    });
    it('#fff', function () {
      var c = geo.util.convertColorToHex('#fff');
      expect(c).toEqual('#ffffff');
    });
    it('#26b', function () {
      var c = geo.util.convertColorToHex('#26b');
      expect(c).toEqual('#2266bb');
    });
  });
  describe('From hex value', function () {
    it('0x000000', function () {
      var c = geo.util.convertColorToHex(0x000000);
      expect(c).toEqual('#000000');
    });
    it('0xffffff', function () {
      var c = geo.util.convertColorToHex(0xffffff);
      expect(c).toEqual('#ffffff');
    });
    it('0x1256ab', function () {
      var c = geo.util.convertColorToHex(0x1256ab);
      expect(c).toEqual('#1256ab');
    });
  });
  describe('From css name', function () {
    it('red', function () {
      var c = geo.util.convertColorToHex('red');
      expect(c).toEqual('#ff0000');
    });
    it('green', function () {
      var c = geo.util.convertColorToHex('green');
      expect(c).toEqual('#008000');
    });
    it('blue', function () {
      var c = geo.util.convertColorToHex('blue');
      expect(c).toEqual('#0000ff');
    });
    it('steelblue', function () {
      var c = geo.util.convertColorToHex('steelblue');
      expect(c).toEqual('#4682b4');
    });
  });
  describe('From rgb triplet', function () {
    it('object', function () {
      var c = geo.util.convertColorToHex({
        r: 0,
        g: 1,
        b: 1
      });
      expect(c).toEqual('#00ffff');
    });
  });
  describe('Pass through unknown colors', function () {
    it('none', function () {
      var c = geo.util.convertColorToHex('none');
      expect(c).toEqual('#000000');
    });
  });
  describe('With alpha', function () {
    it('no flag', function () {
      var c = geo.util.convertColorToHex({r: 0, g: 1, b: 1, a: 0.3});
      expect(c).toEqual('#00ffff');
    });
    it('true flag and alpha', function () {
      var c = geo.util.convertColorToHex({r: 0, g: 1, b: 1, a: 0.3}, true);
      expect(c).toEqual('#00ffff4d');
    });
    it('true flag and no alpha', function () {
      var c = geo.util.convertColorToHex({r: 0, g: 1, b: 1}, true);
      expect(c).toEqual('#00ffff');
    });
    it('false flag and alpha', function () {
      var c = geo.util.convertColorToHex({r: 0, g: 1, b: 1, a: 0.3}, false);
      expect(c).toEqual('#00ffff');
    });
  });
});

describe('geo.util.convertColorToRGBA', function () {
  'use strict';

  var geo = require('../test-utils').geo;
  /* The first entry is the expected result, the second is the input */
  var rgbaTests = [
    ['rgba(0, 0, 0, 1)', null],
    ['rgba(0, 0, 0, 1)', 'black'],
    ['rgba(0, 0, 0, 1)', '#000'],
    ['rgba(0, 0, 0, 1)', {r: 0, g: 0, b: 0}],
    ['rgba(0, 0, 0, 0.50196)', '#00000080'],
    ['rgba(100, 120, 140, 0.5)', {r: 0.393, g: 0.4706, b: 0.548, a: 0.5}],
    ['rgba(100, 120, 140, 1)', {r: 0.393, g: 0.4706, b: 0.548, a: 2}],
    ['rgba(100, 120, 140, 1)', {r: 0.393, g: 0.4706, b: 0.548}],
    ['rgba(100, 120, 140, 1)', {r: 0.393, g: 0.4706, b: 0.548, a: 'bad'}]
  ];

  $.each(rgbaTests, function (idx, record) {
    it('test ' + idx + ' - ' + record[0], function () {
      expect(geo.util.convertColorToRGBA(record[1])).toEqual(record[0]);
    });
  });
});

describe('geo.util.convertColorAndOpacity', function () {
  'use strict';

  var geo = require('../test-utils').geo;
  /* The first entry is the expected result, the second are the input arguments
   */
  var candoTests = [
    [{r: 0, g: 0, b: 0, a: 1}, []],
    [{r: 0, g: 0, b: 0, a: 0}, [undefined, undefined, 'transparent']],
    [{r: 0, g: 0, b: 0, a: 1}, [undefined, undefined, 'no such color']],
    [{r: 0, g: 0, b: 0, a: 0.5}, [undefined, undefined, {r: 0, g: 0, b: 0, a: 0.5}]],
    [{r: 1, g: 1, b: 1, a: 1}, ['white', undefined, {r: 0, g: 0, b: 0, a: 0.5}]],
    [{r: 0, g: 0, b: 0, a: 0.2}, [undefined, 0.4, {r: 0, g: 0, b: 0, a: 0.5}]],
    [{r: 1, g: 1, b: 1, a: 0.4}, ['white', 0.4, {r: 0, g: 0, b: 0, a: 0.5}]],
    [{r: 1, g: 1, b: 1, a: 0.4}, ['white', 0.4]]
  ];

  $.each(candoTests, function (idx, record) {
    it('test ' + idx + ' - ' + record[0], function () {
      expect(geo.util.convertColorAndOpacity.apply(geo.util, record[1])).toEqual(record[0]);
    });
  });
});
