/*global describe, it, expect, geo*/
describe('geo.util.convertColor', function () {
  'use strict';

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
  describe('From hex value', function () {
    it('#000000', function () {
      var c = geo.util.convertColor(0x000000);
      expect(c).toEqual({
        r: 0,
        g: 0,
        b: 0
      });
    });
    it('#ffffff', function () {
      var c = geo.util.convertColor(0xffffff);
      expect(c).toEqual({
        r: 1,
        g: 1,
        b: 1
      });
    });
    it('#1256ab', function () {
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
