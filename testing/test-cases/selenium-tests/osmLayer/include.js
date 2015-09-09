
window.startTest = function(done) {
    window.gjsmap = window.geoTests.createOsmMap(
        {},
        {attribution: '&copy; <a href="http://some-unvisited-domain.org">OpenStreetMap</a> contributors'}
    );

    // give the tiles a chance to load
    window.gjsmap.onIdle(done);
};
