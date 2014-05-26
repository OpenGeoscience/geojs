/*global describe, it, expect, geo*/
describe('geo.version', function () {
  it('Version number is defined', function () {
    expect(geo.version).toMatch(/[0-9]+\.[0-9]+\.[0-9]+[_a-zA-Z]*/);
  });
});
