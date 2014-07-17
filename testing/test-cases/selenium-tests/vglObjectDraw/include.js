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

      reader.parseObject(vtkObject, renderer);

      renderer.setBackgroundColor(1.0, 1.0, 1.0, 1.0);
      var interactorStyle = vgl.trackballInteractorStyle();
      viewer.setInteractorStyle(interactorStyle);
      renderer.resetCamera();
      viewer.render();
      done();
    });
  };
