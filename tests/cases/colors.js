describe('geo.util.convertColor', function () {
  'use strict';

  var geo = require('../test-utils').geo;

  describe('From hex string', function () {
    it('#000000', function () {
      var c = geo.util.convertColor('#000000');
      expect(c).toEqual({
        r: 0,
        g: 0,
        b: 0
      });
    });
    it('#ffffff', function () {
      var c = geo.util.convertColor('#ffffff');
      expect(c).toEqual({
        r: 1,
        g: 1,
        b: 1
      });
    });
    it('#1256ab', function () {
      var c = geo.util.convertColor('#1256ab');
      expect(c).toEqual({
        r: 18 / 255,
        g: 86 / 255,
        b: 171 / 255
      });
    });
  });
  describe('From short hex string', function () {
    it('#000', function () {
      var c = geo.util.convertColor('#000');
      expect(c).toEqual({
        r: 0,
        g: 0,
        b: 0
      });
    });
    it('#fff', function () {
      var c = geo.util.convertColor('#fff');
      expect(c).toEqual({
        r: 1,
        g: 1,
        b: 1
      });
    });
    it('#26b', function () {
      var c = geo.util.convertColor('#26b');
      expect(c).toEqual({
        r: 2 / 15,
        g: 6 / 15,
        b: 11 / 15
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
  describe('From css name', function () {
    it('red', function () {
      var c = geo.util.convertColor('red');
      expect(c).toEqual({
        r: 1,
        g: 0,
        b: 0
      });
    });
    it('green', function () {
      var c = geo.util.convertColor('green');
      expect(c).toEqual({
        r: 0,
        g: 128 / 255,
        b: 0
      });
    });
    it('blue', function () {
      var c = geo.util.convertColor('blue');
      expect(c).toEqual({
        r: 0,
        g: 0,
        b: 1
      });
    });
    it('steelblue', function () {
      var c = geo.util.convertColor('steelblue');
      expect(c).toEqual({
        r: 70 / 255,
        g: 130 / 255,
        b: 180 / 255
      });
    });
  });
  describe('Pass through unknown colors', function () {
    it('none', function () {
      var c = geo.util.convertColor('none');
      expect(c).toEqual('none');
    });
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
});
