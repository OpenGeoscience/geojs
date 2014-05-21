/*global describe, it, expect, geo*/
describe('geo.event', function () {
  it('Unique event names', function () {
    var key1, key2;
    for (key1 in geo.event) {
      if (geo.event.hasOwnProperty(key1)) {
        for (key2 in geo.event) {
          if (geo.event.hasOwnProperty(key2) && key1 !== key2) {
            expect(geo.event[key1]).not.toEqual(geo.event[key2]);
          }
        }
      }
    }
  });
});
