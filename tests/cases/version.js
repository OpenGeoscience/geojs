describe('geo.version', function () {
  var geo = require('../test-utils').geo;
  it('Version number is defined', function () {
    expect(geo.version).toMatch(/[0-9]+\.[0-9]+\.[0-9]+[_a-zA-Z]*/);
  });
});
