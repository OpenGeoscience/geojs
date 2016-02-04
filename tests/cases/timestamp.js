describe('geo.timestamp', function () {
  var geo = require('../test-utils').geo;
  it('modified', function () {
    var t1 = new geo.timestamp(),
        t2 = new geo.timestamp(),
        t3 = new geo.timestamp();

    t1.modified();
    t2.modified();
    t3.modified();

    expect(t1.getMTime()).toBe(t1.getMTime());
    expect(t1.getMTime() < t2.getMTime()).toBe(true);
    expect(t2.getMTime() < t3.getMTime()).toBe(true);

    t2.modified();
    t3.modified();
    t2.modified();

    expect(t2.getMTime()).toBe(t2.getMTime());
    expect(t1.getMTime() < t2.getMTime()).toBe(true);
    expect(t3.getMTime() < t2.getMTime()).toBe(true);
    expect(t1.getMTime() < t3.getMTime()).toBe(true);
  });
});
