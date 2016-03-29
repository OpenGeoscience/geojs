describe('geo.event', function () {

  var geo = require('../test-utils').geo;

  it('Unique event names', function () {
    var key1, key2;
    for (key1 in geo.event) {
      if (geo.event.hasOwnProperty(key1) && typeof geo.event[key1] === 'string') {
        for (key2 in geo.event) {
          if (geo.event.hasOwnProperty(key2) &&
              key1 !== key2 &&
              typeof geo.event[key2] === 'string') {
            expect(geo.event[key1]).not.toEqual(geo.event[key2]);
          }
        }
      }
    }
  });
});
