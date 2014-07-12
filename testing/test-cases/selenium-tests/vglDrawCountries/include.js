window.startTest = function (done) {
  "use strict";

  var node = document.getElementById("glcanvas"),
      viewer = vgl.viewer(node), renderer,
      reader = vgl.geojsonReader(),
      geoms, i, mapper, material, actor,
      interactorStyle;

  interactorStyle = vgl.trackballInteractorStyle();

  viewer.init();
  viewer.renderWindow().resize($(node).width(), $(node).height());
  viewer.setInteractorStyle(interactorStyle);

  renderer = viewer.renderWindow().activeRenderer();

  $.getJSON("/data/countries.json", {
    format: "json"
  })
  .done(function (data) {
    geoms = reader.readGJObject(data);

    for (i = 0; i < geoms.length; i += 1) {
      mapper = vgl.mapper();
      mapper.setGeometryData(geoms[i]);

      material = vgl.utils.createGeometryMaterial();

      actor = vgl.actor();
      actor.setMapper(mapper);
      actor.setMaterial(material);

      renderer.addActor(actor);
    }

    renderer.setBackgroundColor(1.0, 1.0, 1.0, 1.0);
    renderer.resetCamera();
    viewer.render();
    done();
  });

};
