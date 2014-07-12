window.startTest = function (done) {
  "use strict";

  function readData(file) {
      return $.get(file).then(function (result) {
          return result;
        }
      );
    }

  var node = document.getElementById("glcanvas");
  var reader = vgl.vtkReader();

  $.when(
    readData("/data/vtkCube.dat"),
    readData("/data/vtkSceneMetadata.json")
  ).then(function (geom, scene) {

    var idx, viewer = reader.createViewer(node);
    reader.setVtkScene(scene);

    for (idx in scene.Objects) {
      if (scene.Objects.hasOwnProperty(idx)) {
        var sceneObject = scene.Objects[idx];

        //add object to the reader
        var vtkObject = {
          md5: sceneObject.md5,
          part: 1,
          vid: -1,
          id: sceneObject.id,
          data: geom,
          hasTransparency: sceneObject.transparency,
          layer: sceneObject.layer
        };

        reader.addVtkObjectData(vtkObject);
      }
    }

    viewer = reader.updateViewer(node);

    viewer.renderWindow().activeRenderer();
    viewer.interactorStyle();
    viewer.render();
    done();
  });
};
