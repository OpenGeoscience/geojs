
window.startTest = function(done) {
    window.gjsmap = window.geoTests.createOsmMap();

    // give the tiles a chance to load
    window.gjsmap.onIdle(done);
};
