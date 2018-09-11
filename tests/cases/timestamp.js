describe('geo.timestamp', function () {
  var geo = require('../test-utils').geo;
  it('modified', function () {
    var t1 = new geo.timestamp(),
        t2 = new geo.timestamp(),
        t3 = new geo.timestamp();

    t1.modified();
    t2.modified();
    t3.modified();

    expect(t1.timestamp()).toBe(t1.timestamp());
    expect(t1.timestamp() < t2.timestamp()).toBe(true);
    expect(t2.timestamp() < t3.timestamp()).toBe(true);

    t2.modified();
    t3.modified();
    t2.modified();

    expect(t2.timestamp()).toBe(t2.timestamp());
    expect(t1.timestamp() < t2.timestamp()).toBe(true);
    expect(t3.timestamp() < t2.timestamp()).toBe(true);
    expect(t1.timestamp() < t3.timestamp()).toBe(true);
  });
});
