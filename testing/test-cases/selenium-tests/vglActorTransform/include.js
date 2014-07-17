window.startTest = function (done) {
  "use strict";

  var node = document.getElementById("glcanvas");
  var viewer = vgl.viewer(node);
  viewer.init();

  viewer.renderWindow().resize($(node).width(), $(node).height());
  var renderer = viewer.renderWindow().activeRenderer();

  var reader = vgl.vtkReader();
  $.get("/data/vtkCube.dat", {
  })
  .done(function (data) {
    //add object to the reader
    var vtkObject = {
      md5: 12345,
      part: 1,
      vid: -1,
      id: 1,
      data: data,
      hasTransparency: 1,
      layer: 0
    };
    var geom = reader.parseObject(vtkObject, renderer);

    var mapper = vgl.mapper();
    mapper.setGeometryData(geom);

    var material = vgl.utils.createGeometryMaterial();

    var actor = vgl.actor();
    actor.setMapper(mapper);
    actor.setMaterial(material);

    var actor2 = vgl.actor();
    actor2.setMapper(mapper);
    actor2.setMaterial(material);

    var transMat = mat4.create();
    var transVec = vec4.create();
    vec4.set(transVec, 10, 0, 0, 0);
    mat4.translate(transMat, transMat, transVec);
    actor2.setMatrix(transMat);

    renderer.addActor(actor);
    renderer.addActor(actor2);

    renderer.setBackgroundColor(1.0, 1.0, 1.0, 1.0);
    var interactorStyle = vgl.trackballInteractorStyle();
    viewer.setInteractorStyle(interactorStyle);
    renderer.resetCamera();
    viewer.render();
    done();
  });
};
